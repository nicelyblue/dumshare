# Architecture Research

**Domain:** Offline, organizer-led mobile expense sharing (local-first, no cloud)
**Researched:** 2026-04-20
**Confidence:** MEDIUM-HIGH

## Standard Architecture

### System Overview

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                         Mobile App (each device)                           │
├────────────────────────────────────────────────────────────────────────────┤
│  UI Layer                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌────────────────────┐ │
│  │ Expense Entry UI    │  │ Sync Session UI     │  │ Organizer Review UI│ │
│  └──────────┬──────────┘  └──────────┬──────────┘  └──────────┬─────────┘ │
├─────────────┴─────────────────────────┴─────────────────────────┴──────────┤
│  Domain/Application Layer                                                    │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ Command Handlers + Validation + Approval Policy Engine                │  │
│  │ (append-only events, role checks, expense/split invariants)           │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────────┤
│  Sync Layer                                                                 │
│  ┌──────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐ │
│  │ QR Bootstrap     │  │ Session Replicator   │  │ Conflict Classifier  │ │
│  │ (pairing token)  │  │ (checkpointed delta) │  │ (auto/apply/review)  │ │
│  └────────┬─────────┘  └──────────┬───────────┘  └──────────┬───────────┘ │
├───────────┴────────────────────────┴──────────────────────────┴────────────┤
│  Local Data Layer                                                            │
│  ┌────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐ │
│  │ Event Log Store    │ │ Read Model Store     │ │ Sync Metadata Store  │ │
│  │ (immutable events) │ │ (projected balances) │ │ (per-peer checkpoint)│ │
│  └────────────────────┘ └──────────────────────┘ └──────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘

Topology: contributor devices ⇄ organizer device only (star). No contributor⇄contributor sync.
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **UI Workflows** | Collect user intent and display status in plain language (“Show code”, “Scan code”, “Sending changes”) | Native screens + local state machine |
| **Command Layer** | Convert UI actions into validated domain commands | Use-case/handler pattern |
| **Event Store** | Persist immutable domain events in causal order | SQLite table(s), append-only IDs |
| **Projection Engine** | Build current ledger views (balances, pending approvals, participants) from event log | Deterministic reducers + materialized views |
| **Approval Engine (Organizer only authority)** | Accept/reject contributor proposals before they affect approved ledger | Rule engine + explicit approval events |
| **Sync Session Manager** | Orchestrate QR bootstrap + transport lifecycle + retries | Session state machine |
| **Delta Replicator** | Exchange unseen events using checkpoints/watermarks | “changes feed + revs diff” style protocol |
| **Identity & Invitation Module** | Bind contributor identity to one device and group membership | Invite token + local identity key |
| **Audit/Recovery Module** | Rebuild projections, detect corruption, support exports/backups | Reprojection tool + integrity checks |

## Recommended Project Structure

```text
src/
├── app/                      # Mobile screens and navigation
│   ├── organizer/            # Review queue, participant management
│   ├── contributor/          # Expense entry and pending status
│   └── sync/                 # QR + transfer progress + error UX
├── domain/                   # Core business logic (pure, test-heavy)
│   ├── commands/             # CreateExpense, AmendExpense, Approve, Reject...
│   ├── events/               # Event schema/versioning
│   ├── policies/             # Role/approval/currency invariants
│   └── projections/          # Ledger read models from events
├── sync/                     # Replication protocol and transport adapters
│   ├── protocol/             # Handshake, checkpoint, delta envelope
│   ├── qr/                   # Bootstrap payload encode/decode
│   ├── transport/            # Bluetooth / Multipeer abstraction
│   └── conflict/             # Classification + organizer routing
├── data/                     # Persistence adapters
│   ├── sqlite/               # Event log + projection tables + migrations
│   └── repository/           # Storage interfaces
├── security/                 # Signing, invite verification, local secrets
└── tests/                    # Domain/sync/property tests + fixtures
```

### Structure Rationale

