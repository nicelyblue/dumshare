---
status: investigating
trigger: "Investigate and fix two setup flow bugs: (1) adding participant from roster before ledger creation throws uncaught promise `Create the ledger before adding participants`; UX should prevent/handle this cleanly in setup flow. (2) clicking create ledger throws `Setup error Invalid payload for eventType ledger.created`. Trace event payload schema vs emitted payload, fix mismatch, and ensure setup sequence works end-to-end."
created: "2026-05-05"
updated: "2026-05-05"
---

## Symptoms

- Expected behavior: Setup flow should prevent participant add before ledger creation and create ledger successfully.
- Actual behavior: Participant add before ledger create throws uncaught promise; create ledger throws setup payload validation error.
- Error messages: `Create the ledger before adding participants`; `Setup error Invalid payload for eventType ledger.created`.
- Timeline: Current behavior.
- Reproduction: In setup flow attempt add participant from roster before ledger exists; click create ledger.

## Current Focus

- hypothesis: Setup UI allows participant action before preconditions and ledger.created event payload emitted by setup flow does not match schema.
- test: Trace setup flow handlers and ledger.created schema/emitter; add targeted tests.
- expecting: Find missing guard/error handling and a field mismatch between ledger.created payload schema and emitted payload.
- next_action: gather initial evidence

## Evidence

## Eliminated

## Resolution

- root_cause:
- fix:
- verification:
- files_changed:
