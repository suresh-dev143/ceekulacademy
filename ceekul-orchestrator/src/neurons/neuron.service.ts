import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  NeuronBalance,
  NeuronTypeBalance,
  NeuronTransaction,
  NeuronPool,
  EarnNeuronsDto,
  AllocateNeuronsDto,
  NeuronType,
  EARNING_RULES,
  NeuronEarningRule,
} from './neuron.types';

/**
 * NeuronService — core business logic for the Ceekul Neuron system.
 *
 * COMPLIANCE NOTE
 * ───────────────
 * This service operates an internal participation-tracking ledger ONLY.
 * It does NOT:
 *   • Hold, transmit, or process real money
 *   • Operate a stored-value account or e-money wallet
 *   • Allow peer-to-peer neuron transfers between users
 *   • Allow conversion of neurons to fiat or digital currency
 *
 * All monetary transactions remain outside this platform and are handled
 * by separately registered payment service providers (e.g., Razorpay).
 *
 * This service uses an in-memory store. In production replace with a
 * proper database (MongoDB / PostgreSQL) with write-ahead logging so
 * the ledger remains append-only and auditable.
 */
@Injectable()
export class NeuronService {
  private readonly logger = new Logger(NeuronService.name);

  // ── In-memory stores (replace with DB collections in production) ──────────
  private balances = new Map<string, NeuronBalance>();
  private transactions: NeuronTransaction[] = [];
  private pools: NeuronPool[] = [];

  // Daily-cap tracking: key = `${userId}:${triggerId}:${yyyymmdd}`
  private dailyEarnings = new Map<string, number>();

  // Cooldown tracking: key = `${userId}:${triggerId}` → last-earned ISO
  private cooldowns = new Map<string, string>();

