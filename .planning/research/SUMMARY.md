# Project Research Summary

**Project:** Dumshare v1
**Domain:** Offline-first, organizer-led mobile shared-expense tracking (local-only, Android + iOS)
**Researched:** 2026-04-20
**Confidence:** MEDIUM-HIGH

## Executive Summary

Dumshare v1 is a **local-first, no-cloud expense-sharing product** for small travel groups, with a deliberate governance model: contributors propose changes, and an organizer is the sole authority that approves what becomes canonical ledger state. The research converges on a pattern used by robust local-first systems: append-only events, deterministic projections, and checkpointed delta sync. In practice, that means building a resilient offline ledger first, then layering identity-bound in-person replication, then enforcing explicit approval workflows.

The recommended implementation path is **Expo SDK 55 + React Native + TypeScript + SQLite (expo-sqlite) + Drizzle**, with BLE transport via `react-native-ble-plx` and QR bootstrap via `expo-camera`. This stack best matches the constraints (offline, cross-platform, no backend), while keeping native integration predictable through Expo Dev Client/EAS. Feature scope should stay tight around P1 essentials: group/role model, multi-payer split engine, per-currency balances, organizer approval queue, and QR+BLE sync.

The largest execution risks are not UI polish but **correctness and reliability**: money precision errors, mutable-state drift instead of event sourcing, weak invitation/device binding, and non-resumable BLE sessions causing silent divergence. Mitigation is clear from research: integer money arithmetic + deterministic allocation policy, append-only event pipeline with replay tests, one-time signed invitations with device-key binding, and idempotent checkpointed chunk sync with failure-injection testing.

## Key Findings

### Recommended Stack

The strongest stack signal is to use Expo as the framework baseline and avoid cloud-centric defaults. SQLite plus event projections is the right persistence model for auditability and replay, and BLE/QR are mature enough for MVP if implemented with strict session semantics.

**Core technologies:**
- **Expo 55 / React Native 0.83:** cross-platform runtime with practical native-module path for BLE/camera in production.
- **TypeScript 5.9 (strict):** prevents domain-level bugs in split math, event schemas, and sync payload contracts.
- **expo-sqlite + Drizzle ORM/Kit:** durable local event store + typed migrations for deterministic replay and schema evolution.
- **react-native-ble-plx + expo-camera:** in-person sync transport (BLE) plus QR bootstrap.
- **Zod + react-hook-form + Zustand:** validated payload boundaries, robust form handling, lightweight transient UI/session state.

**Critical version constraints:**
- Expo SDK **55.0.15** aligned with RN **0.83** and React **19.2**.
- BLE requires **Dev Client/prebuild** (not Expo Go).
- Drizzle versions should stay within researched matrix (`drizzle-orm 0.45.2`, `drizzle-kit 0.31.x`) to reduce migration/tooling drift.

### Expected Features

Feature research is clear: users expect mature expense-sharing basics, while Dumshare’s advantage comes from explicit organizer governance and true offline operation.

**Must have (table stakes):**
- Group ledger + participant roles.
- Fast expense entry with multi-payer and equal/exact/percentage splits.
- Per-currency running balances + settlement minimization.
- Offline-first operation and editable history.
- In-person QR + Bluetooth sync.

**Should have (competitive differentiators):**
- Organizer-controlled approval/rejection workflow for contributor submissions.
- Single-device contributor identity with organizer-star topology.
- Human-readable audit timeline (pending/approved/rejected).
- “No account, no cloud required” positioning as a product-level differentiator.

**Defer (v2+):**
- Optional cloud backup/bridge.
- Multi-device contributor identities.
- Payment rails/integrations and advanced FX tooling.

### Architecture Approach

Architecture should follow a **layered local-first event system**: UI workflows issue commands; command/policy layer validates and appends events; projection engine derives all read models; sync layer exchanges unseen events via checkpoints; organizer approval emits authoritative events that propagate back to contributors. Keep strict boundaries (UI never writes SQL directly; transport never embeds business rules; sync never writes read models directly).

**Major components:**
1. **Domain command + policy layer** — validates roles, splits, and currency invariants before event append.
2. **Event store + projection engine** — immutable ledger history with deterministic pending/approved/read-model outputs.
3. **Sync subsystem (QR bootstrap + transport adapter + delta replicator)** — resumable, idempotent, checkpoint-based exchange.
4. **Approval engine (organizer authority)** — explicit approve/reject events gate canonical balances.
5. **Identity/invitation module** — one-time invite token and single-device contributor binding.

### Critical Pitfalls

1. **Floating-point money math** — use integer minor units and deterministic rounding allocation captured in events.
2. **Mutable canonical state (CRUD drift)** — enforce append-only events + replay-equality tests.
3. **Weak invite/device binding** — require one-time expiring signed tokens and bind to device key on first pairing.
4. **Non-resumable BLE sync assumptions** — implement checkpoint negotiation, chunk ACKs, idempotent apply, resume.
5. **Transport import treated as approval** — separate `received` vs `pending_review` vs `approved/rejected`; approved balances update only from organizer-authored approval events.

## Implications for Roadmap

