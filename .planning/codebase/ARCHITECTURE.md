# Architecture

**Analysis Date:** 2026-05-12

## Pattern Overview

**Overall:** Event-sourced domain core with SQLite-backed event store and read-model snapshot builders.

**Key Characteristics:**
- Write operations append immutable events via `EventRepository` (`src/domain/events/repository.ts`) rather than updating aggregate rows.
- Read models are rebuilt by replaying ordered events in `replayLedger` (`src/domain/projections/replay.ts`).
- Application-facing services live in data-layer modules (`src/data/ledger/*.ts`) that orchestrate DB access + domain replay.

## Layers

**Storage Layer (SQLite + ORM):**
- Purpose: Persist and query raw ledger events.
- Location: `src/data/sqlite/client.ts`, `src/data/sqlite/schema.ts`
- Contains: Drizzle schema (`events` table), DB handle lifecycle, schema bootstrap.
- Depends on: `better-sqlite3`, `drizzle-orm`.
- Used by: `src/domain/events/repository.ts`, `src/data/ledger/*.ts`.

**Event Repository Layer:**
- Purpose: Provide append/list access to events with deterministic sequence ordering.
- Location: `src/domain/events/repository.ts`
- Contains: `createEventRepository`, `appendEvent`, `listEventsByLedger`, `listEventsAfterSequence`.
- Depends on: Storage layer (`src/data/sqlite/*`), event contracts (`src/domain/events/types.ts`).
- Used by: Ledger mutations/readers in `src/data/ledger/*.ts` and tests in `src/tests/*.spec.ts`.

**Domain Projection & Rules Layer:**
- Purpose: Enforce invariants and derive canonical in-memory ledger state from event history.
- Location: `src/domain/projections/replay.ts`, `src/domain/projections/types.ts`, `src/domain/balances/*.ts`, `src/domain/currency/*.ts`, `src/domain/onboarding/authority.ts`
- Contains: Event payload validation, participant/invite/expense lifecycle rules, owed-share math, balance summaries, currency validation.
- Depends on: Event type contracts and pure TypeScript utilities.
- Used by: Read snapshots and mutation precondition checks in `src/data/ledger/*.ts`.

**Application Service Layer (ledger workflows):**
- Purpose: Expose use-case-level APIs for setup, expenses, review, and dashboard/balance read models.
- Location: `src/data/ledger/ledgerMutations.ts`, `src/data/ledger/expenseDrafts.ts`, `src/data/ledger/expenseReview.ts`, `src/data/ledger/ledgerSnapshot.ts`, `src/data/ledger/balanceDetails.ts`, `src/data/ledger/ledgers.ts`
- Contains: Input normalization, error messaging, event construction, projection-driven decisions.
- Depends on: Event repository + domain replay + helpers like `resolveLatestLedgerId` (`src/data/ledger/latestLedgerId.ts`).
- Used by: External callers/tests (current executable surface in `src/tests/*.spec.ts`).

## Data Flow

**Command Flow (mutation):**

1. A mutation function validates/normalizes input (for example `normalizeExpenseDraft` in `src/data/ledger/expenseDrafts.ts`).
2. It resolves active ledger context (for example `resolveLatestLedgerId` in `src/data/ledger/latestLedgerId.ts`) and builds an `EventInput` payload.
3. It appends event(s) through `createEventRepository(...).appendEvent(...)` (`src/domain/events/repository.ts`).

**Query Flow (snapshot/read model):**

1. Snapshot loader resolves ledger and loads ordered events via `listEventsByLedger` (`src/domain/events/repository.ts`).
2. Events are replayed with `replayLedger` (`src/domain/projections/replay.ts`) into `LedgerProjection` (`src/domain/projections/types.ts`).
3. Read-specific transforms produce output DTOs (for example `buildApprovedBalanceSummary` in `src/domain/balances/summary.ts`, `loadLedgerDashboardSnapshot` in `src/data/ledger/ledgerSnapshot.ts`).

**State Management:**
- Source of truth is append-only `events` rows (`src/data/sqlite/schema.ts`).
- Derived state is ephemeral and recomputed from replay; no persistent projection tables are present.

## Key Abstractions

**LedgerEvent / EventInput:**
- Purpose: Canonical event contract for writes and replay.
- Examples: `src/domain/events/types.ts`, `src/domain/events/repository.ts`
- Pattern: Strongly-typed event envelope + JSON payload per event type.

**LedgerProjection:**
- Purpose: Single in-memory aggregate state after replay.
- Examples: `src/domain/projections/types.ts`, `src/domain/projections/replay.ts`
- Pattern: Deterministic fold over ordered events.

**Use-case Mutation Factories:**
- Purpose: Encapsulate workflow APIs by concern.
- Examples: `createLedgerSetupMutations` (`src/data/ledger/ledgerMutations.ts`), `createExpenseDraftMutations` (`src/data/ledger/expenseDrafts.ts`), `createExpenseReviewMutations` (`src/data/ledger/expenseReview.ts`)
- Pattern: Factory returns async methods; methods append events and return IDs/results.

## Entry Points

**Ledger setup mutations:**
- Location: `src/data/ledger/ledgerMutations.ts`
- Triggers: Caller invokes `createLedgerSetupMutations(...).saveLedgerSetup/addParticipant/renameParticipant/removeParticipant`.
- Responsibilities: Validate setup inputs, enforce participant constraints, append setup events.

**Expense capture mutations:**
- Location: `src/data/ledger/expenseDrafts.ts`
- Triggers: Caller invokes `createExpenseDraftMutations(...).submitExpenseDraft/deleteExpense`.
- Responsibilities: Validate expense/currency/split, generate `expense.created`/`expense.deleted` events.

**Snapshot readers:**
- Location: `src/data/ledger/ledgerSnapshot.ts`, `src/data/ledger/balanceDetails.ts`, `src/data/ledger/expenseReview.ts`, `src/data/ledger/ledgers.ts`
- Triggers: Caller invokes `loadLedgerDashboardSnapshot`, `loadBalanceDetailSnapshot`, `loadExpenseReviewSnapshot`, `listLedgers`.
- Responsibilities: Rehydrate projection and map to UI-facing snapshot DTOs.

## Error Handling

**Strategy:** Fail-fast validation with explicit `Error` throws; callers are expected to surface messages.

**Patterns:**
- Input validation guards before write (for example `normalizeLedgerSetupInput` in `src/data/ledger/ledgerMutations.ts`, `normalizeExpenseDraft` in `src/data/ledger/expenseDrafts.ts`).
- Replay-time invariant enforcement (for example unknown payer, invalid invite lifecycle, unauthorized actor checks in `src/domain/projections/replay.ts`).

## Cross-Cutting Concerns

**Logging:** No dedicated logging layer detected in `src/`; current modules rely on thrown errors and returned data.
**Validation:** Distributed across service-layer normalizers (`src/data/ledger/*.ts`) and projection payload parsers (`src/domain/projections/replay.ts`).
**Authentication:** Device-based authority checks in replay and onboarding guards (`src/domain/projections/replay.ts`, `src/domain/onboarding/authority.ts`).

---

*Architecture analysis: 2026-05-12*
