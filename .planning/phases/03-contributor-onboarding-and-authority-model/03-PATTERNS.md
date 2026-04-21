# Phase 03 Pattern Map — Contributor Onboarding and Authority Model

## Target Files and Closest Analogs

| Target file | Role | Closest existing analog | Reuse pattern |
|---|---|---|---|
| `src/domain/events/types.ts` | Event contract extension | `src/domain/events/types.ts` (existing `ledger.created`, `participant.added`) | Extend `KnownEventType` union + add payload types with explicit scalar fields |
| `src/domain/projections/types.ts` | Projection shape extension | `src/domain/projections/types.ts` (`participants`, `title`, `settlementContext`) | Add strongly typed arrays/maps for invite lifecycle and contributor device claims |
| `src/domain/projections/replay.ts` | Deterministic event replay + validation | `src/domain/projections/replay.ts` (`parse*Payload`, switch dispatch, strict default error) | Add dedicated parser functions + `switch` branches; throw on malformed payload/invalid transitions |
| `src/tests/contributor-onboarding-invitations.spec.ts` | Phase contract/replay tests | `src/tests/ledger-setup-participants.spec.ts` | Use Vitest domain-level tests with deterministic replay assertions and invalid payload guards |
| `src/domain/onboarding/authority.ts` | Policy guard helpers | `src/domain/projections/replay.ts` invariants style | Keep pure functions with explicit input/output and deterministic error messages |
| `src/tests/contributor-authority-policy.spec.ts` | Authority policy tests | `src/tests/ledger-setup-participants.spec.ts` style | Assert allow/deny decisions by scenario; no network/runtime dependencies |

## Concrete Code Patterns to Mirror

1. **Payload parser guard shape**
   - Use small `parseXPayload(payloadJson)` functions that validate required keys/types.
   - Throw `new Error("Invalid payload for eventType <event>")` when malformed.

2. **Deterministic replay ordering**
   - Keep `const ordered = [...events].sort((left, right) => left.sequence - right.sequence)` before applying.

3. **Strict event dispatch**
   - Extend `switch (event.eventType)` with new explicit branches.
   - Preserve `default: throw new Error(\`Unsupported eventType: ${event.eventType}\`)`.

4. **Test style**
   - Follow current phase test pattern: direct `replayLedger([...])` assertions + deterministic rerun assertion + negative case assertions via `toThrow(...)`.
