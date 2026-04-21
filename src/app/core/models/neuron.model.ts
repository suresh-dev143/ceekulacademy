/**
 * CEEKUL NEURON PARTICIPATION ECOSYSTEM — Data Models
 * =====================================================================
 * Neurons are NON-MONETARY, NON-WITHDRAWABLE internal participation
 * units that represent a user's contribution to the Ceekul ecosystem.
 *
 * THE SYSTEM IS NEVER A BANK, WALLET, OR FINANCIAL INTERMEDIARY.
 *
 * Four-Bucket Architecture:
 *
 *   MY NEURONS  — Earning layer. Receives work rewards and project
 *                 outcome rewards. Monthly allocation distributes
 *                 its balance to FUN / CUN / SUN.
 *
 *   FUN         — Family Upgradation Neurons. Primary entry point.
 *                 Receives contribution conversions (1 INR = 1 Neuron).
 *                 Can transfer to CUN or SUN. NEVER receives back from
 *                 CUN or SUN. Used for services, sponsorships, and
 *                 investment in any project type.
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
 *   Project rewards → My Neurons (variable, outcome-based, non-guaranteed)
 *   Monthly: My Neurons → FUN/CUN/SUN (99% user, 1% Ceekul)
 *
 * Real money: ALWAYS external — user bank → entity escrow (outside portal)
 * =====================================================================
 */

// ── Bucket identifiers ────────────────────────────────────────────────────────
export type NeuronBucket = 'my_neurons' | 'fun' | 'cun' | 'sun';

// ── Transaction types ─────────────────────────────────────────────────────────
export type NeuronTxType =
  | 'contribution_conversion'    // External money confirmed → FUN (1 INR = 1 Neuron)
  | 'bucket_transfer'            // User moves neurons between FUN/CUN/SUN
  | 'investment_lock'            // Source bucket → locked pool
  | 'investment_release'         // Locked pool returned (project failed/cancelled)
  | 'project_reward'             // Project outcome → My Neurons (variable, non-guaranteed)
  | 'work_reward'                // Work / task completion → My Neurons
  | 'monthly_allocation_user'    // My Neurons → FUN/CUN/SUN (user's 99% share)
  | 'monthly_allocation_ceekul'  // My Neurons → Ceekul's 1% share
  | 'support_borrow'             // Support debt credited to FUN
  | 'support_repay'              // Support debt repaid
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

  /** Neurons locked in active project investments */
  lockedPool: { balance: number };

  /** Support debt (max 100,000 neurons, 6-month validity) */
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

// ── Contribution (external money → FUN) ──────────────────────────────────────
export interface NeuronContribution {
  _id: string;
  userId: string;
  entityType: 'Trust' | 'Section8' | 'PvtLtd';
  entityName: string;
  entityId?: string;
  amountINR: number;
  transactionReference: string;
  neuronsIssued: number;
  neuronTransactionId?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  confirmedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
}

// ── Project investment ────────────────────────────────────────────────────────
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
    description: 'Your personal earning layer. Receives work rewards, task rewards, and project outcome rewards. Distributed monthly to FUN / CUN / SUN.',
    color:       '#f59e0b',
    borderColor: '#d97706',
    receiveFrom: 'Work, tasks, project outcomes',
    usedFor:     'Distributed monthly to FUN / CUN / SUN',
  },
  {
    key:         'fun',
    label:       'FUN',
    fullName:    'Family Upgradation Neurons',
    description: 'Primary entry gateway. Receives contribution conversions (1 INR = 1 Neuron). Can be transferred to CUN or SUN, but never the other way.',
    color:       '#60a5fa',
    borderColor: '#3b82f6',
    receiveFrom: 'External contributions (1 INR = 1 Neuron), monthly allocation',
    usedFor:     'Services, sponsorships, any project investment',
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
  'Neurons are non-monetary internal participation units within Ceekul. ' +
  'They have no real-world monetary value, cannot be withdrawn, sold, or exchanged ' +
  'for money, and do not represent any financial claim. ' +
  'All real-money transactions are handled exclusively by legally registered external entities. ' +
  'Ceekul is NOT a bank, wallet, or financial intermediary.';
