/**
 * CEEKUL NEURON PARTICIPATION ECOSYSTEM — Data Models
 * =====================================================================
 * ⚗️  EXPERIMENTAL SIMULATION MODE — Phase 1 Architecture Validation
 *
 * Neurons are NON-MONETARY, NON-WITHDRAWABLE internal participation
 * units used ONLY for semantic orchestration testing, workflow
 * validation, and contribution flow experimentation.
 *
 * THE SYSTEM IS NEVER A BANK, WALLET, OR FINANCIAL INTERMEDIARY.
 * NO REAL MONETARY TRANSACTION OCCURS. ALL BALANCES ARE SIMULATED.
 *
 * Four-Bucket Architecture:
 *
 *   MY NEURONS  — Participation layer. Receives simulated work and task
 *                 participation rewards. Monthly allocation distributes
 *                 its balance to FUN / CUN / SUN.
 *
 *   FUN         — Family Upgradation Neurons. Primary entry gateway.
 *                 Receives simulated contribution credits. Can transfer
 *                 to CUN or SUN. NEVER receives back from CUN or SUN.
 *                 Used for services, sponsorships, and simulation
 *                 allocation to any project type.
 *
 *   CUN         — Cognitive Upgradation Neurons. Receives from FUN or
 *                 SUN. Can transfer to SUN only (NEVER back to FUN).
 *                 Used for research / innovation / knowledge projects.
 *
 *   SUN         — Social Upgradation Neurons. Receives from FUN or
 *                 CUN. Can transfer to CUN only (NEVER back to FUN).
 *                 Used for business / infrastructure / social projects.
 *
 * Transfer Rules (STRICTLY ENFORCED):
 *   FUN → CUN ✅   FUN → SUN ✅
 *   CUN → SUN ✅   SUN → CUN ✅
 *   CUN → FUN ❌   SUN → FUN ❌  (permanently blocked)
 *
 * Return Flow:
 *   Participation rewards → My Neurons (variable, non-guaranteed)
 *   Monthly: My Neurons → FUN/CUN/SUN (99% participant, 1% Ceekul)
 *
 * Future migration path: simulation balances will be converted to real
 * coordination flows only after regulatory approval + escrow integration.
 * =====================================================================
 */

// ── Bucket identifiers ────────────────────────────────────────────────────────
export type NeuronBucket = 'my_neurons' | 'fun' | 'cun' | 'sun';

// ── Transaction types ─────────────────────────────────────────────────────────
export type NeuronTxType =
  | 'contribution_conversion'    // Simulated credit confirmed → FUN (internal units only)
  | 'bucket_transfer'            // User moves internal units between FUN/CUN/SUN
  | 'investment_lock'            // Source bucket -> simulated allocation pool
  | 'investment_release'         // Simulated allocation released (project failed/cancelled)
  | 'project_reward'             // Project outcome -> My Neurons (variable, non-guaranteed)
  | 'work_reward'                // Work / task completion → My Neurons
  | 'monthly_allocation_user'    // My Neurons → FUN/CUN/SUN (user's 99% share)
  | 'monthly_allocation_ceekul'  // My Neurons → Ceekul's 1% share
  | 'support_borrow'             // Support units credited to FUN
  | 'support_repay'              // Support units returned
  | 'sponsorship'                // FUN or SUN used to sponsor another user
  | 'service_consume'            // FUN used for platform services
  | 'service_payment'            // Sender side: FUN/CUN/SUN → receiver for a service/product
  | 'service_receive'            // Receiver side: MY NEURONS credited from service payment
  | 'group_deposit'              // Member transfers personal FUN/CUN/SUN → CEEGROUP bucket
  | 'expiry';                    // Unused neurons → Ceegroup1 after 6 months

// ── Per-bucket balance state ──────────────────────────────────────────────────
export interface NeuronBucketState {
  balance: number;
  totalReceived: number;
  totalTransferredOut?: number;
}

// ── Full neuron account (all four buckets) ────────────────────────────────────
export interface NeuronAccount {
  _id?: string;
  userId: string;

  /** Earning layer — receives work/task/project rewards; NOT contributions */
  myNeurons: {
    balance: number;
    totalEarned: number;
    totalAllocatedOut: number;
  };

  /** Primary gateway — entry point from external contributions */
  fun: NeuronBucketState;

  /** Cognitive Upgradation — research / innovation / knowledge */
  cun: NeuronBucketState;

  /** Social Upgradation — business / infrastructure / social */
  sun: NeuronBucketState;

  /** Neurons reserved in active project coordination allocations */
  lockedPool: { balance: number };

  /** Support units (max 100,000 neurons, 6-month validity) */
  support: {
    currentDebt: number;
    borrowedAt?: string;
    expiresAt?: string;
  };

  contributorGrade: 'A' | 'B' | 'C' | null;
  monthlyAllocationLastRun?: string;
  lastActivityAt?: string;
  updatedAt: string;
}

