# Testing Patterns

**Analysis Date:** 2026-05-12

## Test Framework

**Runner:**
- Vitest `^3.2.4` (from `package.json`)
- Config: No dedicated `vitest.config.*` detected; runner options are invoked via `package.json` script (`"test": "vitest run"`).

**Assertion Library:**
- Vitest built-in `expect` API (e.g. `toEqual`, `toThrow`, `toHaveLength`, `toMatchObject`) in `src/tests/local-data-backbone.spec.ts` and `src/tests/ledger-setup-mutations.spec.ts`.

**Run Commands:**
```bash
npm test                       # Run all tests (maps to vitest run)
npx vitest --watch             # Watch mode (not scripted in package.json)
npx vitest run --coverage      # Coverage run (not scripted in package.json)
```

## Test File Organization

**Location:**
- Separate test directory under `src/tests/`.

**Naming:**
- Kebab-case behavior/spec naming with `.spec.ts`, e.g. `src/tests/expense-currency-validation.spec.ts`, `src/tests/no-inline-hex-colors.spec.ts`.

**Structure:**
```
src/
  tests/
    *.spec.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { beforeEach, describe, expect, test } from "vitest";

describe("feature-name", () => {
  beforeEach(() => {
    // reset DB/shared state
  });

  test("specific behavior", async () => {
    // arrange
    // act
    // assert
    expect(result).toEqual(expected);
  });
});
```
Pattern evidenced in `src/tests/local-data-backbone.spec.ts` and `src/tests/ledger-setup-participants.spec.ts`.

**Patterns:**
- Setup pattern: reset DB state with `clearLedgerDb(dbName)` in `beforeEach` (`src/tests/local-data-backbone.spec.ts`, `src/tests/ledger-setup-mutations.spec.ts`).
- Teardown pattern: close/reopen DB handles only when scenario requires persistence checks (`closeLedgerDb`/`openLedgerDb` in `src/tests/ledger-setup-participants.spec.ts`).
- Assertion pattern: strict deterministic checks on sequence/order and exact error messages (e.g. `toEqual([1, 2])`, `rejects.toThrow(...)`).

## Mocking

**Framework:**
- No mocking framework usage detected (`vi.mock`, `spyOn` not present in `src/**/*.ts`).

**Patterns:**
```typescript
// Use real collaborators (SQLite + repository + replay) instead of mocks
const db = openLedgerDb(dbName);
const repository = createEventRepository(db);
await repository.appendEvent(...);
const events = await repository.listEventsByLedger(ledgerId);
expect(replayLedger(events)).toEqual(expectedProjection);
```
Pattern from `src/tests/local-data-backbone.spec.ts` and `src/tests/ledger-setup-participants.spec.ts`.

**What to Mock:**
- Not applicable currently; tests prefer real local collaborators.

**What NOT to Mock:**
- Do not mock projection/event-flow core paths (`src/domain/projections/replay.ts`, `src/domain/events/repository.ts`) in current style; validate them via event fixtures and real repository operations.

## Fixtures and Factories

**Test Data:**
```typescript
function ledgerCreatedEvent(): LedgerEvent {
  return {
    id: "evt-ledger-created-1",
    ledgerId,
    eventType: "ledger.created",
    eventVersion: 1,
    occurredAt: "2026-04-22T09:00:00.000Z",
    actorDeviceId: organizerDeviceId,
    payloadJson: JSON.stringify({ title: "Phase 5 Split Modes" }),
    sequence: 1,
  };
}
```
Factory-helper pattern from `src/tests/expense-split-modes.spec.ts`.

**Location:**
- Fixtures/helpers are inlined per spec file (no centralized `fixtures/` directory detected).

## Coverage

**Requirements:**
- No explicit threshold enforcement detected (no coverage config file).

**View Coverage:**
```bash
npx vitest run --coverage
```

## Test Types

**Unit Tests:**
- Pure function/domain validation tests (e.g. `src/tests/currency-catalog.spec.ts`, `src/tests/expense-currency-validation.spec.ts`, `src/tests/expense-review-split-summary.spec.ts`).

**Integration Tests:**
- Local integration with SQLite + repository + projection replay (e.g. `src/tests/local-data-backbone.spec.ts`, `src/tests/ledger-setup-mutations.spec.ts`).

**E2E Tests:**
- Not detected.

## Common Patterns

**Async Testing:**
```typescript
await expect(setup.addParticipant({ displayName: "Alice" })).rejects.toThrow(
  "Create the ledger before adding participants",
);
```
Pattern from `src/tests/ledger-setup-mutations.spec.ts`.

**Error Testing:**
```typescript
expect(() => normalizeExpenseDraft(invalidDraft)).toThrow(
  "Select a supported expense currency",
);
```
Pattern from `src/tests/expense-currency-validation.spec.ts`.

---

*Testing analysis: 2026-05-12*
