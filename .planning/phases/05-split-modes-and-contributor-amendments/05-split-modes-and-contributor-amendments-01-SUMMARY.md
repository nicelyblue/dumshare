---
phase: 05-split-modes-and-contributor-amendments
plan: 01
subsystem: payments
tags: [replay, split-modes, deterministic-arithmetic, vitest]
requires:
  - phase: 04-expense-capture-foundations
    provides: strict expense.created authorization and payer validation
provides:
  - deterministic equal/exact/percentage split validation for expense.created
  - persisted split metadata and owedShares on projection entries
  - split-mode invariant tests for EXPS-04/05/06
affects: [balance-calculation, contributor-amendments, organizer-approval]
tech-stack:
  added: []
  patterns: [integer-only split math, stable remainder assignment, fail-fast split validation]
key-files:
  created: [src/tests/expense-split-modes.spec.ts]
  modified:
    [src/domain/events/types.ts, src/domain/projections/types.ts, src/domain/projections/replay.ts, src/tests/expense-capture-foundations.spec.ts, src/tests/ledger-setup-participants.spec.ts, src/tests/local-data-backbone.spec.ts]
key-decisions:
  - "Use basis-point arithmetic with deterministic remainder distribution for percentage splits."
  - "Persist both split definition and computed owedShares to make downstream balance calculations replay-derived."
patterns-established:
  - "Split participant validation runs before projection mutation and rejects unknown or duplicate IDs."
requirements-completed: [EXPS-04, EXPS-05, EXPS-06]
duration: 16min
completed: 2026-04-22
---

# Phase 5 Plan 1: Split Modes Summary

**Deterministic equal/exact/percentage split replay now derives owed shares that always reconcile to totalAmountMinor.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-04-22T15:29:00Z
- **Completed:** 2026-04-22T15:45:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Added strict split contract types (`equal`, `exact`, `percentage`) with basis-point representation.
- Implemented deterministic split derivation and validation in replay for all EXPS-04/05/06 modes.
- Added split-mode tests and updated prior replay tests to stay valid after stricter contract enforcement.

## Task Commits

1. **Task 1: Extend split-mode contracts and write failing split invariants** - `e2448ec` (feat)
2. **Task 2: Implement deterministic split validation and owed-share derivation** - `bb56863` (feat)

## Files Created/Modified
- `src/tests/expense-split-modes.spec.ts` - EXPS-04/05/06 contract and replay invariants.
- `src/domain/events/types.ts` - split-mode payload unions added to `ExpenseCreatedPayload`.
- `src/domain/projections/types.ts` - entry split metadata and owed shares persisted.
- `src/domain/projections/replay.ts` - split parsing, integrity checks, and deterministic owed-share derivation.
- `src/tests/expense-capture-foundations.spec.ts` - fixtures aligned with split-required payload.
- `src/tests/ledger-setup-participants.spec.ts` - deterministic replay fixture updated for split-required payload.
- `src/tests/local-data-backbone.spec.ts` - replay fixtures updated for split-required payload.

## Decisions Made
- Enforced split participant uniqueness and roster membership as replay-time correctness checks.
- Kept all split math integer-only in minor units and basis points to avoid floating-point drift.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated legacy replay fixtures broken by required split payload**
- **Found during:** Task 2 (full test verification)
- **Issue:** Existing tests in prior suites still used pre-Phase-5 expense payload shape and failed with invalid payload errors.
- **Fix:** Updated affected replay fixtures to include valid equal split payloads and expected owedShares where assertions compared full entries.
- **Files modified:** `src/tests/expense-capture-foundations.spec.ts`, `src/tests/ledger-setup-participants.spec.ts`, `src/tests/local-data-backbone.spec.ts`
- **Verification:** `npm test`
- **Committed in:** `bb56863`

---

**Total deviations:** 1 auto-fixed (Rule 1)
**Impact on plan:** Required to keep existing deterministic replay coverage valid after split contracts became strict.

## Issues Encountered
None.

## Known Stubs
None.

## Next Phase Readiness
- Split outputs are deterministic and replay-safe, ready for contributor amendment proposal validation reuse.
- No blockers from Plan 01 for Plan 02.

## Self-Check: PASSED
