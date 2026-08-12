# AGENTS.md

Compact guide for OpenCode sessions. Read alongside `README.md` (setup, build, env) and `CONTRIBUTING.md` (PR rules).

## Verification

- No `lint` or `typecheck` script exists. `npm test` runs the Vitest unit suite; browser coverage is separate under `npm run test:e2e`.
- Vitest transpiles via esbuild and does **not** typecheck. Run `npx tsc --noEmit` to catch type errors.
- Run a focused test: `npx vitest run <path-or-pattern>` (e.g. `npx vitest run src/tests/settlement-controller.spec.ts`). Watch mode: `npx vitest`.
- Tests live in `src/tests/` as `*.spec.ts` / `*.spec.tsx`. `vitest/globals` is registered in `tsconfig.json`, so `describe`/`test`/`expect` are global (explicit imports are optional).
- Browser E2E tests live in `e2e/`. `npm run test:e2e` creates a static Expo web export in `e2e/.web-build`, serves it on port 8082, and runs Playwright with a mobile Chromium viewport. Install the browser once with `npx playwright install chromium`.

## Architecture

- **Expo Router entry, not `App.tsx`.** `package.json` `main` is `expo-router/entry`; `App.tsx` is a no-op stub. Routes/layouts live in `app/` (groups: `(setup)`, `(tabs)`, plus top-level screens). Root layout wraps the stack in `src/mobile/providers/AppProviders`. Keep transient forms such as `app/add-expense.tsx` in the root stack, not as hidden tabs; tab screens remain mounted and expose stale content to web accessibility tools.
- **Event-sourced domain.** `src/domain/events/repository.ts` appends immutable events (no update/delete API). State is derived by replaying events through `src/domain/projections/replay.ts` (`replayLedger`, pure and deterministic). Add behavior by introducing an event type in `src/domain/events/types.ts` and a handler in `src/domain/projections/`.
- **Persistence.** `src/data/sqlite/client.ts` wraps `better-sqlite3` + Drizzle. Tests execute in Node against the `better-sqlite3` native binding. A DB name with no path separator and not ending in `.db` resolves to a shared in-memory database keyed by name; otherwise it is a file. The schema is created at runtime via `CREATE TABLE IF NOT EXISTS` in `ensureSchema` — tests do **not** run Drizzle migrations.
- `npm run db:push` (`drizzle-kit push --force`) syncs `src/data/sqlite/schema.ts` into `./.local/dumshare.db` (gitignored). Local dev only; not used by the test suite.

## Conventions

- **No inline hex colors in TSX.** `src/tests/no-inline-hex-colors.spec.ts` scans every `.tsx` under `src/` and fails on any `#RRRRRR` literal. Use tokens from `src/mobile/theme/`.
- Money is stored as integer minor units (`*AmountMinor`) with explicit currency codes; per-currency balances are first-class. Do not use floating-point amounts.
