# Project Research Summary

**Project:** Dumshare (frontend milestone)
**Domain:** Local-first mobile shared-expense app on an event-sourced backend
**Researched:** 2026-05-12
**Confidence:** HIGH

## Executive Summary

Dumshare is a mobile-first, local-first shared-expense tracker where trust depends on deterministic calculations and transparent history, not sync or social features. The research converges on a conservative integration strategy: keep the existing event-sourced domain/data layer authoritative and rebuild the frontend as a thin, typed adapter-driven UI that issues intents, then rehydrates from replayed snapshots.

The recommended approach is Expo SDK 55 + Expo Router + expo-sqlite with TanStack Query for snapshot lifecycle and Zustand only for ephemeral UI state. Feature sequencing should prioritize end-to-end vertical slices over screen-by-screen mock implementation: setup and active-share context first, then expense lifecycle, then settlement and polish. This order reduces boundary mismatch risk early and ensures every phase ships real mutation+query roundtrips.

The top risks are UI/domain drift (bypassing mutation boundaries), stale cross-screen projections, and identity bugs (name/index-based edits). Mitigation is explicit: enforce a Ledger App Service Adapter boundary, use ledgerId-scoped query invalidation on every mutation/share switch, and require canonical IDs in all edit/delete flows with integration tests that validate replayed outcomes after restart.

## Key Findings

### Recommended Stack

The stack is strongly aligned with existing repo direction and current official guidance: Expo-managed RN runtime, file-based router, local SQLite persistence, and typed data access through existing Drizzle-backed modules. State is split by concern: TanStack Query for projection data lifecycle and Zustand for transient UX state.

**Core technologies:**
- **Expo SDK 55 / React Native 0.83 (managed):** mobile runtime/tooling baseline — best compatibility and lowest integration drift for this milestone.
- **Expo Router 55:** navigation shell (tabs/drawer/stack) — standard Expo-first route model with less boilerplate.
- **expo-sqlite 55:** on-device persistence bridge — fits local-first requirement in managed Expo runtime.
- **TanStack Query v5:** snapshot cache/invalidation — ideal for mutation-then-refresh patterns against replayed read models.
- **Zustand v5:** ephemeral UI state only — lightweight control for draft/form/modal/theme without becoming data authority.
- **react-native-paper, react-hook-form, zod, FlashList, reanimated:** accelerate robust forms/lists/animations while preserving performance.

Critical version constraints: keep Expo SDK and bundled native deps in lockstep (`npx expo install` for native packages); avoid runtime-incompatible SQLite alternatives like `better-sqlite3` in mobile app code.

### Expected Features

Research is clear that MVP must deliver complete shared-expense core loops, not peripheral novelty. The user value is rapid setup, reliable expense entry, clear balances, editable history, and settlement closure.

**Must have (table stakes):**
- Onboarding + create share + participant management
- Active share switching via side menu
- Home balance snapshot (net/owed/owes) with resilient states
- Add expense (payer, participants, currency, equal/custom split)
- Ledger history with edit/delete correction path
- Settle-up recommendations by selected currency
- Navigation shell, theme toggle, and destructive reset control

**Should have (competitive):**
- Explainable settle-up outcome card
- Last-entered expense surfaced on Home
- Explicit offline-resilience UX cues
- Fast multi-share long-press shortcuts

**Defer (v2+):**
- Auth/accounts, cloud sync/realtime collaboration
- Web/desktop optimization track
- Advanced split logic (weights/templates/OCR/automation)

### Architecture Approach

Adopt **UI Screen → Screen Controller/ViewModel → Ledger App Service Adapter → existing `src/data/ledger/*` APIs**. Screens remain render/input surfaces; controllers orchestrate validation and loading states; adapter is the anti-corruption boundary that normalizes parameters, maps domain errors, and centralizes active-ledger resolution. Queries hydrate screens first; mutations are followed by snapshot refresh instead of deep optimistic tree patching.

**Major components:**
1. **Navigation shell + active-share context** — route composition and global context display
2. **Controllers/ViewModels** — intent handling, UX validation, and command/query orchestration
3. **Ledger App Service Adapter** — one-way gateway into existing domain/data APIs with typed DTO/error mapping
4. **UI state store (ephemeral only)** — theme, modal state, draft inputs
5. **Existing mutation/query modules** — canonical event append + replayed projections

### Critical Pitfalls

1. **Bypassing domain mutation/validation paths** — prevent via mandatory adapter gateway and integration tests on replayed outcomes.
2. **Unreconciled optimistic UI** — prevent via temporary IDs + post-success projection refresh as source of truth.
3. **Cross-screen stale snapshots** — prevent with ledgerId-scoped query keys and strict invalidation on mutation/switch.
4. **Identity mismatch (name/index vs ID)** — prevent by carrying canonical IDs through all edit/delete actions and duplicate-name tests.
5. **Building on placeholder/incomplete read-model fields** — prevent with typed guards/fallbacks and data-fidelity gates before exposing sensitive views.

## Implications for Roadmap

Based on combined research, suggested phase structure:

