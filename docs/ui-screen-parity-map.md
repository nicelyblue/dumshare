# UI Screen Parity Map (Phase 05)

This matrix maps every UX Pilot mock to concrete app routes/components and required verification coverage.

| Mock Asset | App Route | Owner Component(s) | Required Parity Signals | State Variants | Verification Reference |
|---|---|---|---|---|---|
| Dumshare App - Welcome (No Sha.html | `app/index.tsx` | Welcome route | `Welcome to Dumshare!` heading, onboarding body copy, primary setup CTA | Empty (no active share) | `npm test -- src/tests/ui-screen-parity.spec.tsx` |
| Dumshare App - Create a Share.html | `app/(setup)/create-share.tsx` | Create Share route | `Create Share` title, Share Name/Owner Name labels, Create Share CTA, add-now/add-later options | Validation error, default form | `npm test` |
| Dumshare App - Add Participant.html | `app/(setup)/participants.tsx` | Participants route | `Add Participants` title, inline add affordance, owner row treatment, continue CTA | Empty list, populated list | `npm test` |
| Dumshare App - Side Menu (Shar.html | `app/(tabs)/_layout.tsx` + drawer content | Tabs shell + drawer | tokenized header/menu button, dim overlay dismiss, tab order Home/Add Expense/Ledger/Settle Up | Drawer closed/open | `npm test -- src/tests/no-inline-hex-colors.spec.ts` |
| Dumshare App - Home Dashboard.html | `app/(tabs)/index.tsx`, `src/mobile/components/HomeSnapshotCard.tsx` | Home and snapshot card | section heading, active share label, participant rows, latest expense card hierarchy | Empty snapshot, populated snapshot | `npm test -- src/tests/ui-screen-parity.spec.tsx` |
| Dumshare App - Add Expense.html | `app/(tabs)/add-expense.tsx` | Add Expense route | `Add Expense` heading, field labels, Save Expense CTA, split editor inclusion | Create vs edit mode | `npm test -- src/tests/ui-screen-parity.spec.tsx` |
| Dumshare App - Split Details (.html | `src/mobile/components/ExpenseSplitEditor.tsx` | Split editor | Equal/Exact/Percent/Shares controls, participant allocations, balanced/unbalanced signal | Equal, exact allocation | `npm test -- src/tests/ui-screen-parity.spec.tsx` |
| Dumshare App - Ledger Entries.html | `app/(tabs)/ledger.tsx`, `src/mobile/components/LedgerHistoryList.tsx` | Ledger route and list | summary hierarchy, chronological cards, metadata order, long-press affordance copy | Empty ledger, populated ledger | `npm test -- src/tests/ui-screen-parity.spec.tsx` |
| Dumshare App - Ledger Entry De.html | `src/mobile/components/LongPressActionSheet.tsx` | Action sheet | action title, edit/delete labels, destructive styling for delete, cancel row | Long-press action state | `npm test -- src/tests/ui-screen-parity.spec.tsx` |
| Dumshare App - Settle Up.html | `app/(tabs)/settle-up.tsx`, `src/mobile/components/SettlementRecommendationList.tsx` | Settle up route and list | settlement currency section, Calculate Settlement CTA, recommendation row anatomy | No ledger, no recommendations, recommendations present | `npm test -- src/tests/ui-screen-parity.spec.tsx src/tests/settle-up-screen.spec.tsx` |
| Dumshare App - Settlement Resu.html | `app/settlement-complete.tsx` | Completion route | `Settlement Calculated!` heading, final breakdown labels, return CTA | Completion state after recommendations | `npm test -- src/tests/ui-screen-parity.spec.tsx src/tests/settle-up-screen.spec.tsx` |

## Coverage Checklist

- [x] All 11 mock assets mapped to implementation surfaces.
- [x] Global shell states tracked (drawer closed/open).
- [x] Empty states tracked (welcome, home, ledger, settlement no recommendations).
- [x] Long-press action state tracked.
- [x] Confirmation/completion states tracked (delete confirmation, settlement complete).
