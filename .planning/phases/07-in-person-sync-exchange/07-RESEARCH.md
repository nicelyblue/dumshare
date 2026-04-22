# Phase 7: In-Person Sync Exchange — Research

**Date:** 2026-04-22  
**Status:** Complete  
**Phase requirements:** SYNC-01, SYNC-02, SYNC-03, SYNC-04, SYNC-05

## Objective

Identify the lowest-risk implementation approach for offline, organizer-led, in-person synchronization that exchanges unseen events in both directions with checkpoint-based deltas and clear user-facing status semantics.

## Existing Baseline (from code)

- `src/domain/events/repository.ts`
  - Can append events and list all events by ledger in sequence.
- `src/data/sqlite/schema.ts`
  - Already defines `sync_checkpoints(peer_id, last_sequence)` table.
- `src/domain/projections/replay.ts`
  - Deterministic ordered replay and fail-fast validation.
- `src/domain/onboarding/authority.ts`
  - Organizer-only sync hub guard exists (`assertOrganizerSyncHub`).

## Documentation Findings (Context7 CLI)

### BLE transport (react-native-ble-plx)

- `startDeviceScan` supports discovery callbacks for in-person peer detection.
- `discoverAllServicesAndCharacteristicsForDevice` supports post-connect service setup.
- `monitorCharacteristicForDevice` + `writeCharacteristicWithResponseForDevice` supports request/response payload exchange for sync chunks.

### QR bootstrap (expo-camera)

- `CameraView` with `onBarcodeScanned` and `barcodeScannerSettings` supports sync-request QR scanning.
- `useCameraPermissions` supports runtime camera gate and request flow.

### SQLite checkpoint primitives (expo-sqlite session docs)

- Session/changeset APIs exist for changeset workflows, but current repo already uses append-only event log + sequence checkpoints.
- For consistency with existing architecture, prefer event-log checkpoint deltas now; do not switch to DB-level changesets mid-milestone.

## Recommended Architecture for Phase 7

Implement a **domain-level sync protocol** with transport-agnostic interfaces:

1. **Sync request QR contract (contributor -> organizer):**
   - Contains `ledgerId`, `requesterDeviceId`, contributor checkpoint (`lastSeenSequence`), nonce, and timestamp.
2. **Session establishment (organizer authority):**
   - Organizer validates request and returns a deterministic session descriptor.
3. **Checkpoint delta exchange:**
   - Each side sends unseen events `sequence > peerCheckpoint`.
   - Dedupe by `event.id` on apply.
4. **Bidirectional in one workflow:**
   - Contributor upload delta + organizer return delta are both represented in one exchange result object.
5. **Plain-language progress/status:**
   - Provide status timeline strings from sync service (`"QR request scanned"`, `"Sending 3 changes"`, `"Received 2 changes"`, `"Sync complete"`).

## Security / Trust Boundaries

1. **Contributor QR payload -> organizer parser**
   - Untrusted QR data enters trusted organizer logic.
   - Mitigation: strict payload validation and ledger/device consistency checks.
2. **Remote event batch -> local append repository**
   - Potential tampered/duplicate payloads.
   - Mitigation: schema validation + duplicate event ID filtering + deterministic append order.
3. **Sync action caller -> organizer-only hub operations**
   - Potential unauthorized actor.
   - Mitigation: `assertOrganizerSyncHub` before organizer session/open steps.

## Common Pitfalls to Avoid

1. Applying full event history every sync instead of delta-by-checkpoint.
2. Treating upload/download as separate disconnected flows (must remain one session result for SYNC-04).
3. Non-deterministic status messaging (must be plain-language and testable).
4. Allowing organizer authority bypass during session establishment.

## Architectural Responsibility Map

- **`src/domain/sync/*`**: Session contracts, QR/request parsing, exchange orchestration.
- **`src/domain/events/repository.ts`**: Checkpoint read/write and `listEventsAfterSequence` delta source.
- **`src/tests/*sync*.spec.ts`**: Executable SYNC invariants.
- **Transport adapters (future mobile layer)**: BLE and camera integration against domain interfaces.

## Validation Architecture

Use Vitest with phase-focused suites:

- Quick: `npm run test -- in-person-sync`
- Full: `npm test`

Required coverage:

1. QR request contract parse/validation and organizer session establishment checks.
2. Delta calculation from peer checkpoints and bidirectional exchange payload composition.
3. Dedupe + checkpoint advancement invariants.
4. Plain-language status timeline assertions during send/receive lifecycle.

## Recommendation for Planning

Split into two execution plans:

1. **Contracts + repository checkpoint APIs + session bootstrap tests** (SYNC-01, SYNC-02).
2. **Bidirectional delta exchange + status timeline tests** (SYNC-03, SYNC-04, SYNC-05).
