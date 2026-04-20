# Stack Research

**Domain:** Offline-first, local-only, organizer-led mobile expense sharing (Android + iOS)
**Researched:** 2026-04-20
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Expo (React Native framework) | **55.0.15** | Cross-platform app runtime + native module integration | In 2025/26, RN docs recommend using a framework for new apps; Expo is the default production framework and gives predictable native module workflow for BLE + camera + SQLite. | HIGH |
| React Native (via Expo SDK 55) | **0.83** (SDK-mapped) | Native rendering/runtime | Expo SDK 55 pins RN 0.83 in its official version matrix, reducing breakage from manual RN upgrades. | HIGH |
| TypeScript | **5.9.2** | Type-safe domain modeling | Event logs, split rules, currency math, and sync payload schemas are correctness-sensitive; strict TS reduces ledger bugs. | HIGH |
| expo-sqlite | **55.0.15** | On-device relational persistence | SQLite is the standard offline mobile datastore; Expo SQLite is first-party and now includes session/changeset APIs that fit delta sync workflows. | HIGH |
| Drizzle ORM + Drizzle Kit | **drizzle-orm 0.45.2**, **drizzle-kit 0.31.x** | Typed schema + migrations on SQLite | Best current TS ergonomics for local-first SQLite projects; Expo integration is documented and production-used. | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-ble-plx | **3.5.1** | BLE transport for in-person sync | Required for organizer↔contributor delta exchange over Bluetooth. Use with Expo config plugin + Dev Client (not Expo Go). |
| expo-camera | **55.0.15** | QR bootstrap + scan invite/session codes | Use for invite QR and sync session QR; modern barcode scanning is already supported in expo-camera. |
| @react-navigation/native (+ native stack) | **7.2.2** | App navigation | Standard RN navigation stack; integrates well with focus/background behaviors needed for manual sync flows. |
| zustand | **5.0.12** | Lightweight UI/session state | Use for transient app state (draft forms, active sync session, selected ledger), not canonical data storage. |
| zod | **4.3.6** | Runtime schema validation | Validate all imported QR/BLE payloads and migration boundaries before writing to the event log. |
| react-hook-form + @hookform/resolvers | **7.72.1** + **5.2.2** | Reliable form state + validation | Use for expense entry/edit flows to avoid bespoke form-state bugs, with Zod as single validation source. |
| expo-secure-store | **55.0.13** | Device key/secret storage | Store local cryptographic material (device identity keys, optional DB key reference). |
| expo-crypto | **55.0.14** | Hashing, random IDs, AES operations | Use for event IDs/checksums and cryptographic primitives in invitation/sync verification. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| expo-dev-client (**55.0.27**) | Test custom native modules locally | Mandatory because BLE plugin cannot run in Expo Go. |
| EAS Build (CLI) | Reproducible Android/iOS builds | Use internal distribution for field testing organizer/contributor pairing flows. |
| eslint (**10.2.1**) + prettier (**3.8.3**) | Code quality + formatting | Enforce deterministic code style in event and projection logic. |
| drizzle-kit | Generate/apply SQLite migrations | Keep schema evolution explicit and reviewable as event model evolves. |

## Installation

```bash
# Core
npx create-expo-app@latest dumshare --template blank-typescript
npm install expo@55.0.15

# Data + domain
npx expo install expo-sqlite expo-secure-store expo-crypto expo-camera
npm install drizzle-orm@0.45.2 zod@4.3.6 zustand@5.0.12
npm install react-hook-form@7.72.1 @hookform/resolvers@5.2.2

# Navigation
npm install @react-navigation/native@7.2.2 @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context

# Sync transport
npm install react-native-ble-plx@3.5.1

# Dev dependencies
npm install -D drizzle-kit@0.31.5 eslint@10.2.1 prettier@3.8.3
npx expo install expo-dev-client
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Expo SDK 55 | Bare React Native CLI | Use bare RN only if you need deep native customization beyond config plugins from day 1. For this product, Expo + prebuild is faster and still supports custom native modules. |
| expo-sqlite + Drizzle | WatermelonDB / Realm | Use only if you need built-in advanced sync framework or object graph APIs. For organizer-led manual sync and deterministic event replay, SQLite + typed SQL is simpler and more transparent. |
| react-native-ble-plx | Nearby/Multipeer custom native implementation | Use only if BLE throughput/edge-cases become a proven blocker. For MVP, BLE-PLX is the standard RN BLE choice and sufficient. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Expo Go as primary runtime for this app | BLE native module support requires custom native code; app behavior will diverge from production. | Expo Dev Client + EAS/internal builds. |
| AsyncStorage as source of truth for ledger/event log | Key-value storage is fragile for relational/event integrity and migrations. | SQLite (expo-sqlite) with explicit schema + migrations. |
| Cloud-first stacks (Firebase/Supabase as core dependency) | Violates local-only/offline-first requirement and complicates trust model. | Local SQLite + in-person QR/BLE sync. |
| Deprecated/legacy barcode-only packages as primary scanner | Adds unnecessary dependency when expo-camera already provides barcode scanning. | expo-camera barcode scanning APIs. |
| Auto-merge conflict resolution in client DB layer | Product requires organizer approval gate; auto-merge breaks governance semantics. | Explicit pending queue + organizer review + apply/reject events. |

## Stack Patterns by Variant

**If shipping strict local-only MVP (recommended):**
- Use Expo SDK 55 + expo-sqlite + Drizzle + BLE-PLX + expo-camera.
- Because this gives the fastest stable path to offline event log + in-person sync without cloud coupling.

**If later adding optional encrypted-at-rest ledger:**
- Enable SQLCipher via expo-sqlite config plugin and keep key material in expo-secure-store.
- Because this improves at-rest protection without changing sync topology or core domain model.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| expo@55.0.15 | React Native **0.83**, React **19.2.0** | From Expo version matrix for SDK 55. |
| @react-navigation/native@7.2.2 | RN >=0.72, Expo >=52 | Meets/exceeds requirements on Expo 55. |
| react-native-ble-plx@3.5.1 | Expo projects via config plugin + prebuild/dev client | Not usable inside plain Expo Go runtime. |
| drizzle-orm@0.45.2 | expo-sqlite driver integration | Use Drizzle Expo SQLite driver + drizzle-kit expo config. |

## Sources

- React Native docs (0.85): https://reactnative.dev/docs/environment-setup — framework recommendation for new apps (HIGH)
- Expo SDK reference (latest): https://docs.expo.dev/versions/latest/ — SDK↔RN/React matrix and platform support (HIGH)
- Expo SQLite docs: https://docs.expo.dev/versions/latest/sdk/sqlite/ — WAL guidance, transactions, session/changeset APIs (HIGH)
- Context7 `/expo/expo` docs query: "expo-sqlite SQLiteSession createChangeset applyChangeset" (HIGH)
- Drizzle docs: https://orm.drizzle.team/docs/get-started-sqlite and Context7 `/drizzle-team/drizzle-orm` query "connect expo sqlite" (HIGH)
- React Navigation docs: https://reactnavigation.org/docs/getting-started and Context7 `/react-navigation/react-navigation.github.io` minimum requirements query (HIGH)
- BLE-PLX repo + Context7 `/dotintent/react-native-ble-plx` docs (Expo plugin + not Expo Go): https://github.com/dotintent/react-native-ble-plx (HIGH)
- npm registry version checks (2026-04-20): react-native, expo, expo-sqlite, drizzle-orm, zod, zustand, ble-plx, etc. (MEDIUM)

---
*Stack research for: offline organizer-led mobile expense sharing*
*Researched: 2026-04-20*
