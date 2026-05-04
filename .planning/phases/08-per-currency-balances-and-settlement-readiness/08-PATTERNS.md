# Phase 08 Pattern Map

## Target Files and Analog Sources

| Target | Role | Closest Analog | Reuse Pattern |
|--------|------|----------------|---------------|
| `src/domain/balances/types.ts` | New domain contract types | `src/domain/sync/types.ts` | Export-only type module with explicit discriminated/structured shapes |
| `src/domain/balances/derive.ts` | Deterministic computation logic | `src/domain/projections/replay.ts` (helper functions) | Pure functions, fail-fast guards, integer-only math, deterministic iteration |
| `src/domain/balances/index.ts` | Barrel export surface | `src/domain/sync/index.ts` | Explicit named exports for stable downstream imports |
| `src/tests/per-currency-balances.spec.ts` | Requirement invariant tests | `src/tests/expense-split-modes.spec.ts`, `src/tests/organizer-approval-gate.spec.ts` | Contract assertions + replay-driven invariants using literal fixture events |

## Concrete Code Patterns to Follow

1. **Deterministic ordering and integer arithmetic**
   - Follow replay/test conventions where minor units are integers and assertions compare exact values.

2. **Fail-fast guard style**
   - When malformed state is encountered, throw explicit `Error("...")` with plain-language text.

3. **Test structure**
   - Use `describe("... contracts")` for static/source shape checks.
   - Use `describe("... invariants")` for replay-derived behavior checks.

4. **No hidden state mutation**
   - Keep derivation function pure (`input projection -> output balances`) with no repository writes.
