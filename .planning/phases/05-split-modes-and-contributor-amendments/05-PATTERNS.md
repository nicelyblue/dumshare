# Phase 05 Pattern Map

## Target Files and Closest Analogs

| Target File | Role | Closest Analog | Reuse Pattern |
|-------------|------|----------------|---------------|
| `src/domain/events/types.ts` | Event contract extension for split/amendment payloads | same file (`expense.created`, `invite.*`) | Extend `KnownEventType` union and add explicit payload types with strict scalar fields. |
| `src/domain/projections/types.ts` | Projection read-model extension for owed shares + pending submissions | same file (`LedgerEntry`, `LedgerProjection`) | Add deterministic persisted fields (not transient) for downstream replay consumers. |
| `src/domain/projections/replay.ts` | Split-mode validation/derivation + amendment pending ingestion | same file (`parseExpenseCreatedPayload`, invite lifecycle guards) | Parse+validate first, then mutate projection; throw deterministic plain-language errors. |
| `src/tests/expense-split-modes.spec.ts` | Split mode contract and replay invariants | `src/tests/expense-capture-foundations.spec.ts` | Assert contract surface strings + success/failure replay behavior in one spec. |
| `src/tests/contributor-amendments.spec.ts` | Amendment submission and pending queue invariants | `src/tests/contributor-onboarding-invitations.spec.ts` | Verify role/identity guard errors and deterministic pending-state outcomes. |

## Concrete Pattern Snippets (for executor reference)

### Strict parser guard pattern (`src/domain/projections/replay.ts`)

- Parse JSON as `Partial<T>`
- Validate every required field and mode-specific branch condition
- Throw canonical error strings (e.g., `Invalid payload for eventType ...`) before projection mutation

### Deterministic arithmetic pattern

- Use integer minor units only
- For equal split, derive base share with integer division and distribute remainder in stable order
- For percentage split, use basis points and deterministic remainder handling so owed shares always sum to total

### Pending submission pattern

- Contributor amendment events are appended to dedicated pending collection
- Approved ledger entries are unchanged until organizer review flow applies decision (Phase 6)
