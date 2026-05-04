# Dumshare v1 Project Brief

## Product Summary

Dumshare is a local-first, offline expense-sharing app for small groups such as travelers. It has no central server and no cloud backup. Each device stores a local replica of the ledger, and synchronization happens manually, in person, using a QR-bootstrapped Bluetooth transfer. The organizer is the sole approval authority and the only sync hub; contributors sync only with the organizer.[file:85]

Dumshare v1 is designed to feel simple and non-technical. Users should experience it as “show code / scan code / send changes / receive changes,” not as a distributed system. The product must stay understandable, offline-capable, and easy to use under real-world travel conditions.[file:85]

## Product Goals

The primary goal of Dumshare v1 is to let a group create a shared trip ledger, record expenses offline, and synchronize them later without internet access.[file:85]

Secondary goals:

- Allow one organizer to create and manage a ledger for the whole group.[file:85]
- Allow selected participants to become contributors and record expenses on their own device while offline.[file:85]
- Support approval-based synchronization so the organizer must approve every contributor-submitted expense or amendment before it becomes part of the approved ledger state.[file:85]
- Support real shared-expense scenarios, including multiple payers, custom exact splits, and percentage splits from v1.[file:85]
- Support mixed currencies inside a single ledger, while preserving per-currency balances and settlement logic.[file:85]

## Success Criteria

Dumshare v1 is successful if a small travel group can:

- Create a ledger on one phone.
- Add participants by name.
- Invite at least one participant as a contributor.[file:85]
- Let that contributor record expenses completely offline.[file:85]
- Synchronize the contributor’s pending changes back to the organizer using QR + Bluetooth.[file:85]
- Require the organizer to approve or reject every submitted expense or amendment before it becomes approved state.[file:85]
- Show resulting balances per currency and preserve enough information for eventual settlement calculations.[file:85]

## Target Users

### Organizer

The organizer creates the ledger, adds participants, invites contributors, approves or rejects submitted expenses and edits, and acts as the only synchronization hub.[file:85]

### Contributor

A contributor joins a specific ledger through an organizer-issued invitation, records expenses on one device only, and synchronizes only with the organizer.[file:85]

### Passive Participant

A passive participant exists as a named participant inside the ledger but may never install the app. A passive participant can later be promoted to contributor by the organizer.[file:85]

## Core User Scenarios

### Create and use a trip ledger

A user installs Dumshare, creates a trip ledger, sets a title and settlement currency, and adds participants as names. Initially, only the organizer has the ledger on-device.[file:85]

### Promote a participant to contributor

The organizer upgrades a named participant to contributor by generating an invitation QR code. The participant installs the app, scans the invitation, and gets a local replica of the ledger on a single device.[file:85]

### Record expenses offline

The organizer or a contributor records expenses without internet. Expenses may include one or more payers and participant allocations using equal, exact, or percentage-based splits.[file:85]

### Sync in person

When organizer and contributor physically meet, the contributor initiates a sync request by showing a QR code. The organizer scans it, a Bluetooth session is established, unseen events are exchanged, and the organizer reviews all incoming pending expenses and amendments.[file:85]

### Approve or reject submitted changes

Every contributor-submitted expense or amendment requires explicit organizer approval. Approval or rejection generates new events that are later synced back to the contributor.[file:85]

## MVP Scope

Dumshare v1 must include:

- Ledger creation.
- Participant creation as passive names.[file:85]
- Contributor invitation and join flow via QR code.[file:85]
- One organizer and one or more contributors, with contributors limited to one device each.
- Local-only storage with an append-only event log and derived ledger state.[file:85]
- Manual offline synchronization using QR + Bluetooth.[file:85]
- Delta-based event exchange using checkpoints.[file:85]
- Pending, approved, and rejected expense lifecycle under organizer control.[file:85]
- Expense creation with:
  - Single or multiple payers.[file:85]
  - Equal, exact, and percentage participant splits.[file:85]
  - Mixed currencies inside the same ledger.
- Balance views per currency.[file:85]
- Human-friendly sync UX with simple language and visible progress.[file:85]

## Explicit Non-Goals for v1

Dumshare v1 does not include:

