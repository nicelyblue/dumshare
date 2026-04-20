# Phase 01 Pattern Map

**Generated:** 2026-04-20
**Source inputs:** `01-RESEARCH.md`, `.planning/research/*.md`

## Planned File Roles

| Planned file | Role | Closest analog in repo | Notes |
|---|---|---|---|
| `src/data/sqlite/schema.ts` | Drizzle SQLite schema definitions | *(none — greenfield)* | Follow Drizzle typed table pattern from research stack.
| `src/data/sqlite/client.ts` | SQLite database open/bootstrap adapter | *(none — greenfield)* | Keep local-only connection path.
| `src/domain/events/types.ts` | Event contracts for append-only log | `.planning/research/ARCHITECTURE.md` event examples | Use discriminated unions and explicit version fields.
| `src/domain/events/repository.ts` | Append/read-only event persistence API | `.planning/research/PITFALLS.md` append-only guidance | No update/delete operations for event rows.
| `src/domain/projections/replay.ts` | Deterministic replay projector | `.planning/research/ARCHITECTURE.md` reducer example | Pure reducer + stable ordering guarantees.
| `src/tests/local-data-backbone.spec.ts` | Determinism/persistence tests | *(none — greenfield)* | Tests are the primary executable contract for this phase.

## Constraint Patterns to Apply

1. **Local-only persistence boundary**
   - No cloud storage adapters.
   - No network requirement in bootstrap path.

2. **Append-only event boundary**
   - API should expose `appendEvent` + read queries.
   - Avoid mutable ledger row write paths.

3. **Deterministic replay boundary**
   - Replay must sort/order events by deterministic key.
   - Same input event sequence must produce same projection output.
