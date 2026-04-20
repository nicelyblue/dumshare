# Roadmap: Dumshare v1

## Overview

This roadmap delivers Dumshare v1 in dependency order: establish deterministic local ledger behavior first, then role/onboarding flows, then expense authoring and approval governance, then in-person synchronization, and finally currency-safe balance outcomes users can trust.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Local Data Backbone** - Reliable local persistence and deterministic event replay are in place. (completed 2026-04-20)
- [ ] **Phase 2: Ledger Setup and Participants** - Organizer can create a ledger and manage participant roster offline.
- [ ] **Phase 3: Contributor Onboarding and Authority Model** - Organizer invites one-device contributors and remains sole hub/authority.
- [ ] **Phase 4: Expense Capture Foundations** - Organizer and contributors can record complete offline expense basics.
- [ ] **Phase 5: Split Modes and Contributor Amendments** - Equal/exact/percentage splits and contributor amendment submission work end-to-end.
- [ ] **Phase 6: Organizer Approval Gate** - Contributor submissions are explicitly approved/rejected before entering approved state.
- [ ] **Phase 7: In-Person Sync Exchange** - QR bootstrap and Bluetooth delta sync exchange unseen events bidirectionally.
- [ ] **Phase 8: Per-Currency Balances and Settlement Readiness** - Users get correct per-currency balances without auto-merging currencies.

## Phase Details

### Phase 1: Local Data Backbone
**Goal**: Ledger data is stored locally and always reconstructs the same user-visible state from append-only events.
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02, DATA-03
**Success Criteria** (what must be TRUE):
  1. User can close and reopen the app offline and all previously recorded ledger data is still present on the same device.
  2. User actions are preserved as immutable history rather than destructive overwrites.
  3. The app produces the same ledger outcome every time the same event history is replayed.
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Implement local SQLite append-only event storage contracts and blocking schema push.
- [ ] 01-02-PLAN.md — Implement deterministic replay projection and reconstruction tests.

### Phase 2: Ledger Setup and Participants
**Goal**: Organizer can start a trip ledger and maintain participant names fully offline.
**Depends on**: Phase 1
**Requirements**: LEDR-01, LEDR-02
**Success Criteria** (what must be TRUE):
  1. Organizer can create a new trip ledger with title and settlement context without internet access.
  2. Organizer can add participant names to the ledger for shared expense allocation.
  3. Added participants persist and remain available for later expense/split actions.
**Plans**: TBD

### Phase 3: Contributor Onboarding and Authority Model
**Goal**: Organizer can onboard contributors by QR invitation while preserving single-device identity and organizer-only authority.
**Depends on**: Phase 2
**Requirements**: LEDR-03, LEDR-04, LEDR-05
**Success Criteria** (what must be TRUE):
  1. Organizer can generate a one-time invitation QR for a selected passive participant.
  2. Invited contributor can join the specific ledger by scanning that invitation QR on exactly one device.
  3. Attempts to join the same contributor identity from another device are blocked.
  4. Users experience organizer as the only sync hub and only approval authority in normal ledger operations.
**Plans**: TBD

### Phase 4: Expense Capture Foundations
**Goal**: Organizer and contributors can record complete offline expenses with multi-payer details.
**Depends on**: Phase 3
**Requirements**: EXPS-01, EXPS-02, EXPS-03
**Success Criteria** (what must be TRUE):
  1. Organizer can create an expense offline with description, currency, total amount, and date.
  2. Contributor can create an expense offline with description, currency, total amount, and date.
  3. User can assign one or more payers with explicit paid amounts for a single expense.
**Plans**: TBD

### Phase 5: Split Modes and Contributor Amendments
**Goal**: Expenses support all v1 split modes and contributor amendments feed into the review pipeline.
**Depends on**: Phase 4
**Requirements**: EXPS-04, EXPS-05, EXPS-06, EXPS-07
**Success Criteria** (what must be TRUE):
  1. User can split an expense equally across selected participants.
  2. User can split an expense by exact owed amounts across selected participants.
  3. User can split an expense by percentages across selected participants.
  4. Contributor can amend their submitted expenses and the amendment is treated as reviewable submission, not auto-applied approved state.
**Plans**: TBD

### Phase 6: Organizer Approval Gate
**Goal**: Contributor-created expenses/amendments are governed by explicit organizer approve/reject decisions before they affect approved ledger outcomes.
**Depends on**: Phase 5
**Requirements**: APRV-01, APRV-02, APRV-03, APRV-04, APRV-05
**Success Criteria** (what must be TRUE):
  1. Contributor-created expenses arrive in pending state until organizer review occurs.
  2. Contributor-submitted amendments arrive in pending state until organizer review occurs.
  3. Organizer can explicitly approve or reject each pending contributor submission.
  4. Rejected submissions do not alter approved balances/settlement outcomes.
  5. Approved submissions become part of approved ledger state used for downstream balance outcomes.
**Plans**: TBD

### Phase 7: In-Person Sync Exchange
**Goal**: Organizer and contributors can run in-person QR + Bluetooth sync sessions that exchange unseen events in both directions.
**Depends on**: Phase 6
**Requirements**: SYNC-01, SYNC-02, SYNC-03, SYNC-04, SYNC-05
**Success Criteria** (what must be TRUE):
  1. Contributor can initiate sync by showing a sync-request QR to organizer.
  2. Organizer can scan the request QR and establish a transfer session.
  3. Organizer and contributor exchange unseen events via checkpoint-based delta synchronization.
  4. Sync transfers contributor pending events to organizer and organizer-side events back to contributor in one workflow.
  5. Users receive plain-language status updates while changes are sent and received.
**Plans**: TBD

### Phase 8: Per-Currency Balances and Settlement Readiness
**Goal**: Users can trust per-currency net balances for settlement decisions without hidden cross-currency merging.
**Depends on**: Phase 7
**Requirements**: BALN-01, BALN-02, BALN-03
**Success Criteria** (what must be TRUE):
  1. App computes each participant’s net position per currency from paid amounts and owed shares.
  2. App presents balances separated by currency instead of silently merging different currencies.
  3. Balance outputs preserve enough currency-specific detail to support later settlement calculation.
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Local Data Backbone | 2/2 | Complete   | 2026-04-20 |
| 2. Ledger Setup and Participants | 0/TBD | Not started | - |
| 3. Contributor Onboarding and Authority Model | 0/TBD | Not started | - |
| 4. Expense Capture Foundations | 0/TBD | Not started | - |
| 5. Split Modes and Contributor Amendments | 0/TBD | Not started | - |
| 6. Organizer Approval Gate | 0/TBD | Not started | - |
| 7. In-Person Sync Exchange | 0/TBD | Not started | - |
| 8. Per-Currency Balances and Settlement Readiness | 0/TBD | Not started | - |
