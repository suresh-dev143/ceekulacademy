/**
 * Shared types for the NestJS Neuron module.
 * Mirror of the Angular frontend model — kept separate to avoid a
 * cross-package import dependency.
 */

export type NeuronType =
  | 'learning'
  | 'collaboration'
  | 'creation'
  | 'contribution'
  | 'innovation';

export type NeuronTxType = 'earned' | 'allocated' | 'unlocked' | 'expired';

export type NeuronTrigger =
  | 'lecture.watched'
  | 'module.completed'
  | 'quiz.passed'
  | 'quiz.perfect_score'
  | 'workshop.attended'
  | 'workshop.hosted'
  | 'discussion.contributed'
  | 'peer.reviewed'
  | 'course.published'
  | 'research.submitted'
  | 'innovation.submitted'
  | 'mentoring.session'
  | 'volunteer.shift';

export interface NeuronTransaction {
  id: string;
  userId: string;
  txType: NeuronTxType;
  neuronType: NeuronType;
  delta: number;
  balanceAfter: number;
  referenceId: string;
  referenceType: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface NeuronTypeBalance {
  type: NeuronType;
  available: number;
  allocated: number;
  earned: number;
}

export interface NeuronBalance {
  userId: string;
  totalAvailable: number;
  totalEarned: number;
  totalAllocated: number;
  byType: NeuronTypeBalance[];
  lastActivity: string;
  updatedAt: string;
}

export interface EarnNeuronsDto {
  userId: string;
  trigger: NeuronTrigger;
  referenceId: string;
  referenceType: string;
  metadata?: Record<string, unknown>;
}

export interface AllocateNeuronsDto {
  userId: string;
  neuronType: NeuronType;
  amount: number;
  poolId?: string;
  gatedItemId?: string;
  description: string;
}

export interface NeuronPool {
  id: string;
  title: string;
  description: string;
  poolType: string;
  targetNeurons: number;
  currentNeurons: number;
  participantCount: number;
  status: 'active' | 'funded' | 'closed' | 'expired';
  beneficiary?: { id: string; name: string; description: string };
  expiresAt: string;
  createdAt: string;
  createdBy: string;
}

// Earning rules with daily caps and cooldowns
export interface NeuronEarningRule {
  id: string;
  trigger: NeuronTrigger;
  neuronType: NeuronType;
  baseAmount: number;
  bonusConditions?: { condition: string; multiplier: number }[];
  dailyCap?: number;
  cooldownMinutes?: number;
  active: boolean;
}

export const EARNING_RULES: NeuronEarningRule[] = [
  { id: 'r01', trigger: 'lecture.watched',        neuronType: 'learning',       baseAmount: 10,  dailyCap: 50,  cooldownMinutes: 30, active: true },
  { id: 'r02', trigger: 'module.completed',       neuronType: 'learning',       baseAmount: 25,  dailyCap: 100,                      active: true },
  { id: 'r03', trigger: 'quiz.passed',            neuronType: 'learning',       baseAmount: 20,  dailyCap: 80,                       active: true },
  { id: 'r04', trigger: 'quiz.perfect_score',     neuronType: 'learning',       baseAmount: 40,  dailyCap: 80,                       active: true },
  { id: 'r05', trigger: 'workshop.attended',      neuronType: 'collaboration',  baseAmount: 50,  dailyCap: 100,                      active: true },
  { id: 'r06', trigger: 'workshop.hosted',        neuronType: 'collaboration',  baseAmount: 75,  dailyCap: 150,                      active: true },
  { id: 'r07', trigger: 'discussion.contributed', neuronType: 'collaboration',  baseAmount: 5,   dailyCap: 25,  cooldownMinutes: 60, active: true },
  { id: 'r08', trigger: 'peer.reviewed',          neuronType: 'collaboration',  baseAmount: 15,  dailyCap: 60,                       active: true },
  { id: 'r09', trigger: 'course.published',       neuronType: 'creation',       baseAmount: 100, dailyCap: 200,                      active: true },
  { id: 'r10', trigger: 'research.submitted',     neuronType: 'creation',       baseAmount: 80,  dailyCap: 160,                      active: true },
  { id: 'r11', trigger: 'innovation.submitted',   neuronType: 'innovation',     baseAmount: 120, dailyCap: 240,                      active: true },
  { id: 'r12', trigger: 'mentoring.session',      neuronType: 'contribution',   baseAmount: 40,  dailyCap: 120,                      active: true },
  { id: 'r13', trigger: 'volunteer.shift',        neuronType: 'contribution',   baseAmount: 60,  dailyCap: 180,                      active: true },
];
