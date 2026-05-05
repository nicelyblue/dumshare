---
status: complete
trigger: "Dashboard error: Could not load ledger db.sqlite.prepare is not a function"
created: "2026-05-05"
updated: "2026-05-05"
---

## Symptoms

- Expected behavior: Dashboard loads ledger data successfully on mobile runtime.
- Actual behavior: Dashboard fails with `Could not load ledger db.sqlite.prepare is not a function`.
- Error messages: `db.sqlite.prepare is not a function`.
- Timeline: After prior expo-sqlite migration.
- Reproduction: Open app dashboard/ledger load path in mobile runtime.

## Current Focus

- hypothesis: Remaining runtime assumptions of better-sqlite3 API are still reachable in mobile path.
- test: Locate and inspect all uses of `db.sqlite.prepare` and other Node-only methods in runtime-reachable mobile code.
- expecting: Identify snapshot/load and related ledger paths still using Node adapter methods.
- next_action: verify removal of Node-only prepare usage in runtime ledger paths

## Evidence

- timestamp: 2026-05-05T09:35:00
  finding: Runtime ledger paths (`ledgerSnapshot`, `balanceDetails`, `expenseReview`, `expenseDrafts`, `ledgerMutations`, `syncSession`) directly called `db.sqlite.prepare(...)` to fetch latest ledger id.
  implication: `client.native.ts` provides Expo SQLite handle where `prepare` is not the same better-sqlite3 API, causing `db.sqlite.prepare is not a function` at runtime.

- timestamp: 2026-05-05T09:35:20
  finding: Replaced all latest-ledger lookups with shared async Drizzle query (`resolveLatestLedgerId`) using `db.orm.select(...).orderBy(desc(events.sequence)).limit(1)`.
  implication: Removes better-sqlite3-specific assumption and uses driver-agnostic Drizzle path compatible with expo-sqlite.

- timestamp: 2026-05-05T09:35:54
  finding: `npx tsc --noEmit` succeeded and ledger-related tests passed (`local-data-backbone`, `sync-session-bridge`).
  implication: Refactor compiles cleanly and preserves existing ledger/sync behavior in covered paths.

## Eliminated

## Resolution

- root_cause: Mobile runtime still reached code paths that used better-sqlite3-style `db.sqlite.prepare(...)` instead of Drizzle queries, which is incompatible with expo-sqlite handle semantics.
- fix: Introduced shared `resolveLatestLedgerId` helper using Drizzle ORM and updated all runtime ledger snapshot/mutation/sync call sites to await this driver-agnostic query.
- verification: `npx tsc --noEmit` and `npx vitest run src/tests/local-data-backbone.spec.ts src/tests/sync-session-bridge.spec.ts`.
- files_changed: src/data/ledger/latestLedgerId.ts, src/data/ledger/ledgerSnapshot.ts, src/data/ledger/balanceDetails.ts, src/data/ledger/expenseReview.ts, src/data/ledger/expenseDrafts.ts, src/data/ledger/ledgerMutations.ts, src/data/ledger/syncSession.ts
