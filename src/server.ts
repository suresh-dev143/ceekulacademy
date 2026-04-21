import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

// ── In-memory Neuron store for SSR dev mock ──────────────────────────────────
// In production, these requests are proxied to the NestJS orchestrator.
interface NeuronTx {
  id: string; userId: string; txType: string; neuronType: string;
  delta: number; balanceAfter: number; referenceId: string;
  referenceType: string; description: string; timestamp: string;
}
interface NeuronUser {
  totalAvailable: number; totalEarned: number; totalAllocated: number;
  byType: Record<string, { available: number; allocated: number; earned: number }>;
  lastActivity: string; updatedAt: string;
}

const neuronUsers = new Map<string, NeuronUser>();
const neuronTxLog: NeuronTx[] = [];

const NEURON_TYPES = ['learning', 'collaboration', 'creation', 'contribution', 'innovation'] as const;

const MOCK_EARNING_RULES: Record<string, { type: string; amount: number; dailyCap: number }> = {
  'lecture.watched':        { type: 'learning',       amount: 10,  dailyCap: 50 },
  'module.completed':       { type: 'learning',       amount: 25,  dailyCap: 100 },
  'quiz.passed':            { type: 'learning',       amount: 20,  dailyCap: 80 },
  'quiz.perfect_score':     { type: 'learning',       amount: 40,  dailyCap: 80 },
  'workshop.attended':      { type: 'collaboration',  amount: 50,  dailyCap: 100 },
  'workshop.hosted':        { type: 'collaboration',  amount: 75,  dailyCap: 150 },
  'discussion.contributed': { type: 'collaboration',  amount: 5,   dailyCap: 25 },
  'peer.reviewed':          { type: 'collaboration',  amount: 15,  dailyCap: 60 },
  'course.published':       { type: 'creation',       amount: 100, dailyCap: 200 },
  'research.submitted':     { type: 'creation',       amount: 80,  dailyCap: 160 },
  'innovation.submitted':   { type: 'innovation',     amount: 120, dailyCap: 240 },
  'mentoring.session':      { type: 'contribution',   amount: 40,  dailyCap: 120 },
  'volunteer.shift':        { type: 'contribution',   amount: 60,  dailyCap: 180 },
};

const MOCK_POOLS = [
  { id: 'pool_access_001', title: 'Rural Learner Access Scholarship', description: 'Unlock 3 months of full platform access for learners in low-connectivity districts.', poolType: 'access_scholarship', targetNeurons: 5000, currentNeurons: 2310, participantCount: 47, status: 'active', expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(), createdAt: new Date().toISOString(), createdBy: 'system', beneficiary: { id: 'b1', name: 'District 7 Learner Cohort', description: 'Students in Tier-3 districts' } },
  { id: 'pool_research_001', title: 'Spotlight: AI in Agriculture Research', description: 'Surface this research submission to the home feed and director pipeline.', poolType: 'research_spotlight', targetNeurons: 1500, currentNeurons: 890, participantCount: 23, status: 'active', expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(), createdAt: new Date().toISOString(), createdBy: 'system', beneficiary: { id: 'b2', name: 'Dr. Anitha Kumar', description: 'AI-driven crop yield prediction research' } },
  { id: 'pool_mentor_001', title: 'Mentor Recognition: Community Champion', description: 'Recognise outstanding mentors with a community honour badge.', poolType: 'mentor_recognition', targetNeurons: 2000, currentNeurons: 2000, participantCount: 61, status: 'funded', expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), createdAt: new Date().toISOString(), createdBy: 'system', beneficiary: { id: 'b3', name: 'Ravi Shankar', description: 'Top mentor for Q1 2026' } },
];

