/**
 * CEEGROUP — Collective Entity Models
 * =====================================================================
 * A CEEGROUP is identified by a unique 15-digit numeric ID.
 * Individual users (CEEBRAIN) are identified by 12-digit IDs.
 *
 * Entity type is determined by ID length:
 *   12 digits → CEEBRAIN (individual)
 *   15 digits → CEEGROUP (collective)
 *
 * Neuron flow:
 *   Member deposits personal FUN/CUN/SUN → CEEGROUP matching bucket
 *   CEEGROUP sends FUN/CUN/SUN for services → receiver MY NEURONS or Group Neurons
 *   CEEGROUP receives service payments → Group Neurons
 * =====================================================================
 */

export type CeegroupMemberRole = 'admin' | 'member';

export interface CeegroupMember {
  userId:   string;
  role:     CeegroupMemberRole;
  joinedAt: string;
}

export interface CeegroupBucketState {
  balance:             number;
  totalReceived:       number;
  totalTransferredOut?: number;
}

export interface CeegroupAccount {
  _id:        string;
  ceegroupId: string;   // 15-digit unique ID
  name:       string;
  description?: string;
  createdBy:  string;
  members:    CeegroupMember[];

  /** Sending buckets — filled by member deposits */
  fun: CeegroupBucketState;
  cun: CeegroupBucketState;
  sun: CeegroupBucketState;

  /** Receiving bucket — credited from inbound service payments */
  groupNeurons: {
    balance:       number;
    totalReceived: number;
  };

  isActive:       boolean;
  lastActivityAt?: string;
  createdAt:      string;
  updatedAt:      string;
}

// ── Payloads ──────────────────────────────────────────────────────────────────

export interface CreateCeegroupPayload {
  name:         string;
  description?: string;
}

export interface AddMemberPayload {
  userId: string;
  role?:  CeegroupMemberRole;
}

export interface GroupDepositPayload {
  fromBucket: 'fun' | 'cun' | 'sun';
  amount:     number;
}

export interface ServiceTransferPayload {
  senderEntityId:    string;   // Your CEEBRAIN ID or a CEEGROUP ID you belong to
  receiverEntityId:  string;   // Destination CEEBRAIN or CEEGROUP ID
  fromBucket:        'fun' | 'cun' | 'sun';
  amount:            number;
  serviceDescription: string;
}

// ── Entity resolution (used by the Send form preview) ─────────────────────────

export type EntityType = 'ceebrain' | 'ceegroup';

export interface ResolvedEntity {
  type:     EntityType;
  name:     string;
  entityId: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Determine entity type from ID length */
export function entityTypeOf(id: string): EntityType | null {
  if (/^\d{12}$/.test(id)) return 'ceebrain';
  if (/^\d{15}$/.test(id)) return 'ceegroup';
  return null;
}
