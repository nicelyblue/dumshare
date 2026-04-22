# Phase 6: Organizer Approval Gate — Research

**Date:** 2026-04-22  
**Status:** Complete  
**Phase requirements:** APRV-01, APRV-02, APRV-03, APRV-04, APRV-05

## Objective

Determine the lowest-risk implementation approach for organizer-gated approval/rejection of contributor submissions in the existing deterministic replay architecture.

## Existing Baseline (from code)

### Current approval-adjacent model
- `src/domain/projections/replay.ts`
  - `expense.amendment-submitted` already appends to `projection.pendingSubmissions`.
  - `expense.created` currently appends directly to `projection.entries` regardless of `creatorRole`.
- `src/domain/projections/types.ts`
  - `pendingSubmissions` exists but currently only models `submissionType: "expense-amendment"`.
- `src/domain/onboarding/authority.ts`
  - `assertOrganizerApprovalAuthority()` exists and provides reusable organizer-only guard.

### Pattern continuity from completed phases
- Strict payload parsing and fail-fast replay errors (`replay.ts` parser style).
- Deterministic projection mutation from ordered event stream only.
- Approval governance kept at organizer authority boundary (STATE + Phase 3/5 summaries).

## Decision

Adopt an **event-sourced approval lifecycle** with explicit organizer decision events:

1. Contributor-created expenses become pending submissions (not approved entries).
2. Contributor amendments remain pending submissions.
3. Organizer emits explicit approve/reject events for a submission.
4. Replay applies approval by mutating approved state deterministically:
   - approve contributor expense submission → append approved `LedgerEntry`
   - approve amendment submission → replace target approved entry with proposed expense snapshot
   - reject any submission → mark decision metadata only; no approved-entry mutation

## Event Contract Additions

Recommended additions in `src/domain/events/types.ts`:

- `expense.submission-created`
  - Represents contributor-submitted new expense proposal.
  - Payload includes submission ID + full proposed expense payload.
- `expense.submission-reviewed`
  - Organizer decision event (`decision: "approved" | "rejected"`) + rationale + target submission ID.

Why this shape:
- Keeps approval logic explicit and auditable in event log.
- Unifies APRV-01/02/03/04 under one deterministic replay branch.
- Avoids implicit/non-event state transitions.

## Projection Model Updates

Recommended updates in `src/domain/projections/types.ts`:

- Expand `pendingSubmissions` into discriminated union:
  - `expense-create`
  - `expense-amendment`
- Add `reviewedSubmissions` (or equivalent immutable decision trail) with:
  - submissionId
  - decision
  - reviewedAt
  - reviewedByDeviceId
  - reason

Replay constraints (`src/domain/projections/replay.ts`):
- Reject duplicate submission IDs.
- Reject review of unknown submission ID.
- Reject re-review of already reviewed submission.
- Enforce organizer-only review authority via `assertOrganizerApprovalAuthority`.
- On reject, guarantee no `entries` mutation (APRV-05 invariant).

## Security / Trust Boundaries

1. **Contributor device → event log** (untrusted origin for submission payload).
   - Mitigation: strict parser validation + claimed contributor device checks.
2. **Organizer decision event → approved projection state**.
   - Mitigation: organizer authority guard + replay-time duplicate/review-state checks.

## Validation Architecture

Use current Vitest suite with phase-focused tests and deterministic replay assertions.

### Required new tests
1. `src/tests/organizer-approval-gate.spec.ts`
   - Contributor expense submission lands in pending queue.
   - Contributor amendment submission lands in pending queue.
   - Organizer approval applies pending submission to approved state.
   - Organizer rejection leaves approved state unchanged.
   - Non-organizer review attempt throws guard error.
   - Re-review/double-review throws deterministic error.

2. Contract assertions
   - event type literals and payload fields exist in `events/types.ts`.
   - projection type contains pending + reviewed decision artifacts.

### Fast verification commands
- Quick: `npm run test -- organizer-approval-gate`
- Full: `npm test`

## Common Pitfalls to Avoid

1. **Direct mutation of approved entries at submission time** for contributor-created expenses.
2. **Silent approval defaults** (must require explicit decision event).
3. **Non-idempotent review branch** allowing duplicate apply.
4. **Approval without authority check** bypassing organizer gate.

## Architectural Responsibility Map

- **Event contracts (`events/types.ts`)**: schema-level truth for lifecycle states.
- **Replay engine (`projections/replay.ts`)**: deterministic enforcement and state transitions.
- **Projection types (`projections/types.ts`)**: approved vs pending vs reviewed state shape.
- **Tests (`src/tests/*.spec.ts`)**: executable invariants for APRV requirements.

## Recommendation for Planning

Split phase into two execution plans:

1. **Lifecycle contracts + replay wiring for submission and review events** (core implementation).
2. **Comprehensive APRV invariant tests + regression coverage updates** (verification hardening).

This keeps each plan within ~50% context while preserving full requirement coverage.