function ensureNeuronUser(userId: string): NeuronUser {
  if (!neuronUsers.has(userId)) {
    neuronUsers.set(userId, {
      totalAvailable: 0, totalEarned: 0, totalAllocated: 0,
      byType: Object.fromEntries(NEURON_TYPES.map(t => [t, { available: 0, allocated: 0, earned: 0 }])),
      lastActivity: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  return neuronUsers.get(userId)!;
}

function nrnId() { return `nrn_${Date.now()}_${Math.random().toString(36).slice(2,9)}`; }
// ─────────────────────────────────────────────────────────────────────────────

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
app.get('/api/v1/workshops/:id/eligibility', (req, res) => {
  res.json({ eligible: true });
});

app.post('/api/v1/workshops/:id/vimeo-token', (req, res) => {
  res.json({ 
    token: 'vimeo_mock_token_' + Math.random().toString(36).substr(2, 9),
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    streamUrl: 'https://vimeo.com/event/mock'
  });
});

app.post('/api/v1/payments/create-order', (req, res) => {
  res.json({
    id: 'order_' + Math.random().toString(36).substr(2, 9),
    amount: req.body.amount,
    currency: 'INR'
  });
});

app.post('/api/v1/payments/verify', (req, res) => {
  // Mock fee distribution logic
  const { amount, mobilizerId, mode } = req.body;
  console.log(`Processing payment for ${mode} mode with amount ${amount}`);
  
  if (mode === 'online') {
    if (mobilizerId) {
      console.log('Split: 66% Creator, 33% Mobilizer, 1% Ceekul');
    } else {
      console.log('Split: 99% Creator, 1% Ceekul');
    }
  } else if (mode === 'offline') {
    if (mobilizerId) {
      console.log('Split: 50% Creator, 40% Infrastructure, 10% Mobilizer');
    } else {
      console.log('Split: 50% Creator, 50% Infrastructure');
    }
  }

  res.json({ status: 'success', transactionId: 'pay_' + Math.random().toString(36).substr(2, 9) });
});

app.post('/api/v1/workshops/:id/refund', (req, res) => {
  res.json({ status: 'refunded', amount: req.body.amount });
});

// ════════════════════════════════════════════════════════════════════════════
// NEURON API — mock endpoints (proxied to NestJS orchestrator in production)
// All neurons are non-monetary, non-withdrawable internal participation units.
// ════════════════════════════════════════════════════════════════════════════
app.use(express.json());

// GET /api/neurons/balance/:userId
app.get('/api/neurons/balance/:userId', (req, res) => {
  const u = ensureNeuronUser(req.params['userId']);
  res.json({ userId: req.params['userId'], ...u, byType: NEURON_TYPES.map(t => ({ type: t, ...u.byType[t] })) });
});

// GET /api/neurons/transactions/:userId
app.get('/api/neurons/transactions/:userId', (req, res) => {
  const userId = req.params['userId'];
  const limit = parseInt(String(req.query['limit'] ?? '50'));
  const offset = parseInt(String(req.query['offset'] ?? '0'));
  const all = neuronTxLog.filter(tx => tx.userId === userId).reverse();
  res.json({ items: all.slice(offset, offset + limit), total: all.length });
});

// POST /api/neurons/earn
app.post('/api/neurons/earn', (req, res) => {
  const { userId, trigger, referenceId, referenceType, metadata } = req.body;
  const rule = MOCK_EARNING_RULES[trigger];
  if (!rule) { res.status(400).json({ message: `Unknown trigger: ${trigger}` }); return; }
  const u = ensureNeuronUser(userId);
  const amount = rule.amount;
  u.byType[rule.type].available += amount;
  u.byType[rule.type].earned += amount;
  u.totalAvailable += amount;
  u.totalEarned += amount;
  u.lastActivity = u.updatedAt = new Date().toISOString();
  const tx: NeuronTx = { id: nrnId(), userId, txType: 'earned', neuronType: rule.type, delta: amount, balanceAfter: u.byType[rule.type].available, referenceId, referenceType, description: `Activity: ${trigger} (+${amount} neurons)`, timestamp: new Date().toISOString() };
  neuronTxLog.push(tx);
  res.json({ transaction: tx, balance: { userId, ...u, byType: NEURON_TYPES.map(t => ({ type: t, ...u.byType[t] })) } });
});

// POST /api/neurons/allocate
app.post('/api/neurons/allocate', (req, res) => {
  const { userId, neuronType, amount, poolId, description } = req.body;
  const u = ensureNeuronUser(userId);
  if (u.byType[neuronType]?.available < amount) {
    res.status(400).json({ message: `Insufficient ${neuronType} neurons.` }); return;
  }
  if (poolId) {
    const pool = MOCK_POOLS.find(p => p.id === poolId);
    if (pool && pool.status === 'active') {
      pool.currentNeurons += amount;
      pool.participantCount += 1;
      if (pool.currentNeurons >= pool.targetNeurons) pool.status = 'funded';
    }
  }
  u.byType[neuronType].available -= amount;
  u.byType[neuronType].allocated += amount;
  u.totalAvailable -= amount;
  u.totalAllocated += amount;
  u.updatedAt = new Date().toISOString();
  const tx: NeuronTx = { id: nrnId(), userId, txType: poolId ? 'allocated' : 'unlocked', neuronType, delta: -amount, balanceAfter: u.byType[neuronType].available, referenceId: poolId ?? 'direct', referenceType: poolId ? 'pool' : 'gated_item', description, timestamp: new Date().toISOString() };
  neuronTxLog.push(tx);
  res.json({ transaction: tx, balance: { userId, ...u, byType: NEURON_TYPES.map(t => ({ type: t, ...u.byType[t] })) } });
});

// GET /api/neurons/pools
app.get('/api/neurons/pools', (_req, res) => { res.json(MOCK_POOLS); });

// GET /api/neurons/pools/:poolId
app.get('/api/neurons/pools/:poolId', (req, res) => {
  const pool = MOCK_POOLS.find(p => p.id === req.params['poolId']);
  pool ? res.json(pool) : res.status(404).json({ message: 'Pool not found' });
});

// GET /api/neurons/leaderboard
app.get('/api/neurons/leaderboard', (_req, res) => {
  const entries = Array.from(neuronUsers.entries())
    .map(([userId, u], i) => ({ rank: i + 1, userId, displayName: `User ${userId.slice(-4)}`, totalEarned: u.totalEarned, byType: Object.fromEntries(Object.entries(u.byType).map(([t, b]) => [t, (b as { earned: number }).earned])) }))
    .sort((a, b) => b.totalEarned - a.totalEarned)
    .map((e, i) => ({ ...e, rank: i + 1 }));
  res.json(entries);
});

// GET /api/neurons/rules
app.get('/api/neurons/rules', (_req, res) => {
  res.json(Object.entries(MOCK_EARNING_RULES).map(([trigger, rule], i) => ({
    id: `r${String(i+1).padStart(2,'0')}`, trigger, neuronType: rule.type,
    baseAmount: rule.amount, dailyCap: rule.dailyCap, active: true,
  })));
});
// ════════════════════════════════════════════════════════════════════════════

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