- Any cloud sync, server-side storage, or account system.
- Automatic background synchronization.[file:85]
- Contributor-to-contributor synchronization; the topology is star-shaped via the organizer only.[file:85]
- Multi-device identity for the same contributor.
- Ledger recovery guarantees if a device is lost.
- Strong financial-grade security requirements; v1 security is intentionally lightweight.
- Automatic cross-currency merging of balances; currencies remain separate unless settlement logic explicitly converts them.[file:85]
- Automatic CRDT-style conflict resolution; the organizer is the human arbiter.[file:85]

## Product Decisions Locked In

The following product decisions are fixed for v1:

- Platforms: Android and iOS.
- Cloud usage: none at all.
- Identity model: one contributor maps to one device.
- Failure model: device loss is treated as unrecoverable for that local copy.
- Approval policy: organizer approval is mandatory for every contributor-submitted expense or amendment.
- Expense model: custom exact amounts and percentages are required in v1.
- Currency model: mixed currencies are allowed in a single ledger.

## Domain Rules

### Roles and permissions

The organizer can create the ledger, add participants, invite contributors, approve or reject expenses, and act as sync hub. Contributors can read the ledger on their own device, add expenses, edit expenses, and sync with the organizer. Passive participants do not use the app directly.[file:85]

### Expense rules

An expense records:

- Description.
- Currency.
- Total amount.[file:85]
- Expense date.[file:85]
- One or more payers with explicit paid amounts.[file:85]
- One or more participating people with shares defined by equal split, exact amounts, or percentages.[file:85]

All contributor-created or contributor-amended expenses are initially pending until reviewed by the organizer.[file:85]

### Balance rules

Balances are maintained per currency. For each participant and currency, the system computes credits from paid amounts, debits from owed shares, and net balances from the difference. These balances are not automatically merged across currencies.[file:85]

### Sync rules

Synchronization is manual, offline, bidirectional, and delta-based. A contributor prepares a QR-encoded sync request, the organizer scans it, a Bluetooth session starts, the contributor uploads unseen events, the organizer validates and reviews them, and then the organizer sends missing organizer-side events back to the contributor.[file:85]

### Conflict rules

Conflicting contributor edits may coexist as pending proposals. The organizer decides which proposed revision, if any, becomes approved. No automatic merge strategy is required in v1.[file:85]

## UX Principles

Dumshare should present itself in plain language. Preferred language includes “Show code,” “Scan code,” “Sync with organizer,” “Sending changes,” and “Receiving changes.” The UI should avoid technical terms like “Bluetooth,” “replica,” and “event log.” Workflows should be linear, with one clear primary action per step, visible partner identity before transfer, and simple human-readable failure messages.[file:85]

## Technical Constraints

The app must be fully usable without internet or remote infrastructure. Storage is local only. The data model should be event-sourced or event-log-based, with deterministic replay into user-visible state.[file:85]

The synchronization design must preserve:

- QR as session bootstrap.[file:85]
- Bluetooth as the transport channel for ledger deltas.[file:85]
- Checkpoint-based delta exchange.[file:85]
- Organizer-side validation and approval before state becomes approved.[file:85]

v1 security should remain lightweight, such as short-lived session tokens and optional simple signatures, without turning the product into a high-friction secure-messaging system.[file:85]

## Open Questions

These questions remain intentionally open and should be resolved during spec decomposition rather than blocked here:

- Exact mobile framework and implementation stack for Android + iOS.
- Exact event ordering strategy: vector clocks versus simpler logical clock design.[file:85]
- Exact settlement UX for mixed-currency views and conversions.[file:85]
- Exact editing rules for already-approved expenses.
- Exact invitation and identity verification UX details.

## Recommended First Spec Slices

The first spec-driven changes should likely be:

1. Core ledger, participant, and local event-log schema.
2. Ledger creation and participant management flow.
3. Contributor invitation and join flow via QR.
4. Expense creation model with custom split rules and mixed-currency support.
5. Organizer approval workflow for pending expenses.
6. QR + Bluetooth sync protocol with checkpoints.
7. Balance projection and currency-specific ledger views.

## Brief Summary

Dumshare v1 is an offline, local-first, organizer-led expense sharing app for small groups. It must support one organizer, one-device contributors, approval-gated expense sync, custom splits, and mixed currencies, all without cloud services or contributor-to-contributor sync.[file:85]
