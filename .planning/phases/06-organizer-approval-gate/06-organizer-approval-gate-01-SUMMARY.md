---
phase: 06-organizer-approval-gate
plan: 01
subsystem: domain
tags: [event-sourcing, approval-gate, replay, testing]
requires:
  - phase: 05-split-modes-and-contributor-amendments
    provides: contributor amendment queue and deterministic split foundations
provides:
  - explicit submission-created/reviewed event contracts
  - replay transitions for pending, approve, and reject decisions
  - organizer-only approval authority enforcement for review events
affects: [phase-07-sync, balances, settlement]
tech-stack:
  added: []
  patterns: [deterministic replay validation, explicit approval lifecycle events]
key-files:
  created: [src/tests/organizer-approval-gate.spec.ts]
  modified: [src/domain/events/types.ts, src/domain/projections/types.ts, src/domain/projections/replay.ts]
key-decisions:
  - "Contributor-originated expenses now enter pendingSubmissions and only mutate entries on explicit organizer approval events."
  - "Review decisions are audit-trailed in reviewedSubmissions with reviewer identity and source event metadata."
patterns-established:
  - "Approval gate pattern: submission-created queues proposals, submission-reviewed performs authority-gated transition."
requirements-completed: [APRV-01, APRV-02, APRV-03, APRV-04]
duration: 12min
completed: 2026-04-22
---

# Phase 6 Plan 1: Organizer Approval Lifecycle Summary

**Organizer-gated submission lifecycle with explicit pending queue and deterministic review transitions in replay.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-22T15:58:00Z
- **Completed:** 2026-04-22T16:10:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added new event contracts for `expense.submission-created` and `expense.submission-reviewed` with explicit payload schemas.
- Expanded projection contracts to support pending submission unions and immutable reviewed decision trails.
- Implemented replay branches for enqueue/review flow with organizer authority checks, duplicate/unknown review errors, and decision-specific state mutations.

## Task Commits

1. **Task 1: Add approval-lifecycle event/projection contracts and RED tests** - `b2bf7aa` (test)
2. **Task 2: Implement replay approval/rejection transitions with organizer-only authority** - `90e2ef5` (feat)

## Files Created/Modified
- `src/domain/events/types.ts` - Added submission lifecycle event types and payload contracts.
- `src/domain/projections/types.ts` - Added pending submission union + reviewed decision trail projection shape.
- `src/domain/projections/replay.ts` - Implemented authority-gated approval lifecycle transitions.
- `src/tests/organizer-approval-gate.spec.ts` - Added APRV contract and replay invariant coverage.

## Decisions Made
- Reused `assertOrganizerApprovalAuthority` from onboarding authority module for all review events.
- Preserved deterministic fail-fast errors for invalid payloads, unknown submissions, and duplicate reviews.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Approval lifecycle behavior is now codified and testable.
- Ready to harden APRV-05 invariants and migrate legacy contributor expense expectations in Plan 02.

## Self-Check: PASSED
