---
phase: 05-split-modes-and-contributor-amendments
plan: 02
subsystem: payments
tags: [amendments, pending-review, contributor-authority, replay]
requires:
  - phase: 05-split-modes-and-contributor-amendments
    provides: split-aware expense payload validation
provides:
  - expense.amendment-submitted event contract and parser
  - claimed-contributor-only amendment submission guard
  - deterministic pendingSubmissions queue without approved-entry mutation
affects: [phase-06-approval-gate, sync-review-pipeline]
tech-stack:
  added: []
  patterns: [proposal-queue over direct mutation, parser reuse for proposed expense payloads]
key-files:
  created: [src/tests/contributor-amendments.spec.ts]
  modified: [src/domain/events/types.ts, src/domain/projections/replay.ts]
key-decisions:
  - "Contributor amendments are represented as pending submissions and never auto-apply to approved entries."
  - "Only claimed contributor devices may submit amendments; organizer approval remains authoritative."
patterns-established:
  - "Amendment proposedExpense reuses expense payload validation to prevent contract drift."
requirements-completed: [EXPS-07]
duration: 9min
completed: 2026-04-22
---

# Phase 5 Plan 2: Contributor Amendments Summary

**Contributor amendment submissions now replay into a deterministic pending-review queue with strict authority and target-expense guards.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-04-22T15:33:00Z
- **Completed:** 2026-04-22T15:42:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added `expense.amendment-submitted` contract and EXPS-07 invariant tests.
- Implemented replay branch that validates amendment payload and proposed expense shape.
- Enforced claimed contributor device authority and known-target-expense checks before queue append.

## Task Commits

1. **Task 1: Add amendment submission contracts and failing pending-flow tests** - `68f233e` (feat)
2. **Task 2: Implement replay queueing for contributor amendments with authority and target guards** - `80cb9fc` (feat)

## Files Created/Modified
- `src/tests/contributor-amendments.spec.ts` - EXPS-07 contract and replay invariants.
- `src/domain/events/types.ts` - amendment event type and payload contract.
- `src/domain/projections/replay.ts` - amendment parser, authorization/target guards, pending submission queueing.

## Decisions Made
- Reused strict expense payload parser logic for amendment `proposedExpense` validation.
- Kept queue record as source-of-truth artifact (`pendingSubmissions`) for organizer approval workflow in Phase 6.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## Known Stubs
None.

## Next Phase Readiness
- Amendment submissions are safely queued and ready for organizer apply/reject flow implementation.
- No blockers for Phase 6 approval gate work.

## Self-Check: PASSED