  // ── Seed demo pools ───────────────────────────────────────────────────────
  constructor() {
    this.seedDemoPools();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  getBalance(userId: string): NeuronBalance {
    return this.ensureBalance(userId);
  }

  getTransactions(
    userId: string,
    limit = 50,
    offset = 0,
  ): { items: NeuronTransaction[]; total: number } {
    const items = this.transactions
      .filter(tx => tx.userId === userId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(offset, offset + limit);
    const total = this.transactions.filter(tx => tx.userId === userId).length;
    return { items, total };
  }

  /**
   * Award neurons for a completed activity.
   * Validates the trigger against earning rules, respects daily caps
   * and cooldowns, then appends an immutable transaction record.
   */
  earnNeurons(dto: EarnNeuronsDto): { transaction: NeuronTransaction; balance: NeuronBalance } {
    const rule = this.findRule(dto.trigger);
    if (!rule || !rule.active) {
      throw new BadRequestException(`No active earning rule for trigger: ${dto.trigger}`);
    }

    // Cooldown check
    if (rule.cooldownMinutes) {
      const key = `${dto.userId}:${rule.id}`;
      const lastEarned = this.cooldowns.get(key);
      if (lastEarned) {
        const elapsed = (Date.now() - new Date(lastEarned).getTime()) / 60_000;
        if (elapsed < rule.cooldownMinutes) {
          const remaining = Math.ceil(rule.cooldownMinutes - elapsed);
          throw new BadRequestException(
            `Cooldown active: ${remaining} minute(s) remaining before this activity awards neurons again.`,
          );
        }
      }
      this.cooldowns.set(key, new Date().toISOString());
    }

    // Daily-cap check
    const dayKey = `${dto.userId}:${rule.id}:${this.todayKey()}`;
    const todayTotal = this.dailyEarnings.get(dayKey) ?? 0;
    if (rule.dailyCap && todayTotal >= rule.dailyCap) {
      this.logger.warn(`Daily cap reached for user ${dto.userId} on trigger ${dto.trigger}`);
      // Return current balance silently — do not error; the user just does not earn more today
      return { transaction: null as unknown as NeuronTransaction, balance: this.getBalance(dto.userId) };
    }

    const amount = this.computeAmount(rule, dto.metadata);
    const actualAmount = rule.dailyCap
      ? Math.min(amount, rule.dailyCap - todayTotal)
      : amount;

    // Update daily tracker
    this.dailyEarnings.set(dayKey, todayTotal + actualAmount);

    // Persist transaction + update balance
    const balance = this.ensureBalance(dto.userId);
    const typeBalance = this.getTypeBalance(balance, rule.neuronType);

    typeBalance.available += actualAmount;
    typeBalance.earned += actualAmount;
    balance.totalAvailable += actualAmount;
    balance.totalEarned += actualAmount;
    balance.lastActivity = new Date().toISOString();
    balance.updatedAt = new Date().toISOString();

    const tx: NeuronTransaction = {
      id: this.newId(),
      userId: dto.userId,
      txType: 'earned',
      neuronType: rule.neuronType,
      delta: actualAmount,
      balanceAfter: typeBalance.available,
      referenceId: dto.referenceId,
      referenceType: dto.referenceType,
      description: this.earnDescription(dto.trigger, actualAmount),
      timestamp: new Date().toISOString(),
      metadata: dto.metadata,
    };
    this.transactions.push(tx);
    this.logger.log(`Earned ${actualAmount} ${rule.neuronType} neurons for user ${dto.userId} via ${dto.trigger}`);
    return { transaction: tx, balance };
  }

  /**
   * Allocate neurons from a user's balance to a community pool or
   * to unlock gated platform content. Neurons are debited but stay
   * within the platform — they are NEVER converted to money.
   */
  allocateNeurons(
    dto: AllocateNeuronsDto,
  ): { transaction: NeuronTransaction; balance: NeuronBalance } {
    const balance = this.ensureBalance(dto.userId);
    const typeBalance = this.getTypeBalance(balance, dto.neuronType);

    if (typeBalance.available < dto.amount) {
      throw new BadRequestException(
        `Insufficient ${dto.neuronType} neurons. ` +
        `Available: ${typeBalance.available}, requested: ${dto.amount}.`,
      );
    }

    // If targeting a pool, update the pool record
    if (dto.poolId) {
      const pool = this.pools.find(p => p.id === dto.poolId);
      if (!pool) throw new BadRequestException(`Pool ${dto.poolId} not found.`);
      if (pool.status !== 'active') {
        throw new BadRequestException(`Pool ${dto.poolId} is no longer accepting contributions.`);
      }
      pool.currentNeurons += dto.amount;
      pool.participantCount += 1;
      if (pool.currentNeurons >= pool.targetNeurons) {
        pool.status = 'funded';
        this.logger.log(`Pool ${pool.id} reached target: "${pool.title}"`);
      }
    }

    typeBalance.available -= dto.amount;
    typeBalance.allocated += dto.amount;
    balance.totalAvailable -= dto.amount;
    balance.totalAllocated += dto.amount;
    balance.updatedAt = new Date().toISOString();

    const tx: NeuronTransaction = {
      id: this.newId(),
      userId: dto.userId,
      txType: dto.poolId ? 'allocated' : 'unlocked',
      neuronType: dto.neuronType,
      delta: -dto.amount,
      balanceAfter: typeBalance.available,
      referenceId: dto.poolId ?? dto.gatedItemId ?? 'direct',
      referenceType: dto.poolId ? 'pool' : 'gated_item',
      description: dto.description,
      timestamp: new Date().toISOString(),
    };
    this.transactions.push(tx);
    this.logger.log(`Allocated ${dto.amount} ${dto.neuronType} neurons from user ${dto.userId}`);
    return { transaction: tx, balance };
  }

  getAllPools(): NeuronPool[] {
    return this.pools;
  }

  getPool(poolId: string): NeuronPool {
    const pool = this.pools.find(p => p.id === poolId);
    if (!pool) throw new BadRequestException(`Pool ${poolId} not found.`);
    return pool;
  }

  createPool(data: Omit<NeuronPool, 'id' | 'currentNeurons' | 'participantCount' | 'status' | 'createdAt'>): NeuronPool {
    const pool: NeuronPool = {
      ...data,
      id: this.newId(),
      currentNeurons: 0,
      participantCount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    this.pools.push(pool);
    return pool;
  }

  getLeaderboard(limit = 20): {
    rank: number; userId: string; totalEarned: number; byType: Partial<Record<NeuronType, number>>;
  }[] {
    return Array.from(this.balances.entries())
      .map(([userId, b]) => ({
        userId,
        totalEarned: b.totalEarned,
        byType: Object.fromEntries(b.byType.map(t => [t.type, t.earned])) as Partial<Record<NeuronType, number>>,
      }))
      .sort((a, b) => b.totalEarned - a.totalEarned)
      .slice(0, limit)
      .map((entry, i) => ({ rank: i + 1, ...entry }));
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private ensureBalance(userId: string): NeuronBalance {
    if (!this.balances.has(userId)) {
      const allTypes: NeuronType[] = ['learning', 'collaboration', 'creation', 'contribution', 'innovation'];
      const balance: NeuronBalance = {
        userId,
        totalAvailable: 0,
        totalEarned: 0,
        totalAllocated: 0,
        byType: allTypes.map(type => ({ type, available: 0, allocated: 0, earned: 0 })),
        lastActivity: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.balances.set(userId, balance);
    }
    return this.balances.get(userId)!;
  }

  private getTypeBalance(balance: NeuronBalance, type: NeuronType): NeuronTypeBalance {
    let tb = balance.byType.find(b => b.type === type);
    if (!tb) {
      tb = { type, available: 0, allocated: 0, earned: 0 };
      balance.byType.push(tb);
    }
    return tb;
  }

  private findRule(trigger: string): NeuronEarningRule | undefined {
    return EARNING_RULES.find(r => r.trigger === trigger);
  }

  private computeAmount(rule: NeuronEarningRule, metadata?: Record<string, unknown>): number {
    let amount = rule.baseAmount;
    if (rule.bonusConditions && metadata) {
      for (const bonus of rule.bonusConditions) {
        // Simple evaluation: check if metadata contains the condition key/value
        if (bonus.condition.includes('score === 100') && metadata['score'] === 100) {
          amount = Math.floor(amount * bonus.multiplier);
        }
      }
    }
    return amount;
  }

  private todayKey(): string {
    return new Date().toISOString().slice(0, 10).replace(/-/g, '');
  }

  private newId(): string {
    return `nrn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  private earnDescription(trigger: string, amount: number): string {
    const labels: Record<string, string> = {
      'lecture.watched':        `Watched a lecture (+${amount} neurons)`,
      'module.completed':       `Completed a learning module (+${amount} neurons)`,
      'quiz.passed':            `Passed a quiz (+${amount} neurons)`,
      'quiz.perfect_score':     `Perfect quiz score — bonus neurons! (+${amount} neurons)`,
      'workshop.attended':      `Attended a workshop (+${amount} neurons)`,
      'workshop.hosted':        `Hosted a workshop (+${amount} neurons)`,
      'discussion.contributed': `Contributed to a discussion (+${amount} neurons)`,
      'peer.reviewed':          `Completed a peer review (+${amount} neurons)`,
      'course.published':       `Published a course (+${amount} neurons)`,
      'research.submitted':     `Submitted research (+${amount} neurons)`,
      'innovation.submitted':   `Submitted an innovation (+${amount} neurons)`,
      'mentoring.session':      `Completed a mentoring session (+${amount} neurons)`,
      'volunteer.shift':        `Completed a volunteer shift (+${amount} neurons)`,
    };
    return labels[trigger] ?? `Activity completed (+${amount} neurons)`;
  }

  private seedDemoPools(): void {
    const future = (days: number) =>
      new Date(Date.now() + days * 86_400_000).toISOString();

    this.pools = [
      {
        id: 'pool_access_001',
        title: 'Rural Learner Access Scholarship',
        description: 'Contribute neurons to unlock 3 months of full platform access for a learner in a low-connectivity district.',
        poolType: 'access_scholarship',
        targetNeurons: 5000,
        currentNeurons: 2310,
        participantCount: 47,
        status: 'active',
        beneficiary: { id: 'beneficiary_001', name: 'District 7 Learner Cohort', description: 'Students in under-served Tier-3 districts' },
        expiresAt: future(30),
        createdAt: new Date().toISOString(),
        createdBy: 'system',
      },
      {
        id: 'pool_research_001',
        title: 'Spotlight: AI in Agriculture Research',
        description: 'Help surface this research submission to the home feed and director pipeline.',
        poolType: 'research_spotlight',
        targetNeurons: 1500,
        currentNeurons: 890,
        participantCount: 23,
        status: 'active',
        beneficiary: { id: 'research_001', name: 'Dr. Anitha Kumar', description: 'Research on AI-driven crop yield prediction' },
        expiresAt: future(14),
        createdAt: new Date().toISOString(),
        createdBy: 'system',
      },
      {
        id: 'pool_mentor_001',
        title: 'Mentor Recognition: Community Champion',
        description: 'Recognise outstanding mentors with a community honour badge on their profile.',
        poolType: 'mentor_recognition',
        targetNeurons: 2000,
        currentNeurons: 2000,
        participantCount: 61,
        status: 'funded',
        beneficiary: { id: 'user_mentor_01', name: 'Ravi Shankar', description: 'Top mentor for Q1 2026' },
        expiresAt: future(7),
        createdAt: new Date().toISOString(),
        createdBy: 'system',
      },
    ];
  }
}
