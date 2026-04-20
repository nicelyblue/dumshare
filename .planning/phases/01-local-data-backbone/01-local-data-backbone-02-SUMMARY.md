---
phase: 01-local-data-backbone
plan: 02
subsystem: projections
tags: [deterministic-replay, event-log, vitest]
requires: [01-01]
provides:
  - Deterministic replay reducer that reconstructs ledger view from append-only events
  - Typed projection contract for user-visible reconstructed entries
  - Regression tests for replay determinism, reopen reconstruction, and unknown-event rejection
affects: [phase-01-completion, projection-engine, replay-invariants]
tech-stack:
  added: []
  patterns: [pure replay reduction, exhaustive event-type dispatch, sequence-ordered projection]
key-files:
  created:
    - src/domain/projections/types.ts
    - src/domain/projections/replay.ts
    - src/domain/projections/index.ts
  modified:
    - src/tests/local-data-backbone.spec.ts
key-decisions:
  - "Replay reducer sorts by append sequence before applying events to preserve deterministic outputs even if input order drifts."
  - "Projection enforces strict eventType handling by throwing on unsupported types to mitigate tampered/unknown events."
patterns-established:
  - "Projection outputs ledgerId, lastSequence, appliedEventIds, and entries as the minimal stable read model for phase scope."
requirements-completed: [DATA-03, DATA-01]
duration: 2min
completed: 2026-04-20
---

# Phase 1 Plan 2: Local Data Backbone Summary

**Deterministic replay now reconstructs stable ledger entries from append-only events with strict unknown-event rejection.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-20T18:17:59+02:00
- **Completed:** 2026-04-20T18:19:45+02:00
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added RED-phase replay tests for deterministic equality, reopen reconstruction parity, and unsupported-event rejection.
- Implemented `LedgerProjection` contract and `replayLedger(events)` reducer with stable sequence ordering.
- Enforced threat-model mitigation by throwing `Unsupported eventType` on unknown replay input.

## Task Commits

1. **Task 1: Extend tests with failing deterministic replay cases** - `8ad20dc` (test)
2. **Task 2: Implement deterministic replay projection and typed ledger view** - `afa9414` (feat)

## Files Created/Modified
- `src/tests/local-data-backbone.spec.ts` - added replay determinism, reopen parity, and explicit unsupported-event tests.
- `src/domain/projections/types.ts` - introduced `LedgerProjection` and `LedgerEntry` contracts.
- `src/domain/projections/replay.ts` - implemented deterministic reducer and strict event dispatch.
- `src/domain/projections/index.ts` - exported replay API and projection types.

## Decisions Made
- Replay processing is sequence-driven and deterministic even when callers provide arrays in varying order.
- Unknown event types fail fast to preserve reducer integrity and reduce silent corruption risk.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED
- FOUND: `.planning/phases/01-local-data-backbone/01-local-data-backbone-02-SUMMARY.md`
- FOUND commits: `8ad20dc`, `afa9414`
