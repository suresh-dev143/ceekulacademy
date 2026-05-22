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
| 3 | Event-Driven Resilience | ✅ Mostly built | 1 | `outboxWorkerService.js`, `civilizationEventTypes.js` |
| 4 | Dormant Computation Fabric | ⬜ Medium-term | 2 | — |
| 5 | Quantum Orchestration | ⬜ Long-term | 3 | — |
| 6 | Multi-Scale AI Orchestration | ✅ Foundation built | 1 | `SemanticContextService.assistanceMode` + full-app route inference |
| 7 | Semantic Delta Networking | ⬜ Medium-term | 2 | — |
| 8 | Planetary Resource Orchestration | ⬜ Medium-term | 2 | — |
| 9 | Distributed Human Coherence | 🔶 Foundation | 1 | Dinner workflow lifecycle; full-app intent routing (30+ routes) |
| 10 | Adaptive UI/UX | 🔶 Foundation | 1 | `SemanticContextService`, 3-panel layout |
| 11 | Reality Reconstruction / XR | ⬜ Long-term | 3 | — |
| 12 | Self-Evolving Infrastructure | ⬜ Near-term | 1 | — |
| 13 | Distributed Local-First | ⬜ Medium-term | 2 | — |
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

**Next (Phase 1 continuation):**
- Layer 9: Village welfare orchestration UI (collective issue tracking, village coordination board)
- Layer 12: Self-optimizing workflow engine (detect and restructure inefficient patterns)
- Layer 10: Panel emergence — panels adapt content to active semantic intent

### Phase 2 — Infrastructure Patterns (18 months–5 years)
- Layer 4: Dormant computation fabric (temporary task-specific modules)
- Layer 7: Semantic delta networking (transmit only semantic perturbations)
- Layer 8: Planetary resource orchestration (demand aggregation → adaptive logistics)
- Layer 13: Local-first operation (offline semantic continuity, CRDT sync)
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
