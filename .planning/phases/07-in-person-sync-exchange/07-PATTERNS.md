# Phase 07 Pattern Map — In-Person Sync Exchange

## Source Files to Mirror

### 1) Deterministic state transition pattern
- **Reference:** `src/domain/projections/replay.ts`
- **Pattern:** parse input -> validate actor/shape -> deterministic mutation -> fail-fast error

### 2) Organizer authority guard reuse pattern
- **Reference:** `src/domain/onboarding/authority.ts`
- **Pattern:** centralized pure guard (`assertOrganizerSyncHub`) for organizer-only sync actions

### 3) Repository sequence ordering pattern
- **Reference:** `src/domain/events/repository.ts`
- **Pattern:** sequence-ordered reads (`orderBy(asc(events.sequence))`) and append-only writes

### 4) Contract + replay invariant test pattern
- **Reference:** `src/tests/contributor-onboarding-invitations.spec.ts`, `src/tests/organizer-approval-gate.spec.ts`
- **Pattern:**
  1. contract-presence assertions (`readFileSync` + `toContain`)
  2. deterministic fixtures for behavior checks
  3. explicit failure message assertions (`toThrow`)

## Canonical Snippets

From `src/domain/onboarding/authority.ts`:

```ts
if (projection.syncHubDeviceId !== actorDeviceId) {
  throw new Error("Only organizer device can run sync hub actions");
}
```

From `src/domain/events/repository.ts`:

```ts
const rows = await db.orm
  .select()
  .from(events)
  .where(eq(events.ledger_id, ledgerId))
  .orderBy(asc(events.sequence));
```

## Usage Notes for Planner/Executor

- Keep sync exchange deterministic and sequence-based.
- Keep organizer authority checks explicit in session-establishment path.
- Keep test naming/filtering aligned with existing `npm run test -- <suite>` pattern.
