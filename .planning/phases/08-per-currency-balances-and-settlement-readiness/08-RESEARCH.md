# Phase 8: Per-Currency Balances and Settlement Readiness — Research

**Date:** 2026-04-22  
**Status:** Complete  
**Phase requirements:** BALN-01, BALN-02, BALN-03

## Objective

Define a low-risk implementation approach for deterministic per-currency balance computation that uses approved ledger state only, preserves organizer approval semantics, and exposes settlement-ready currency detail without hidden cross-currency merging.

## Existing Baseline (from code)

- `src/domain/projections/replay.ts`
  - Approved entries live in `projection.entries`.
  - Contributor submissions remain in `pendingSubmissions` until explicit organizer review.
  - Rejected submissions do not mutate approved entries.
- `src/domain/projections/types.ts`
  - Entry records already include `currency`, `payers`, and `owedShares` needed for net-balance derivation.
  - Projection includes `participants`, `pendingSubmissions`, and `reviewedSubmissions` for approved-state messaging.
- `src/tests/organizer-approval-gate.spec.ts`
  - Confirms pending/reject/approve invariants that must remain true for balance calculations.

## Decision

Implement a **projection-derived per-currency balance module** that:

1. Consumes `LedgerProjection` as input.
2. Computes participant net values per currency from approved entries only.
3. Produces structured output with:
   - participant rows,
   - per-currency net amount (minor units),
   - paid and owed totals per currency,
   - approved-state note metadata when pending submissions exist.

## Calculation Contract

For each approved entry in `projection.entries`:

- For each payer row, add `paidAmountMinor` to that participant in `entry.currency`.
- For each owed-share row, add `owedAmountMinor` to that participant in `entry.currency` owed bucket.
- Net per participant/currency = `paidTotalMinor - owedTotalMinor`.

No balances may read from `pendingSubmissions` proposals directly.

## Security / Trust Boundaries

1. **Replay projection -> balance derivation**
   - Balance module trusts replay-invariants, not raw unvalidated events.
   - Mitigation: only consume `LedgerProjection` output and fail fast on unknown participant references in approved entries.
2. **Currency aggregation boundary**
   - Risk: accidental cross-currency merge causing user-visible financial tampering.
   - Mitigation: currency-keyed maps and explicit per-currency output shape.

## Common Pitfalls to Avoid

1. Using pending submission payloads in net computations.
2. Returning a single merged net amount without currency separation.
3. Omitting participant rows that have zero activity in a currency when consistent output is required for later settlement logic.
4. Re-implementing split arithmetic instead of using already persisted `owedShares` from replay entries.

## Architectural Responsibility Map

- **`src/domain/balances/types.ts`**: Contract for per-currency balance output shape.
- **`src/domain/balances/derive.ts`**: Deterministic aggregation from approved entries.
- **`src/domain/balances/index.ts`**: Stable exports for downstream settlement phase.
- **`src/tests/per-currency-balances.spec.ts`**: Executable BALN requirement invariants.

## Validation Architecture

Use Vitest with targeted and full-suite checks:

- Quick: `npm run test -- per-currency-balances`
- Full: `npm test`

Required coverage:

1. BALN-01: net math per participant/currency equals paid minus owed.
2. BALN-02: multiple currencies remain separate and are not merged.
3. BALN-03: output includes paid/owed/net detail sufficient for settlement inputs.
4. Decision locks: pending and rejected contributor submissions do not affect approved-balance output.

## Recommendation for Planning

Split into two plans:

1. **Balance contracts + deterministic derivation + TDD invariants** (BALN-01).
2. **Approved-only messaging and settlement-readiness shape integration** (BALN-02, BALN-03).
