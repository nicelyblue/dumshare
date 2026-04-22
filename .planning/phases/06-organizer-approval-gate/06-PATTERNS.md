# Phase 06 Pattern Map — Organizer Approval Gate

## Source Files to Mirror

### 1) Replay event-branch pattern
- **Target to modify:** `src/domain/projections/replay.ts`
- **Closest analog:** existing `case "expense.amendment-submitted"` branch
- **Pattern:** parse payload → authority checks → state existence checks → deterministic mutation → break

### 2) Event contract typing pattern
- **Target to modify:** `src/domain/events/types.ts`
- **Closest analog:** `ExpenseAmendmentSubmittedPayload` and `KnownEventType` union entries
- **Pattern:** literal event type in union + strongly typed payload + parser in replay

### 3) Projection state shape pattern
- **Target to modify:** `src/domain/projections/types.ts`
- **Closest analog:** `pendingSubmissions` structured object list
- **Pattern:** explicit discriminated fields (`submissionType`) and replay-derived metadata (`sourceEventId`, timestamps, actor)

### 4) Organizer authority guard reuse
- **Target to reuse:** `src/domain/onboarding/authority.ts`
- **Closest analog:** `assertOrganizerApprovalAuthority(projection, actorDeviceId)`
- **Pattern:** fail-fast plain-language error from centralized guard module

### 5) Invariant test layout
- **Target to create:** `src/tests/organizer-approval-gate.spec.ts`
- **Closest analog:** `src/tests/contributor-amendments.spec.ts`
- **Pattern:**
  1. contract-presence tests using `readFileSync` + `toContain`
  2. replay invariant tests with deterministic event fixtures
  3. explicit `toThrow` assertions for guard failures

## Canonical Snippets

From `src/domain/projections/replay.ts`:

```ts
if (!Object.values(projection.participantContributorDeviceClaims).includes(event.actorDeviceId)) {
  throw new Error("Only claimed contributor devices can submit expense amendments");
}
```

```ts
projection.pendingSubmissions.push({
  submissionType: "expense-amendment",
  amendmentId: payload.amendmentId,
  targetExpenseId: payload.targetExpenseId,
  reason: payload.reason,
  proposedExpense: payload.proposedExpense,
  submittedAt: event.occurredAt,
  submittedByDeviceId: event.actorDeviceId,
  sourceEventId: event.id,
});
```

From `src/domain/onboarding/authority.ts`:

```ts
if (projection.approvalAuthorityDeviceId !== actorDeviceId) {
  throw new Error("Only organizer device can approve contributor submissions");
}
```

## Usage Notes for Planner/Executor

- Keep mutation in replay only; do not introduce side-channel state.
- Reuse current plain-language error style for deterministic test assertions.
- Preserve event ordering behavior (`ordered = [...events].sort(...)`) and fail-fast default branch.
