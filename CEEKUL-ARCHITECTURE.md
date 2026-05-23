# Ceekul Semantic Architecture
## Civilization-Scale Semantic Nervous System — Living Blueprint

> This document is the master reference for all architectural decisions.
> Every layer maps to specific files. Update this file when a layer evolves.
> Version: Phase 1 Foundation (May 2026)

---

## Core Principle

The future is not permanently running monolithic hardware executing static software.

The future is: **temporary adaptive modular semantic compute ecosystems forming dynamically according to context, coherence, and semantic complexity, then dissolving after execution.**

Ceekul's architecture evolves from apps/files/accounts toward:
semantic workflows · contextual orchestration · lineage-aware memory · sparse event-triggered compute · distributed semantic memory · coherence-regulated civilization intelligence

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CIVILIZATION INTENT                       │
│          (what 10B+ people are trying to accomplish)         │
└───────────────────────────┬─────────────────────────────────┘
                            │
         ┌──────────────────▼──────────────────┐
         │      LAYER 10: Adaptive UI/UX        │
         │   SemanticContextService (Angular)   │
         │   Living semantic workspace panels   │
         └──────────────────┬──────────────────┘
                            │
         ┌──────────────────▼──────────────────┐
         │    LAYER 6: AI Orchestration         │
         │   assistanceMode signal → avatar     │
         │   (mentor/navigator/advocate/…)      │
         └──────────────────┬──────────────────┘
                            │
    ┌───────────────────────▼───────────────────────┐
    │             LAYER 2: Contextual AI Avatar       │
    │     Role-aware · workflow-aware · trust-aware   │
    │     Claude API + semantic graph context         │
    └───────────────────────┬───────────────────────┘
                            │
    ┌───────────────────────▼───────────────────────┐
    │          LAYER 3: Event-Driven Resilience       │
    │  civilizationEventTypes.js (40+ event types)   │
    │  Redis Streams outbox · idempotent replay       │
    └───────────────────────┬───────────────────────┘
                            │
         ┌──────────────────▼──────────────────┐
         │    LAYER 14: Trust + Dignity         │
         │   DScore model · dScoreService       │
         │   7-dimension contribution score     │
         └──────────────────┬──────────────────┘
                            │
         ┌──────────────────▼──────────────────┐
         │    LAYER 1: Semantic Memory          │
         │   SemanticEdge model (graph)         │
         │   UCRS commit system                 │
         │   contentCid as universal identity   │
         └─────────────────────────────────────┘
