# Dumshare v1 Architecture — Local-First, QR + Bluetooth Sync

## 1. System Overview

Dumshare is a **local-first, decentralized expense ledger** for small groups (e.g. trips).
Each participant’s phone stores a full copy of the ledger. There is **no central server**
that holds canonical data.

One participant acts as the **organizer** (ledger owner and approver). Selected
participants can become **contributors**, who keep their own ledger replica and collect
expenses offline. The organizer and contributors synchronize by physically meeting and
running a **QR-bootstrapped Bluetooth sync**:

- QR code: carries a short-lived sync session descriptor.
- Bluetooth: carries the actual ledger deltas (events).

All synchronization is:

- **Manual**: someone has to explicitly start a sync.
- **Offline**: works without internet or any remote service.
- **Star-shaped**: contributors sync only with the organizer, not with each other.

---

## 2. Roles & Permissions

### 2.1 Roles

- **Organizer**
  - Creates the ledger.
  - Adds participants as passive names.
  - Invites selected participants as contributors.
  - Approves or rejects expenses and edits.
  - Acts as the sole sync hub.

- **Contributor**
  - Joins a specific ledger via organizer-issued invitation.
  - Can add and edit expenses on their device.
  - Syncs only with the organizer.
  - Receives updates and approvals from the organizer.

- **Viewer / Passive Participant**
  - Exists in the ledger as a named participant.
  - May never install the app.
  - Can later be upgraded to contributor via invitation.

### 2.2 Permissions Matrix

| Action                                  | Organizer | Contributor | Viewer |
|-----------------------------------------|-----------|------------|--------|
| Read ledger (on device)                 | ✅        | ✅         | ❌     |
| Add expense                             | ✅        | ✅         | ❌     |
| Edit expense                            | ✅        | ✅         | ❌     |
| Approve / reject expenses               | ✅        | ❌         | ❌     |
| Invite contributor                      | ✅        | ❌         | ❌     |
| Sync as hub (with others)               | ✅        | ❌         | ❌     |
| Sync as spoke (with organizer)          | ❌        | ✅         | ❌     |


---

## 3. User Flows

### 3.1 Create Trip & Add Participants

1. Alice installs Dumshare.
2. She creates a **Trip Ledger**:
   - Title (e.g. “Germany & Czech Republic 2026”).
   - Default settlement currency (e.g. USD).
3. She adds participants as passive names:
   - Alice, Bob, Charlie, David, Erin, Frank.

At this point, Alice’s phone is the **only device** with the ledger.

---

### 3.2 Upgrade a Participant to Contributor

Scenario: David wants to track expenses for a subgroup day trip.

1. David installs Dumshare from the link Alice sent (e.g. F-Droid).
2. Alice opens the trip ledger and taps on **David** in the participant list.
3. Alice chooses **“Invite as collaborator”**.
4. Dumshare shows a **QR code** on Alice’s phone:
   - Contains ledger ID, David’s assigned member ID, and a short-lived invitation token.
5. David opens Dumshare → taps **“Join ledger”** → chooses **“Scan invite”**.
6. David scans the QR shown on Alice’s phone.
7. David’s app:
   - Verifies the token.
   - Creates a local replica of the ledger:
     - Same ledger ID.
     - Same participant list and identifiers.
     - Marks David as a **Contributor**.
8. Both devices now show the same trip ledger, with the same participants.

---

### 3.3 Daily Use: Single-Organizer Tracking

For the first days, everyone is together and Alice tracks all expenses:

1. Alice opens the ledger and adds expenses as they occur.
2. Her device updates its local ledger.
3. Other participants may not have the app at all, or have it but don’t contribute.
4. No sync is needed yet; Alice’s device is effectively the single source.

---

### 3.4 Subgroup Tracking by a Contributor

On day four, David, Bob, and Frank go off alone.

1. David opens Dumshare on his phone.
2. He selects the same trip ledger.
3. He adds subgroup expenses:
   - Restaurant, transport, etc.
   - Specifies payers (e.g. Bob, Frank) and included participants.
4. These expenses are stored as **pending events** on David’s device.
5. Alice is unaware of these subgroup expenses until a sync occurs.

---

### 3.5 Sync Contributor → Organizer (and back)

Later that day, they all meet again.

1. David says: “Let me sync with your ledger.”
2. David opens Dumshare, selects the ledger, and taps **“Sync with organizer”**.
3. David’s app:
   - Prepares a **sync request** containing:
     - Ledger ID.
     - David’s member ID.
     - David’s last-known sync checkpoint with Alice.
     - A short-lived session token.
   - Encodes this into a **QR code**.

