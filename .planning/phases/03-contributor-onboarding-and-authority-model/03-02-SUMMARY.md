---
phase: 03-contributor-onboarding-and-authority-model
plan: 02
subsystem: auth
tags: [authority-guards, organizer-policy, replay-integration, vitest]
requires:
  - phase: 03-contributor-onboarding-and-authority-model
    provides: replay-derived sync and approval authority fields on projection
provides:
  - organizer-only authority guard module
  - replay-backed authority policy test coverage
affects: [phase-04-sync-foundation, contributor-submission-approval]
tech-stack:
  added: []
  patterns: [pure guard functions over projection authority fields, replay-integrated policy tests]
key-files:
  created:
    - src/domain/onboarding/authority.ts
    - src/tests/contributor-authority-policy.spec.ts
  modified:
    - src/tests/contributor-authority-policy.spec.ts
key-decisions:
  - "Centralize organizer-only checks in reusable pure functions for sync and approval flows."
  - "Validate authority policy against replay-derived projection fixtures, not only hand-built objects."
patterns-established:
  - "Authority checks must compare actorDeviceId against projection.syncHubDeviceId and approvalAuthorityDeviceId."
requirements-completed: [LEDR-05]
duration: 3min
completed: 2026-04-21
---

# Phase 3 Plan 2: Organizer Authority Guard Summary

**Organizer-only sync-hub and approval authority policies are now enforced through pure domain guards verified with replay-backed projection fixtures.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-21T17:40:02Z
- **Completed:** 2026-04-21T17:41:20Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added `assertOrganizerSyncHub` and `assertOrganizerApprovalAuthority` guard helpers.
- Added deterministic pass/fail tests for organizer and non-organizer actors.
- Added replay-integrated fixture coverage proving authority wiring from projection output.

## Task Commits

1. **Task 1: Create organizer authority guard module** - `4704c8f`, `6237836` (test, feat)
2. **Task 2: Verify authority guards against replay-derived state and full suite** - `4e2afaf` (test)

## Files Created/Modified
- `src/domain/onboarding/authority.ts` - Pure organizer-only authority guard helpers.
- `src/tests/contributor-authority-policy.spec.ts` - Unit-style and replay-derived authority policy tests.

## Decisions Made
- Non-organizer failures use explicit plain-language errors to keep UX and diagnostics consistent.
- Guard coverage includes replay outputs to protect against future projection contract drift.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: src/domain/onboarding/authority.ts
- FOUND: src/tests/contributor-authority-policy.spec.ts
- FOUND: 4704c8f
- FOUND: 6237836
- FOUND: 4e2afaf
