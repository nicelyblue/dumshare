# Technology Stack

**Analysis Date:** 2026-05-12

## Languages

**Primary:**
- TypeScript (strict mode) - Core domain/data logic and tests in `src/**/*.ts` (configured in `tsconfig.json`).

**Secondary:**
- SQL (SQLite DDL via runtime `CREATE TABLE`) - Schema bootstrap in `src/data/sqlite/client.ts`.
- HTML (design mock artifacts) - Static mock screens in `frontend mock/*.html`.

## Runtime

**Environment:**
- Node.js runtime with ESM modules (`"type": "module"` in `package.json`).

**Package Manager:**
- npm (lockfile-based workflow)
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core:**
- Expo `^55.0.23` - App platform dependency declared in `package.json`.
- Drizzle ORM `^0.45.2` - Typed DB access used in `src/data/sqlite/client.ts`, `src/domain/events/repository.ts`, `src/data/ledger/ledgers.ts`.
- better-sqlite3 `^12.1.1` - Local SQLite driver used in `src/data/sqlite/client.ts`.

**Testing:**
- Vitest `^3.2.4` - Test runner via `npm test` (`package.json`) with specs under `src/tests/*.spec.ts`.

**Build/Dev:**
- TypeScript `~5.9.2` - Type-check configuration in `tsconfig.json` (`"noEmit": true`).
- drizzle-kit `^0.31.10` - Schema push tooling via `npm run db:push` in `package.json` and config in `drizzle.config.ts`.

## Key Dependencies

**Critical:**
- `drizzle-orm` `^0.45.2` - Defines data access patterns and query APIs across ledger/event storage (`src/domain/events/repository.ts`).
- `better-sqlite3` `^12.1.1` - Backing database engine for persistent and in-memory stores (`src/data/sqlite/client.ts`).

**Infrastructure:**
- `drizzle-kit` `^0.31.10` - Manages DB schema synchronization (`drizzle.config.ts`, `package.json` script).
- `currency-codes` `^2.2.0` - Currency catalog used by domain validation (`src/domain/currency/catalog.ts`).

## Configuration

**Environment:**
- No required `process.env.*` configuration detected in `src/` or root TypeScript/JavaScript files.
- Database path configured in code/tooling: `./.local/dumshare.db` in `drizzle.config.ts`.
- `.env*` files: Not detected at repository root.

**Build:**
- TypeScript compiler settings in `tsconfig.json`.
- Database tooling settings in `drizzle.config.ts`.

## Platform Requirements

**Development:**
- Node.js + npm for scripts in `package.json`.
- Local filesystem write access for SQLite database at `.local/` (ignored by `.gitignore`).

**Production:**
- Not explicitly defined; no deployment target config detected (no `Dockerfile*`, no `.github/workflows/*`, no hosting config files).

---

*Stack analysis: 2026-05-12*
