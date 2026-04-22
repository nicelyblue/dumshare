# Phase 07 Discovery — In-Person Sync Exchange

**Date:** 2026-04-22  
**Discovery level:** Level 2 (standard research)  
**Reason:** New external integration surface (QR bootstrap + BLE transport) and sync-protocol design choices.

## Inputs Reviewed

- `.planning/ROADMAP.md` (Phase 7 goal + success criteria)
- `.planning/REQUIREMENTS.md` (SYNC-01..SYNC-05)
- `.planning/STATE.md` (prior decisions + BLE risk note)
- `src/domain/events/repository.ts` and `src/data/sqlite/schema.ts` (event log + `sync_checkpoints` table)
- `src/domain/projections/replay.ts` and `src/domain/onboarding/authority.ts` (deterministic replay + organizer authority)
- Context7 CLI fallback docs:
  - `/dotintent/react-native-ble-plx`
  - `/expo/expo` (expo-camera barcode + expo-sqlite session APIs)

## Findings

1. **Current codebase is domain-first and deterministic-replay centric.**
   - Existing implementation style favors pure logic modules + replay invariants in Vitest.
   - There is no mobile UI/runtime wiring in-repo yet, so Phase 7 planning should define executable sync-domain contracts and transport/QR adapters rather than platform UI screens.

2. **`sync_checkpoints` already exists in SQLite schema.**
   - Strong signal to implement checkpoint-based delta exchange now via repository APIs.

3. **BLE + QR docs support required transport shape.**
   - BLE-PLX supports scan/connect/discover/monitor/write flows.
   - Expo camera supports barcode scanning callbacks and permission hooks.
   - These should be represented as adapter interfaces for later mobile wiring.

4. **Security/trust boundary remains organizer-centric.**
   - Prior phase decision enforces organizer as sole sync hub and approval authority.
   - Sync session initiation must keep organizer authority checks explicit.

## Planning Implications

- Split into **2 plans**:
  - Plan 01: session bootstrap contracts + checkpoint repository APIs (SYNC-01/02).
  - Plan 02: bidirectional delta exchange orchestration + plain-language status stream (SYNC-03/04/05).
- Keep each plan to 2 tasks, no checkpoints required, fully automated verification via Vitest.

## Non-Goals for This Phase Plan Set

- Full React Native screen implementation (not yet present in repository structure).
- BLE peripheral platform tuning/device-matrix hardening (follow-up when app shell exists).
