---
phase: 04-expense-capture-foundations
created: 2026-04-21
status: complete
confidence: high
---

# Phase 4 Research: Expense Capture Foundations

## Research Question

What must be implemented to plan Phase 4 so EXPS-01/02/03 are satisfied using existing event-sourced patterns, with strict deterministic replay and organizer/contributor authority constraints preserved?

## Sources Reviewed

- `.planning/phases/04-expense-capture-foundations/04-CONTEXT.md`
- `.planning/REQUIREMENTS.md` (EXPS-01, EXPS-02, EXPS-03)
- `.planning/STATE.md`
- `src/domain/events/types.ts`
- `src/domain/projections/types.ts`
- `src/domain/projections/replay.ts`
- `src/domain/onboarding/authority.ts`
- `src/tests/ledger-setup-participants.spec.ts`
- `src/tests/contributor-onboarding-invitations.spec.ts`
- `src/tests/contributor-authority-policy.spec.ts`

## Existing Pattern Findings

1. **Strict replay validation is already the norm**
   - `replay.ts` parser helpers throw immediately on malformed payloads per event type.
   - Unsupported event types throw hard errors.

2. **Authority identity is replay-derived, not request-state-derived**
   - Organizer authority is encoded via `syncHubDeviceId` and `approvalAuthorityDeviceId` from `ledger.created`.
   - Contributor device claims are encoded in `participantContributorDeviceClaims` from invite consumption.

3. **Tests are contract + behavior mixed**
   - Existing phase tests assert literal contract surface (string checks in source) plus replay invariants.

## Standard Stack / Libraries

- Keep current stack: TypeScript + Vitest + Drizzle-backed repository; no new dependency needed for Phase 4.
- Keep fail-fast runtime validation in replay parser functions; do not introduce best-effort normalization.

## Recommended Implementation Shape

### Event Contract

- Extend `expense.created` payload to require:
  - `expenseId: string`
  - `description: string`
  - `currency: string`
  - `totalAmountMinor: number`
  - `expenseDate: string`
  - `creatorRole: "organizer" | "contributor"`
  - `payers: Array<{ participantId: string; paidAmountMinor: number }>`

### Replay Validation and Guards

- Validate all required fields at event boundary.
- Enforce one-or-more payer rows; every payer amount must be positive integer.
- Enforce payer participant IDs exist in projection participant roster.
- Enforce creator authorization:
  - organizer path: `event.actorDeviceId === projection.syncHubDeviceId`
  - contributor path: `event.actorDeviceId` must exist in `participantContributorDeviceClaims` values.
- Preserve strict replay behavior: throw deterministic, plain-language errors and stop replay on first invalid event.

### Projection Shape

- Extend `LedgerEntry` to include:
  - `totalAmountMinor`
  - `expenseDate`
  - `creatorRole`
  - `payers`

## Common Pitfalls to Avoid

- Reusing legacy `amountMinor` as single source of truth while introducing payer breakdown (causes ambiguity).
- Allowing unknown participant IDs in payers (breaks integrity and downstream balance math).
- Allowing contributor creation without device-claim verification (violates D-05/D-09).
- Converting invalid values instead of throwing (violates D-07/D-08).

## Architectural Responsibility Map

| Concern | Tier | Files |
|--------|------|-------|
| Event contract definitions | Domain contract | `src/domain/events/types.ts` |
| Replay validation + deterministic application | Domain logic | `src/domain/projections/replay.ts` |
| Projection read-model types | Domain contract | `src/domain/projections/types.ts` |
| Expense capture invariants and regression coverage | Test | `src/tests/expense-capture-foundations.spec.ts` |

## Validation Architecture

- Primary validation path: parser functions in `replay.ts` throw on malformed `expense.created` payload.
- Authorization path: replay enforces organizer/contributor creator constraints before projection mutation.
- Integrity path: replay validates payer references against known participants and validates payer totals shape.
- Automated validation commands:
  - `npm run test -- expense-capture-foundations`
  - `npm run test -- ledger-setup-participants`
  - `npm run test -- contributor-authority-policy`

## Planning Implications

- Single execution plan is sufficient (2 tasks) because work stays within existing domain subsystem and test suite.
- No schema push gate required for this phase (no schema files in phase scope).
- Security threat modeling remains required (tampered payloads, unauthorized creator spoofing, payer reference integrity).