// ── Immutable ledger entry ────────────────────────────────────────────────────
export interface NeuronTransaction {
  _id: string;
  txId: string;
  userId: string;
  txType: NeuronTxType;
  fromBucket: NeuronBucket | 'locked_pool' | 'group_neurons' | 'ceegroup1' | 'external';
  toBucket:   NeuronBucket | 'locked_pool' | 'group_neurons' | 'ceegroup1' | 'external';
  amount: number;
  /** Full balance snapshot after this transaction */
  balanceAfter: Record<NeuronBucket | 'lockedPool', number>;
  referenceId?:   string;
  referenceType?: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ── Contribution simulation -> FUN ──────────────────────────────────────
export interface NeuronContribution {
  _id: string;
  userId: string;
  entityType: 'Trust' | 'Section8' | 'PvtLtd';
  entityName: string;
  entityId?: string;
  simulationUnits?: number;
  amountINR?: number; // Schema compatibility alias for simulation-unit records.
  externalReferenceAmount?: number;
  transactionReference: string;
  neuronsIssued: number;
  neuronTransactionId?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  confirmedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
}

// ── Project coordination allocation ────────────────────────────────────────────────────────
export type NeuronProjectType =
  | 'any'
  | 'research' | 'innovation' | 'knowledge'    // CUN eligible
  | 'business' | 'infrastructure' | 'social';  // SUN eligible

export interface NeuronInvestment {
  _id: string;
  userId: string;
  projectId: string;
  projectName: string;
  projectType: NeuronProjectType;
  entityType: 'Trust' | 'Section8' | 'PvtLtd';
  entityName?: string;
  sourceBucket: 'fun' | 'cun' | 'sun';
  amount: number;
  status: 'locked' | 'completed' | 'released' | 'failed';
  outcome?: {
    revenue?: number;
    cost?: number;
    impact?: string;
    evaluatedAt?: string;
  };
  rewardAmount?: number;
  lockedAt: string;
  completedAt?: string;
}

// ── Transfer rules (UI enforcement — also enforced server-side) ───────────────
export const TRANSFER_TARGETS: Readonly<Record<string, NeuronBucket[]>> = {
  fun: ['cun', 'sun'],
  cun: ['sun'],
  sun: ['cun'],
} as const;

// ── Investment bucket rules (UI guidance — enforced server-side) ──────────────
export const BUCKET_PROJECT_TYPES: Readonly<Record<string, string[]>> = {
  fun: ['any', 'research', 'innovation', 'knowledge', 'business', 'infrastructure', 'social'],
  cun: ['research', 'innovation', 'knowledge'],
  sun: ['business', 'infrastructure', 'social'],
} as const;

// ── Bucket metadata for display ────────────────────────────────────────────────
export interface BucketMeta {
  key: NeuronBucket;
  label: string;
  fullName: string;
  description: string;
  color: string;
  borderColor: string;
  receiveFrom: string;
  usedFor: string;
}

export const BUCKET_META: BucketMeta[] = [
  {
    key:         'my_neurons',
    label:       'My Neurons',
    fullName:    'My Neurons',
    description: 'Your personal participation layer. Receives workflow units, task units, and project outcome units. Distributed monthly to FUN / CUN / SUN.',
    color:       '#f59e0b',
    borderColor: '#d97706',
    receiveFrom: 'Work, tasks, project outcomes',
    usedFor:     'Distributed monthly to FUN / CUN / SUN',
  },
  {
    key:         'fun',
    label:       'FUN',
    fullName:    'Family Upgradation Neurons',
    description: '⚗️ Simulation mode. Primary entry gateway. Receives simulated contribution credits. Can be transferred to CUN or SUN, but never the other way.',
    color:       '#60a5fa',
    borderColor: '#3b82f6',
    receiveFrom: 'Simulated contribution units, monthly allocation from My Neurons',
    usedFor:     'Services, sponsorships, simulation allocation to any project',
  },
  {
    key:         'cun',
    label:       'CUN',
    fullName:    'Cognitive Upgradation Neurons',
    description: 'Purpose-locked for cognitive growth. Can only be used for research, innovation, and knowledge projects.',
    color:       '#a78bfa',
    borderColor: '#7c3aed',
    receiveFrom: 'Transfer from FUN or SUN',
    usedFor:     'Research, innovation, knowledge development',
  },
  {
    key:         'sun',
    label:       'SUN',
    fullName:    'Social Upgradation Neurons',
    description: 'Purpose-locked for societal growth. Can only be used for business, infrastructure, and social projects.',
    color:       '#34d399',
    borderColor: '#059669',
    receiveFrom: 'Transfer from FUN or CUN',
    usedFor:     'Business projects, infrastructure, societal development',
  },
];

// ── Compliance disclaimer — shown in any UI that displays neuron data ─────────
export const NEURON_DISCLAIMER =
  'Neurons are Experimental Internal Utility Units within Ceekul. ' +
  'They are platform-restricted, non-transferable outside Ceekul, and non-exchangeable. ' +
  'They do not represent a regulated financial claim. ' +
  'No regulated real-economy execution is active inside this phase. ' +
  'Ceekul is running simulation, workflow testing, and semantic orchestration validation only.';

// ── Simulation mode notice — shown in contribution and ad campaign UI ─────────
export const SIMULATION_MODE_NOTICE =
  '⚗️ Experimental Simulation Mode — Phase 1 Architecture Validation. ' +
  'No regulated real-economy transaction occurs. All balances are internal utility units used ' +
  'exclusively for testing semantic orchestration, contribution workflow logic, and ' +
  'advertisement distribution architecture. ' +
  'Future regulated contribution flows remain abstracted until approval ' +
  'and escrow integration are complete.';

// ── Ad distribution ratios — watch-to-earn simulation defaults ────────────────
export const AD_DISTRIBUTION_RATIOS = {
  viewer:   0.66,  // 66% to the viewer (attention reward)
  provider: 0.33,  // 33% to the content provider
  platform: 0.01,  // 1%  to the platform sustainability pool
} as const;

// ── Reward rate — simulated attention scoring ─────────────────────────────────
// 10 seconds of valid, verified attention = 1 internal utility neuron
export const WATCH_REWARD_RATE_PER_SECOND = 0.1; // SAU (Simulated Allocation Units) / sec
