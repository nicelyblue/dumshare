# Phase 4: Expense Capture Foundations - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers offline expense capture basics for organizer and contributors: create expenses with required core fields (description, currency, total amount, date) and support one-or-more payers with explicit paid amounts.

</domain>

<decisions>
## Implementation Decisions

### Expense payload contract
- **D-01:** [auto] Use a strict required payload for `expense.created` in Phase 4 (description, currency, total amount in minor units, date, payer breakdown, creator identity context).
- **D-02:** [auto] Do not rely on deferred enrichment for core fields; missing required fields are invalid at event boundary.

### Multi-payer representation
- **D-03:** [auto] Represent one-or-more payers inline in `expense.created` payload as explicit participantId + paid amount entries.
- **D-04:** [auto] Keep payer representation inside creation event for deterministic replay (avoid follow-up payer mutation events in this phase).

### Creator permissions and participant linkage
- **D-05:** [auto] Allow expense creation only from organizer device or a claimed contributor device already linked through Phase 3 onboarding.
- **D-06:** [auto] Restrict payer participant references to known participant IDs already present in ledger projection.

### Validation and error behavior
- **D-07:** [auto] Enforce fail-fast validation with deterministic, plain-language errors for invalid expense payloads or unauthorized creators.
- **D-08:** [auto] Preserve strict replay behavior (invalid events stop replay rather than being normalized or ignored).

### Carried Forward Constraints
- **D-09:** Single-device contributor identity from Phase 3 remains enforced.
- **D-10:** Organizer remains sole sync hub and approval authority; Phase 4 capture does not relax authority boundaries.
- **D-11:** Event sourcing remains append-only with deterministic replay as source of truth.

### the agent's Discretion
- Exact payload field names for payer array and creator linkage metadata.
- Whether replay-level validation helpers live in one module or split by event type.
- Exact wording of plain-language error strings, as long as they stay action-oriented and deterministic.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and phase contract
- `.planning/ROADMAP.md` — Phase 4 goal, EXPS-01/02/03 scope, and success criteria.
- `.planning/REQUIREMENTS.md` — Requirement definitions for EXPS-01, EXPS-02, EXPS-03 and out-of-scope constraints.
- `.planning/PROJECT.md` — Core offline/local-first constraints, role model, and plain-language UX constraints.
- `.planning/STATE.md` — Current phase continuity and accumulated decisions.

### Prior locked decisions from Phase 3
- `.planning/phases/03-contributor-onboarding-and-authority-model/03-CONTEXT.md` — Invite lifecycle, one-device claims, and authority constraints to preserve.
- `.planning/phases/03-contributor-onboarding-and-authority-model/03-01-SUMMARY.md` — Implemented onboarding lifecycle contracts and replay invariants.
- `.planning/phases/03-contributor-onboarding-and-authority-model/03-02-SUMMARY.md` — Organizer-only authority guard implementation.
- `.planning/phases/03-contributor-onboarding-and-authority-model/03-VERIFICATION.md` — Verified behavior baseline from Phase 3.

### Existing code contracts and patterns
- `src/domain/events/types.ts` — Event type union and payload contract surface to extend for expense foundations.
- `src/domain/events/repository.ts` — Append-only event write/read repository behavior.
- `src/domain/projections/types.ts` — Projection state structure and type constraints.
- `src/domain/projections/replay.ts` — Deterministic replay pipeline and strict validation/error pattern.
- `src/tests/ledger-setup-participants.spec.ts` — Existing replay determinism and validation testing pattern.
- `src/tests/contributor-onboarding-invitations.spec.ts` — Lifecycle invariant testing style with plain-language guard assertions.
- `src/tests/contributor-authority-policy.spec.ts` — Authority guard expectation patterns tied to replay output.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/domain/events/types.ts`: Existing strongly-typed payload and event name contracts provide the extension point for Phase 4 expense capture data.
- `src/domain/projections/replay.ts`: Existing switch-based deterministic reducer with per-event parse/validation helpers is the core pattern for new expense behavior.
- `src/domain/events/repository.ts`: Existing append sequence assignment and ledger-scoped retrieval already support new event types without repository redesign.

### Established Patterns
- Strict payload validation: malformed payloads throw hard errors by event type (`Invalid payload for eventType ...`).
- Deterministic replay ordering: all behavior derives from sequence ordering and immutable event history.
- Plain-language guard errors: user-facing failure semantics are encoded in replay/guard messages and asserted in tests.

### Integration Points
- Extend `KnownEventType` and payload contracts in `src/domain/events/types.ts` for Phase 4 requirements.
- Add replay parsing + projection application in `src/domain/projections/replay.ts` while preserving existing authority and claim invariants from Phase 3.
- Expand projection typing in `src/domain/projections/types.ts` to carry any new fields needed for expense capture semantics.
- Add targeted tests in `src/tests/` mirroring existing contract-first and replay-invariant style.

</code_context>

<specifics>
## Specific Ideas

- Auto-selected defaults were used for all Phase 4 gray areas (`--auto` mode) and are marked inline as `[auto]` in decisions.
- Expense capture remains intentionally strict at domain boundary to avoid ambiguous downstream settlement behavior.

</specifics>

<deferred>
## Deferred Ideas

None — discussion remained within Phase 4 scope.

</deferred>

---

*Phase: 04-expense-capture-foundations*
*Context gathered: 2026-04-21*
