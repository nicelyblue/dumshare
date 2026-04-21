---
phase: 03-contributor-onboarding-and-authority-model
plan: 01
subsystem: auth
tags: [event-sourcing, invite-lifecycle, replay, vitest]
requires:
  - phase: 02-ledger-setup-and-participants
    provides: deterministic replay baseline and participant roster projection
provides:
  - invite lifecycle event contracts
  - replay-enforced single-use invite behavior
  - replay-enforced one-device contributor claim mapping
affects: [phase-03-plan-02, contributor-onboarding]
tech-stack:
  added: []
  patterns: [strict payload parsing in replay handlers, plain-language replay guard errors]
key-files:
  created:
    - src/tests/contributor-onboarding-invitations.spec.ts
  modified:
    - src/domain/events/types.ts
    - src/domain/projections/types.ts
    - src/domain/projections/replay.ts
key-decisions:
  - "Store invite lifecycle state directly in replay projection to enforce consume/revoke guards deterministically."
  - "Bind organizer sync/approval authority IDs to ledger.created actorDeviceId during replay for downstream authority guards."
patterns-established:
  - "Invite replay handlers must validate non-empty payload strings before state mutation."
  - "Replay guard failures return plain-language user-actionable messages for used or revoked invites."
requirements-completed: [LEDR-03, LEDR-04]
duration: 7min
completed: 2026-04-21
---

# Phase 3 Plan 1: Contributor Onboarding Invite Lifecycle Summary

**Deterministic invite lifecycle replay now enforces single-use invites, revoke blocks, and one-device contributor claims from immutable event history.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-21T17:35:41Z
- **Completed:** 2026-04-21T17:39:05Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Extended event contracts with `invite.issued`, `invite.revoked`, and `invite.consumed` payload types.
- Expanded projection contract with invite state tracking and participant-to-device claim mapping.
- Implemented replay handlers and validations that block revoked/used invites and cross-device participant claims.

## Task Commits

1. **Task 1: Extend onboarding event/projection contracts** - `039f32b`, `10fba5b` (test, feat)
2. **Task 2: Implement deterministic invite lifecycle replay invariants** - `5c98833`, `53b085c` (test, feat)

## Files Created/Modified
- `src/tests/contributor-onboarding-invitations.spec.ts` - Contract and replay invariant coverage for invite lifecycle.
- `src/domain/events/types.ts` - Invite lifecycle event union and payload type definitions.
- `src/domain/projections/types.ts` - Invite/claim projection shape and authority field contracts.
- `src/domain/projections/replay.ts` - Invite issue/revoke/consume handlers with deterministic guards.

## Decisions Made
- Organizer authority fields are replay-derived from `ledger.created` actor device identity.
- Invite errors include plain-language remediation (`request a new code`) to satisfy contributor UX constraints.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: src/tests/contributor-onboarding-invitations.spec.ts
- FOUND: src/domain/projections/replay.ts
- FOUND: 039f32b
- FOUND: 10fba5b
- FOUND: 5c98833
- FOUND: 53b085c
