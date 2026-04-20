# Pitfalls Research

**Domain:** Offline organizer-led mobile expense sharing (travel groups)
**Researched:** 2026-04-20
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Using floating-point math for money and splits

**What goes wrong:**
Balances drift by small amounts (e.g., 0.01 differences), split totals do not exactly match expense totals, and approval disputes increase because users see “impossible” rounding outcomes.

**Why it happens:**
Teams use default `float/double` math in app/business logic and persistence. IEEE-754 approximation errors accumulate during multi-payer + percentage split workflows.

**How to avoid:**
- Store money as integer minor units (e.g., cents) per currency.
- Define explicit rounding/allocation policy (e.g., “largest remainder” to a deterministic participant order).
- Enforce invariant checks at write time: `sum(split_allocations) == total_amount_minor`.
- Snapshot the exact allocation result in the event payload so replay is deterministic.

**Warning signs:**
- Frequent “off by 0.01” bug reports.
- Same expense renders different participant amounts after re-open/sync.
- Approval queue shows repeated reject/re-submit cycles for rounding complaints.

**Phase to address:**
Phase 1 — Ledger model and arithmetic invariants.

---

### Pitfall 2: Treating approved ledger state as mutable records instead of immutable events

**What goes wrong:**
Offline replicas diverge, historical reasoning becomes impossible, and conflict handling becomes “last write wins by accident.” Reconciliation later requires rewrites.

**Why it happens:**
CRUD-first schemas are faster to prototype than event logs, so teams patch mutable rows and lose causal history.

**How to avoid:**
- Make all business changes append-only events.
- Build deterministic projections for user-visible state (pending/approved/rejected, balances).
- Include schema version + event type versioning from day one.
- Add replay tests: full replay from empty DB must produce identical state.

**Warning signs:**
- “Hotfix” SQL/data migration scripts that rewrite approved data.
- Different devices show different balances for same checkpoint.
- Team cannot answer “which change caused this balance?” from stored data.

**Phase to address:**
Phase 1 — Event model, projection rules, replay tests.

---

### Pitfall 3: Weak contributor identity binding during QR invitation

**What goes wrong:**
Duplicate contributor identities, accidental account hijack on shared devices, or unauthorized devices injecting events into organizer review queue.

**Why it happens:**
Projects treat QR as plain identifier exchange without one-time invitation nonce, expiry, or organizer-side binding confirmation.

**How to avoid:**
- Use one-time invitation tokens with expiry and organizer signature.
- Bind invitation to contributor device key on first successful pairing.
- Reject reuse of consumed invitation tokens.
- Show explicit organizer confirmation screen before binding is finalized.

**Warning signs:**
- Same person appears multiple times after re-invite.
- Organizer sees unknown device names in sync list.
- Support/debug logs show token reuse attempts.

**Phase to address:**
Phase 2 — Identity, invitation, and trust bootstrap.

---

### Pitfall 4: Assuming Bluetooth sync is atomic and always reliable

**What goes wrong:**
Partial transfers produce duplicate or missing events; app appears “synced” but replicas differ. Field failures spike in noisy travel environments.

**Why it happens:**
Teams model sync as one shot request/response instead of resumable chunked protocol with acknowledgements and idempotency.

**How to avoid:**
- Define sync protocol with: checkpoint negotiation, chunk IDs, per-chunk ACK, final commit marker.
- Make ingest idempotent by event ID (safe re-send).
- Persist sync session state for resume after app/background interruption.
- Add fault-injection tests (disconnect mid-transfer, duplicate chunks, reordered chunks).

**Warning signs:**
- Intermittent “sync complete” followed by changed pending counts.
- Manual retried sync creates duplicate pending items.
- Higher failure rates on older Android/iOS devices.

**Phase to address:**
Phase 2 — Transport protocol and reliability harness.

---

### Pitfall 5: Mixing transport acceptance with business approval

**What goes wrong:**
Contributor submissions become effectively auto-approved on import, bypassing organizer governance and damaging trust in final ledger.

**Why it happens:**
Pipeline conflates “event received successfully” with “expense accepted as approved state.”

**How to avoid:**
- Separate states explicitly: `received` → `pending_review` → `approved|rejected`.
- Keep approval decision as explicit organizer-authored event.
- Projection logic must exclude unapproved contributor events from approved balances.

**Warning signs:**
- Organizer cannot explain why an expense appeared as approved.
- No clear audit trail for who approved/rejected and when.
- Rejected expense still impacts balance totals.

**Phase to address:**
Phase 3 — Approval workflow and projection correctness.

---

### Pitfall 6: Missing deterministic conflict policy for amendments

**What goes wrong:**
Contributor amends an expense while organizer reviews older version; resulting state is ambiguous, causing accidental overwrites or silent data loss.

