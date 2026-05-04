# Phase 8: Per-Currency Balances and Settlement Readiness - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-04-22
**Phase:** 08-per-currency-balances-and-settlement-readiness
**Areas discussed:** Balance source

---

## Balance source

| Option | Description | Selected |
|--------|-------------|----------|
| Approved only | Use `projection.entries` only; aligns with approval gate and avoids untrusted pending data in balances. | ✓ |
| Approved + pending | Include pending contributor submissions in computed balances immediately. | |
| Two modes | Keep approved canonical and show separate provisional preview including pending. | |

**User's choice:** Approved only
**Notes:** Approved ledger state is authoritative for settlement-facing balance output.

---

## Pending amendment handling

| Option | Description | Selected |
|--------|-------------|----------|
| Keep approved state | Continue using currently approved expense values until amendment is explicitly approved. | ✓ |
| Show pending override | Temporarily compute balances with proposed amendment while pending. | |
| You decide | Delegate pending-amendment behavior to implementation. | |

**User's choice:** Keep approved state
**Notes:** Pending amendment proposals must not change approved balances.

---

## Rejected submissions treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Exclude from balances | Rejected submissions never affect computed balances and stay in review history only. | ✓ |
| Show in provisional math | Allow rejected items in provisional view before final state. | |
| You decide | Delegate rejected-item handling to implementation. | |

**User's choice:** Exclude from balances
**Notes:** Rejected items remain audit-only artifacts.

---

## Approved-state qualifier UX

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, explicit note | Show plain-language note that balances reflect approved entries only when pending exists. | ✓ |
| No extra note | Show balances without qualifier text. | |
| You decide | Delegate qualifier behavior to implementation. | |

**User's choice:** Yes, explicit note
**Notes:** The balances screen should surface approved-only semantics in plain language when pending submissions exist.

---

## the agent's Discretion

- Exact output data shape for aggregated per-currency balances.
- Exact wording of qualifier copy.
- Internal helper structure for balance derivation.

## Deferred Ideas

None.
