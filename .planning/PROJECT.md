# Dumshare v1

## What This Is

Dumshare v1 is a local-first, offline expense-sharing app for small travel groups. It lets one organizer manage a shared ledger while invited contributors record expenses on their own device and sync changes in person. The product experience stays simple and non-technical even though it runs on local replicas, event logs, and approval-gated synchronization.

## Core Value

A small group can reliably record and reconcile shared trip expenses offline, then sync in person through an organizer-controlled flow without requiring internet or cloud services.

## Current Milestone: v1.1 Frontend Foundation

**Goal:** Turn the Expo app into a real mobile UI layer over the validated offline ledger and sync engine.

**Target features:**
- App shell and navigation
- Read-only ledger dashboard with status and balances
- Ledger setup and participant management screens
- Expense entry and split editor screens
- Sync request and balance detail screens

## Requirements

### Validated

- DATA-01 (Phase 1): Ledger state persists locally on-device with no cloud dependency.
- DATA-02 (Phase 1): Ledger changes are recorded as append-only immutable events.
- DATA-03 (Phase 1): User-visible ledger state is deterministically reconstructed by replay.
- LEDR-01 (Phase 2): Organizer can create a trip ledger with title and settlement context fully offline.
- LEDR-02 (Phase 2): Organizer can add passive participant names that persist through replay and reopen.
- EXPS-01 (Phase 4): Organizer can create an offline expense with description, currency, total amount, date, and payer rows.
- EXPS-02 (Phase 4): Claimed contributor can create an offline expense with the same strict required fields.
- EXPS-03 (Phase 4): Expense creation requires one-or-more explicit payer rows with participant IDs and paid amounts.
- APRV-01..APRV-05 (Phase 6): Contributor submissions are pending-first and only affect approved ledger state after explicit organizer approve/reject decisions.
- SYNC-01..SYNC-05 (Phase 7): Contributor QR bootstrap, organizer-gated session establishment, checkpoint deltas, bidirectional exchange, and plain-language sync status timeline are verified.
- BALN-01..BALN-03 (Phase 8): Per-currency balances are derived from approved entries and remain separated by currency.

### Active

- [ ] User can open the app into a native mobile shell with a branded header and primary navigation.
- [ ] User can move between dashboard, setup, expense entry, sync, and balances screens without leaving the app.
- [ ] User can see a dashboard summary with ledger title, participant count, pending approvals, latest activity, and currency balance snapshot.
- [ ] Organizer can create a ledger and manage the participant roster through mobile forms.
- [ ] User can create an expense draft with payer rows and equal, exact, or percentage split controls.
- [ ] User can review pending contributor submissions and see approve/reject status in the UI.
- [ ] User can start sync by showing or scanning QR codes and follow plain-language transfer states.
- [ ] User can inspect per-currency balance detail and settlement-ready summaries.

### Out of Scope

- Cloud sync, remote storage, and account systems — v1 is intentionally local-only and offline-first.
- Background or automatic synchronization — sync is manual and in-person by design.
- Contributor-to-contributor sync — topology is organizer-centric star only.
- Multi-device identity for a contributor — each contributor maps to one device in v1.
- Recovery guarantees for lost devices — local copies may be unrecoverable after device loss.
- Financial-grade cryptographic hardening — v1 security remains lightweight to preserve usability.
- Automatic conflict resolution — organizer remains human arbiter for conflicting proposals.
- Rich visual personalization and marketing-style motion — first frontend milestone should ship usable screens before polish.

## Context

- Product is optimized for real-world travel conditions where internet access is unreliable or unavailable.
- User roles are explicit: organizer (authority + hub), contributor (single-device participant), passive participant (name-only ledger member).
- Data model constraint is append-only event log with deterministic projection to user-visible state.
- Sync flow is fixed for v1: contributor prepares sync request QR, organizer scans, Bluetooth transfer exchanges unseen events, organizer reviews pending changes, organizer sends missing organizer-side events back.
- The codebase already has a validated domain/data layer, but the UI surface is still a static Expo root component.
- UX language must stay plain and action-oriented (for example: "Show code", "Scan code", "Sending changes", "Receiving changes") and avoid distributed-systems terminology.

## Constraints

- **Platform**: Android and iOS — product decisions lock mobile support for both ecosystems.
- **Connectivity**: Fully offline operation — users must complete core flows without internet.
- **Storage**: Local-only on-device persistence — no cloud dependency is allowed.
- **Sync topology**: Organizer as sole hub — simplifies consistency and approval governance.
- **Transport**: QR bootstrap plus Bluetooth transfer — fixed v1 session establishment and data channel.
- **Consistency model**: Append-only event log with checkpoint-based delta sync — supports deterministic replay and bounded transfer.
- **Governance**: Mandatory organizer approval on contributor submissions — ensures trusted approved ledger state.
- **Currency handling**: Per-currency balance accounting — no automatic currency merging.
- **Frontend approach**: Expo/React Native shell over existing domain APIs — keep UI thin and avoid duplicating replay logic.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| No cloud/server architecture for v1 | Preserve offline reliability, reduce infra complexity, and align with local-first product promise | — Pending |
| Organizer-only approval and sync hub model | Keeps conflict handling understandable and centralizes trust decisions | — Pending |
| Single-device contributor identity | Simplifies identity, replication edges, and invitation semantics in MVP | — Pending |
| Expense model includes multi-payer + exact + percentage splits in v1 | Required for real travel expense scenarios; equal-only splits are insufficient | — Pending |
| Mixed currencies allowed in one ledger with per-currency balances | Reflects real group travel behavior while avoiding fragile implicit conversions | — Pending |
| Frontend should be a thin Expo UI over the validated domain layer | Keeps navigation, forms, and screens deterministic without re-implementing business logic | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-04 after starting v1.1 Frontend Foundation*
