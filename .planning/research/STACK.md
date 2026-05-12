# Technology Stack

**Project:** Dumshare (frontend milestone)
**Researched:** 2026-05-12

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Expo | 55.0.23 | React Native app runtime + build tooling | Already in repo, current stable Expo line, and best compatibility surface for mobile-first local app delivery. |
| React Native (via Expo SDK 55) | 0.83 (Expo-managed) | UI runtime | Keeps native/runtime compatibility in lockstep with Expo and avoids manual RN version drift. |
| Expo Router | 55.0.14 | File-based navigation for tabs + drawer + stack flows | Standard Expo-first navigation model in 2025/2026; reduces boilerplate and gives typed routes/deep-link parity by default. |

### Database
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| expo-sqlite | 55.0.15 | On-device SQLite in Expo runtime | Standard local persistence bridge in managed Expo apps; aligns with existing local-first requirement. |
| drizzle-orm | 0.45.2 | Typed SQL/event-store access layer | Already used by backend/domain modules; keep one data abstraction across write/read models. |

### Infrastructure
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @tanstack/react-query | 5.100.10 | Async state/cache for snapshots and query invalidation | Best-in-class server/async-state ergonomics in RN; useful even local-first for snapshot reads, stale management, and mutation lifecycle. |
| Zustand | 5.0.13 | Lightweight UI/session state (active tab, draft form state, modal controls) | Minimal boilerplate and fast selector-based updates; complements Query rather than replacing domain/repository state. |
| expo-secure-store | Expo SDK bundled | Store small sensitive prefs/secrets if introduced later | Keeps sensitive material out of plain kv/db; optional now but recommended baseline for future sync tokens. |

### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-paper | 5.15.2 | Material-style UI primitives (AppBar, FAB, menus, dialogs, theme) | Use to accelerate mock-to-production UI delivery for this milestone. |
| react-hook-form | 7.75.0 | Form orchestration for share creation/expense forms | Use for complex forms with validation and fewer re-renders than ad-hoc controlled state. |
| zod | 4.4.3 | Runtime schema validation for UI inputs before mutation calls | Use at UI boundary to normalize/validate before calling existing domain mutation APIs. |
| @shopify/flash-list | 2.3.1 | High-performance long lists (ledger entries, participant lists) | Use where list growth and smooth scrolling matter; keep FlatList for tiny lists. |
| react-native-reanimated | 4.3.1 | Smooth UI-thread animations for drawer/menus/transitions | Use for interactions that must remain fluid on low-end devices. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Navigation | Expo Router | Raw React Navigation route trees | Works, but adds manual route wiring and more boilerplate in a greenfield frontend rebuild. |
| Async Data | TanStack Query + explicit invalidation | Redux Toolkit Query | RTKQ is solid, but introduces global reducer/action setup overhead not needed for this app’s local projection reads. |
| UI State | Zustand | Redux Toolkit | RTK is heavier than needed for transient UI state in this milestone. |
| SQLite access | expo-sqlite (+ existing Drizzle usage) | better-sqlite3 in app runtime | better-sqlite3 is Node-native and not appropriate for Expo mobile runtime path; keep it for non-mobile tooling/tests only. |

## Installation

```bash
# Core frontend/runtime
npm install expo-router expo-sqlite

# Data and state
npm install @tanstack/react-query zustand

# UI and forms
npm install react-native-paper react-hook-form zod @shopify/flash-list

# Motion
npm install react-native-reanimated

# Expo-aligned native deps (install with expo to match SDK)
npx expo install react-native-screens react-native-safe-area-context react-native-gesture-handler
```

## Prescriptive Integration Notes for This Codebase

1. **Do not duplicate domain logic in UI.** Keep `src/domain` + `src/data/ledger/*` as the single mutation/read-model source; UI only adapts inputs/outputs.
2. **Query keys should mirror ledger scope.** Example: `['ledger', ledgerId, 'dashboard']`, `['ledger', ledgerId, 'entries']`, `['ledger', ledgerId, 'settlement', currency]`.
3. **Mutations should invalidate projection queries, not hand-patch deep state.** This preserves event-sourced correctness and avoids UI/domain drift.
4. **Use Zustand only for ephemeral UI concerns** (active drawer section, in-progress draft field UX state, modal visibility), not authoritative ledger state.
5. **Use FlashList for Ledger Entries screen early.** It prevents later rework once event history grows.

## Sources

- Expo SDK reference (latest): https://docs.expo.dev/versions/latest/  
  Confidence: **HIGH** (official docs)
- Expo Router introduction (updated 2026-05-05): https://docs.expo.dev/router/introduction/  
  Confidence: **HIGH** (official docs)
- Expo SQLite docs: https://docs.expo.dev/versions/latest/sdk/sqlite/  
  Confidence: **HIGH** (official docs)
- React Navigation getting started (7.x): https://reactnavigation.org/docs/getting-started/  
  Confidence: **HIGH** (official docs)
- TanStack Query React Native guidance: https://tanstack.com/query/latest/docs/framework/react/react-native  
  Confidence: **HIGH** (official docs)
- React Native Paper getting started (v5): https://callstack.github.io/react-native-paper/docs/guides/getting-started/  
  Confidence: **HIGH** (official docs)
- FlashList docs (last updated 2026-03-27): https://shopify.github.io/flash-list/docs/  
  Confidence: **HIGH** (official docs)
- npm package versions (current as of research date): https://www.npmjs.com/  
  Confidence: **MEDIUM** (registry snapshot at research time)