```

---

## Layer Status

| Layer | Name | Status | Phase | Key Files |
|-------|------|--------|-------|-----------|
| 1 | Universal Semantic Memory | ✅ Foundation built | 1 | `semanticGraphModel.js`, UCRS commit system |
| 2 | Contextual AI Orchestration | ✅ Foundation built | 1 | `VaOverlayComponent` reads `assistanceMode`; 5 persona modes wired |
| 3 | Event-Driven Resilience | ✅ Foundation built | 1 | `outboxWorkerService.js`, `civilizationEventTypes.js`, `dscoreEventConsumer.js` |
| 4 | Dormant Computation Fabric | ✅ Foundation built | 2 | `moduleLifecycleService.js`, `containerAdapterService.js`, `moduleRegistrar.js`, `module.route.js`, `dormant-computation.service.ts` |
| 5 | Quantum Orchestration | ⬜ Long-term | 3 | — |
| 6 | Multi-Scale AI Orchestration | ✅ Foundation built | 1 | `SemanticContextService.assistanceMode` + full-app route inference |
| 7 | Semantic Delta Networking | ✅ Foundation built | 2 | `semanticDeltaSubscriptionService.js`, `deltaStream.route.js`, `semantic-delta-subscription.service.ts` |
| 8 | Planetary Resource Orchestration | ✅ Foundation built | 2 | `resourceOrchestrationService.js`, `/api/orchestration/demand`, village OS demand strip |
| 9 | Distributed Human Coherence | ✅ Foundation built | 1 | Dinner workflow; village OS (`/village`); 30+ route intent inference; `coherenceService.js`; coherence strip in right panel |
| 10 | Adaptive UI/UX | ✅ Phase 1 complete | 1 | `SemanticIntelligencePanelComponent` (right); `SemanticLeftPanelComponent` (left); both panels fully semantic |
| 11 | Reality Reconstruction / XR | ⬜ Long-term | 3 | — |
| 12 | Self-Evolving Infrastructure | ✅ Foundation built | 1 | `WorkflowOptimizerService` (frontend); `workflowIntelligenceService.js` (backend) |
| 13 | Distributed Local-First | ✅ Foundation built | 2 | `NetworkStatusService`; `OfflineQueueService` + interceptor; semantic context persistence; PWA shell (`ngsw-config.json`) |
| 14 | Trust + Dignity Computation | ✅ Foundation built | 1 | `dScoreModel.js`, `dScoreService.js` |
| 15 | Regenerative Device Metabolism | ⬜ Long-term | 3 | — |

---

## Layer 1 — Universal Semantic Memory

### Purpose
Every piece of knowledge in the civilization (a lecture, a governance decision, a welfare application, a research finding) is identified by a `contentCid`. These are not files — they are semantic objects with lineage, dependencies, and relationships.

### Current Implementation
- **UCRS** — Universal Commit and Reference System: `POST /api/commit` creates a `contentCid` for any content object. Append-only. History queryable via `GET /api/commit/history/:logicalId`.
- **SemanticEdge** — directed typed relationship between two contentCids. Relationship types: `depends_on`, `extends`, `references`, `contradicts`, `synthesizes`, `derived_from`, `peer_reviewed`, `supersedes`, `co_authored`, `translated_from`.

### API
```
POST /api/semantic-graph/edges          — establish a relationship
GET  /api/semantic-graph/edges/:cid     — relationships from/to a cid
GET  /api/semantic-graph/neighborhood/:cid  — 2-hop semantic neighborhood
DELETE /api/semantic-graph/edges/:id    — soft-revoke (lineage preserved)
```

### Data Contract
```javascript
SemanticEdge {
  fromCid:          String   // source contentCid
  toCid:            String   // target contentCid
  relationshipType: String   // one of 10 types
  domain:           String   // civilization domain
  semanticWeight:   Number   // 0–1 strength
  lineageDepth:     Number   // hops from original
  establishedBy:    String   // CB ID
  revokedAt:        Date     // null if active
}
```

### Layer 1 Depth Pass

**Semantic neighbor auto-fetch** — `SemanticGraphService` (Angular, `providedIn: 'root'`). Observes `SemanticContextService.contentCid()` via `effect()`. When a `contentCid` becomes active, fires `GET /api/semantic-graph/neighborhood/:cid` and calls `setNeighbors()` with the deduplicated union of first-hop and second-hop `toCid` values. The right panel's neighbor pills now show live data rather than an empty state. Silently no-ops on error — neighbors are an enhancement, not a requirement.

### Evolution Path (Phase 2)
- Graph traversal for semantic search (replace keyword search with graph-walk)
- Civilization semantic cache: most-referenced contentCids pre-loaded at edge nodes
- Cross-lingual semantic alignment: same knowledge in 250 languages shares a semantic identity

---

## Layer 3 — Event-Driven Resilience

### Purpose
Every civilization action (a neuron transfer, a welfare disbursement, a governance vote, a semantic edge created) emits an event. Events are the single source of truth — they can be replayed, audited, and used to recompute any derived state.

### Current Implementation
- **Outbox worker** — polls UCE outbox every 2 seconds, drains to Redis Streams, 5 retries, stale recovery. `outboxWorkerService.js`
- **NeuronTransaction** — immutable ledger, pre-save hook prevents modification. 30 transaction types.
- **civilizationEventTypes.js** — canonical registry of 40+ event types across 7 domains.

### Civilization Event Domains
```
education.*   — content, lectures, enrolments, peer review
governance.*  — votes, deliberations, policy, mandates
welfare.*     — applications, disbursements, solidarity
economy.*     — neuron credits, CG pool contributions
research.*    — swarms, collaboration, discoveries
wellness.*    — family coordination, village acts, coherence
logistics.*   — demand aggregation, resource routing, delivery
identity.*    — D-score updates, trust relationships, CB ID lifecycle
system.*      — graph rebalancing, workflow optimization, self-healing
```

### DSCORE_TRIGGERS
Any civilization event automatically triggers a D-score update if it appears in `DSCORE_TRIGGERS`. Domain services fire events; the D-score layer subscribes — no coupling between domains.

### Layer 3 Depth Pass — D-score automation

**`dscoreEventConsumer.js`** — Starts one `consumeStream()` consumer per mapped civilization event type (12 streams: education.content.committed, governance.vote.cast, welfare.solidarity.granted, etc.). For each message: extracts the actor CB ID from the payload (tries domain-specific field names with fallbacks), calls `dScoreService.recordEvent(cbId, dscoreType, { referenceId })`. Idempotency is guaranteed by `recordEvent`'s existing `referenceId` guard — replayed messages are silently no-ops.

**`civilizationWorkers.js`** — Single startup entry point: starts `outboxWorkerService` (UCE outbox → Redis Streams) and `dscoreEventConsumer` (Redis Streams → D-score updates). Called from `app.js` at boot. Before this, the outbox worker was never started; D-score updates required manual admin API calls. After this, every civilization event automatically keeps D-scores current.

---

## Layer 6 — Multi-Scale AI Orchestration

### Purpose
Every device and every user session runs a semantic orchestration layer that decides: what assistance mode is active, what compute is needed, and what should remain dormant.

### Current Implementation (Angular)
`SemanticContextService` — tracks intent, workflow, domain, contentCid, depth, and semantic neighbors. Computes `assistanceMode` as a derived signal. Every navigation automatically updates the context.

### Assistance Modes
```
learn      → mentor     (knowledge companion)
navigate   → navigator  (semantic wayfinding)
support    → advocate   (welfare / solidarity guide)
research   → collaborator (swarm coordination)
coordinate → coordinator (family / village orchestration)
```

### Evolution Path (Phase 1, near-term)
- AI avatar component reads `assistanceMode` to change its persona
- Workflow tracking: `beginWorkflow()` / `advanceWorkflow()` / `endWorkflow()` drive multi-step semantic flows
- Semantic neighbor display: related contentCids visible in the UI when `contentCid` is set

---

## Layer 10 — Adaptive UI/UX

### Purpose
The UI is not a set of apps. It is a living semantic workspace that reorganizes itself according to the active intent and workflow.

### Current Implementation
- 3-panel layout across all Ceekul pages (left context / center content / right intelligence)
- `SemanticContextService` provides the semantic state that panels read
- Academy section lazy-loading: chunks load on demand, prefetch on hover
- CGPool: tab nav separates overview from action (Apply for Support)

### Semantic Panel Emergence (near-term)
Each panel should:
1. Read `SemanticContextService.state()`
2. Adapt its content to the active intent (mentor panel vs. navigation panel vs. advocate panel)
3. Surface the correct assistance mode avatar
4. Show semantic neighbors when a contentCid is active

---

## Layer 14 — Trust + Dignity Computation

### Purpose
Recommendations, welfare priority, governance weight, and AI assistance depth are all modulated by the D-score — not by follower counts or engagement time.

### Current Implementation
- **DScore model** — 7-dimension score per CB ID: learning, governance, welfare, research, community coherence, semantic lineage, temporal consistency.
- **dScoreService** — idempotent event application (referenceId guard), weighted composite computation, trust network queries.

### API
```
GET  /api/dscore/me              — own D-score with full breakdown
GET  /api/dscore/:cbId           — public score (overview only)
GET  /api/dscore/leaderboard/top — top contributors (welfare priority feed)
POST /api/dscore/event           — admin trigger (internal use)
```

### D-Score Weights (Executive Council configurable)
```
learningContribution:    20%
welfareContribution:     20%
governanceParticipation: 15%
researchCollaboration:   15%
communityCoherence:      15%
semanticLineage:         10%
temporalConsistency:      5%
```

### Evolution Path
- Welfare algorithm reads D-score to set priority (lower D-score = higher need = higher priority for SUN disbursement)
- Governance deliberation weight proportional to `governanceParticipation` component
- AI mentor depth increases with `learningContribution` component

---

## Layer 9 — Distributed Human Coherence

### Purpose
Every village and district has a coherence field — a measure of how aligned its members are with civilization goals. Individual coherence drives welfare priority, governance trust weight, and AI assistance depth. Aggregate coherence surfaces in the village OS so coordinators can see where alignment is strong or breaking down.

### Current Implementation

**`coherenceService.js`** — Pure computation from D-score dimensions. No additional data collection needed. Formula (0–100):
```
coherence =
  communityCoherence  (0–100) × 0.35
  temporalConsistency (0–100) × 0.25
  welfareContribution (0–100) × 0.20
  overallScore (0–1000) / 10  × 0.20
