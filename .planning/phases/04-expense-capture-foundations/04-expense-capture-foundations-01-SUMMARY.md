---
phase: 04-expense-capture-foundations
plan: 01
subsystem: domain
tags: [event-sourcing, replay, authorization, validation, vitest]
requires:
  - phase: 03-contributor-onboarding-and-authority-model
    provides: claimed contributor device identity and organizer authority guards
provides:
  - Strict `expense.created` contract with creator role and payer breakdown
  - Replay-time creator authorization and payer participant integrity guards
  - Automated EXPS-01/02/03 invariant coverage with deterministic error assertions
affects: [expense capture, settlement inputs, replay determinism]
tech-stack:
  added: []
  patterns: [strict payload parsing, fail-fast replay authorization, deterministic plain-language errors]
key-files:
  created:
    - src/tests/expense-capture-foundations.spec.ts
  modified:
    - src/domain/events/types.ts
    - src/domain/projections/types.ts
    - src/domain/projections/replay.ts
    - src/tests/ledger-setup-participants.spec.ts
    - src/tests/local-data-backbone.spec.ts
key-decisions:
  - "Promoted expense payload to strict required fields with creatorRole and one-or-more payers to satisfy EXPS-01/02/03 at event boundary."
  - "Authorized expense creation only for organizer sync hub device or claimed contributor devices derived from replay state."
  - "Kept fail-fast deterministic error behavior for invalid payloads and unknown payer references."
patterns-established:
  - "Expense replay branch validates payload shape before authorization and mutation."
  - "Cross-suite regression tests must migrate event fixtures when payload contracts are tightened."
requirements-completed: [EXPS-01, EXPS-02, EXPS-03]
duration: 6min
completed: 2026-04-21
---

# Phase 4 Plan 1: Expense Capture Foundations Summary

**Deterministic `expense.created` replay now enforces strict creator and payer integrity for offline organizer and claimed contributor capture flows.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-21T20:19:03Z
- **Completed:** 2026-04-21T20:24:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Added strict `ExpenseCreatedPayload` and expanded `LedgerEntry` schema for total, date, creator role, and payer rows.
- Implemented replay authorization guard for organizer/claimed-contributor creators and participant existence guard for all payer rows.
- Added dedicated phase tests plus migrated prior fixture-based tests to keep full-suite replay regressions green.

## Task Commits

1. **Task 1: Extend expense contracts and write failing capture invariants** - `3018214` (test)
2. **Task 2: Implement replay authorization and payer validation for expense.created** - `5239050` (feat)

## Files Created/Modified
- `src/domain/events/types.ts` - Added strict `ExpenseCreatedPayload` type used by replay validation.
- `src/domain/projections/types.ts` - Expanded `LedgerEntry` for strict expense capture semantics.
- `src/domain/projections/replay.ts` - Implemented strict parser, creator authorization guard, and payer participant guard.
- `src/tests/expense-capture-foundations.spec.ts` - Added EXPS-01/02/03 contract and invariant coverage.
- `src/tests/ledger-setup-participants.spec.ts` - Updated deterministic replay fixture for new strict expense payload shape.
- `src/tests/local-data-backbone.spec.ts` - Updated replay fixture payloads and setup events for full-suite compatibility.

## Decisions Made
- Use replay-derived authority (`syncHubDeviceId` and claimed contributor device map) as the sole source for expense creator authorization.
- Require non-empty payer list with positive integer paid amounts and known participant references before appending ledger entries.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed prior replay fixtures broken by strict expense payload migration**
- **Found during:** Task 2 verification (`npm run test -- ledger-setup-participants` and `npm test`)
- **Issue:** Existing tests used legacy `amountMinor` payloads and lacked participant setup required by new guards.
- **Fix:** Updated legacy fixtures to strict payload fields (`totalAmountMinor`, `expenseDate`, `creatorRole`, `payers`) and inserted participant setup events where needed.
- **Files modified:** `src/tests/ledger-setup-participants.spec.ts`, `src/tests/local-data-backbone.spec.ts`
- **Verification:** `npm run test -- ledger-setup-participants && npm test`
- **Committed in:** `5239050`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Required regression alignment only; no scope creep.

## Issues Encountered
- Full-suite tests initially failed after strict payload rollout due to legacy fixtures; resolved by migrating fixtures to the new contract.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Expense creation domain layer now provides strict, authorization-safe inputs for upcoming expense notes and settlement calculations.
- No blockers identified for continuing phase execution.

---
*Phase: 04-expense-capture-foundations*
*Completed: 2026-04-21*

## Self-Check: PASSED