4. Alice opens Dumshare → selects the same ledger → taps **“Receive sync”**.
5. Alice scans David’s QR code **from within the Dumshare app**.

6. The app on Alice’s device:
   - Parses the QR payload.
   - Starts a **Bluetooth server / listener** for this session.
   - Signals David’s app (via QR data) how to connect.

7. David’s app:
   - Initiates a Bluetooth connection to Alice for this session.
   - Once connected, sends:
     - All **unseen events** since the last sync checkpoint with Alice.

8. Alice’s app:
   - Receives David’s event bundle.
   - Validates the bundle (ledger ID, member ID, signatures).
   - Integrates the events into Alice’s local event log.
   - Presents a UI for **approval**:
     - Alice can approve/reject each new expense or edit.

9. After Alice’s approvals:
   - Alice’s app prepares a **response bundle** for David:
     - All **organizer-side events** David is missing since the last sync.
     - This includes:
       - Alice’s added expenses.
       - Alice’s approvals/rejections of David’s submitted events.
       - Any other ledger changes.

10. Over the same Bluetooth session:
    - Alice sends the response bundle to David.

11. David’s app:
    - Integrates the new events into its event log.
    - Updates its view of the ledger (now matches Alice’s).

12. Both devices:
    - Record a new **sync checkpoint** for “Alice ↔ David” so they know the last shared state.

Result: **Alice and David now have the same ledger, including subgroup expenses and approvals.**

---

## 4. Data & Domain Model

### 4.1 Core Entities (Logical)

- **Ledger**
  - `ledger_id`
  - `title`
  - `description`
  - `settlement_currency`
  - `created_at`
  - `created_by` (member_id / device)
  - `current_organizer` (member_id)

- **Participant**
  - `participant_id`
  - `display_name`
  - `status`: passive | contributor
  - `role`: organizer | contributor | viewer
  - `joined_at` (for contributors)

- **Expense** (logical group)
  - `expense_id`
  - `current_revision_id` (latest approved revision)
  - `status`: active | voided

- **ExpenseRevision**
  - `revision_id`
  - `expense_id`
  - `description`
  - `currency`
  - `total_amount`
  - `expense_date`
  - `payers`: list of `{ participant_id, amount }`
  - `participants`: list of `{ participant_id, share }`
  - `allocation_rule`: equal | exact | percentage
  - `status`: pending | approved | rejected
  - `proposed_by`
  - `proposed_at`
  - `reviewed_by`
  - `reviewed_at`

- **Event** (append-only log, per ledger)
  - `event_id`
  - `ledger_id`
  - `type` (see below)
  - `actor` (participant_id/device)
  - `created_at`
  - `payload` (type-specific data)
  - `signature` (optional cryptographic signature)
  - `local_seq` (per-device sequence)
  - `vector_clock` or `clock_hint` (for ordering)

- **SyncCheckpoint**
  - `checkpoint_id`
  - `ledger_id`
  - `peer_member_id` (e.g. David, from Alice’s perspective)
  - `last_event_id` or `last_clock` (represents shared frontier)
  - `updated_at`

---

### 4.2 Event Types

Minimum v1 event types:

- Ledger / participants:
  - `ledger_created`
  - `participant_added`
  - `participant_promoted_to_contributor`
  - `organizer_changed` (optional v1, can be V2)

- Expenses:
  - `expense_proposed`
  - `expense_approved`
  - `expense_rejected`
  - `expense_amended` (new proposed revision)
  - `expense_voided`

- Settlements:
  - `settlement_proposed`
  - `settlement_finalized`

- Sync:
  - `sync_checkpoint_recorded` (can be just local metadata rather than real event)

All **user-visible state** (balances, expense list, participant roles) is derived by replaying
these events in deterministic order.

---

## 5. Expense & Balance Logic

### 5.1 Expense Entry

When creating or editing an expense:

1. Step 1: **Who paid?**
   - Single or multiple payers.
   - Option to “split payment equally” between selected payers.
   - Example:
     - Total = 150 USD.
     - Payers: Alice: 75, Bob: 25, Charlie: 50.

2. Step 2: **Who took part?**
   - Choose participants involved in the expense.
   - Split modes:
     - Equal: total / number of participants.
     - Exact: exact amount per person.
     - Percentage: percentages sum to 100%.

3. The app stores the intent as an `expense_proposed` event with:
   - `payers` and `participants`.
   - `allocation_rule`.

The organizing device calculates each participant’s share based on the rule.

---

### 5.2 Balances by Currency

For each currency independently:

- For each participant `P`:
  - `credit[P, currency]` = sum of amounts `P` paid (as payer).
  - `debit[P, currency]` = sum of P’s shares (as participant).
  - `net[P, currency] = credit - debit`.

