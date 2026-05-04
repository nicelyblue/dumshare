---
phase: 12-sync-and-balance-views
plan: 02
subsystem: ui
tags: [balances, per-currency, react-native, replay]
requires:
  - phase: 12-sync-and-balance-views
    provides: updated feature routing and session extensions
provides:
  - balance detail snapshot loader from approved balance summary
  - reusable currency balance card for paid/owed/net rows
  - balances destination with approved-scope messaging
affects: [dashboard, settlement]
tech-stack:
  added: []
  patterns: [participant-first-currency-cards, approved-only-balance-display]
key-files:
  created: [src/data/ledger/balanceDetails.ts, src/screens/BalancesScreen.tsx, src/ui/CurrencyBalanceCard.tsx]
  modified: [src/state/ledgerSession.tsx, src/screens/FeatureScreen.tsx, src/navigation/featureRegistry.ts]
key-decisions:
  - "Balance detail screen consumes buildApprovedBalanceSummary output directly to avoid cross-currency drift."
  - "Approval scope note is rendered from metadata verbatim when pending submissions exist."
patterns-established:
  - "Balances UI renders participant-first cards with per-currency rows and explicit net direction labels."
requirements-completed: [FE-08]
duration: 41min
completed: 2026-05-04
---

# Phase 12 Plan 02: Balance View Slice Summary

**Replay-backed per-currency settlement details now render in a dedicated Balances screen with approved-only scope context and reusable currency cards.**

## Performance
- **Duration:** 41 min
- **Tasks:** 2
- **Files modified:** 6

## Task Commits
1. **Task 1: Add balance detail snapshot loader and session state wiring** - `39fce7b` (feat)
2. **Task 2: Build balances screen and reusable per-currency cards** - `702b6f2` (feat)

## Deviations from Plan
### Auto-fixed Issues
**1. [Rule 1 - Bug] Fixed pending-submission test authorization setup**
- **Found during:** Task 1 verification
- **Issue:** contributor draft path failed without invite-claim events
- **Fix:** seeded invite.issued + invite.consumed before contributor submission in snapshot test
- **Files modified:** src/tests/balance-details-snapshot.spec.ts
- **Commit:** `39fce7b`

## Self-Check: PASSED
- FOUND: src/data/ledger/balanceDetails.ts
- FOUND: src/screens/BalancesScreen.tsx
- FOUND: 39fce7b
- FOUND: 702b6f2
