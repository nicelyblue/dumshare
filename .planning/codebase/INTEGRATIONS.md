# External Integrations

**Analysis Date:** 2026-05-12

## APIs & External Services

**Third-party HTTP APIs:**
- Not detected in current source (`src/**/*.ts`): no `fetch`, `axios`, webhook client, or external API SDK usage.

**Reference Data Libraries:**
- `currency-codes` - Used for local currency metadata/validation in `src/domain/currency/catalog.ts`.
  - SDK/Client: `currency-codes` (`package.json`)
  - Auth: Not applicable

## Data Storage

**Databases:**
- SQLite (local file + in-memory variants)
  - Connection: Not environment-variable based; DB name/path passed directly (examples: default `dumshare-ui` in `src/data/ledger/*.ts`, `./.local/dumshare.db` in `drizzle.config.ts`).
  - Client: Drizzle ORM + better-sqlite3 in `src/data/sqlite/client.ts`.

**File Storage:**
- Local filesystem only (SQLite file at `.local/dumshare.db` via `drizzle.config.ts`).

**Caching:**
- None detected (no Redis/memcached/cache SDK imports in `src/`).

## Authentication & Identity

**Auth Provider:**
- Custom domain-level actor identity only (event field `actor_device_id` in `src/data/sqlite/schema.ts`, `src/domain/events/types.ts`).
  - Implementation: Recorded as part of event-sourced ledger operations; no external auth service detected.

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry/Bugsnag/Rollbar SDK usage in `src/`).

**Logs:**
- No centralized logging integration detected.

## CI/CD & Deployment

**Hosting:**
- Not detected (no hosting platform config present in repository root).

**CI Pipeline:**
- None detected (`.github/workflows/*` not present).

## Environment Configuration

**Required env vars:**
- Not detected (`process.env.*` usage not found in project code files).

**Secrets location:**
- No secrets management files/config detected in tracked source; `.env*` files not detected at root.

## Webhooks & Callbacks

**Incoming:**
- None detected.

**Outgoing:**
- None detected.

---

*Integration audit: 2026-05-12*