**Why it happens:**
Amendments are treated as in-place edits rather than new proposals linked to a specific prior approved revision.

**How to avoid:**
- Model amendments as new proposal events referencing target expense revision.
- Reject/flag stale proposals when base revision no longer current.
- Require organizer to choose explicit resolution path (approve newest, reject stale, merge manually).

**Warning signs:**
- “My edit disappeared” reports after sync.
- Multiple pending proposals for same expense with unclear order.
- Approvals produce non-deterministic results across devices.

**Phase to address:**
Phase 3 — Conflict semantics and review UX.

---

### Pitfall 7: Incorrect multi-currency settlement model (forced cross-currency netting)

**What goes wrong:**
Users dispute balances because implicit FX conversion uses unknown rates/timestamps; approved ledger becomes socially untrusted.

**Why it happens:**
Teams collapse balances into one currency too early for “simple UI,” ignoring trip reality and FX volatility.

**How to avoid:**
- Maintain balances per currency as first-class ledger outputs.
- If conversion is introduced later, require explicit rate source + timestamp + user confirmation.
- Keep converted suggestions separate from canonical per-currency balances.

**Warning signs:**
- Frequent “why do I owe this amount?” complaints in mixed-currency groups.
- Users screenshot/manual-calc outside app to verify totals.
- Inability to reproduce settlement output from stored data.

**Phase to address:**
Phase 1 (model) and Phase 3 (settlement UX).

---

### Pitfall 8: Underestimating mobile OS BLE/background constraints

**What goes wrong:**
Sync seems stable in dev but fails in production due to permission friction, scan throttling/coalescing, app suspension, and short background execution windows.

**Why it happens:**
Teams test mostly foreground happy paths on a few devices and miss platform-specific constraints.

**How to avoid:**
- Design sync UX as foreground, user-driven session (already aligned with project scope).
- Implement explicit permission/state preflight checks before session start.
- Keep background behavior minimal and resumable; never rely on long-running background BLE jobs.
- Run compatibility matrix tests across Android/iOS versions and vendors.

**Warning signs:**
- Device-specific “cannot find organizer” or “session dropped” reports.
- iOS background callbacks not arriving reliably.
- Android users stuck in repeated permission prompts.

**Phase to address:**
Phase 2 — Mobile transport integration and device-matrix QA.

---

### Pitfall 9: No local corruption detection/recovery in local-only architecture

**What goes wrong:**
Single-device storage corruption or bad migration can irreversibly lose contributor history; with no cloud backup in v1, this becomes catastrophic.

**Why it happens:**
Focus on sync features delays integrity checks, migration safety, and export/import recovery tooling.

**How to avoid:**
- Use durable SQLite settings (avoid unsafe journal modes).
- Add startup integrity checks and migration checksum verification.
- Provide manual encrypted export/import backups for organizer device.
- Keep destructive migrations gated behind pre-migration backup creation.

**Warning signs:**
- Post-upgrade crashes around DB open/migration paths.
- “Database malformed” or unexpected empty ledger on app restart.
- No tested recovery runbook for corrupted local DB.

**Phase to address:**
Phase 4 — Reliability hardening and recovery operations.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using doubles for amounts | Faster coding, fewer custom types | Rounding bugs and trust loss in balances | Never |
| Directly mutating approved expense rows | Simple CRUD implementation | No auditability; impossible deterministic replay | Never |
| Syncing without idempotent event IDs | Smaller initial protocol | Duplicate/missing events after retries | Never |
| Skipping invitation token expiry | Less identity code upfront | Token replay and accidental re-binding | Never |
| Single “synced” boolean state | Simple UI state machine | Impossible to debug partial transfer failures | Only throwaway prototype |

## Integration Gotchas

Common mistakes when connecting to platform services and protocols.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Android BLE permissions | Assuming pre-Android-12 permission model is enough | Handle Android 12+ `BLUETOOTH_SCAN` + `BLUETOOTH_CONNECT` (and legacy fallbacks where needed) with runtime checks before scan/connect |
| iOS BLE background behavior | Expecting foreground BLE behavior in background | Treat background windows as constrained; resume explicitly and keep sessions user-driven |
| BLE scanning | Expecting duplicate/continuous discovery events consistently | Design for coalesced discoveries and explicit rescan/retry UX |
| SQLite durability | Choosing fast but unsafe journal config | Prefer durable journal/sync configuration for ledger integrity |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Reprojecting full event log on every UI render | Janky screens on large trips | Incremental projections + cached checkpoints | ~1k+ events on mid-range phones |
| Monolithic Bluetooth payload transfer | Timeouts/disconnects on weak radios | Chunking + ACK + resume | Large history sync (hundreds/thousands of events) |
| Unbounded pending review list queries | Slow organizer review screen | Indexed status/timestamp queries + pagination | Large groups with frequent edits |

