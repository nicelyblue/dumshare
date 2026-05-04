---
phase: 05-split-modes-and-contributor-amendments
created: 2026-04-22
status: complete
confidence: high
---

# Phase 5 Research: Split Modes and Contributor Amendments

## Research Question

What must be implemented so Phase 5 satisfies EXPS-04/05/06/07 using the existing deterministic replay architecture, while preparing contributor amendments as reviewable submissions for the organizer pipeline?

## Sources Reviewed

- `.planning/ROADMAP.md` (Phase 5 goal + success criteria)
- `.planning/REQUIREMENTS.md` (EXPS-04, EXPS-05, EXPS-06, EXPS-07)
- `.planning/STATE.md`
- `src/domain/events/types.ts`
- `src/domain/projections/types.ts`
- `src/domain/projections/replay.ts`
- `src/tests/expense-capture-foundations.spec.ts`
- `src/tests/ledger-setup-participants.spec.ts`
- `src/tests/contributor-onboarding-invitations.spec.ts`

## Existing Pattern Findings

1. **Replay is fail-fast and contract-first**
   - Every event parser validates shape and value constraints before mutating projection state.
   - Unsupported event types throw deterministic errors.

2. **Participant roster and contributor identity are replay-derived**
   - Split participants must be validated against `projection.participants`.
   - Contributor amendment authority should continue relying on claimed contributor device mapping.

3. **Tests combine contract assertions + replay invariants**
   - Existing phase tests assert concrete source-contract fields and replay behavior/errors in one spec.

## Standard Stack / Libraries

- Keep current TypeScript + Vitest domain workflow.
- No new dependencies are required.
- Keep deterministic integer arithmetic in minor units for split calculations.

## Recommended Implementation Shape

### A) Split Modes on `expense.created` (EXPS-04/05/06)

Add a strict split definition to `ExpenseCreatedPayload`:

- `split.mode`: `"equal" | "exact" | "percentage"`
- `split.participants`: array with mode-specific fields
  - equal: participant IDs only
  - exact: participant IDs + exact owed amounts in minor units
  - percentage: participant IDs + percentage in basis points (0-10000)

Deterministic replay validation rules:

- Selected participants must exist in projection roster.
- Participant IDs must be unique in the split array.
- `equal`: derive owed shares deterministically from `totalAmountMinor` using integer division + stable remainder assignment.
- `exact`: sum of `owedAmountMinor` must equal `totalAmountMinor`.
- `percentage`: sum of `percentageBps` must equal 10000 and derived owed shares must sum to `totalAmountMinor`.

Projection output should persist both split definition and computed `owedShares` so downstream balance phase can consume deterministic owed values.

### B) Contributor Amendments as Reviewable Submissions (EXPS-07)

Introduce amendment submission event (e.g., `expense.amendment-submitted`) with strict payload:

- `amendmentId`, `targetExpenseId`, `reason`, `proposedExpense` (same strict split-aware expense shape)

Replay behavior:

- Allow submission only from claimed contributor devices.
- Require target expense to exist.
- Validate proposed expense payload with same strict split-mode rules as new expenses.
- Do **not** mutate approved `entries` directly; append amendment into `pendingSubmissions` projection collection for organizer review in Phase 6.

## Common Pitfalls to Avoid

- Using floating-point math for percentage distribution (nondeterministic rounding drift).
- Accepting split participants not present in roster.
- Treating contributor amendment as immediate mutation of approved expense entry.
- Diverging validation logic between `expense.created` and amendment proposed payload.

## Architectural Responsibility Map

| Concern | Tier | Files |
|--------|------|-------|
| Split-mode and amendment event contracts | Domain contract | `src/domain/events/types.ts` |
| Projection shapes for owed shares and pending amendment submissions | Domain contract | `src/domain/projections/types.ts` |
| Deterministic split validation/derivation + amendment pending ingestion | Domain logic | `src/domain/projections/replay.ts` |
| Phase-5 split and amendment invariant coverage | Test | `src/tests/expense-split-modes.spec.ts`, `src/tests/contributor-amendments.spec.ts` |

## Validation Architecture

- Single source of truth for split validation and owed-share derivation in replay parser helpers.
- Amendment proposed payload reuses split validation helpers to prevent contract drift.
- Contributor amendments land in pending submission queue, never in approved entries.
- Automated commands:
  - `npm run test -- expense-split-modes`
  - `npm run test -- contributor-amendments`
  - `npm run test -- expense-capture-foundations`
  - `npm test`

## Planning Implications

- Two execute plans are appropriate:
  1. split-mode contracts + deterministic owed-share replay
  2. contributor amendment submission + pending review feed
- Plans are sequential due shared files (`events/types.ts`, `projections/types.ts`, `projections/replay.ts`).
- Security threat modeling remains mandatory (payload tampering, unauthorized amendment spoofing, integrity of pending queue).
