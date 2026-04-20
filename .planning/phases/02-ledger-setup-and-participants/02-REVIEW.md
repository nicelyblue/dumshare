---
phase: 02-ledger-setup-and-participants
reviewed: 2026-04-20T20:31:06Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/domain/events/types.ts
  - src/domain/projections/types.ts
  - src/domain/projections/replay.ts
  - src/tests/ledger-setup-participants.spec.ts
  - src/tests/local-data-backbone.spec.ts
findings:
  critical: 0
  warning: 1
  info: 1
  total: 2
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-04-20T20:31:06Z  
**Depth:** standard  
**Files Reviewed:** 5  
**Status:** issues_found

## Summary

Reviewed Phase 02 implementation for ledger setup + participant replay behavior (plans 02-01 and 02-02). Payload validation and deterministic sequence replay are implemented correctly overall, with test coverage for invalid payloads, ordering, and reopen reconstruction.

One correctness issue remains in replay semantics: `ledger.created` can be applied multiple times and silently overwrites immutable ledger metadata.

## Warnings

### WR-01: `ledger.created` can mutate ledger identity after creation

**File:** `src/domain/projections/replay.ts:135-139`  
**Issue:** Replay applies every `ledger.created` event it encounters, so later events overwrite `title` and `settlementContext`. This breaks ledger identity immutability and allows accidental/tampered metadata mutation in reconstructed state.

**Fix:** Reject duplicate `ledger.created` events once ledger metadata has been initialized.

```ts
case "ledger.created": {
  if (projection.title !== "" || projection.settlementContext !== "") {
    throw new Error("Duplicate ledger.created event");
  }

  const payload = parseLedgerCreatedPayload(event.payloadJson);
  projection.title = payload.title;
  projection.settlementContext = payload.settlementContext;
  break;
}
```

## Info

### IN-01: Replay payload types are duplicated instead of reusing shared contracts

**File:** `src/domain/projections/replay.ts:5-20`  
**Issue:** `LedgerCreatedPayload` and `ParticipantAddedPayload` are redefined locally despite existing event payload contracts in `src/domain/events/types.ts`. This increases drift risk if contracts evolve.

**Fix:** Import and reuse shared payload types from `src/domain/events/types.ts` (or a shared contracts module) to keep compile-time alignment.

---

_Reviewed: 2026-04-20T20:31:06Z_  
_Reviewer: the agent (gsd-code-reviewer)_  
_Depth: standard_
