---
phase: 08-per-currency-balances-and-settlement-readiness
plan: 01
subsystem: balances
tags: [balances, currency, replay, vitest, tdd]
requires:
  - phase: 06-organizer-approval-gate
    provides: approved-only projection semantics for entries vs pending/reviewed submissions
  - phase: 05-split-modes-and-contributor-amendments
    provides: deterministic owedShares on approved entries
provides:
  - Per-currency participant balance contracts for settlement-facing math
  - Deterministic derivation of paid, owed, and net totals from approved entries
  - BALN-01 replay invariant tests covering mixed currencies and rejected submissions
affects: [08-02 settlement-readiness messaging, settlement computation]
tech-stack:
  added: []
  patterns: [approved-only aggregation, participant-first deterministic output ordering]
key-files:
  created:
    - src/domain/balances/types.ts
    - src/domain/balances/derive.ts
    - src/tests/per-currency-balances.spec.ts
  modified: []
key-decisions:
  - "Aggregate only projection.entries and never numeric-read pending/reviewed submission state."
  - "Return rows in replay participant order with per-participant currencies sorted lexicographically for deterministic output."
patterns-established:
  - "Balance derivation fails fast when approved entries reference unknown participants."
requirements-completed: [BALN-01]
duration: 1min
completed: 2026-04-22
---

# Phase 8 Plan 01: Per-Currency Balance Derivation Summary

**Approved-entry per-currency participant net derivation with deterministic ordering and replay-backed invariants for mixed currency and rejection paths**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-22T17:22:27+02:00
- **Completed:** 2026-04-22T15:23:43Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added explicit balance output contracts (`CurrencyBalanceRow`, `ParticipantCurrencyBalances`) for per-currency settlement inputs.
- Added BALN-01 test suite verifying paid-minus-owed net math, strict currency separation, and non-mutating rejected submission path behavior.
- Implemented `derivePerCurrencyBalances` with deterministic participant/currency ordering from approved replay entries only.

## Task Commits
1. **Task 1 (RED): Define per-currency balance contracts and failing invariants** - `144f1c4` (test)
2. **Task 2 (GREEN): Implement approved-entry per-currency derivation** - `8188116` (feat)

## Files Created/Modified
- `src/domain/balances/types.ts` - Per-currency participant balance output contracts.
- `src/domain/balances/derive.ts` - Deterministic approved-entry aggregation and net derivation.
- `src/tests/per-currency-balances.spec.ts` - BALN-01 executable invariants and contract checks.

## Decisions Made
- Kept derivation input strictly at `LedgerProjection` boundary and aggregated only `projection.entries` to preserve approval-gated semantics.
- Initialized participant rows from `projection.participants` and throw explicit errors for unknown participant references in approved rows.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## TDD Gate Compliance
- RED gate commit present: `test(08-01)` at `144f1c4`.
- GREEN gate commit present: `feat(08-01)` at `8188116`.

## Self-Check: PASSED
- Verified created files exist: `src/domain/balances/types.ts`, `src/domain/balances/derive.ts`, `src/tests/per-currency-balances.spec.ts`.
- Verified task commits exist in git log: `144f1c4`, `8188116`.