- **domain/** is isolated so approval, splitting, and currency invariants stay deterministic and easy to test.
- **sync/** is separate from transport so protocol logic can be reused across Android/iOS transport differences.
- **data/** isolates storage details from business logic, allowing migration strategy changes without rewriting domain code.

## Architectural Patterns

### Pattern 1: Event-Sourced Ledger with Deterministic Projections

**What:** Write only immutable events; derive all user-visible ledger state from projection reducers.
**When to use:** Local-first, offline workflows where auditability and replay matter.
**Trade-offs:**
- ✅ Strong audit trail, easier sync and merge primitives.
- ✅ Recovery possible by replaying events.
- ❌ Requires careful event schema evolution and projection performance tuning.

**Example:**
```typescript
type Event =
  | { t: "expense_proposed"; expenseId: string; by: string; payload: ExpenseDraft }
  | { t: "expense_approved"; expenseId: string; by: string }
  | { t: "expense_rejected"; expenseId: string; by: string; reason?: string };

function reduce(state: LedgerView, e: Event): LedgerView {
  switch (e.t) {
    case "expense_proposed": return addPending(state, e);
    case "expense_approved": return movePendingToApproved(state, e.expenseId);
    case "expense_rejected": return markRejected(state, e.expenseId);
  }
}
```

### Pattern 2: Approval-Gated Two-Lane Model (Pending vs Approved)

**What:** Maintain explicit separate states for proposed (pending) and organizer-approved ledger entries.
**When to use:** Trust model with a single human arbiter (organizer).
**Trade-offs:**
- ✅ Prevents unreviewed contributor data from mutating canonical balances.
- ✅ Clear UX (“awaiting organizer approval”).
- ❌ More state transitions and UI states to manage.

### Pattern 3: Checkpointed Delta Replication Session

**What:** During a manual sync session, exchange only unseen events since each peer checkpoint.
**When to use:** Intermittent in-person sync with constrained bandwidth and battery.
**Trade-offs:**
- ✅ Bounded transfer size; resumable after interruption.
- ✅ Scales with change volume, not database size.
- ❌ Requires robust checkpoint and idempotency semantics.

## Data Flow

### Request Flow (local command)

```text
[User action: add expense]
        ↓
[UI form]
        ↓
[Command handler validates role/splits/currency]
        ↓
[Append event to local event log]
        ↓
[Projector updates read models]
        ↓
[UI rerenders from read model]
```

### Sync Flow (explicit direction)

```text
Contributor Device                                  Organizer Device
------------------                                  ----------------
1) Generate sync request QR  --------------------->  Scan + validate invite/session
2) Open transport channel      <------------------>  Open transport channel
3) Send contributor deltas     --------------------->  Ingest as pending proposals
4) Organizer reviews pending   (local only)          Approve/Reject events appended
5) Send organizer-side deltas  <---------------------  (approvals, participant updates)
6) Contributor applies events  (local projection)

Direction rule: contributor→organizer carries proposals; organizer→contributor carries authoritative outcomes.
```

### Key Data Flows

1. **Expense Proposal Flow:** Contributor command → pending event → organizer approval event → approved ledger projection.
2. **Membership Flow:** Organizer invite event → contributor identity bind → future sync authorization checks.
3. **Recovery Flow:** On startup/migration, read full event log → rebuild projections → verify checkpoint consistency.

## Component Boundaries (What Talks to What)

| Boundary | Allowed Communication | Not Allowed |
|----------|------------------------|-------------|
| UI → Domain | Commands only (no direct SQL) | UI mutating storage directly |
| Domain → Data | Repository interfaces only | Domain calling platform transport APIs |
| Sync Protocol → Transport | Adapter interface (`send`, `receive`, `close`) | Business rules in transport layer |
| Sync Protocol → Domain | Ingest/emit domain events | Sync writing read models directly |
| Organizer Approval Engine → Projection | Append approval events then reproject | Mutating balances outside event pipeline |

## Suggested Build Order (for roadmap dependencies)

1. **Core Domain + Event Schema + Local Event Store**
   - Dependency base for everything else.
   - Deliverable: create/amend expense events, replay into basic ledger projection.

2. **Projection Engine + Pending/Approved Read Models**
   - Enables organizer-approval semantics and usable ledger screens.
   - Deliverable: clear separation of pending vs approved balances.

3. **Invitation + Identity Binding (single-device contributor)**
   - Needed before safe sync can exist.
   - Deliverable: organizer-issued invite flow and local role enforcement.

4. **Manual Sync Session Orchestrator (QR bootstrap + transport abstraction)**
   - Build session state machine before implementing full replication.
   - Deliverable: reliable session establishment and teardown.

5. **Checkpointed Delta Replicator + Idempotent Apply**
   - Depends on stable event schema and identity model.
   - Deliverable: contributor→organizer and organizer→contributor delta exchange.

6. **Organizer Review Queue + Approval/Reject Workflow**
   - Depends on synced pending events.
   - Deliverable: authoritative approvals propagating back to contributors.

7. **Resilience Layer (retry, interruption recovery, re-projection tooling, export/backups)**
   - Hardens v1 for field usage.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-100 users (typical v1 groups are much smaller) | Single local SQLite DB + straightforward projections is enough |
| 100-10k users (across many independent groups/devices) | Keep per-group event streams partitioned; optimize projection indexes; cap sync batch sizes |
| 10k+ users (product-level install base, still local-only) | Focus on migration tooling, telemetry-free diagnostics, and protocol compatibility/versioning |

### Scaling Priorities

1. **First bottleneck:** Projection rebuild time as event logs grow → use incremental projections + periodic snapshots.
2. **Second bottleneck:** Sync session latency for large backlogs → chunked delta transfer + checkpoint resume.

## Anti-Patterns

### Anti-Pattern 1: Treating Contributor Entries as Immediately Canonical

**What people do:** Directly include contributor-submitted expenses in balances before organizer approval.
**Why it's wrong:** Violates trust model, creates reconciliation churn, and confuses users.
**Do this instead:** Keep strict pending lane until explicit `approved` event arrives.

### Anti-Pattern 2: Syncing Full Database Dumps Every Session

**What people do:** Export/import full local DB for every in-person sync.
**Why it's wrong:** Slow, battery-heavy, and fragile to partial failures.
**Do this instead:** Checkpointed delta replication with idempotent event apply.

### Anti-Pattern 3: Coupling Protocol to Bluetooth API Details

**What people do:** Hard-code business sync logic into platform-specific transport callbacks.
**Why it's wrong:** Blocks cross-platform parity and makes recovery logic untestable.
**Do this instead:** Transport adapter boundary; protocol operates on generic message frames.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| None (v1 intentional) | N/A | Preserve offline/local-first guarantees |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| App UI ↔ Domain | Command + query interfaces | Keeps business invariants centralized |
| Sync Protocol ↔ Domain | Event ingest/egress APIs | Enables deterministic test fixtures |
| Sync Protocol ↔ Transport | Adapter contract | Allows Android/iOS transport differences |

## Sources

- Apache CouchDB Replication Protocol (changes feed, checkpoints, revs
- Context7 docs for Apache CouchDB (`/_changes`, `/_revs_diff`, replication flow) — /apache/couchdb **[HIGH]**
- SQLite WAL documentation (concurrency, checkpoint behavior, WAL pitfalls, updated 2026-03-20) — https://www.sqlite.org/wal.html **[HIGH]**
- Context7 SQLite WAL configuration snippets (`journal_mode=WAL`, autocheckpoint APIs) — /websites/sqlite_docs **[HIGH]**
- Apple Multipeer Connectivity overview (`MCSession`, browser/advertiser phases, background behavior, Bonjour service declaration) — /websites/developer_apple via Context7 **[MEDIUM-HIGH]**
- Android Bluetooth permission/API behavior (`BLUETOOTH_CONNECT` for Android 12+) — /websites/developer_android via Context7 **[MEDIUM]**
- Ink & Switch “Local-first software” (architectural principles for local-first/offline sync) — https://www.inkandswitch.com/essay/local-first/ **[MEDIUM]**

---
*Architecture research for: organizer-led offline expense sharing*
*Researched: 2026-04-20*
