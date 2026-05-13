# Requirements: Dumshare

**Defined:** 2026-05-12
**Core Value:** Any group can reliably capture shared expenses and instantly see an accurate, explainable settle-up outcome.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### App Shell and Navigation

- [x] **NAV-01**: User can see a persistent app shell with header, left menu trigger, and bottom tabs (Home, Add Expense, Ledger, Settle Up)
- [x] **NAV-02**: User can navigate between major screens using the bottom tab bar without losing current ledger context
- [x] **NAV-03**: User can open and close the side menu from any primary screen

### Share Setup and Participants

- [x] **SETUP-01**: User can create a share by entering share name and owner name
- [x] **SETUP-02**: User can save share setup and choose whether to add participants immediately or later
- [x] **SETUP-03**: User can add participants one-by-one and see the current participant list before saving
- [x] **SETUP-04**: User can view existing shares, switch active share, and see active-share highlighting in side menu
- [x] **SETUP-05**: User can long-press non-active shares to make active, edit, or delete
- [x] **SETUP-06**: User can long-press participants to edit or delete them

### Dashboard and Snapshot Views

- [x] **DASH-01**: User can view per-participant financial status (net, owed, owes) for the active share
- [x] **DASH-02**: User can view the latest entered expense summary on the home dashboard
- [x] **DASH-03**: User can view an expense review snapshot with clear split and participant impact details

### Expense Capture and Ledger Entries

- [x] **EXP-01**: User can create an expense with name, amount, currency, payer, and participant selection
- [x] **EXP-02**: User can choose equal or custom split mode for selected participants
- [x] **EXP-03**: User can save expense and return to home with updated snapshot data
- [x] **LEDG-01**: User can see a chronological list of expense entries with overview details
- [x] **LEDG-02**: User can long-press a ledger entry to edit or delete it
- [x] **LEDG-03**: User can edit an existing ledger entry using a prefilled expense form and save changes

### Settlement and App Utilities

- [x] **SETTLE-01**: User can choose settlement currency from searchable ISO currency list
- [x] **SETTLE-02**: User can generate settle-up recommendations showing who owes whom and how much
- [x] **SETTLE-03**: User can view settlement completion screen with final settlement breakdown
- [x] **UTIL-01**: User can toggle light/dark mode from the side menu
- [x] **UTIL-02**: User can delete all local app data from side menu with explicit confirmation

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Collaboration and Platform Expansion

- **COLLAB-01**: User can sync shares across devices/accounts
- **COLLAB-02**: User can invite participants via remote link flow instead of local-only tagging
- **PLAT-01**: User can use a dedicated web client with parity to core mobile workflows

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Cloud sync/auth in v1 | Current architecture and scope are local-first; keep milestone focused on UI rebuild and backend integration |
| Advanced analytics/reporting | Not required to deliver core settle-up value in first frontend release |
| Push notifications | Adds service dependencies without improving immediate core workflow completion |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| NAV-01 | Phase 1 | Complete |
| NAV-02 | Phase 1 | Complete |
| NAV-03 | Phase 1 | Complete |
| SETUP-01 | Phase 1 | Complete |
| SETUP-02 | Phase 1 | Complete |
| SETUP-03 | Phase 1 | Complete |
| SETUP-04 | Phase 1 | Complete |
| SETUP-05 | Phase 1 | Complete |
| SETUP-06 | Phase 1 | Complete |
| DASH-01 | Phase 2 | Complete |
| DASH-02 | Phase 2 | Complete |
| DASH-03 | Phase 2 | Complete |
| EXP-01 | Phase 3 | Complete |
| EXP-02 | Phase 3 | Complete |
| EXP-03 | Phase 3 | Complete |
| LEDG-01 | Phase 3 | Complete |
| LEDG-02 | Phase 3 | Complete |
| LEDG-03 | Phase 3 | Complete |
| SETTLE-01 | Phase 4 | Complete |
| SETTLE-02 | Phase 4 | Complete |
| SETTLE-03 | Phase 4 | Complete |
| UTIL-01 | Phase 1 | Complete |
| UTIL-02 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0

---
*Requirements defined: 2026-05-12*
*Last updated: 2026-05-12 after roadmap mapping*
