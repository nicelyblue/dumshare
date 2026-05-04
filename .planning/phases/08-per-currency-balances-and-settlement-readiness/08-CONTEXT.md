# Phase 8: Per-Currency Balances and Settlement Readiness - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers trustworthy per-currency participant net balances from approved ledger data so users can make settlement decisions without hidden cross-currency merging.

</domain>

<decisions>
## Implementation Decisions

### Balance source of truth
- **D-01:** Per-currency balances are computed from approved entries only (`projection.entries`), not from pending submissions.
- **D-02:** If an amendment is pending organizer review, balances continue to use the currently approved expense values until an explicit approve decision is recorded.
- **D-03:** Rejected submissions never affect computed balances and remain audit/history only.

### User-facing approved-state clarity
- **D-04:** When pending submissions exist, balances must show a plain-language note that values reflect approved entries only and pending changes are excluded.

### Carried-forward constraints
- **D-05:** Organizer approval gate semantics remain authoritative: only explicitly approved contributor submissions may influence approved outcomes.
- **D-06:** Currency values remain separated by currency code; no implicit cross-currency merge or conversion is allowed in v1.

### the agent's Discretion
- Exact data structure for computed balance output (participant-first vs currency-first vs both) as long as D-01 through D-06 remain true.
- Exact plain-language copy for the approved-only qualifier note.
- Internal helper/module boundaries for balance derivation.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope and requirement contract
- `.planning/ROADMAP.md` — Phase 8 goal, BALN-01/02/03 mapping, and success criteria.
- `.planning/REQUIREMENTS.md` — Balance and currency requirements plus out-of-scope constraint on forced currency merging.
- `.planning/PROJECT.md` — Non-negotiables for offline/local-only behavior and per-currency accounting.
- `.planning/STATE.md` — Current execution continuity and prior phase decision trail.

### Prior phase decisions that constrain balance logic
- `.planning/phases/03-contributor-onboarding-and-authority-model/03-CONTEXT.md` — Organizer authority and single-device contributor model.
- `.planning/phases/04-expense-capture-foundations/04-CONTEXT.md` — Strict expense payload and deterministic replay conventions.

### Existing code contracts for balance derivation inputs
- `src/domain/projections/replay.ts` — Approved entries, pending/reviewed submission lifecycle, and deterministic owed-share derivation.
- `src/domain/projections/types.ts` — Projection shape (`entries`, `pendingSubmissions`, `reviewedSubmissions`, `owedShares`) that balance derivation must consume.
- `src/domain/events/types.ts` — Event and split payload contracts feeding replay outputs.
- `src/tests/organizer-approval-gate.spec.ts` — Verified invariant that only approved submissions affect approved entries.
- `src/tests/expense-split-modes.spec.ts` — Deterministic owed-share invariants that downstream balance math must respect.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/domain/projections/replay.ts`: Already builds approved `entries` with normalized `owedShares` per expense and enforces approval gating.
- `src/domain/projections/types.ts`: Provides strongly typed inputs needed for per-currency aggregation logic.
- `src/tests/expense-split-modes.spec.ts`: Existing deterministic arithmetic test style can be mirrored for balance derivation invariants.

### Established Patterns
- Deterministic replay from ordered events is the source of truth.
- Invalid or inconsistent financial payloads fail fast with explicit errors.
- Contributor-created data is pending-first and only enters approved state via organizer review events.

### Integration Points
- Add balance derivation logic on top of replay projection outputs (`entries` and participant roster).
- Keep pending/rejected submissions outside canonical balance totals while still exposing status context for UI messaging.
- Add Phase 8 tests in `src/tests/` aligned with existing replay-invariant contract style.

</code_context>

<specifics>
## Specific Ideas

- Use explicit user-facing language for balance trust boundary, e.g. "Balances reflect approved entries only; pending changes are not included."
- Preserve strict approved-state semantics so settlement-facing numbers never include unreviewed contributor proposals.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-per-currency-balances-and-settlement-readiness*
*Context gathered: 2026-04-22*
