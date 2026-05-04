# Roadmap: Dumshare v1.1 Frontend Foundation

## Overview

This roadmap turns the validated offline ledger engine into a real mobile app experience. The focus is a thin Expo/React Native frontend that exposes navigation, dashboard summaries, ledger setup, expense entry, sync status, and per-currency balance views without duplicating domain logic.

## Phases

**Phase Numbering:**
- Integer phases continue from the previous milestone.
- Decimal phases (for example 9.1) are reserved for urgent insertions.

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 9: App Shell and Navigation** - App opens into a native shell with top-level navigation and shared screen layout.
- [ ] **Phase 10: Dashboard and Ledger Setup** - Dashboard surfaces ledger status while setup screens let the organizer manage the roster.
- [x] **Phase 11: Expense Entry and Review UI** - Expense forms, split controls, and pending-review actions are available on mobile. (completed 2026-05-04)
- [x] **Phase 12: Sync and Balance Views** - QR sync flow and per-currency balance detail screens are available with plain-language states. (completed 2026-05-04)

## Phase Details

### Phase 9: App Shell and Navigation
**Goal**: App launches into a branded mobile shell with top-level navigation and reusable layout scaffolding.
**Depends on**: Phase 8 completed domain data and read models
**Requirements**: FE-01, FE-02
**Success Criteria** (what must be TRUE):
  1. User can open the app and see a native shell rather than a placeholder root view.
  2. User can move between the main frontend areas from the same app container.
  3. Shared layout and loading/error handling are centralized so later screens stay consistent.
**Plans**: 2 plans

Plans:
- [ ] 09-01-PLAN.md — Build the Expo shell, branded header, and primary navigation structure.
- [ ] 09-02-PLAN.md — Add shared UI state wiring and layout primitives for all main screens.

### Phase 10: Dashboard and Ledger Setup
**Goal**: Dashboard shows ledger health at a glance and setup screens let the organizer manage the roster.
**Depends on**: Phase 9
**Requirements**: FE-03, FE-04
**Success Criteria** (what must be TRUE):
  1. User can see a dashboard summary that includes the current ledger title, participant count, pending approvals, and balance snapshot.
  2. Organizer can create or edit ledger setup data through a mobile form flow.
  3. Organizer can manage the participant roster from the app UI without needing to inspect raw data structures.
**Plans**: 2 plans

Plans:
- [ ] 10-01-PLAN.md — Build the dashboard summary cards, activity states, and participant overview.
- [ ] 10-02-PLAN.md — Build the ledger setup and participant management screens.

### Phase 11: Expense Entry and Review UI
**Goal**: Users can enter expenses and inspect pending contributor submissions from mobile forms.
**Depends on**: Phase 10
**Requirements**: FE-05, FE-06
**Success Criteria** (what must be TRUE):
  1. User can draft an expense with payer rows and equal, exact, or percentage split controls.
  2. User can review pending contributor submissions and see approval state clearly in the UI.
  3. Expense workflow screens reuse the same validation language as the underlying domain model.
**Plans**: 2 plans

Plans:
- [x] 11-01-PLAN.md — Build the expense entry form and split editor UI.
- [x] 11-02-PLAN.md — Build the pending review list and submission detail screens.

### Phase 12: Sync and Balance Views
**Goal**: Users can run the QR sync flow and inspect per-currency balances in settlement-ready form.
**Depends on**: Phase 11
**Requirements**: FE-07, FE-08
**Success Criteria** (what must be TRUE):
  1. User can start sync by showing or scanning QR codes and follow plain-language progress states.
  2. User can inspect per-currency balance detail without forced cross-currency merging.
  3. Balance views preserve enough settlement context to support the next planning cycle.
**Plans**: 2 plans

Plans:
- [x] 12-01-PLAN.md — Build the QR sync request, scan, and transfer status screens.
- [x] 12-02-PLAN.md — Build the per-currency balance detail and settlement summary screens.

## Progress

**Execution Order:**
Phases execute in numeric order: 9 → 10 → 11 → 12

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 9. App Shell and Navigation | 0/2 | Not started | - |
| 10. Dashboard and Ledger Setup | 0/2 | Not started | - |
| 11. Expense Entry and Review UI | 2/2 | Complete   | 2026-05-04 |
| 12. Sync and Balance Views | 2/2 | Complete   | 2026-05-04 |
