# Requirements: Dumshare v1

**Defined:** 2026-04-20
**Core Value:** A small group can reliably record and reconcile shared trip expenses offline, then sync in person through an organizer-controlled flow without requiring internet or cloud services.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Ledger and Roles

- [x] **LEDR-01**: Organizer can create a new trip ledger with title and settlement context on device without internet.
- [x] **LEDR-02**: Organizer can add participants as passive names inside the ledger.
- [x] **LEDR-03**: Organizer can promote a passive participant to contributor by generating a one-time invitation QR.
- [x] **LEDR-04**: Invited contributor can join the specific ledger on exactly one device by scanning organizer invitation QR.
- [x] **LEDR-05**: Organizer remains the only approval authority and only sync hub for contributor devices.

### Expenses and Splits

- [x] **EXPS-01**: Organizer can create an expense offline with description, currency, total amount, and date.
- [x] **EXPS-02**: Contributor can create an expense offline with description, currency, total amount, and date.
- [x] **EXPS-03**: User can record one or more payers for an expense with explicit paid amounts.
- [ ] **EXPS-04**: User can assign participants using equal split for an expense.
- [ ] **EXPS-05**: User can assign participants using exact amount split for an expense.
- [ ] **EXPS-06**: User can assign participants using percentage split for an expense.
- [ ] **EXPS-07**: Contributor can amend their submitted expenses and amendments enter the same approval flow as new submissions.

### Approval Workflow

- [ ] **APRV-01**: Every contributor-created expense enters pending state until organizer reviews it.
- [ ] **APRV-02**: Every contributor-submitted amendment enters pending state until organizer reviews it.
- [ ] **APRV-03**: Organizer can approve a pending contributor expense or amendment.
- [ ] **APRV-04**: Organizer can reject a pending contributor expense or amendment.
- [ ] **APRV-05**: Only approved organizer-reviewed changes affect approved ledger balances and settlement views.

### Offline Sync

- [ ] **SYNC-01**: Contributor can initiate in-person sync by presenting a QR sync request to organizer.
- [ ] **SYNC-02**: Organizer can scan contributor sync request and establish transfer session.
- [ ] **SYNC-03**: Organizer and contributor can exchange unseen events using checkpoint-based delta synchronization.
- [ ] **SYNC-04**: Sync flow supports bidirectional exchange where contributor uploads pending events and receives organizer-side events.
- [ ] **SYNC-05**: Sync UX shows clear plain-language progress and status for sending and receiving changes.

### Balances and Currency

- [ ] **BALN-01**: App computes participant net balances per currency from paid amounts and owed shares.
- [ ] **BALN-02**: App displays balances per currency without auto-merging different currencies.
- [ ] **BALN-03**: App preserves enough per-currency detail for eventual settlement calculation.

### Local Data and Determinism

- [x] **DATA-01**: Ledger state is persisted locally with no cloud storage dependency.
- [x] **DATA-02**: Ledger changes are recorded in an append-only event log.
- [x] **DATA-03**: User-visible ledger state is deterministically derived from replay of stored events.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Reliability and UX Extensions

- **RUXE-01**: User can attach receipt photos to expenses.
- **RUXE-02**: User can export trip summaries in shareable formats.
- **RUXE-03**: User can view category-level spend insights.

### Identity and Continuity

- **IDCT-01**: Contributor can use the same identity across multiple devices.
- **IDCT-02**: Ledger can be recovered after device loss through backup/restore mechanisms.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Cloud accounts and server sync | v1 is intentionally local-first and offline-only. |
| Automatic background synchronization | In-person manual sync is the deliberate v1 operating model. |
| Contributor-to-contributor sync | Organizer-star topology is required to keep trust and conflict handling simple. |
| Automatic CRDT-style conflict merges | Organizer remains the explicit human arbiter for conflicts in v1. |
| Forced cross-currency balance merging | v1 keeps per-currency balances to avoid hidden conversion ambiguity. |
| Financial-grade security hardening | v1 security stays lightweight to preserve usability under travel conditions. |
| Direct payment rail integrations | Not core to v1 value; focus is trusted offline ledger and sync. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| LEDR-01 | Phase 2 | Complete |
| LEDR-02 | Phase 2 | Complete |
| LEDR-03 | Phase 3 | Complete |
| LEDR-04 | Phase 3 | Complete |
| LEDR-05 | Phase 3 | Complete |
| EXPS-01 | Phase 4 | Complete |
| EXPS-02 | Phase 4 | Complete |
| EXPS-03 | Phase 4 | Complete |
| EXPS-04 | Phase 5 | Pending |
| EXPS-05 | Phase 5 | Pending |
| EXPS-06 | Phase 5 | Pending |
| EXPS-07 | Phase 5 | Pending |
| APRV-01 | Phase 6 | Pending |
| APRV-02 | Phase 6 | Pending |
| APRV-03 | Phase 6 | Pending |
| APRV-04 | Phase 6 | Pending |
| APRV-05 | Phase 6 | Pending |
| SYNC-01 | Phase 7 | Pending |
| SYNC-02 | Phase 7 | Pending |
| SYNC-03 | Phase 7 | Pending |
| SYNC-04 | Phase 7 | Pending |
| SYNC-05 | Phase 7 | Pending |
| BALN-01 | Phase 8 | Pending |
| BALN-02 | Phase 8 | Pending |
| BALN-03 | Phase 8 | Pending |
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 1 | Complete |
| DATA-03 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0

---
*Requirements defined: 2026-04-20*
*Last updated: 2026-04-20 after roadmap mapping*
