# Phase 04 Pattern Map

## Target Files and Closest Analogs

| Target File | Role | Closest Analog | Reuse Pattern |
|-------------|------|----------------|---------------|
| `src/domain/events/types.ts` | Event contract extension | same file (`invite.*`, `participant.added`) | Extend `KnownEventType` union + add typed payload shapes with explicit string/number fields. |
| `src/domain/projections/types.ts` | Projection contract extension | same file (`LedgerEntry`, `LedgerProjection`) | Add deterministic read-model fields directly to `LedgerEntry` and projection shape; avoid implicit/derived runtime-only fields. |
| `src/domain/projections/replay.ts` | Deterministic parser + reducer behavior | same file (`parseLedgerCreatedPayload`, `parseInviteConsumedPayload`) | Add parse helper with fail-fast guards and switch branch that mutates projection only after validation passes. |
| `src/tests/expense-capture-foundations.spec.ts` | New phase invariant tests | `src/tests/contributor-onboarding-invitations.spec.ts`, `src/tests/ledger-setup-participants.spec.ts` | Mix contract string assertions + replay behavior tests + plain-language guard message assertions. |

## Concrete Pattern Snippets (for executor reference)

### Strict payload parsing pattern (`src/domain/projections/replay.ts`)

Use the existing parser style:

- Parse JSON to `Partial<T>`.
- Validate each required field type and non-empty constraints.
- Throw `new Error("Invalid payload for eventType ...")` on any mismatch.

### Deterministic guard error pattern

Use plain-language and deterministic messages as in invite flow, e.g.:

- `Only organizer or a claimed contributor device can create expenses`
- `Expense payer references unknown participant`

### Test structure pattern

In one spec file:

1. Contract surface assertions by reading source files (`readFileSync` + `toContain`).
2. Replay success path assertions for valid event payload.
3. Replay failure path assertions (`toThrow`) for malformed payload and unauthorized actor.
