import { Injectable, signal, computed } from '@angular/core';

// ── Domain types ──────────────────────────────────────────────────────────────

export interface CuapVitals {
  activeUsers: number;
  contentUnitsTotal: number;
  adsActive: number;
  cidCommitsToday: number;
  moderationQueueSize: number;
  neuronFlowToday: number;
  systemLoad: 'normal' | 'elevated' | 'critical';
  uptime: number;
}

export type EventSeverity = 'info' | 'warning' | 'critical';
export type EventType =
  | 'cid_commit' | 'ad_approved' | 'ad_rejected' | 'user_flagged'
  | 'content_approved' | 'content_rejected' | 'override'
  | 'identity_verified' | 'fraud_detected' | 'system';

export interface AdminEvent {
  id: string;
  type: EventType;
  cid?: string;
  actor: string;
  summary: string;
  timestamp: Date;
  severity: EventSeverity;
}

export interface CidRecord {
  cid: string;
  type: 'content' | 'ad' | 'user' | 'session' | 'chat' | 'identity';
  logicalId: string;
  parentCid?: string;
  version: number;
  timestamp: Date;
  trusted: boolean;
  status: 'active' | 'archived' | 'flagged' | 'pending';
  sizeBytes: number;
  references: number;
}

export type ContentPhase = 'morning' | 'work' | 'afternoon' | 'evening' | 'wind-down' | 'sleep';

export interface ContentSlot {
  hour: number;
  hourLabel: string;
  contentCid: string;
  contentTitle: string;
  phase: ContentPhase;
  adPackCid: string;
  adTitle: string;
  isCurrentHour: boolean;
  hasOverride: boolean;
  engagementScore: number;
  aiSuggestion?: string;
}

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export interface ModerationItem {
  cid: string;
  type: 'content' | 'ad' | 'chat' | 'profile';
  title: string;
  author: string;
  flaggedAt: Date;
  riskScore: number;
  flags: string[];
  status: ModerationStatus;
}

export interface SystemService {
  name: string;
  health: number;
  status: 'operational' | 'degraded' | 'down';
  latencyMs: number;
}

export interface AdminUser {
  id: string;
  cbId: string;
  name: string;
  email: string;
  role: 'admin' | 'creator' | 'user';
  neurons: number;
  joinedAt: Date;
  status: 'active' | 'suspended' | 'pending';
}

export interface AdPack {
  cid: string;
  name: string;
  advertiser: string;
  targetSlot: string;
  budget: number;
  spend: number;
  impressions: number;
  ctr: number;
  status: 'active' | 'paused' | 'draft';
}

export interface AdStats {
  activePacks: number;
  impressionsToday: number;
  ctr: number;
  revenueToday: number;
  fillRate: number;
  fraudBlocked: number;
}

export interface UserStats {
  total: number;
  activeToday: number;
  newThisWeek: number;
  suspended: number;
  pendingKyc: number;
}

export interface AnalyticsKpi {
  key: string;
  label: string;
  value: string;
  delta: string;
  deltaPositive: boolean;
}

export interface HourlyBar {
  hour: string;
  hourShort: string;
  score: number;
}

export interface TopContentItem {
  cid: string;
  title: string;
  neurons: number;
}

export interface NeuronCategory {
  name: string;
  neurons: number;
  pct: number;
}

export interface InfraService {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  uptime: number;
  rps: number;
}

export interface CacheLayer {
  name: string;
  hitRate: number;
}

export interface QueueDepth {
  name: string;
  depth: number;
  lagMs: number;
}

export interface IdentityStats {
  issued: number;
  kycVerified: number;
  biometricLinked: number;
  fraudFlags: number;
  revoked: number;
}

export interface TrustBand {
  label: string;
  color: string;
  pct: number;
  count: number;
}

export interface FraudSignal {
  id: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  detectedAt: Date;
}

export interface KycStep {
  name: string;
  done: boolean;
  index: number;
  count: number;
}

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface RateLimit {
  key: string;
  name: string;
  value: number;
  window: string;
}