```
Levels: ≥ 70 → **aligned** · ≥ 40 → **emerging** · < 40 → **divergent**

**`GET /api/coherence/me`** — authenticated member's coherence score (`{ coherence, level, cbId }`).
**`GET /api/coherence/village/:id`** — district aggregate: mean coherence, level, memberCount, and `distribution: { aligned, emerging, divergent }`. Members resolved via `User.address.district`.

**Coherence strip in the right panel** — `CoherenceService` (Angular) fetches `/api/coherence/me` on load and exposes `memberCoherence` as a signal. `SemanticIntelligencePanelComponent` displays a dot + score + level label between the workflow health strip and quick actions. Dot color: green (aligned) · amber (emerging) · red (divergent).

**Dinner workflow + village OS** — `beginWorkflow`/`endWorkflow` lifecycle hooked into the family dinner session. Village OS at `/village` coordinates welfare, volunteers, issues, and resources across the district.

### Evolution Path (Phase 2)
- Coherence drives welfare priority weight (lower coherence → higher solidarity need signal)
- Village OS shows district coherence heatmap across members
- Governance deliberation weight proportional to `communityCoherence` dimension

---

## Layer 12 — Self-Evolving Infrastructure

### Purpose
Workflows should detect their own inefficiency and restructure. In Phase 1 this means:
- Recording how users actually move through semantic workflows (step timings, completion vs abandonment)
- Detecting patterns that indicate friction (bottleneck steps, high abandonment, slow sessions)
- Surfacing live signals in the UI so the user and the system can adapt

### Current Implementation

**Frontend — `WorkflowOptimizerService`**
Observes `SemanticContextService.workflow()` via Angular `effect()`. Records each session run (step IDs, per-step duration, abandoned vs completed) to `localStorage` (key: `ck_wf_runs_v1`, capped at 50 runs). From ≥2 historical runs it computes:

```
healthScore = completionRate × 0.45 + stepEfficiency × 0.35 + depthProgress × 0.20
```

Three suggestion types, surfaced in the right panel:
| Type | Trigger | Glyph |
|------|---------|-------|
| `high_abandonment` | >40% of runs abandoned | ⚑ |
| `slow_run` | current session >1.5× historical avg | ◉ |
| `bottleneck_step` | one step >2.5× per-step avg | ⊘ |

**Backend — `workflowIntelligenceService.js`**
Analyzes UCRS saga workflows from MongoDB. `analyzeWorkflows(name?)` returns step-level failure rates, avg durations, retry patterns, and text recommendations. `selfHeal({ maxAgeHours, dryRun })` resets recoverable failed workflows to `pending` for automatic retry. Exposed via `GET /api/workflows/stats` and implicitly via the drain cycle.

### Evolution Path (Phase 2)
- Backend API for cross-user aggregate patterns (replace localStorage with real telemetry)
- Automatic step restructuring: optimizer calls `advanceWorkflow()` to skip bottleneck steps
- Workflow templates adapt based on aggregate completion patterns
- ML-based suggestion ranking as pattern corpus grows

---

## Implementation Roadmap

### Phase 1 — Foundation (0–18 months)
**Completed:**
- ✅ UCRS commit system
- ✅ Immutable neuron transaction ledger
- ✅ Redis Streams outbox workers (UCE, UCRS)
- ✅ Welfare application + disbursement system
- ✅ Academy section lazy-loading (60% bundle reduction)
- ✅ Academy manifest API (`GET /api/academy/manifest`)
- ✅ SemanticEdge model + API (Layer 1)
- ✅ DScore model + service + API (Layer 14)
- ✅ civilizationEventTypes.js (Layer 3 extension)
- ✅ SemanticContextService (Layer 6/10 foundation)
- ✅ Layer 2: VA avatar reads `assistanceMode` — 5 persona modes (mentor/navigator/advocate/collaborator/coordinator)
- ✅ Layer 9 foundation: full-app route → intent inference (30+ routes); dinner workflow lifecycle wired to `beginWorkflow`/`endWorkflow`
- ✅ Layer 9 village: Village Welfare Orchestration OS (`/village`) — issues, welfare board, volunteers, coordination, resources
- ✅ Layer 10: `SemanticIntelligencePanelComponent` in layout right column — 5 persona modes, workflow strip, semantic neighbors
- ✅ Layer 10 deep: `SemanticLeftPanelComponent` in layout left column — identity strip + mode-specific contextual nav (5 domains: Learning Space / Welfare & Solidarity / Research Space / Coordination Hub / Explore); collapses to glyph-only
- ✅ Layer 2 deep: AI avatar sends semantic context as part of every `/api/va/interact` call

- ✅ Layer 9 complete: `coherenceService.js` (member + village coherence from D-score); `GET /api/coherence/me` + `/village/:id`; coherence strip in right panel; `SemanticGraphService` auto-fetches 2-hop semantic neighbors when `contentCid` changes (Layer 1 depth pass bundled)

- ✅ Layer 3 depth: `dscoreEventConsumer.js` — subscribes to 12 civilization event streams (`stream:{civEventType}`); maps to `dScoreService.recordEvent()` automatically; `civilizationWorkers.js` starts outbox worker + D-score consumer at app boot. D-score is now a live reactive signal, not a manually maintained one.

- ✅ Layer 8 foundation: `resourceOrchestrationService.js` — `aggregateDemand(districtId)` queries open welfare applications by fund type + urgency + outstanding need + avg applicant D-score; `suggestDispatch(districtId)` matches highest-urgency pending applications to available volunteers. `GET /api/orchestration/demand/:districtId` + `/dispatch/:districtId`. Village OS welfare tab shows live demand aggregate (SUN/CUN/FUN breakdown + neurons needed + critical count).

- ✅ Layer 12: `WorkflowOptimizerService` — session telemetry to localStorage, 3-signal pattern detection (abandonment rate / slow run / bottleneck step), health score (0–100) + suggestions surfaced in right panel. Backend: `workflowIntelligenceService.js` (saga-level self-healing, `selfHeal()`, failure rate analysis).

**Phase 1 complete.** All near-term Layer 1 foundation items done.

### Phase 1 Depth Pass (post-completion wiring)
- ✅ D-score → welfare priority: `composite_dscore` (weight 30%, direction `asc`) and `dscore_welfare_dimension` added as valid policy criteria. Default policy updated to 35/30/20/10/5 split (goal_category / D-score / monthly_inflow / outstanding_need / days_in_queue). Monthly neuron inflows now auto-computed from NeuronTransaction history (`toBucket: 'my_neurons'`) — EC admin no longer needs to pass the map manually. `welfareService._getDScores()` fetches scores lazily only when the active policy references them.

## Layer 13 — Distributed Local-First

### Purpose
The app must be resilient to connectivity loss. Users in low-connectivity areas should never see a blank page, lose their semantic context on refresh, or have mutations silently discarded when offline.

### Current Implementation

**PWA Shell** — `ngsw-config.json` + `@angular/service-worker`. Service worker precaches app shell (JS, CSS, manifest), lazy-caches static assets, and applies `freshness` (network-first, 3s timeout) for all API routes and `performance` (cache-first, 1h TTL) for academy content. Registered via `provideServiceWorker` in `app.config.ts` — disabled in dev mode.

**`NetworkStatusService`** — SSR-safe signal `online` wrapping `navigator.onLine` + window `online`/`offline` events. The single source of truth for connectivity state across all Layer 13 components.

**Semantic Context Persistence** — `SemanticContextService` now persists `intent`, `domain`, `workflow`, `contentCid`, and `depth` to localStorage on every state change via `effect()`. Restores on app load with a 30-minute TTL. Page refresh no longer loses the semantic workspace state.

**`OfflineQueueService`** — Queues failed mutation requests (POST/PATCH/PUT/DELETE) to localStorage (max 20, max age 2h). On reconnect (`network.online()` → true), replays FIFO via `HttpClient` so the auth interceptor re-attaches headers. Exposes `queueLength` signal.

**`offlineQueueInterceptor`** — Functional HTTP interceptor (runs last in chain). Catches `HttpErrorResponse` with `status === 0` (network failure) on our own API mutations. Enqueues and does not propagate the error. 4xx/5xx are never queued.

**`OfflineIndicatorComponent`** — Compact badge in the layout. Shows `Offline · N queued` when `!network.online()`. Disappears silently when connectivity returns.

### Layer 13 Deep Pass

**`SemanticCacheService`** — IDB wrapper (`ceekul_semantic_v1`, version 1). Two object stores: `api_cache` (keyed by `urlWithParams`) and `content_objects` (keyed by `contentCid`). Each entry stores `{ data, cachedAt, ttlMs }` with TTL-aware eviction on read. Exposes `isReady` signal; queues resolvers until IDB is open. SSR-safe (no-ops on server).

**`semanticCacheInterceptor`** — Functional HTTP interceptor (runs before `offlineQueueInterceptor`). For GET requests to `/api/**`: taps successful responses into IDB (academy paths: 1h TTL; others: 5m TTL). On `status === 0` (network failure), serves from IDB if a non-expired entry exists. Returns a synthetic `HttpResponse(200)` so components receive data transparently.

**Cross-tab semantic sync** — `SemanticContextService` now opens a `BroadcastChannel('ck-semantic-ctx')` on construction. Each `effect()` broadcast includes the tab's unique `_tabId`; incoming messages from other tabs apply remote state to local signals but skip messages where `_tabId === this._tabId` (echo guard). All tabs sharing a browser origin now reflect the same semantic workspace state in real time.

**Periodic replay** — `OfflineQueueService` adds a `setInterval` (60s) alongside the reactive `effect()` reconnect trigger. Catches items that survived a reconnect-replay failure (e.g., server was briefly down). Cleared via `ngOnDestroy`.

### Evolution Path (Phase 3 deep)
- CRDT sync for collaborative semantic editing (Yjs + vector clock backend)
- Background Sync API for guaranteed delivery of queued mutations
- Cross-device semantic workspace sync via identity-bound state server

---

## Layer 8 — Planetary Resource Orchestration

### Purpose
Aggregate welfare demand signals across a district and route available resources (volunteers, neurons, skills) to where they are needed most. Replaces manual matching with algorithm-driven dispatch.

### Current Implementation

**`resourceOrchestrationService.js`**

`aggregateDemand(districtId)`:
- Resolves CB members by `User.address.district`
- Queries open welfare applications (`status: pending | approved | partially_funded`)
- Returns: `totalOpen`, `byFundType` (FUN/CUN/SUN counts), `byUrgency` (critical/high/medium), `totalOutstandingNeed` (sum in neurons), `avgApplicantDscore` (signals collective depth of need)

`suggestDispatch(districtId)`:
- Selects highest-urgency pending applications (emergency first, then by `outstandingNeed`)
- Matches each to the best available volunteer by skill/domain overlap
- Returns up to 10 `{ applicationId, fundType, goalCategory, isEmergency, outstandingNeed, suggestedVolunteer }` tuples

**API:**
```
GET /api/orchestration/demand/:districtId   — live demand snapshot
GET /api/orchestration/dispatch/:districtId — volunteer→need suggestions
```

**Village OS** — Welfare Board tab now shows a live demand aggregate strip: SUN/CUN/FUN counts, critical count, total neurons needed. WELFARE NEEDS metric in the header bar sources from `aggregateDemand()` with mock fallback while loading.

### Evolution Path (Phase 2 deep)
- Real-time demand updates via WebSocket push (replace HTTP poll)
- Cross-district demand routing: surplus volunteers assist adjacent districts
- Predictive demand: ML model on welfare application patterns → pre-position volunteers

---

### Phase 2 — Infrastructure Patterns (18 months–5 years)
- ✅ Layer 4: Dormant computation fabric — trigger-driven module activation, 7 civilization modules, Docker/K8s adapter (foundation built)
- ✅ Layer 7: Semantic delta networking — SSE push, Redis subscriber sets, prefetch pre-warming (foundation built)
- Layer 13: Local-first operation (CRDT sync, Background Sync API)
- Layer 15: Regenerative hardware metabolism (component lineage tracking)

### Phase 3 — Long-Term (5–15 years)
- Layer 5: Hybrid quantum orchestration (selectively activated, semantically triggered)
- Layer 11: Reality reconstruction + XR (low-bandwidth semantic world building)
- Interplanetary semantic synchronization (Moon/Mars latency-tolerant)

---

## Data Flow: A Welfare Application

```
Member submits application
  → SemanticContextService.beginWorkflow({ intent: 'support', domain: 'welfare' })
  → POST /api/welfare/apply
  → NeuronTransaction recorded (immutable)
  → CIV_EVENTS.WELFARE_APPLICATION_FILED emitted → outbox → Redis Stream
  → dScoreService.recordEvent(cbId, 'welfare_application_withdrawn') (member took initiative)
  → Algorithm ranks by D-score (lowest welfareContribution + highest need)
  → Month-end: CIV_EVENTS.WELFARE_DISBURSED emitted
  → SemanticEdge created: applicationCid → disbursementCid (type: 'derived_from')
  → Member's semanticLineage score increases
  → SemanticContextService.endWorkflow()
```

---

## Adding a New Governance Tier

1. Add section to `src/app/pages/ceekul-academy/academy-manifest.ts` (frontend)
2. Add section to `GET /api/academy/manifest` response (backend)
3. Create the Angular component in `src/app/pages/ceekul-academy/<tier>/`
4. Add loader to `_loaders` in `ceekul-academy.ts`
5. Add `CIV_EVENTS` entries for the new tier's domain events
6. Add D-score triggers for contribution events in `DSCORE_TRIGGERS`

No other files need to change. The manifest pattern ensures zero-friction extension.

---

## Key Constraints

- **No human can transfer neurons** — algorithm only, enforced at the service layer
- **No balance mutations** — all state is derived from the append-only event ledger
- **No semantic edge hard-deletion** — revoke only, lineage always preserved
- **No D-score manipulation** — events are idempotent (referenceId guard) and only internal services can trigger score events
- **No monolithic bundles** — every section lazy-loaded, every module independently deployable

---

*This document is a living artifact. Update when a layer advances. Never delete sections — mark them as superseded.*
