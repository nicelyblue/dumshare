---
phase: 03
name: contributor-onboarding-and-authority-model
status: complete
date: 2026-04-21
source: gsd-phase-researcher
---

# Phase 03 Research — Contributor Onboarding and Authority Model

## Scope

Phase 3 must add organizer-issued one-time invite lifecycle, single-device contributor claim, and explicit organizer authority guarantees while preserving deterministic replay/event-sourcing patterns from Phases 1-2.

## Decisions for Planning

1. Extend event contracts with onboarding lifecycle events using explicit payloads:
   - `invite.issued` (inviteId, participantId, inviteCode)
   - `invite.revoked` (inviteId, revokedReason)
   - `invite.consumed` (inviteId, participantId, contributorDeviceId)
2. Enforce one-time and one-device rules in replay/domain policy:
   - consumed invite cannot be consumed again
   - revoked invite cannot be consumed
   - participant with claimed contributor device cannot be claimed by a second device
3. Keep organizer authority explicit in projection/policy:
   - organizer device ID is treated as sole `syncHubDeviceId`
   - organizer device ID is treated as sole `approvalAuthorityDeviceId`
   - non-organizer attempts are rejected by policy helpers
4. Preserve plain-language failure reasons for invite failures (used/revoked/already-claimed) for downstream UI use.

## Recommended Artifacts

- `src/domain/events/types.ts` — onboarding event type additions
- `src/domain/projections/types.ts` — invite/contributor/authority projection shape
- `src/domain/projections/replay.ts` — deterministic replay handlers + invariant checks
- `src/domain/onboarding/authority.ts` — explicit policy/guard helpers for authority and invite-join checks
- `src/tests/contributor-onboarding-invitations.spec.ts` — replay and invariants
- `src/tests/contributor-authority-policy.spec.ts` — authority guard behavior

## Validation Architecture

- Quick command: `npm run test -- contributor-onboarding`
- Full command: `npm test`
- Required checks:
  - Invite lifecycle enforces D-01/D-02/D-03 state transitions deterministically
  - Used/revoked invite consumption throws deterministic plain-language errors per D-04
  - Second device claim for same participant is blocked (LEDR-04)
  - Authority guard rejects non-organizer sync/approval attempts (LEDR-05)

## Risks and Mitigations

- **Risk:** Replay invariants drift from policy helper behavior.
  - **Mitigation:** Add tests that validate both replay outcomes and policy helper outputs from same event history.
- **Risk:** Invite code collisions or weak identity linkage.
  - **Mitigation:** Keep `inviteId` as canonical unique key; treat `inviteCode` as transport token only.
- **Risk:** Scope creep into transport (BLE/QR camera implementation) too early.
  - **Mitigation:** Phase 3 limits to domain contracts and policy semantics; transport implementation remains later phases.

## Output for Planner

Planning must produce executable prompts that:

- Explicitly cover `LEDR-03`, `LEDR-04`, and `LEDR-05` in plan frontmatter.
- Reference D-01..D-06 decisions directly in task actions.
- Include deterministic replay + guard verification commands in every code-producing task.
