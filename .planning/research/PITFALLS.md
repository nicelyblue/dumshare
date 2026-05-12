# Domain Pitfalls

**Domain:** Local-first mobile shared-expense app UI layered on existing event-sourced backend (Dumshare)
**Researched:** 2026-05-12

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: UI Bypassing Domain Mutation/Validation Paths
**What goes wrong:** Screens write “convenience” state directly (or re-implement validation) instead of calling existing mutation APIs, so persisted events and replayed projections diverge from what the UI assumes.
**Why it happens:** Frontend rebuild pressure; tempting to keep temporary component-local rules for speed.
**Consequences:** Data integrity drift, hard-to-reproduce bugs after app restart, and expensive rewrite to re-align with event model.
**Prevention:** Treat `src/domain` + `src/data` mutation boundaries as mandatory write gateways; no direct DB writes from UI layer. Add integration tests per major user action (create share, add participant, add/edit/delete expense) asserting replayed snapshot outcomes.
**Detection:** Same action appears correct immediately but differs after cold restart/reload; UI-only validation messages differ from domain error messages.

### Pitfall 2: Optimistic UI Not Reconciled with Event Replay Truth
**What goes wrong:** UI applies optimistic inserts/edits but never reconciles with persisted sequence/replay output.
**Why it happens:** Mobile UX polishing happens before defining event lifecycle states (pending/confirmed/failed).
**Consequences:** Duplicate ledger rows, incorrect “last expense,” stale balances, user distrust in settle-up numbers.
**Prevention:** Model UI state as projection-derived first; optimistic updates must carry temporary IDs and be replaced only by confirmed event-backed records. Always refetch/replay projection after successful append.
**Detection:** Duplicate entries with same intent, flicker between values, settle-up numbers changing unexpectedly after navigation.

### Pitfall 3: Cross-Screen Stale Snapshot Caches
**What goes wrong:** Home, ledger list, add-expense, and settle-up screens each maintain independent stale copies of projection data.
**Why it happens:** Navigation-first implementation without a single source-of-truth read model store.
**Consequences:** Inconsistent participant lists, editing deleted expenses, wrong share context, settlement computed on old state.
**Prevention:** Centralize active-share projection in one query/store layer; invalidate and refresh on every mutation and share switch. Use ledgerId-scoped cache keys.
**Detection:** Screen A shows participant/expense absent on Screen B; share switch updates menu highlight but not underlying content.

### Pitfall 4: Share/Participant Identity Mismatch in UI Actions
**What goes wrong:** UI keys by display names or list index instead of stable IDs when editing/deleting participants/expenses.
**Why it happens:** Mock-driven implementation focuses on visible labels, not entity identity.
**Consequences:** Wrong record edited/deleted, phantom participants in splits, irreversible event history mistakes.
**Prevention:** All mutation commands carry canonical IDs from projection; never use array index as durable identifier. Add tests for duplicate names and reorder scenarios.
**Detection:** Long-press edit/delete affects a different row than selected; bug reports spike after participant rename.

### Pitfall 5: Building UI on Known Placeholder/Incomplete Read Models
**What goes wrong:** UI depends on fields currently known to be placeholder/incomplete (e.g., reviewed submission details) or on authority fields not represented in projection types.
**Why it happens:** Frontend uses available objects without checking concern audits.
**Consequences:** Misleading financial data in history views; runtime/compile failures when wiring authority checks.
**Prevention:** Gate UI features behind data-fidelity checks; treat incomplete fields as status-only until fixed. Add explicit adapter layer with typed guards and fallback behavior.
**Detection:** “N/A” currency/zero amounts appear in review views; authority-related flows fail type-check/build.

## Moderate Pitfalls

### Pitfall 1: Coupling UI Flow to Event Ordering Assumptions
**What goes wrong:** UI expects strict immediate ordering semantics not guaranteed by the current append/replay timing model.
**Prevention:** Drive UI from post-append snapshot reads; avoid assumptions like “new expense always at index 0 before refresh.”

### Pitfall 2: Currency and Split UX Diverging from Domain Rules
**What goes wrong:** Form-level split/currency constraints differ from domain validators.
**Prevention:** Reuse domain validation messages/contracts; perform pre-submit checks via domain helpers where possible.

### Pitfall 3: Navigation Shell Implemented Before Data Lifecycle
**What goes wrong:** Tabs/menu flows are complete visually, but lifecycle hooks (refresh on focus/share switch/reset) are missing.
**Prevention:** Define navigation data contract first: which screens subscribe, when they refresh, and what invalidates caches.

## Minor Pitfalls

### Pitfall 1: Theme and Data Controls Causing Hidden State Corruption
**What goes wrong:** Theme toggle/reset data actions unintentionally reuse stale handles/state.
**Prevention:** Ensure reset closes/reopens DB cleanly and clears UI stores; verify with restart tests.

### Pitfall 2: Long-Press Action Sheets Missing Safety UX
**What goes wrong:** Edit/delete affordances are easy to mis-tap without confirmation for destructive actions.
**Prevention:** Add confirmations and undo-friendly UX copy for delete actions.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Navigation shell + state wiring | Cross-screen stale snapshots | Introduce single projection store + focus-based refresh contract |
| Share creation + switching | Active share drift between UI and data layer | Make active ledgerId a first-class global state; invalidate all share-scoped queries on switch |
| Participant management | Identity mismatch on edit/delete | Use participant IDs end-to-end; test duplicate-name scenarios |
| Expense create/edit/delete flows | UI bypasses domain rules; optimistic divergence | Route all writes through mutation APIs; reconcile optimistic state with replayed snapshot |
| Ledger entries list | Ordering/index assumptions | Render by sequence from projection; avoid index-based row identity |
| Settle-up flow | Settlement from stale or mixed-currency state | Recompute from latest snapshot at submit time; force currency selection validation |
| Theme toggle + delete-all-data | Handle leakage/stale state after reset | Explicitly close DB, clear stores, reopen, and verify cold-start baseline |
| QA/UAT phase | Gaps hidden by lack of E2E coverage | Add high-value integration/E2E paths for full mobile flow (create share → add expense → edit/delete → settle-up) |

## Sources

- Internal project context: `.planning/PROJECT.md` (constraints: preserve event-sourced boundaries; UI must use existing mutation/validation paths)
- Code risk inventory: `.planning/codebase/CONCERNS.md` (known bugs, fragile contracts, placeholder read-model fields, replay/perf fragility)
- Testing posture: `.planning/codebase/TESTING.md` (integration-heavy backend tests; missing E2E coverage for UI flows)
- UX flow baseline: `frontend mock/plans.txt` (navigation, screen behavior, destructive actions, settle-up flow)
