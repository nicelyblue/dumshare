---
phase: 01
name: local-data-backbone
status: complete
date: 2026-04-20
source: gsd-phase-researcher
---

# Phase 01 Research — Local Data Backbone

## Scope

Phase 1 must establish local-only persistence, append-only ledger history, and deterministic replay for user-visible state.

## Decisions for Planning

1. Use Expo SQLite + Drizzle for on-device storage (no cloud fallback) to satisfy DATA-01.
2. Model ledger writes as append-only events with immutable rows (no in-place mutation of historical events) to satisfy DATA-02.
3. Build projection functions as pure deterministic reducers and verify replay equality in automated tests to satisfy DATA-03.
4. Use integer minor units for money-related fields from day one to avoid non-determinism from floating point arithmetic.

## Recommended Artifacts

- `package.json` / `app.json` dependency and plugin setup for Expo + SQLite + Drizzle
- `drizzle.config.ts` and `src/data/sqlite/schema.ts` for event log and projection tables
- `src/domain/events/*` event contracts and append API
- `src/domain/projections/*` deterministic projector logic
- `src/tests/*` replay and persistence tests

## Validation Architecture

Use a fast targeted test loop during implementation and a full test pass at wave completion:

- Quick command: `npm run test -- local-data-backbone`
- Full command: `npm test`
- Required checks:
  - Event rows are append-only (updates/deletes blocked by code path)
  - Replaying the same event sequence twice yields byte-equivalent projection snapshots
  - Local reopen simulation preserves ledger state without network access

## Risks and Mitigations

- **Risk:** Schema drift between domain contracts and SQLite tables.
  - **Mitigation:** Keep typed schema in `src/data/sqlite/schema.ts` and enforce test fixtures against exported types.
- **Risk:** Hidden mutable updates via convenience repository methods.
  - **Mitigation:** Restrict repository API to append/read operations for event log.
- **Risk:** Slow replay as event count grows.
  - **Mitigation:** Introduce checkpoint/snapshot table shape now, even if optimization is deferred.

## Output for Planner

Planning must produce executable prompts that:

- Cover DATA-01, DATA-02, DATA-03 explicitly in plan frontmatter requirements.
- Include deterministic replay verification commands in every code-producing task.
- Keep all storage and logic local-only and offline-compatible.