## Security Mistakes

Domain-specific security issues beyond general app security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Unsigned QR invitations | Device impersonation / fake joins | Sign invitations and verify organizer identity before binding |
| Trusting BLE device name for identity | Easy spoofing/confusion | Bind to cryptographic device key after invitation handshake |
| Storing invitation secrets in plaintext logs | Token leakage and replay | Redact sensitive fields and store only hashed/token IDs in logs |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Exposing distributed-systems jargon (“replica”, “delta”, “conflict tree”) | Users get confused and mistrust flow | Plain language: “Show code”, “Scan code”, “Sending changes”, “Review changes” |
| Ambiguous approval states | Users can’t tell what counts in balances | Always show status chips: Pending / Approved / Rejected |
| No clear recovery when sync fails | Users abandon sync and duplicate data manually | Provide “Resume sync”, “Retry safely”, and explicit last successful checkpoint |

## "Looks Done But Isn’t" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Expense splitting:** deterministic rounding/allocation tested across equal/exact/percent + multi-payer paths.
- [ ] **Approval flow:** imported contributor changes never affect approved balances before organizer decision.
- [ ] **Sync:** mid-transfer disconnect tested with idempotent retry and no duplicates.
- [ ] **Identity:** invitation replay and duplicate-device binding blocked.
- [ ] **Multi-currency:** no implicit cross-currency netting in canonical balances.
- [ ] **Local durability:** migration rollback + corrupted DB recovery path tested.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Float-based money bugs shipped | HIGH | Freeze release; migrate to integer minor units; recompute projections from events; publish reconciliation notes |
| Partial/duplicate sync ingestion | MEDIUM | Re-run idempotent reconciliation from last known checkpoint; dedupe by event ID; reproject state |
| Invitation token abuse / duplicate identity | MEDIUM | Revoke affected contributor binding; rotate organizer invitation secret; re-invite with one-time token |
| Local DB corruption on organizer device | HIGH | Restore latest manual backup/export; verify integrity; replay recent contributor sync if available |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Money precision and split invariants | Phase 1 | Property tests confirm split sums and deterministic replay equality |
| Append-only events + deterministic projection | Phase 1 | Full replay from genesis equals live state snapshot |
| Invitation/device identity binding | Phase 2 | Security tests block token reuse and unknown device binding |
| Resumable idempotent Bluetooth sync | Phase 2 | Fault-injection suite passes disconnect/retry/reorder scenarios |
| Approval-state separation from transport | Phase 3 | QA proves pending events never affect approved balances |
| Amendment conflict policy | Phase 3 | Tests for stale proposal handling and deterministic organizer resolution |
| Multi-currency canonical accounting | Phase 1 & 3 | No cross-currency merge in canonical balance outputs |
| Local corruption/recovery readiness | Phase 4 | Migration rollback drill + restore drill pass on real devices |

## Sources

- Project constraints and scope: `.planning/PROJECT.md` (HIGH)
- CouchDB conflict model and deterministic winner behavior: https://docs.couchdb.org/en/stable/replication/conflicts.html (HIGH)
- PouchDB conflict handling patterns (“immediate” vs “eventual” conflicts; delta/event style): https://pouchdb.com/guides/conflicts.html (MEDIUM)
- SQLite floating-point precision caveats and exact arithmetic guidance: https://sqlite.org/floatingpoint.html (HIGH)
- SQLite journaling/durability caveat (MEMORY mode risk): https://sqlite.org/pragma.html#pragma_journal_mode (HIGH)
- Apple Core Bluetooth background constraints and execution windows: https://developer.apple.com/library/archive/documentation/NetworkingInternetWeb/Conceptual/CoreBluetooth_concepts/CoreBluetoothBackgroundProcessingForIOSApps/PerformingTasksWhileYourAppIsInTheBackground.html (MEDIUM; archived but official)
- BLE mobile integration behavior from widely used cross-platform libraries (permission patterns, scan/connect constraints):
  - https://dotintent.github.io/react-native-ble-plx/#permissions (MEDIUM)
  - https://pub.dev/packages/flutter_blue_plus (MEDIUM)

### Confidence Notes

- **HIGH:** Money precision, event/conflict modeling, and SQLite durability pitfalls are strongly supported by authoritative docs.
- **MEDIUM:** Mobile BLE operational pitfalls are well-supported by Apple docs and mature library docs; some Android-specific operational details lacked direct access to current official Android pages in this session.
- **LOW:** None asserted as hard recommendations.

---
*Pitfalls research for: offline organizer-led mobile expense sharing*
*Researched: 2026-04-20*
