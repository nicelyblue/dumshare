# Codebase Concerns

**Analysis Date:** 2026-05-12

## Tech Debt

**Event replay and validation monolith:**
- Issue: Projection replay, payload parsing, split math, invite lifecycle, and authorization checks are concentrated in one large module, making changes high-risk.
- Files: `src/domain/projections/replay.ts`
- Impact: Regression risk is high for any event-model change because multiple responsibilities are coupled in a single 708-line file.
- Fix approach: Split `replay.ts` into focused modules (`parsers`, `validators`, `expense-derivation`, `invite-lifecycle`, `replay-engine`) with unit tests per module.

**Duplicated event/ID generation patterns:**
- Issue: Event ID construction, timestamping, and actor device assignment are repeated across mutation modules.
- Files: `src/data/ledger/ledgerMutations.ts`, `src/data/ledger/expenseDrafts.ts`, `src/data/ledger/expenseReview.ts`, `src/data/ledger/ledgers.ts`
- Impact: Inconsistent behavior and harder maintenance when ID policy or actor attribution rules need to change.
- Fix approach: Centralize event envelope creation in a shared helper (e.g., `src/domain/events/factory.ts`) with deterministic test seams.

## Known Bugs

**Corrupted TypeScript type declaration in event types:**
- Symptoms: `ExpenseAmendmentSubmittedPayload` section is malformed (`amendmentId: striDeletedPayload = { ... }`), creating invalid source.
- Files: `src/domain/events/types.ts`
- Trigger: Type-checking or importing these types in stricter flows.
- Workaround: Not applicable; file needs direct correction.

**Authority helper references missing projection field:**
- Symptoms: Approval authority check reads `projection.approvalAuthorityDeviceId`, but `LedgerProjection` does not define this property.
- Files: `src/domain/onboarding/authority.ts`, `src/domain/projections/types.ts`
- Trigger: Using `assertOrganizerApprovalAuthority` in any compiled path.
- Workaround: Use `assertOrganizerLedgerAuthority` until projection type and event model are aligned.

**Reviewed submission snapshot uses placeholder data:**
- Symptoms: Reviewed items are emitted with `submittedByParticipantId: 'unknown'`, `currency: 'N/A'`, and `totalAmountMinor: 0`, which does not represent real reviewed expense payloads.
- Files: `src/data/ledger/expenseReview.ts`
- Trigger: Loading reviewed submissions in `loadExpenseReviewSnapshot`.
- Workaround: Treat reviewed list as status-only; do not rely on monetary fields.

## Security Considerations

**Hard-coded actor identities:**
- Risk: Mutations assign static actor IDs (`device-organizer-ui`, `device-contributor-ui`) instead of verified caller identity.
- Files: `src/data/ledger/ledgerMutations.ts`, `src/data/ledger/expenseDrafts.ts`, `src/data/ledger/expenseReview.ts`, `src/data/ledger/ledgers.ts`
- Current mitigation: Domain replay validates some authorization paths (e.g., contributor claim checks in `src/domain/projections/replay.ts`).
- Recommendations: Pass caller identity from authenticated session context; enforce identity/role checks before appending events.

**Invite codes stored in clear text event payloads:**
- Risk: Invite code values are persisted and replayed as plain strings, increasing exposure if DB is leaked.
- Files: `src/domain/events/types.ts`, `src/domain/projections/replay.ts`, `src/domain/projections/types.ts`
- Current mitigation: Lifecycle checks for revoked/consumed codes exist in replay logic.
- Recommendations: Store hashed invite secrets, add expiration and attempt limits, and avoid returning raw code from projections after issuance.

## Performance Bottlenecks

**Full event replay on read paths:**
- Problem: Snapshots and some mutations rebuild state from all events for a ledger.
- Files: `src/data/ledger/ledgerSnapshot.ts`, `src/data/ledger/expenseReview.ts`, `src/data/ledger/ledgerMutations.ts`, `src/domain/projections/replay.ts`
- Cause: No materialized snapshots/checkpoints; replay is always from sequence 1.
- Improvement path: Add checkpointed projections by ledger and incremental replay from last checkpoint.

**Global MAX(sequence) scan per append:**
- Problem: Each append computes next sequence via `COALESCE(MAX(sequence), 0) + 1` over the full table.
- Files: `src/domain/events/repository.ts`
- Cause: Sequence generation is query-based instead of database-native auto-increment strategy.
- Improvement path: Move sequencing to DB-managed key or per-ledger sequence table with transactional increment.

## Fragile Areas

**Event schema/projection contract boundary:**
- Files: `src/domain/events/types.ts`, `src/domain/projections/replay.ts`, `src/domain/projections/types.ts`, `src/data/ledger/*.ts`
- Why fragile: Event payload shape, parser rules, and projection fields must stay synchronized across many files.
- Safe modification: Change one event type at a time, update parser + projection + mutation producers together, and verify with domain tests.
- Test coverage: Good coverage for split and participant flows in `src/tests/*.spec.ts`, but no dedicated contract tests for malformed event payload variants.

## Scaling Limits

**Single-table event store without ledger-oriented indexing strategy:**
- Current capacity: Not defined in code; all operations use one `events` table.
- Limit: Query/append cost grows with total event count due to global sequence and frequent ledger scans.
- Scaling path: Add indexes for `ledger_id` and (`ledger_id`, `sequence`), introduce archival/partition strategy, and use incremental projection snapshots.

## Dependencies at Risk

**Not detected:**
- Risk: Not detected from current repository state.
- Impact: Not applicable.
- Migration plan: Not applicable.

## Missing Critical Features

**Organizer approval authority model is incomplete:**
- Problem: Approval authority is referenced in `src/domain/onboarding/authority.ts` but is not represented in `src/domain/projections/types.ts` or replayed state.
- Blocks: Reliable enforcement of approval-specific permissions separate from organizer baseline authority.

## Test Coverage Gaps

**Persistence layer behavior (repository/client):**
- What's not tested: Sequence generation under repeated appends, DB handle lifecycle, and edge cases in `listEventsAfterSequence`.
- Files: `src/domain/events/repository.ts`, `src/data/sqlite/client.ts`
- Risk: Data ordering or handle-leak regressions can ship unnoticed.
- Priority: High

**Authority helper usage and contract alignment:**
- What's not tested: `assertOrganizerApprovalAuthority` behavior against actual `LedgerProjection` shape.
- Files: `src/domain/onboarding/authority.ts`, `src/domain/projections/types.ts`
- Risk: Authorization checks can fail at compile/runtime when integrated.
- Priority: High

**Reviewed submission data fidelity:**
- What's not tested: Whether reviewed snapshot items retain canonical expense details.
- Files: `src/data/ledger/expenseReview.ts`
- Risk: UI or reporting can show misleading historical review data.
- Priority: Medium

---

*Concerns audit: 2026-05-12*