### Phase 1: Integration Foundation (Adapter + Contracts)
**Rationale:** Highest architectural risk sits at the UI/domain boundary; resolve before UI scale.
**Delivers:** Ledger App Service Adapter, DTO mappers, error taxonomy, boundary contract matrix, smoke tests.
**Addresses:** Enables all table-stakes features safely.
**Avoids:** Pitfalls 1 and 5 (domain bypass, placeholder field misuse).

### Phase 2: Navigation Shell + Active Share Context
**Rationale:** All feature flows depend on stable share scoping and refresh lifecycle.
**Delivers:** Header/menu/tabs, share list/highlight/switching, focus-refresh contract.
**Addresses:** Persistent share switching, navigation shell table stakes.
**Avoids:** Pitfalls 3 and moderate nav lifecycle pitfall.

### Phase 3: Share Setup Vertical Slice
**Rationale:** First complete user loop validates event flow earliest.
**Delivers:** Welcome → create share → add/edit/delete participants → transition to home.
**Addresses:** Onboarding, share setup, participant management.
**Avoids:** Pitfall 4 (identity mismatch) via ID-first mutation commands.

### Phase 4: Home Snapshot Read Models
**Rationale:** Home is the trust dashboard and post-mutation landing state.
**Delivers:** Net/owed/owes cards, latest expense block, robust empty/loading/error states.
**Addresses:** Home balance snapshot, differentiator (last-entered expense).
**Avoids:** Pitfalls 2 and 3 via query-first hydration + invalidation.

### Phase 5: Expense + Ledger Lifecycle
**Rationale:** Core product value and highest domain-rule density.
**Delivers:** Add expense (currency, equal/custom split), ledger list, edit/delete with confirmations.
**Addresses:** Add expense, split modes, ledger history, correction workflows.
**Avoids:** Pitfalls 1, 2, 4 and moderate currency/split divergence.

### Phase 6: Settlement + Explainability
**Rationale:** Depends on reliable balances and expense history.
**Delivers:** Currency-based settle-up recommendations + explainable outcome card.
**Addresses:** Settle-up table stake + trust differentiator.
**Avoids:** Stale/mixed-currency settlement outputs via recompute on latest snapshot.

### Phase 7: Cross-Cutting Controls + Hardening
**Rationale:** Lower integration risk; layer after core loops are stable.
**Delivers:** Theme toggle, delete-all reset lifecycle, E2E/UAT coverage for full mobile journey.
**Addresses:** Theme + data lifecycle controls, offline confidence UX.
**Avoids:** Reset handle leakage, destructive-action UX errors, hidden QA gaps.

### Phase Ordering Rationale

- Dependencies require adapter and active-share context before feature-heavy screens.
- Architecture favors vertical slices with real mutation+query loops each phase.
- Risk-first ordering addresses highest rewrite drivers (boundary mismatch, stale caches, identity errors) early.

### Research Flags

Phases likely needing deeper `/gsd-research-phase` during planning:
- **Phase 5 (Expense + Ledger lifecycle):** complex split/currency edge cases and edit/delete authority paths.
- **Phase 6 (Settlement explainability):** UX wording and algorithm explanation quality need targeted validation.
- **Phase 7 (Hardening/E2E):** mobile E2E tooling strategy and deterministic offline/restart assertions.

Phases with standard patterns (can likely skip extra research):
- **Phase 1 (Adapter/contracts):** well-defined by existing repo architecture and documented boundaries.
- **Phase 2 (Navigation shell/context):** conventional Expo Router + query invalidation patterns.
- **Phase 3 (Share setup):** straightforward CRUD flow over known mutation APIs.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Predominantly official Expo/TanStack/library docs plus repo alignment. |
| Features | HIGH | Derived directly from project scope + explicit frontend flow artifacts. |
| Architecture | HIGH | Matches existing codebase boundaries and risk controls clearly. |
| Pitfalls | HIGH | Grounded in known concerns/testing gaps and event-sourcing failure modes. |

**Overall confidence:** HIGH

### Gaps to Address

- **Mobile E2E tooling decision (Detox/Maestro/Expo-compatible approach):** choose during planning hardening phase and lock smoke paths early.
- **Performance thresholds for replay/list growth:** define measurable targets (snapshot load, list FPS) and instrument in Phase 5/7.
- **Placeholder read-model fields identified in concerns:** verify data fidelity before exposing any detailed financial-review UI.

## Sources

### Primary (HIGH confidence)
- `.planning/research/STACK.md`
- `.planning/research/FEATURES.md`
- `.planning/research/ARCHITECTURE.md`
- `.planning/research/PITFALLS.md`
- `.planning/PROJECT.md`
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/CONCERNS.md`
- `.planning/codebase/TESTING.md`
- `frontend mock/plans.txt`
- Official docs referenced in STACK.md (Expo, Expo Router, expo-sqlite, TanStack Query, React Navigation, React Native Paper, FlashList)

### Secondary (MEDIUM confidence)
- npm registry version snapshots (as of research date)

### Tertiary (LOW confidence)
- None identified

---
*Research completed: 2026-05-12*
*Ready for roadmap: yes*
