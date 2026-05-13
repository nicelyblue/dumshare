# Roadmap: Dumshare Frontend Rebuild

## Overview

This milestone rebuilds the mobile frontend as a thin UI layer over the existing event-sourced backend/domain foundation, delivering complete user-visible flows from share setup to settle-up without changing core ledger logic.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Shell, Share Context, and Setup Flows** - Deliver navigation shell, share/participant lifecycle, and utility controls on top of existing backend APIs. (completed 2026-05-12)
- [ ] **Phase 2: Home Snapshot and Review Views** - Deliver trustworthy dashboard snapshots and expense impact review for the active share.
- [ ] **Phase 3: Expense Capture and Ledger Correction Loop** - Deliver end-to-end expense create/edit/delete and chronological ledger history.
- [ ] **Phase 4: Settlement Recommendations and Completion** - Deliver currency-based settle-up recommendations and completion breakdown.

## Phase Details

### Phase 1: Shell, Share Context, and Setup Flows
**Goal**: Users can navigate the app, manage active shares and participants, and perform key app controls while preserving backend/domain as the source of truth.
**Depends on**: Nothing (first phase)
**Requirements**: NAV-01, NAV-02, NAV-03, SETUP-01, SETUP-02, SETUP-03, SETUP-04, SETUP-05, SETUP-06, UTIL-01, UTIL-02
**Success Criteria** (what must be TRUE):
  1. User can move between Home, Add Expense, Ledger, and Settle Up tabs while keeping the active share context intact.
  2. User can create a share, save setup, and choose immediate participant entry or deferral.
  3. User can add participants, review the participant list before saving, and edit/delete participants via long-press actions.
  4. User can open side menu from primary screens, switch active share with clear highlighting, and edit/delete non-active shares via long-press.
  5. User can toggle light/dark theme and can clear all local app data only after explicit confirmation.
**Plans**: 4 plans
Plans:
- [x] 01-01-PLAN.md — Build Expo shell, tabs, active-share state, and adapter contracts.
- [x] 01-02-PLAN.md — Implement create-share and participant setup flow.
- [x] 01-03-PLAN.md — Implement drawer share switching, theme toggle, and reset controls.
- [x] 01-04-PLAN.md — Implement long-press edit/delete flows for shares and participants.
**UI hint**: yes

### Phase 2: Home Snapshot and Review Views
**Goal**: Users can understand current share financial state from reliable, readable snapshot views.
**Depends on**: Phase 1
**Requirements**: DASH-01, DASH-02, DASH-03
**Success Criteria** (what must be TRUE):
  1. User can view per-participant net/owed/owes status for the active share.
  2. User can see the latest entered expense summary directly on Home.
  3. User can open an expense review snapshot that clearly explains split details and participant impact.
**Plans**: 2 plans
Plans:
- [x] 02-01-PLAN.md — Add snapshot service/controller contracts with test-backed UI model mapping.
- [x] 02-02-PLAN.md — Implement Home and Review snapshot screens wired to active share context.
**UI hint**: yes

### Phase 3: Expense Capture and Ledger Correction Loop
**Goal**: Users can reliably record expenses and correct ledger history through full create/edit/delete workflows.
**Depends on**: Phase 1
**Requirements**: EXP-01, EXP-02, EXP-03, LEDG-01, LEDG-02, LEDG-03
**Success Criteria** (what must be TRUE):
  1. User can create an expense with name, amount, currency, payer, and participant selection.
  2. User can select equal or custom split mode and save the expense back into the active share.
  3. User can view a chronological ledger list with clear entry overview details.
  4. User can long-press ledger entries to edit or delete, and edited entries open with prefilled values that save successfully.
**Plans**: 3 plans
Plans:
- [x] 03-01-PLAN.md — Define and test expense form/ledger history service-controller contracts.
- [x] 03-02-PLAN.md — Implement Add Expense create/edit form with split-mode workflows.
- [x] 03-03-PLAN.md — Implement chronological ledger list and long-press edit/delete correction actions.
**UI hint**: yes

### Phase 4: Settlement Recommendations and Completion
**Goal**: Users can generate and understand settle-up outcomes from the latest ledger state.
**Depends on**: Phase 2, Phase 3
**Requirements**: SETTLE-01, SETTLE-02, SETTLE-03
**Success Criteria** (what must be TRUE):
  1. User can select a settlement currency from a searchable ISO currency list.
  2. User can generate settle-up recommendations showing who owes whom and exact amounts.
  3. User can view a settlement completion screen with final breakdown details for closure.
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 (Phase 2 and Phase 3 are parallel-friendly after Phase 1, if capacity allows)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Shell, Share Context, and Setup Flows | 4/4 | Complete   | 2026-05-12 |
| 2. Home Snapshot and Review Views | 0/TBD | Not started | - |
| 3. Expense Capture and Ledger Correction Loop | 0/TBD | Not started | - |
| 4. Settlement Recommendations and Completion | 0/TBD | Not started | - |