Interpretation:
- `net > 0`: P is owed money in that currency.
- `net < 0`: P owes money in that currency.

The ledger keeps these **per currency**; they are never automatically merged.

---

### 5.3 “Settle in Local Currency”

The ledger has a **settlement currency** (e.g. USD).

To show “settle in local currency”:

1. Take all `net[P, currency]` per participant.
2. For each non-settlement currency, convert using a rate effective on the settlement date.
3. Sum across all currencies to get a single net per participant in the settlement currency.
4. Compute a minimized “who pays whom” graph in settlement currency.

For per-currency settlement (no conversion), do the same minimization separately for each currency.

---

## 6. Sync Protocol (Organizer ↔ Contributor)

### 6.1 Guarantees

- **Bidirectional**: both sides send and receive events.
- **Delta-based**: only unseen events are transferred.
- **Manual**: initiated explicitly by the user (no background surprise sync).
- **Offline**: uses QR + Bluetooth, no network required.

### 6.2 Sync Request (Contributor → Organizer)

Contributor prepares:

- `ledger_id`
- `contributor_member_id`
- `last_shared_clock` (or equivalent checkpoint)
- `session_token` (short-lived)
- Optionally, a user-friendly name (“David”) and ledger name.

This is encoded as a QR payload that the organizer scans in Dumshare.

### 6.3 Bluetooth Session

After QR scan:

1. Organizer’s app prepares to accept a Bluetooth connection for this session.
2. Contributor’s app connects over Bluetooth using the advertised service/profile.
3. Once connected:
   - Contributor sends all events **that the organizer has not yet seen**, based on the last checkpoint.

### 6.4 Merge & Approval (Organizer)

Organizer’s app:

1. Validates all incoming events:
   - Correct ledger ID.
   - Correct contributor identity.
   - No structural inconsistencies.

2. Integrates events into local event log as **pending** where applicable.

3. Organizer reviews:
   - Pending expenses.
   - Pending amendments.

4. Organiser’s approvals and rejections produce new events:
   - `expense_approved`
   - `expense_rejected`

These approval events are added to the organizer’s local log.

### 6.5 Sync Response (Organizer → Contributor)

Organizer then prepares a response bundle:

- All events in organizer’s log that the contributor has not yet seen:
  - Newly created expenses.
  - Approval/rejection events.
  - Other ledger changes.

Over the same Bluetooth connection, the organizer sends this response to the contributor.

Contributor’s app integrates these events into its log and updates its checkpoint.

---

## 7. Conflict & Consistency Model

- Each device maintains an **append-only log** of events.
- Events have a deterministic ordering based on:
  - Logical / vector clocks, or
  - Timestamps + device IDs as a tiebreaker.

### 7.1 Conflicts

Because only the organizer can approve/reject and there is **no contributor-to-contributor sync**:

- Two contributors may propose conflicting edits to the same expense.
- Both are valid pending proposals.
- The organizer sees both, chooses which to approve (or none).
- The approved one becomes the latest revision; others remain rejected.

No automatic “CRDT” merge is needed because the organizer is the human arbiter.

---

## 8. UX Principles for Non-Technical Users

- Use language like:
  - “Show code” / “Scan code”
  - “Sync with Alice” / “Sync with organizer”
  - “Sending changes” / “Receiving changes”
- Avoid terms like “Bluetooth,” “pairing,” “replica,” “event log.”
- Keep workflows linear:
  - One big primary button per step.
- Show the other person’s **name and avatar** before starting transfer.
- Show progress as a simple bar or checkmarks, not technical logs.
- On failure, use human messages:
  - “Move phones closer”
  - “Keep both apps open”
  - “Try again”

---

## 9. Technical Implementation Notes (v1)

- **Local storage**: embedded DB (e.g. SQLite) with:
  - `events` table
  - `participants`
  - `expenses` (for indexing)
  - `checkpoints`
- **Sync format**:
  - Compact binary or JSON, batched events.
  - Support compression if needed (but keep v1 simple).
- **Security (v1)**:
  - Session tokens to prevent replay of old QR codes.
  - Optionally, simple signatures per event for authenticity.
  - Sessions expire automatically after short timeout.

---

## 10. Summary

Dumshare v1 is a **local-first, offline, manual-sync expense ledger** for small groups. The
organizer creates the ledger, invites contributors, and acts as the approval and sync hub.
Contributors maintain local replicas, track subgroup expenses offline, and occasionally
synchronize with the organizer by scanning a QR code that bootstraps a Bluetooth session
to exchange event deltas in both directions.

This design keeps the system:

- Understandable for non-technical travelers.
- Fully usable offline.
- Free from central servers.
- Robust against intermittent connectivity and device failures.
