# Requirements: Dumshare v1.1 Frontend Foundation

**Defined:** 2026-05-04
**Core Value:** A small group can reliably record and reconcile shared trip expenses offline, then sync in person through an organizer-controlled flow without requiring internet or cloud services.

## v1 Requirements

Requirements for the frontend milestone. Each maps to roadmap phases.

### Shell and Navigation

- [ ] **FE-01**: User can open the app into a native mobile shell with a branded header and primary navigation.
- [ ] **FE-02**: User can move between dashboard, setup, expense entry, sync, and balances screens without leaving the app.

### Dashboard and Setup

- [ ] **FE-03**: User can see a dashboard summary with ledger title, participant count, pending approvals, latest activity, and currency balance snapshot.
- [ ] **FE-04**: Organizer can create a ledger and manage the participant roster through mobile forms.

### Expenses and Review

- [ ] **FE-05**: User can create an expense draft with payer rows and equal, exact, or percentage split controls.
- [ ] **FE-06**: User can review pending contributor submissions and see approve/reject status in the UI.

### Sync and Balances

- [ ] **FE-07**: User can start sync by showing or scanning QR codes and follow plain-language transfer states.
- [ ] **FE-08**: User can inspect per-currency balance detail and settlement-ready summaries.

## v2 Requirements

Deferred to future release. Tracked but not in the current frontend roadmap.

### Reliability and UX Extensions

- **RUXE-01**: User can attach receipt photos to expenses.
- **RUXE-02**: User can export trip summaries in shareable formats.
- **RUXE-03**: User can view category-level spend insights.

### Visual Polish and Accessibility

- **UXPL-01**: User can switch between light and dark visual themes.
- **UXPL-02**: User can adjust layout density for small and large phones.
- **UXPL-03**: User can navigate core screens with accessible labels and focus order.

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
| Desktop and web layouts | This milestone is Android-first and iOS-compatible mobile UI only. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FE-01 | Phase 9 | Pending |
| FE-02 | Phase 9 | Pending |
| FE-03 | Phase 10 | Pending |
| FE-04 | Phase 10 | Pending |
| FE-05 | Phase 11 | Pending |
| FE-06 | Phase 11 | Pending |
| FE-07 | Phase 12 | Pending |
| FE-08 | Phase 12 | Pending |

**Coverage:**
- v1 requirements: 8 total
- Mapped to phases: 8
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-04*
*Last updated: 2026-05-04 after v1.1 frontend planning*
