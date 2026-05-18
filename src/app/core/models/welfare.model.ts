/**
 * CEEKUL WELFARE SYSTEM — Data Models
 * =====================================================================
 * CG100000000000 global welfare — need-first neuron disbursement.
 *
 * Three fund types, each with a distinct purpose:
 *   FUN — basic facilities (food, shelter, daily necessities)
 *   CUN — cognitive upgradation via Ceekul portal expert programs
 *   SUN — emergency care (health, safety) — loan-style, must be repaid
 *
 * Application lifecycle:
 *   submitted → (partial support flows in) → provider confirms →
 *   month-end ranking → neurons disburse → outstanding decreases →
 *   fulfilled → auto-repayment once CB balance crosses EC threshold
 * =====================================================================
 */

export type WelfareFundType = 'fun' | 'cun' | 'sun';

export type WelfareGoalCategory =
  | 'starving'
  | 'shelter'
  | 'learning'
  | 'emergency_health'
  | 'emergency_safety'
  | 'other';

export type WelfareApplicationStatus =
  | 'pending'
  | 'partially_funded'
  | 'fulfilled'
  | 'closed';

export type WelfareSupportSourceType =
  | 'cg_fund'
  | 'member_sun_donation'
  | 'member_fun_donation'
  | 'in_kind_service'
  | 'cun_subsidy'
  | 'other';

// ── Support ledger entry ──────────────────────────────────────────────────────
// Every partial support credit is logged here — the UI shows this to the
// applicant so they can see what has already been arranged for them.
export interface WelfareSupportLedgerEntry {
  _id?:          string;
  sourceId:      string;             // CB or CG ID of donor / provider
  sourceType:    WelfareSupportSourceType;
  amount:        number;
  description?:  string;
  confirmedAt:   string;             // ISO date string
  confirmedBy?:  string;
}

// ── Welfare application ───────────────────────────────────────────────────────
export interface WelfareApplication {
  _id?:                       string;
  applicationId:              string;
  applicantUserId:            string;
  applicantCBId:              string;
  fundType:                   WelfareFundType;
  goalCategory:               WelfareGoalCategory;
  goalDescription:            string;
  requestedAmount:            number;
  outstandingNeed:            number;    // live — decreases as support flows in
  supportLedger:              WelfareSupportLedgerEntry[];
  serviceProviderId?:         string;
  serviceProviderConfirmed:   boolean;
  serviceProviderConfirmedAt?: string;
  isEmergency:                boolean;
  disbursedAmount:            number;
  disbursedAt?:               string;
  repaidAmount:               number;
  repaidAt?:                  string;
  fullyRepaidAt?:             string;
  status:                     WelfareApplicationStatus;
  lastProcessedCycle?:        string;    // 'yyyy-MM'
  createdAt:                  string;
  updatedAt:                  string;
}

// ── Policy: priority criterion ────────────────────────────────────────────────
export type WelfarePriorityField =
  | 'monthly_neuron_inflow'
  | 'outstanding_need'
  | 'days_in_queue'
  | 'goal_category_weight'
  | 'prior_support_received';

export interface WelfarePriorityCriterion {
  field:     WelfarePriorityField;
  weight:    number;
  direction: 'asc' | 'desc';
}

export interface WelfareGoalCategoryWeights {
  starving:          number;
  shelter:           number;
  emergency_health:  number;
  emergency_safety:  number;
  learning:          number;
  other:             number;
}

// ── EC Policy ─────────────────────────────────────────────────────────────────
export interface WelfarePolicy {
  _id?:                                 string;
  policyId:                             string;
  repaymentThreshold:                   number;
  maxDisbursementPerApplicantPerCycle?: number | null;
  priorityCriteria:                     WelfarePriorityCriterion[];
  goalCategoryWeights:                  WelfareGoalCategoryWeights;
  isActive:                             boolean;
  createdBy:                            string;
  notes?:                               string;
  createdAt:                            string;
  updatedAt:                            string;
}

// ── Request payloads ──────────────────────────────────────────────────────────
export interface WelfareApplyPayload {
  fundType:          WelfareFundType;
  goalCategory:      WelfareGoalCategory;
  goalDescription:   string;
  requestedAmount:   number;
  isEmergency?:      boolean;
  serviceProviderId?: string;
}

export interface WelfareCreatePolicyPayload {
  repaymentThreshold:                   number;
  maxDisbursementPerApplicantPerCycle?: number | null;
  priorityCriteria:                     WelfarePriorityCriterion[];
  goalCategoryWeights:                  WelfareGoalCategoryWeights;
  notes?:                               string;
}

// ── Display helpers ───────────────────────────────────────────────────────────
export const WELFARE_FUND_LABELS: Record<WelfareFundType, string> = {
  fun: 'FUN — Basic Facilities',
  cun: 'CUN — Cognitive Upgradation',
  sun: 'SUN — Emergency Care',
};

export const WELFARE_GOAL_LABELS: Record<WelfareGoalCategory, string> = {
  starving:          'Food / Anti-Starving',
  shelter:           'Shelter',
  learning:          'Learning Program',
  emergency_health:  'Emergency Health',
  emergency_safety:  'Emergency Safety',
  other:             'Other',
};

export const WELFARE_STATUS_LABELS: Record<WelfareApplicationStatus, string> = {
  pending:           'Pending',
  partially_funded:  'Partially Funded',
  fulfilled:         'Fulfilled',
  closed:            'Closed',
};
