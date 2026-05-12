# Codebase Structure

**Analysis Date:** 2026-05-12

## Directory Layout

```text
dumshare/
├── src/                    # TypeScript application/domain/data code
│   ├── data/               # SQLite integration and ledger-facing service modules
│   │   ├── sqlite/         # DB client and schema
│   │   └── ledger/         # Mutation and snapshot APIs built on event replay
│   ├── domain/             # Event contracts, replay engine, balances, currency, authority logic
│   └── tests/              # Vitest specification suites
├── docs/                   # Project docs (for example styling guidance)
├── frontend mock/          # Static HTML product mockups
├── openspec/               # OpenSpec artifacts/spec workflow files
├── .planning/              # GSD planning artifacts (includes codebase maps)
├── drizzle.config.ts       # Drizzle schema generation config
├── tsconfig.json           # TypeScript compiler config
└── package.json            # Scripts and dependency manifest
```

## Directory Purposes

**`src/data/sqlite/`:**
- Purpose: Database infrastructure for event persistence.
- Contains: DB lifecycle helpers (`openLedgerDb`, `clearLedgerDb`) and event table schema.
- Key files: `src/data/sqlite/client.ts`, `src/data/sqlite/schema.ts`

**`src/domain/events/`:**
- Purpose: Event contracts + repository abstraction.
- Contains: Event payload/type definitions and append/list repository implementation.
- Key files: `src/domain/events/types.ts`, `src/domain/events/repository.ts`

**`src/domain/projections/`:**
- Purpose: Deterministic replay into aggregate ledger state.
- Contains: `LedgerProjection` model and `replayLedger` fold logic.
- Key files: `src/domain/projections/types.ts`, `src/domain/projections/replay.ts`

**`src/data/ledger/`:**
- Purpose: Feature-level APIs consumed by app/UI layers.
- Contains: Ledger setup, expense mutation/review flows, snapshots, and active-ledger helpers.
- Key files: `src/data/ledger/ledgerMutations.ts`, `src/data/ledger/expenseDrafts.ts`, `src/data/ledger/ledgerSnapshot.ts`

**`src/tests/`:**
- Purpose: Behavior + contract tests around replay, mutations, balances, and conventions.
- Contains: Vitest `*.spec.ts` files.
- Key files: `src/tests/local-data-backbone.spec.ts`, `src/tests/ledger-setup-mutations.spec.ts`, `src/tests/expense-capture-foundations.spec.ts`

## Key File Locations

**Entry Points:**
- `src/data/ledger/ledgerMutations.ts`: Ledger setup mutation API factory.
- `src/data/ledger/expenseDrafts.ts`: Expense create/delete mutation API factory.
- `src/data/ledger/ledgerSnapshot.ts`: Dashboard snapshot loader.

**Configuration:**
- `package.json`: npm scripts (`test`, `db:push`) and dependency versions.
- `tsconfig.json`: strict TS settings and included source globs.
- `drizzle.config.ts`: Drizzle schema path/output and SQLite DB target path.

**Core Logic:**
- `src/domain/projections/replay.ts`: Event replay engine + domain invariants.
- `src/domain/events/repository.ts`: Event storage query/write abstraction.
- `src/domain/balances/derive.ts`: Derived per-currency balance calculations.

**Testing:**
- `src/tests/*.spec.ts`: All current test suites are centralized under `src/tests/`.

## Naming Conventions

**Files:**
- Domain and data modules use `camelCase.ts` (for example `latestLedgerId.ts`, `ledgerSnapshot.ts`).
- Tests use kebab-case `*.spec.ts` (for example `expense-currency-validation.spec.ts`).

**Directories:**
- Feature/concern directories are lowercase nouns (`src/domain/balances/`, `src/data/ledger/`).

## Where to Add New Code

**New Feature:**
- Primary code: Add orchestrating API in `src/data/ledger/` and domain rules in `src/domain/`.
- Tests: Add a corresponding `*.spec.ts` in `src/tests/`.

**New Component/Module:**
- Implementation: Put storage concerns in `src/data/sqlite/`, event/domain logic in `src/domain/*`, feature use-cases in `src/data/ledger/`.

**Utilities:**
- Shared helpers: Prefer colocating with owning domain submodule (for example currency helpers in `src/domain/currency/`, balance helpers in `src/domain/balances/`).

## Special Directories

**`frontend mock/`:**
- Purpose: Static HTML mock screens for product/UI exploration.
- Generated: No.
- Committed: Yes.

**`openspec/`:**
- Purpose: Structured spec artifacts and change proposals.
- Generated: Partially (workflow-generated artifacts).
- Committed: Yes.

**`.planning/`:**
- Purpose: GSD planning state and generated mapping docs.
- Generated: Yes.
- Committed: Yes.

---

*Structure analysis: 2026-05-12*
