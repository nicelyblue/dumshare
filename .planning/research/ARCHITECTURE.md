# Architecture Patterns

**Domain:** Local-first mobile shared-expense app (Dumshare) frontend integration
**Researched:** 2026-05-12

## Recommended Architecture

Use a **UI → App Services (adapter) → Existing Data/Domain APIs** structure, where screens never call event repository or replay functions directly.

```text
React Native Screens
  ↓ (intents + form data)
UI Controllers / ViewModels (per screen)
  ↓ (typed commands/queries)
Ledger App Service Adapter (frontend boundary)
  ↓
src/data/ledger/* APIs (existing)
  ↓
EventRepository append/list
  ↓
replayLedger projections → snapshot DTOs back to UI
```

This preserves the current event-sourced architecture and reduces integration risk by centralizing translation, error mapping, and active-share resolution in one frontend boundary.

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Navigation Shell (Header/Menu/Tabs) | Route composition, global chrome, active-share context display | App State Store, Share Query Service |
| Screen View (Welcome, Create Share, Home, Add Expense, Ledger, Settle) | Render-only UI + user input capture | Screen Controller/ViewModel |
| Screen Controller/ViewModel | Input validation for UX constraints, loading/error state, command orchestration | Ledger App Service Adapter |
| Ledger App Service Adapter (new frontend boundary) | Wrap existing `src/data/ledger/*` calls, normalize params, map errors to UI-safe messages, enforce “one way in” | Existing data-layer modules |
| App State Store (UI state only) | Active screen params, ephemeral form drafts, theme, transient UI flags | Navigation, Controllers |
| Existing Ledger Mutation APIs | Persist changes by appending events | Event Repository |
| Existing Snapshot Query APIs | Rehydrate and derive dashboard/review/balance outputs | Replay + balance domain |

### Data Flow

1. User action on a screen emits a typed intent (`createShare`, `addParticipant`, `submitExpense`, `deleteExpense`, `runSettlement`).
2. Screen Controller validates UI-level constraints (required fields, numeric formatting) and calls Adapter command/query.
3. Adapter invokes existing module APIs in `src/data/ledger/` (no direct repository/replay access from UI).
4. Domain/data layer appends events or loads snapshots via replay.
5. Adapter maps success/failure to UI DTOs and stable error codes/messages.
6. Controller updates view state; navigation proceeds only on confirmed success.

## Patterns to Follow

### Pattern 1: Anti-Corruption Frontend Adapter
**What:** A strict frontend integration layer that exposes app-specific methods and hides backend function shape drift.
**When:** For all mutation/query calls from UI.
**Example:**
```typescript
// frontend/app/ledgerGateway.ts
export interface LedgerGateway {
  createShare(input: { shareName: string; ownerName: string }): Promise<{ ledgerId: string }>;
  addParticipant(input: { ledgerId?: string; name: string }): Promise<void>;
  loadHomeSnapshot(input?: { ledgerId?: string }): Promise<HomeSnapshotVm>;
  submitExpense(input: ExpenseFormVm): Promise<void>;
}
```

### Pattern 2: Query-First Screen Hydration
**What:** Every screen loads from snapshot/query APIs first; local state is a projection of domain state, not a parallel source of truth.
**When:** Home, Ledger Entries, Settle Up, side-menu shares/participants.
**Example:**
```typescript
// On screen focus
const snapshot = await ledgerGateway.loadHomeSnapshot({ ledgerId: activeLedgerId });
setVm(snapshot);
```

### Pattern 3: Mutation Then Refresh
**What:** After successful mutation, re-read affected snapshot rather than mutating deep UI trees optimistically.
**When:** Expense create/edit/delete, participant updates, share switch.
**Example:**
```typescript
await ledgerGateway.submitExpense(form);
const next = await ledgerGateway.loadHomeSnapshot();
setVm(next);
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Direct Event-Store Access from Screens
**What:** Screen-level imports of repository/replay modules.
**Why bad:** Couples UI to sequencing/event payload details; high rewrite risk if domain contracts evolve.
**Instead:** Only call Adapter methods that route to `src/data/ledger/*` APIs.

### Anti-Pattern 2: Dual State Authority
**What:** Keeping editable local copies of balances/ledger entries as persistent truth.
**Why bad:** Divergence from replayed canonical state; stale balances and inconsistent settle-up outputs.
**Instead:** Treat snapshots as canonical; local state is temporary form/UI state only.

### Anti-Pattern 3: Big-Bang Screen Integration
**What:** Building all screens before wiring real mutations/queries.
**Why bad:** Delays discovery of API shape mismatches and validation errors.
**Instead:** Vertical slices in risk-first order (below).

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| Event replay latency per active share | Full replay on demand is acceptable | Introduce memoized snapshot caching per ledger/session | Move toward persisted/materialized read models if needed |
| UI consistency under rapid edits | Refresh-after-mutation sufficient | Add per-screen invalidation keys and background refresh | Introduce event subscription/changefeed abstraction |
| Multi-share switching | Simple query on switch | Cache last N share snapshots for instant switch | Dedicated share index + lazy hydration |

## Recommended Build Order (Risk-Reduced)

1. **Integration Foundation Layer**
   - Build `Ledger App Service Adapter`, typed DTO mappers, error taxonomy.
   - Add smoke tests that call existing `src/data/ledger/*` via adapter.
   - **Why first:** catches boundary mismatch early before UI complexity.

2. **Navigation + Active Share Context**
   - Header/menu/tabs shell, share list and active-share switch flow, empty-state routing.
   - Wire read-only queries first.
   - **Why second:** every screen depends on navigation and active ledger resolution.

3. **Share Setup Vertical Slice**
   - Welcome → Create Share → Add Participants → Home transition.
   - Wire `saveLedgerSetup` + participant mutations and immediate snapshot reload.
   - **Why third:** validates creation lifecycle and baseline event flow.

4. **Home Dashboard Read Models**
   - Participant status cards and latest expense block from snapshot APIs.
   - Add resilient loading/error/empty states.
   - **Why fourth:** central read path used after nearly all mutations.

5. **Expense Create/Edit/Delete Slice**
   - Add Expense screen, ledger entries list, long-press delete/edit actions.
   - Currency selector and split handling mapped to existing validation.
   - **Why fifth:** highest domain-rule density; integrate once foundations are stable.

6. **Settlement Slice**
   - Settle-up currency selection and result presentation.
   - Use existing balance/settlement snapshot outputs end-to-end.
   - **Why sixth:** depends on reliable expense and balance pipelines.

7. **Cross-Cutting UX Controls**
   - Theme toggle, destructive data reset, polish and defensive UX.
   - **Why last:** lower architecture risk; can be safely layered.

## Integration Risk Controls (for roadmap decomposition)

- Add a **boundary contract check** phase artifact: adapter method matrix ↔ existing data API methods.
- Require each phase to ship at least one **real mutation + real query** roundtrip.
- Introduce **error mapping table** early (domain error strings → user-facing messages).
- Enforce “no screen imports from `src/domain/*` or repository modules” via lint rule or code review gate.

## Sources

- `.planning/PROJECT.md` (HIGH confidence, project constraints and scope)
- `.planning/codebase/ARCHITECTURE.md` (HIGH confidence, existing event-store/replay boundaries)
- `.planning/codebase/STRUCTURE.md` (HIGH confidence, module ownership and entry points)
- `frontend mock/plans.txt` (HIGH confidence, target screen behaviors and flows)
