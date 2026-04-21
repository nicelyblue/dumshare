# Phase 3: Contributor Onboarding and Authority Model - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers organizer-led contributor onboarding: organizer issues a one-time invitation QR for a selected passive participant, contributor joins that specific ledger on exactly one device, and organizer authority remains explicit as the only sync hub and approval authority.

</domain>

<decisions>
## Implementation Decisions

### Invite Lifecycle
- **D-01:** Contributor invitations are single-use and become invalid immediately after first successful join.
- **D-02:** Unused invitations do not auto-expire; validity remains until consumed or explicitly revoked.
- **D-03:** Organizer can manually revoke an unused invitation via an explicit revoke action (auditable event).
- **D-04:** If a scanned invitation is already used or revoked, contributor sees a clear block message and is instructed to request a new code from organizer.

### Carried Forward Constraints
- **D-05:** Single-device contributor identity remains enforced (already locked in project context).
- **D-06:** Organizer remains sole sync hub and sole approval authority (already locked in project context).

### the agent's Discretion
- Event naming, reducer wiring, and storage schema details for invite-issued/invite-revoked/invite-consumed remain implementation discretion, as long as they preserve decisions D-01 through D-04.
- Exact UI copy can be refined during planning, but must stay plain-language and action-oriented.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope and phase contract
- `.planning/ROADMAP.md` — Phase 3 goal, dependencies, and success criteria for onboarding + authority model.
- `.planning/REQUIREMENTS.md` — LEDR-03, LEDR-04, LEDR-05 requirements and v1 scope constraints.
- `.planning/PROJECT.md` — Locked product constraints: offline-only, organizer hub, single-device contributor identity, plain-language UX.
- `.planning/STATE.md` — Current project execution state and continuity notes.

### Existing domain/event patterns to reuse
- `src/domain/events/types.ts` — Current event-type union baseline (`ledger.created`, `participant.added`) to extend for onboarding lifecycle events.
- `src/domain/events/repository.ts` — Append-only event persistence/query contract for new onboarding events.
- `src/domain/projections/replay.ts` — Deterministic replay and payload validation pattern to mirror for invitation/onboarding state.
- `src/domain/projections/types.ts` — Projection shape patterns to extend with contributor onboarding/authority fields.
- `src/tests/ledger-setup-participants.spec.ts` — Existing contract and replay test style to mirror for Phase 3 behavior.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/domain/events/repository.ts`: Existing append-only repository methods and event ordering behavior should be reused for invitation lifecycle and join events.
- `src/domain/projections/replay.ts`: Existing strict payload validation and deterministic replay flow provides the implementation pattern for onboarding authority rules.
- `src/tests/ledger-setup-participants.spec.ts`: Provides the established test style for contract coverage and replay determinism assertions.

### Established Patterns
- Event-sourced model is strict and explicit: unsupported or malformed event payloads throw errors during replay.
- Projection state is reconstructed from ordered immutable events; behavior must be encoded via event history, not mutable records.
- Contracts are validated through both type surfaces and replay-oriented tests.

### Integration Points
- Add Phase 3 event contracts in `src/domain/events/types.ts` and consume them in replay logic in `src/domain/projections/replay.ts`.
- Persist onboarding events through `src/domain/events/repository.ts` alongside existing ledger/participant events.
- Expand projection types in `src/domain/projections/types.ts` to include contributor onboarding status and authority-related state.
- Extend domain test coverage under `src/tests/` using the existing phase test style.

</code_context>

<specifics>
## Specific Ideas

- Keep contributor-facing failure messaging direct and non-technical when invite is invalid (used/revoked), with clear next action: ask organizer for a new code.
- Prefer explicit organizer actions over implicit timeout behavior for invite invalidation.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-contributor-onboarding-and-authority-model*
*Context gathered: 2026-04-21*
