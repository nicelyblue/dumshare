# Coding Conventions

**Analysis Date:** 2026-05-12

## Naming Patterns

**Files:**
- Use lowercase or lowerCamelCase `.ts` file names grouped by domain/data intent, e.g. `src/domain/events/repository.ts`, `src/data/ledger/expenseDrafts.ts`, `src/data/sqlite/client.ts`.
- Use kebab-case for test file names with `.spec.ts`, e.g. `src/tests/ledger-setup-mutations.spec.ts`, `src/tests/expense-split-modes.spec.ts`.

**Functions:**
- Use `camelCase` for functions and helpers, e.g. `createEventRepository` in `src/domain/events/repository.ts`, `normalizeExpenseDraft` in `src/data/ledger/expenseDrafts.ts`, `derivePercentageShares` in `src/domain/projections/replay.ts`.

**Variables:**
- Use `camelCase` for locals/constants, e.g. `nextSequence` in `src/domain/events/repository.ts`, `SUPPORTED_CURRENCY_CODES` for exported module constants in `src/domain/currency/catalog.ts`.
- Use `UPPER_SNAKE_CASE` for shared immutable constant sets, e.g. `CURRENCY_OPTIONS` in `src/domain/currency/catalog.ts`.

**Types:**
- Use `PascalCase` and descriptive suffixes (`Payload`, `Input`, `Repository`, `Projection`), e.g. `ExpenseCreatedPayload` in `src/domain/events/types.ts`, `EventRepository` in `src/domain/events/repository.ts`, `LedgerProjection` in `src/domain/projections/types.ts`.

## Code Style

**Formatting:**
- Tool used: Not detected (no `.prettierrc*` or formatter config present).
- Key settings: Follow existing file-local style when editing (repository currently mixes single and double quotes between files, e.g. `src/data/ledger/expenseDrafts.ts` vs `src/domain/events/repository.ts`).

**Linting:**
- Tool used: Not detected (no `.eslintrc*`, `eslint.config.*`, or `biome.json`).
- Key rules: Use TypeScript compiler strictness from `tsconfig.json` (`"strict": true`, `"noEmit": true`, `"forceConsistentCasingInFileNames": true`).

## Import Organization

**Order:**
1. External packages / Node built-ins first (e.g. `node:fs`, `drizzle-orm`, `currency-codes`) in `src/tests/expense-split-modes.spec.ts` and `src/domain/events/repository.ts`
2. Blank line separation
3. Internal relative imports (domain/data modules), e.g. `../domain/projections` in `src/tests/local-data-backbone.spec.ts`

**Path Aliases:**
- Not used. Use relative imports (`../`, `../../`) consistently, e.g. `src/data/ledger/balanceDetails.ts` and `src/domain/events/repository.ts`.

## Error Handling

**Patterns:**
- Throw plain-language `Error` messages for validation/business-rule failures, e.g. `normalizeExpenseDraft` in `src/data/ledger/expenseDrafts.ts` and `listEventsAfterSequence` in `src/domain/events/repository.ts`.
- Validate early and fail fast with explicit guard clauses, e.g. payload validators in `src/domain/projections/replay.ts`.

## Logging

**Framework:** None detected (`console.*` logging not used in analyzed `src/**/*.ts`).

**Patterns:**
- Prefer deterministic return values and thrown errors over logging side effects, e.g. repository and replay modules in `src/domain/events/repository.ts` and `src/domain/projections/replay.ts`.

## Comments

**When to Comment:**
- Comments are sparse and used mainly to explain legacy/compatibility behavior in tests, e.g. fallback intent comments in `src/tests/ledger-setup-mutations.spec.ts`.

**JSDoc/TSDoc:**
- Not used in analyzed modules. Prefer strong type aliases and explicit function names over docblocks.

## Function Design

**Size:**
- Keep public orchestration functions small and delegate to helpers, e.g. `createExpenseDraftMutations` uses `normalizeExpenseDraft`, `buildExpenseCreatedEventInput`, and `sanitizeSplit` in `src/data/ledger/expenseDrafts.ts`.

**Parameters:**
- Use typed object parameters for complex inputs (`ExpenseDraftInput`, `BuildExpenseEventInput`) in `src/data/ledger/expenseDrafts.ts`.
- Use primitive parameters for narrow helpers (`dbName`, `ledgerId`) in `src/data/sqlite/client.ts` and `src/domain/events/repository.ts`.

**Return Values:**
- Return typed objects and `Promise<T>` from async boundaries, e.g. `Promise<StoredEvent[]>` in `src/domain/events/repository.ts`.
- Use `void` only for mutation actions without value output, e.g. `appendEvent(...): Promise<void>`.

## Module Design

**Exports:**
- Prefer named exports for functions/types (`export function ...`, `export type ...`) across domain/data modules, e.g. `src/domain/currency/catalog.ts`, `src/data/sqlite/client.ts`.

**Barrel Files:**
- Used selectively for domain aggregation, e.g. `src/domain/balances/index.ts` and `src/domain/projections/index.ts`.

---

*Convention analysis: 2026-05-12*