export interface UceThreshold {
  key: string;
  name: string;
  value: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

function _vitals(): CuapVitals {
  return {
    activeUsers: 28_491, contentUnitsTotal: 142_387, adsActive: 4_219,
    cidCommitsToday: 87_341, moderationQueueSize: 23,
    neuronFlowToday: 1_847_293, systemLoad: 'normal', uptime: 99.97,
  };
}

function _events(): AdminEvent[] {
  const t = Date.now();
  return [
    { id: 'e1', type: 'cid_commit',        cid: 'ck_7f2a8b3c', actor: 'system',        summary: 'Content atom committed — Research: AI in Education',        timestamp: new Date(t - 12_000),   severity: 'info'     },
    { id: 'e2', type: 'ad_approved',       cid: 'ck_3b1c9e4f', actor: 'admin',         summary: 'Ad approved — Tech Workshop 2026',                          timestamp: new Date(t - 45_000),   severity: 'info'     },
    { id: 'e3', type: 'fraud_detected',    cid: 'ck_9d5e2a1b', actor: 'fraud-engine',  summary: 'Suspicious impression pattern — 847 rapid ticks detected',  timestamp: new Date(t - 120_000),  severity: 'critical' },
    { id: 'e4', type: 'content_approved',  cid: 'ck_2a1f7d3e', actor: 'admin',         summary: 'Content approved — Yoga & Pranayama Module 3',             timestamp: new Date(t - 180_000),  severity: 'info'     },
    { id: 'e5', type: 'identity_verified', cid: 'ck_8c4d0f2a', actor: 'identity-svc',  summary: 'Biometric layer verified — CB100000147821',                 timestamp: new Date(t - 240_000),  severity: 'info'     },
    { id: 'e6', type: 'user_flagged',      cid: 'ck_4e7b1c9d', actor: 'ai-filter',     summary: 'Profile flagged — risk score 87/100',                       timestamp: new Date(t - 360_000),  severity: 'warning'  },
    { id: 'e7', type: 'override',          cid: 'ck_1a3f8e5c', actor: 'admin',         summary: 'Homepage slot 14:00 manually overridden',                   timestamp: new Date(t - 480_000),  severity: 'warning'  },
    { id: 'e8', type: 'cid_commit',        cid: 'ck_6d9a2b4e', actor: 'session-svc',   summary: 'Session summary generated — Workshop: Vedic Maths',         timestamp: new Date(t - 600_000),  severity: 'info'     },
    { id: 'e9', type: 'content_rejected',  cid: 'ck_b2e5f9a1', actor: 'admin',         summary: 'Content rejected — Misleading health claims',              timestamp: new Date(t - 780_000),  severity: 'warning'  },
    { id: 'e10', type: 'system',                               actor: 'infra',          summary: 'Identity service latency spike — 124ms avg',               timestamp: new Date(t - 960_000),  severity: 'warning'  },
  ];
}

const PHASES: ContentPhase[] = ['morning','morning','morning','work','work','work','work','work','afternoon','afternoon','afternoon','evening','evening','wind-down'];
const TITLES = ['Wake + Detox','Movement & Breath','Learning Focus','Deep Work A','Deep Work B','Creative Sprint','Collaboration','Reflection','Afternoon Focus','Skill Building','Health & Wellness','Civic Participation','Evening Learning','Wind Down'];
const AD_TITLES = ['Morning Health Pack','Fitness Pro Q2','EduTech 2026','Corporate Training','AI Workshop Series','Ceekul Premium','Local Business','Health Connect','Nutrition Guide','Career Skills','Mindfulness App','Community Forum','Evening Courses','Sleep Tech'];
const AI_TIPS = [undefined, undefined, 'Consider swapping with slot 07:00 — higher morning engagement predicted', undefined, undefined, 'Ad pack underperforming — suggest Tech Workshop bundle', undefined, undefined, 'Peak engagement window — consider premium content here', undefined, undefined, undefined, undefined, undefined];

function _slots(): ContentSlot[] {
  const hours = [5,6,7,8,9,10,11,12,13,14,15,16,17,18];
  const cur = new Date().getHours();
  return hours.map((h, i) => ({
    hour: h,
    hourLabel: h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h-12}:00 PM`,
    contentCid: `ck_${(0x10000000 + i * 0x3f2a1b4c).toString(16).slice(0, 8)}`,
    contentTitle: TITLES[i],
    phase: PHASES[i],
    adPackCid: `ck_${(0x20000000 + i * 0x1e9b3d7a).toString(16).slice(0, 8)}`,
    adTitle: AD_TITLES[i],
    isCurrentHour: h === cur,
    hasOverride: h === 10 || h === 14,
    engagementScore: 58 + Math.floor((i * 7 + 3) % 42),
    aiSuggestion: AI_TIPS[i],
  }));
}

function _modQueue(): ModerationItem[] {
  return [
    { cid: 'ck_f3a7b2e1', type: 'content', title: 'How to bypass payment gateways',          author: 'CB100000284719', flaggedAt: new Date(Date.now()-1_800_000), riskScore: 94, flags: ['financial fraud','illegal activity'],   status: 'pending' },
    { cid: 'ck_c8d4f1a3', type: 'ad',      title: 'Guaranteed 50% returns — Invest now',     author: 'CB100000391047', flaggedAt: new Date(Date.now()-3_600_000), riskScore: 87, flags: ['misleading claims','financial fraud'], status: 'pending' },
    { cid: 'ck_2e9b5c7d', type: 'chat',    title: 'Chat session — Research Workshop #4892',  author: 'CB100000127483', flaggedAt: new Date(Date.now()-7_200_000), riskScore: 42, flags: ['spam pattern'],                       status: 'pending' },
    { cid: 'ck_a1f6d3e8', type: 'profile', title: 'User profile — CB100000748291',           author: 'CB100000748291', flaggedAt: new Date(Date.now()-10_800_000),riskScore: 61, flags: ['suspicious bio','multiple reports'],   status: 'pending' },
    { cid: 'ck_7b3c9e2f', type: 'content', title: 'Natural medicine: Skip your prescriptions',author:'CB100000583021',flaggedAt: new Date(Date.now()-14_400_000),riskScore: 78, flags: ['health misinformation'],              status: 'pending' },
  ];
}

function _services(): SystemService[] {
  return [
    { name: 'CID Pipeline',      health: 99, status: 'operational', latencyMs: 4   },
    { name: 'Ad Delivery',       health: 99, status: 'operational', latencyMs: 2   },
    { name: 'UCE Engine',        health: 97, status: 'operational', latencyMs: 8   },
    { name: 'Fraud Detection',   health: 94, status: 'operational', latencyMs: 15  },
    { name: 'Session Lifecycle', health: 98, status: 'operational', latencyMs: 6   },
    { name: 'Identity Service',  health: 89, status: 'degraded',    latencyMs: 124 },
    { name: 'AI Filter',         health: 96, status: 'operational', latencyMs: 31  },
    { name: 'Analytics Engine',  health: 82, status: 'degraded',    latencyMs: 287 },
  ];
}

function _adPacks(): AdPack[] {
  return [
    { cid: 'ck_ad1f3b2e', name: 'Morning Health Pack',       advertiser: 'HealthFirst India',  targetSlot: '06:00 AM', budget: 50_000,  spend: 31_200, impressions: 48_291, ctr: 4.2, status: 'active'  },
    { cid: 'ck_ad2a9c7d', name: 'Tech Workshop Series Q2',   advertiser: 'CodeForBharat',      targetSlot: '10:00 AM', budget: 120_000, spend: 94_800, impressions: 182_419,ctr: 3.8, status: 'active'  },
    { cid: 'ck_ad3e5f1a', name: 'Fitness Pro — Summer',      advertiser: 'MoveWell',           targetSlot: '07:00 AM', budget: 35_000,  spend: 8_750,  impressions: 14_200, ctr: 2.9, status: 'paused'  },
    { cid: 'ck_ad4b7d3c', name: 'Ceekul Premium Upgrade',    advertiser: 'Ceekul Internal',    targetSlot: '08:00 AM', budget: 0,       spend: 0,      impressions: 92_100, ctr: 6.1, status: 'active'  },
    { cid: 'ck_ad5c2e8f', name: 'Career Skills Bootcamp',    advertiser: 'UpskillBharat',      targetSlot: '05:00 PM', budget: 75_000,  spend: 0,      impressions: 0,      ctr: 0,   status: 'draft'   },
  ];
}

function _users(): AdminUser[] {
  return [
    { id: 'u1', cbId: 'CB100000147821', name: 'Arjun Sharma',    email: 'arjun@example.com',   role: 'admin',   neurons: 42_891, joinedAt: new Date('2024-01-15'), status: 'active'    },
    { id: 'u2', cbId: 'CB100000284719', name: 'Priya Nair',      email: 'priya@example.com',   role: 'creator', neurons: 18_340, joinedAt: new Date('2024-03-22'), status: 'active'    },
    { id: 'u3', cbId: 'CB100000391047', name: 'Ravi Kumar',      email: 'ravi@example.com',    role: 'user',    neurons: 2_190,  joinedAt: new Date('2024-06-01'), status: 'suspended' },
    { id: 'u4', cbId: 'CB100000127483', name: 'Sunita Patel',    email: 'sunita@example.com',  role: 'creator', neurons: 9_741,  joinedAt: new Date('2024-08-10'), status: 'active'    },
    { id: 'u5', cbId: 'CB100000748291', name: 'Mohammed Iqbal',  email: 'iqbal@example.com',   role: 'user',    neurons: 412,    joinedAt: new Date('2025-01-05'), status: 'pending'   },
    { id: 'u6', cbId: 'CB100000583021', name: 'Kavya Reddy',     email: 'kavya@example.com',   role: 'creator', neurons: 31_200, joinedAt: new Date('2024-11-18'), status: 'active'    },
    { id: 'u7', cbId: 'CB100000902847', name: 'Deepak Joshi',    email: 'deepak@example.com',  role: 'user',    neurons: 5_830,  joinedAt: new Date('2025-02-28'), status: 'active'    },
    { id: 'u8', cbId: 'CB100000471023', name: 'Lakshmi Iyer',    email: 'lakshmi@example.com', role: 'creator', neurons: 27_640, joinedAt: new Date('2024-07-14'), status: 'active'    },
  ];
}

function _infraServices(): InfraService[] {
  return [
    { name: 'CID Pipeline',       status: 'healthy',  latencyMs: 4,   uptime: 99.99, rps: 12_847 },
    { name: 'UCE Write Engine',   status: 'healthy',  latencyMs: 8,   uptime: 99.97, rps: 4_219  },
    { name: 'Ad Delivery Grid',   status: 'healthy',  latencyMs: 2,   uptime: 99.99, rps: 28_401 },
    { name: 'Fraud Detection',    status: 'healthy',  latencyMs: 15,  uptime: 99.94, rps: 8_847  },
    { name: 'Session Lifecycle',  status: 'healthy',  latencyMs: 6,   uptime: 99.98, rps: 3_941  },
    { name: 'Identity Service',   status: 'degraded', latencyMs: 124, uptime: 99.71, rps: 1_204  },
    { name: 'AI Content Filter',  status: 'healthy',  latencyMs: 31,  uptime: 99.96, rps: 2_184  },
    { name: 'Analytics Engine',   status: 'degraded', latencyMs: 287, uptime: 99.52, rps: 941    },
    { name: 'Notification Bus',   status: 'healthy',  latencyMs: 5,   uptime: 99.99, rps: 7_384  },
    { name: 'Object Storage',     status: 'healthy',  latencyMs: 18,  uptime: 99.99, rps: 5_102  },
  ];
}

function _featureFlags(): FeatureFlag[] {
  return [
    { key: 'ff_ai_shadow_editor',    name: 'AI Shadow Editor',        description: 'Heuristic slot suggestions on homepage engine',           enabled: true  },
    { key: 'ff_biometric_kyc',       name: 'Biometric KYC',           description: 'Enable fingerprint + face scan during registration',       enabled: true  },
    { key: 'ff_neuron_decay',        name: 'Neuron Time-Decay',       description: 'Apply weekly 2% decay to idle neuron balances',            enabled: false },
    { key: 'ff_cbid_public_api',     name: 'CB ID Public API',        description: 'Allow third-party CB ID resolution via API key',           enabled: false },
    { key: 'ff_ad_fraud_realtime',   name: 'Real-time Fraud Block',   description: 'Block suspicious ad impressions in <50ms',                 enabled: true  },
    { key: 'ff_content_versioning',  name: 'CID Version Chains',      description: 'Store parent CID on all UCE commits for full audit trail', enabled: true  },
    { key: 'ff_emergency_lockdown',  name: 'Emergency Lockdown Mode', description: 'Hard-disable all external API calls and writes',           enabled: false },
  ];
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class CuapService {
  readonly vitals          = signal<CuapVitals>(_vitals());
  readonly activityFeed    = signal<AdminEvent[]>(_events());
  readonly contentSlots    = signal<ContentSlot[]>(_slots());
  readonly moderationQueue = signal<ModerationItem[]>(_modQueue());
  readonly systemServices  = signal<SystemService[]>(_services());
  private readonly _adPacks       = signal<AdPack[]>(_adPacks());
  private readonly _users         = signal<AdminUser[]>(_users());
  private readonly _infraServices = signal<InfraService[]>(_infraServices());
  private readonly _featureFlags  = signal<FeatureFlag[]>(_featureFlags());

  readonly cidQuery      = signal('');
  readonly cidResult     = signal<CidRecord | null>(null);
  readonly cidResolving  = signal(false);
  readonly cidError      = signal(false);

  readonly pendingCount   = computed(() => this.moderationQueue().filter(m => m.status === 'pending').length);
  readonly criticalCount  = computed(() => this.activityFeed().filter(e => e.severity === 'critical').length);
  readonly degradedCount  = computed(() => this.systemServices().filter(s => s.status !== 'operational').length);

  // ── Ad Manager ──────────────────────────────────────────────────────────────
  adPacks() { return this._adPacks(); }
  adStats(): AdStats {
    const packs = this._adPacks();
    return {
      activePacks:      packs.filter(p => p.status === 'active').length,
      impressionsToday: packs.reduce((a, p) => a + p.impressions, 0),
      ctr:              +(packs.reduce((a, p) => a + p.ctr, 0) / (packs.length || 1)).toFixed(1),
      revenueToday:     Math.round(packs.reduce((a, p) => a + p.spend * 0.3, 0)),
      fillRate:         94.7,
      fraudBlocked:     1_284,
    };
  }

  // ── User Management ─────────────────────────────────────────────────────────
  userStats(): UserStats {
    const u = this._users();
    return {
      total:       28_491,
      activeToday: 4_812,
      newThisWeek: 347,
      suspended:   u.filter(x => x.status === 'suspended').length,
      pendingKyc:  u.filter(x => x.status === 'pending').length,
    };
  }

  filteredUsers(query: string): AdminUser[] {
    const q = query.toLowerCase().trim();
    if (!q) return this._users();
    return this._users().filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.cbId.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }

  // ── Analytics ───────────────────────────────────────────────────────────────
  analyticsKpis(): AnalyticsKpi[] {
    return [
      { key: 'dau',      label: 'DAU',            value: '28,491',    delta: '+4.2%',   deltaPositive: true  },
      { key: 'sessions', label: 'SESSIONS TODAY',  value: '84,193',    delta: '+7.8%',   deltaPositive: true  },
      { key: 'neurons',  label: 'NEURONS MINTED',  value: '1.84M',     delta: '+12.3%',  deltaPositive: true  },
      { key: 'revenue',  label: 'AD REVENUE',      value: '₹4.12L',    delta: '+2.1%',   deltaPositive: true  },
      { key: 'churn',    label: 'CHURN RATE',      value: '0.8%',      delta: '-0.3pp',  deltaPositive: true  },
      { key: 'content',  label: 'CONTENT UNITS',   value: '142,387',   delta: '+891',    deltaPositive: true  },
    ];
  }

  hourlyEngagement(): HourlyBar[] {
    const scores = [22,18,31,45,62,78,84,91,88,76,69,72,65,58,71,83,79,74,61,49,38,29,24,18];
    return scores.map((score, i) => ({
      hour: `${i}:00`, hourShort: i % 4 === 0 ? `${i}h` : '', score,
    }));
  }

  topContent(): TopContentItem[] {
    return [
      { cid: 'ck_7f2a8b3c', title: 'Deep Work — Focus Framework',      neurons: 84_291 },
      { cid: 'ck_3b1c9e4f', title: 'Vedic Mathematics Level 2',        neurons: 71_840 },
      { cid: 'ck_9d5e2a1b', title: 'Morning Yoga & Pranayama',         neurons: 63_412 },
      { cid: 'ck_2a1f7d3e', title: 'Civic Participation: Your Vote',   neurons: 54_183 },
      { cid: 'ck_8c4d0f2a', title: 'Nutrition for Peak Performance',   neurons: 47_920 },
    ];
  }

  neuronCategories(): NeuronCategory[] {
    const cats = [
      { name: 'Learning & Education', neurons: 841_200 },
      { name: 'Health & Wellness',    neurons: 412_900 },
      { name: 'Civic Participation',  neurons: 289_400 },
      { name: 'Creative Work',        neurons: 184_700 },
      { name: 'Community Building',   neurons: 119_093 },
    ];
    const max = cats[0].neurons;
    return cats.map(c => ({ ...c, pct: Math.round((c.neurons / max) * 100) }));
  }

  // ── Infrastructure ──────────────────────────────────────────────────────────
  infraServices() { return this._infraServices(); }

  cacheLayers(): CacheLayer[] {
    return [
      { name: 'CID Lookup (L1)',      hitRate: 98.4 },
      { name: 'Ad Pack (L1)',         hitRate: 99.1 },
      { name: 'Content Metadata (L2)',hitRate: 94.7 },
      { name: 'Session State (Redis)',hitRate: 87.2 },
      { name: 'Analytics (L3)',       hitRate: 71.8 },
    ];
  }

  queueDepths(): QueueDepth[] {
    return [
      { name: 'CID Commit Queue',     depth: 12,    lagMs: 3   },
      { name: 'Moderation Queue',     depth: 23,    lagMs: 0   },
      { name: 'Analytics Ingestion',  depth: 8_491, lagMs: 847 },
      { name: 'Notification Bus',     depth: 184,   lagMs: 12  },
      { name: 'Fraud Detection',      depth: 47,    lagMs: 8   },
    ];
  }

  // ── Identity ────────────────────────────────────────────────────────────────
  identityStats(): IdentityStats {
    return { issued: 28_491, kycVerified: 21_840, biometricLinked: 14_291, fraudFlags: 47, revoked: 12 };
  }

  trustBands(): TrustBand[] {
    return [
      { label: 'Platinum (91–100)', color: '#00f5ff', pct: 8,  count: 2_279  },
      { label: 'Gold (76–90)',      color: '#f59e0b', pct: 24, count: 6_838  },
      { label: 'Silver (51–75)',    color: '#c8d8f0', pct: 41, count: 11_681 },
      { label: 'Bronze (26–50)',    color: '#ff9900', pct: 21, count: 5_983  },
      { label: 'Flagged (0–25)',    color: '#ff3366', pct: 6,  count: 1_710  },
    ];
  }

  fraudSignals(): FraudSignal[] {
    const t = Date.now();
    return [
      { id: 'fs1', severity: 'high',   description: '847 rapid ad impressions from single IP — 10.0.2.91',    detectedAt: new Date(t - 120_000)  },
      { id: 'fs2', severity: 'high',   description: 'Multiple CB ID registrations from same device fingerprint', detectedAt: new Date(t - 480_000)  },
      { id: 'fs3', severity: 'medium', description: 'Neuron farming pattern — 12 accounts, coordinated timing',  detectedAt: new Date(t - 1_800_000) },
      { id: 'fs4', severity: 'medium', description: 'KYC photo reuse detected — CB100000391047',                 detectedAt: new Date(t - 3_600_000) },
      { id: 'fs5', severity: 'low',    description: 'Unusual session length — 14h continuous on single content', detectedAt: new Date(t - 7_200_000) },
    ];
  }

  kycSteps(): KycStep[] {
    return [
      { index: 1, name: 'Phone OTP',   done: true,  count: 28_491 },
      { index: 2, name: 'Email Verify',done: true,  count: 26_204 },
      { index: 3, name: 'ID Upload',   done: true,  count: 23_419 },
      { index: 4, name: 'Biometric',   done: false, count: 14_291 },
      { index: 5, name: 'AI Review',   done: false, count: 21_840 },
    ];
  }

  // ── Settings ────────────────────────────────────────────────────────────────
  featureFlags() { return this._featureFlags(); }

  rateLimits(): RateLimit[] {
    return [
      { key: 'rl_api_global',   name: 'Global API',         value: 1000,  window: 'min' },
      { key: 'rl_cid_commit',   name: 'CID Commits',        value: 500,   window: 'min' },
      { key: 'rl_ad_serve',     name: 'Ad Serve',           value: 10000, window: 'min' },
      { key: 'rl_kyc_attempts', name: 'KYC Attempts',       value: 5,     window: 'day' },
      { key: 'rl_mod_actions',  name: 'Mod Actions / admin',value: 200,   window: 'hr'  },
    ];
  }

  uceThresholds(): UceThreshold[] {
    return [
      { key: 'uce_dedup_window',   name: 'Dedup Window',            value: '30 seconds'      },
      { key: 'uce_max_payload',    name: 'Max Payload Size',         value: '512 KB'          },
      { key: 'uce_risk_block',     name: 'Risk Score Auto-Block',    value: '85 / 100'        },
      { key: 'uce_version_limit',  name: 'Max Versions per logicalId',value: '999 (unlimited)'},
      { key: 'uce_retention',      name: 'Commit Log Retention',     value: '7 years'         },
    ];
  }

  toggleFlag(key: string): void {
    this._featureFlags.update(flags =>
      flags.map(f => f.key === key ? { ...f, enabled: !f.enabled } : f)
    );
  }

  resolveCid(cid: string): void {
    const q = cid.trim();
    if (!q) return;
    this.cidResolving.set(true);
    this.cidResult.set(null);
    this.cidError.set(false);
    setTimeout(() => {
      if (q.startsWith('ck_') || q.startsWith('CB')) {
        this.cidResult.set({
          cid: q, type: 'content',
          logicalId: 'lgi_' + q.slice(-8),
          parentCid: q !== 'ck_00000000' ? `ck_${(parseInt(q.slice(3), 16) - 1).toString(16).padStart(8,'0')}` : undefined,
          version: 3, timestamp: new Date(Date.now() - 7_200_000),
          trusted: true, status: 'active',
          sizeBytes: 4_096, references: 14,
        });
      } else {
        this.cidError.set(true);
      }
      this.cidResolving.set(false);
    }, 500);
  }

  approveItem(cid: string): void {
    this.moderationQueue.update(q => q.map(m => m.cid === cid ? { ...m, status: 'approved' as const } : m));
    this.vitals.update(v => ({ ...v, moderationQueueSize: Math.max(0, v.moderationQueueSize - 1) }));
  }

  rejectItem(cid: string): void {
    this.moderationQueue.update(q => q.map(m => m.cid === cid ? { ...m, status: 'rejected' as const } : m));
    this.vitals.update(v => ({ ...v, moderationQueueSize: Math.max(0, v.moderationQueueSize - 1) }));
  }

  overrideSlot(hour: number, newCid: string): void {
    this.contentSlots.update(slots =>
      slots.map(s => s.hour === hour ? { ...s, contentCid: newCid, hasOverride: true } : s)
    );
  }

  clearOverride(hour: number): void {
    this.contentSlots.update(slots =>
      slots.map(s => s.hour === hour ? { ...s, hasOverride: false } : s)
    );
  }

  relative(date: Date): string {
    const s = Math.floor((Date.now() - date.getTime()) / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    return `${Math.floor(m / 60)}h`;
  }

  phaseAccent(phase: ContentPhase): string {
    const map: Record<ContentPhase, string> = {
      morning: '#f59e0b', work: '#22c55e', afternoon: '#a78bfa',
      evening: '#fb923c', 'wind-down': '#818cf8', sleep: '#4a90d9',
    };
    return map[phase] ?? '#888';
  }

  riskColor(score: number): string {
    if (score >= 80) return '#ff3366';
    if (score >= 50) return '#ff9900';
    return '#22c55e';
  }
}