Based on dependencies across stack/features/architecture/pitfalls, use a 4-phase plan.

### Phase 1: Ledger Core and Deterministic Accounting
**Rationale:** Everything else depends on trusted local truth; errors here contaminate all sync/approval behavior.
**Delivers:** Event schema/versioning, command handlers, integer money model, split engine, per-currency projections, settlement minimization baseline, replay/property tests.
**Addresses:** Group/participant foundation, expense entry, split methods, balances, settlement (FEATURES P1).
**Avoids:** Float precision drift, mutable-state anti-pattern, premature cross-currency netting.

### Phase 2: Identity, Invitation, and Reliable In-Person Sync
**Rationale:** Safe replication requires identity guarantees before transport scale-up.
**Delivers:** One-time signed QR invites, device binding, sync session state machine, BLE adapter, checkpointed delta protocol, idempotent ingestion, interruption recovery harness.
**Addresses:** Contributor onboarding, QR+BLE sync, organizer-star topology.
**Avoids:** Token replay/identity duplication, atomic-sync assumptions, OS BLE/background failures.

### Phase 3: Organizer Governance and Conflict Semantics
**Rationale:** After reliable event movement exists, enforce trust semantics and resolve amendment races.
**Delivers:** Pending review queue, explicit approve/reject events, amendment version policy (stale proposal handling), clear status UX, audit timeline.
**Addresses:** Core differentiator (approval-gated contributor edits) and editable history.
**Avoids:** Auto-approval leakage, ambiguous amendment conflicts, opaque reconciliation.

### Phase 4: Reliability Hardening and Operational Recovery
**Rationale:** Local-only architecture needs explicit resilience before broad rollout.
**Delivers:** Migration/integrity checks, corruption detection, encrypted export/import backup path, performance indexing/pagination/snapshots, device-matrix QA.
**Addresses:** Field reliability and supportability for real travel environments.
**Avoids:** Catastrophic local data loss, slow projections at scale, unstable release upgrades.

### Phase Ordering Rationale

- Build in dependency order: domain truth model → identity/sync transport → governance workflow → hardening.
- Group by architecture boundaries: domain/data first, then sync, then review UX/policies, then ops reliability.
- Front-load pitfalls with highest blast radius (money correctness + event model) before user-facing sync complexity.

### Research Flags

Phases likely needing deeper `/gsd-research-phase` during planning:
- **Phase 2:** BLE behavior/permission differences across Android/iOS vendors and resumable protocol edge cases.
- **Phase 3:** Amendment conflict resolution UX and deterministic policy tuning under real user behavior.
- **Phase 4:** Practical local backup/encryption/recovery UX trade-offs and migration rollback strategy.

Phases with standard patterns (likely can skip additional deep research):
- **Phase 1:** Event-sourced ledger + integer accounting + deterministic projection patterns are well-documented.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Strong reliance on official Expo/RN/SQLite/Drizzle docs and clear version matrix alignment. |
| Features | MEDIUM | Table stakes are well-supported by competitor consensus; differentiator evidence is directional but less exhaustive. |
| Architecture | MEDIUM-HIGH | Recommended patterns are robust and coherent; some transport specifics are adapted from analogous replication systems. |
| Pitfalls | MEDIUM-HIGH | Core correctness/durability pitfalls are strongly evidenced; BLE operational specifics vary by device/OS and need validation. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **BLE device-matrix uncertainty:** Validate across target OS/vendor mix early with fault-injection and real-world travel conditions.
- **Exact event ordering/revision strategy:** Finalize canonical ordering keys and stale-amendment policy before Phase 3 implementation.
- **Invitation cryptography details:** Specify signing/verification/key-rotation choices concretely (lightweight but non-trivial).
- **Settlement UX details for mixed currency:** Confirm user-comprehension patterns before adding any optional conversion helpers.
- **No cloud recovery trade-offs:** Validate acceptable backup UX burden for organizer device in v1.

## Sources

### Primary (HIGH confidence)
- React Native docs (framework recommendation) — https://reactnative.dev/docs/environment-setup
- Expo docs/version matrix + SDK modules (`expo-sqlite`, `expo-camera`) — https://docs.expo.dev/versions/latest/
- SQLite docs (WAL and floating point behavior) — https://www.sqlite.org/wal.html, https://sqlite.org/floatingpoint.html
- Drizzle SQLite/Expo documentation — https://orm.drizzle.team/docs/get-started-sqlite
- BLE-PLX official repo/docs — https://github.com/dotintent/react-native-ble-plx
- Project constraints and scope — `.planning/PROJECT.md`

### Secondary (MEDIUM confidence)
- CouchDB/PouchDB replication/conflict references (checkpointed delta patterns) — https://docs.couchdb.org/, https://pouchdb.com/guides/conflicts.html
- Apple Core Bluetooth background constraints — Apple archived official docs
- Android BLE behavior references via research notes/Context7
- Competitor product feature baselines: Splitwise, Tricount, Splitser, Kittysplit, Settle Up

### Tertiary (LOW confidence)
- None identified as roadmap-critical conclusions.

---
*Research completed: 2026-04-20*
*Ready for roadmap: yes*
