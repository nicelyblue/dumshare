# Phase 4: Expense Capture Foundations - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-21
**Phase:** 4-expense-capture-foundations
**Mode:** Auto (`--auto`)
**Areas discussed:** Expense payload contract, Multi-payer representation, Creator permissions and participant linkage, Validation and error behavior

---

## Expense payload contract

| Option | Description | Selected |
|--------|-------------|----------|
| Strict required payload | Required core fields are validated at creation. | ✓ |
| Minimal payload, enrich later | Start sparse and add details later. | |
| Progressive optional fields | Keep more fields optional in v1. | |

**User's choice:** Auto-selected recommended default (`Strict required payload`)
**Notes:** Auto mode selected first/recommended option.

## Multi-payer representation

| Option | Description | Selected |
|--------|-------------|----------|
| Inline payer breakdown on expense.created | Store payer participantId + paid amount in creation event. | ✓ |
| Separate payer events after creation | Record payers through follow-up events. | |
| Single payer now, multi-payer later | Defer multi-payer representation. | |

**User's choice:** Auto-selected recommended default (`Inline payer breakdown on expense.created`)
**Notes:** Auto mode selected first/recommended option.

## Creator permissions and participant linkage

| Option | Description | Selected |
|--------|-------------|----------|
| Organizer or claimed contributor only; payers must be known participants | Enforces role and participant integrity. | ✓ |
| Any device with local ledger copy | More permissive write model. | |
| Organizer only in Phase 4 | Contributor writes deferred. | |

**User's choice:** Auto-selected recommended default (`Organizer or claimed contributor only; payers must be known participants`)
**Notes:** Auto mode selected first/recommended option.

## Validation and error behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Fail fast with deterministic plain-language errors | Invalid data is rejected explicitly. | ✓ |
| Best-effort normalize and continue | Try to recover malformed data. | |
| Store invalid payload and filter in UI | Persist then hide/handle later. | |

**User's choice:** Auto-selected recommended default (`Fail fast with deterministic plain-language errors`)
**Notes:** Auto mode selected first/recommended option.

---

## the agent's Discretion

- Final naming for payload fields and helper functions.
- Internal module organization for validators and replay helpers.

## Deferred Ideas

None.
