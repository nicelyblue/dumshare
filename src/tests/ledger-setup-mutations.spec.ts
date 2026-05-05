import { beforeEach, describe, expect, test } from 'vitest';
import { createLedgerSetupMutations } from '../data/ledger/ledgerMutations';
import { clearLedgerDb, openLedgerDb } from '../data/sqlite/client';
import { loadLedgerDashboardSnapshot } from '../data/ledger/ledgerSnapshot';
import { createEventRepository } from '../domain/events/repository';

describe('ledger-setup-mutations', () => {
  const dbName = 'ledger-setup-mutations-test-db';

  beforeEach(() => {
    clearLedgerDb(dbName);
  });

  test('addParticipant rejects before ledger exists with setup-specific message', async () => {
    const setup = createLedgerSetupMutations(dbName);

    await expect(setup.addParticipant({ displayName: 'Alice' })).rejects.toThrow(
      'Create the ledger before adding participants',
    );
  });

  test('saveLedgerSetup trims payload fields so replay schema accepts ledger.created', async () => {
    const setup = createLedgerSetupMutations(dbName);

    await setup.saveLedgerSetup({
      title: '  Barcelona Weekend  ',
      settlementContext: '  per-currency balances  ',
    });

    const snapshot = await loadLedgerDashboardSnapshot(dbName);
    expect(snapshot.hasLedger).toBe(true);
    expect(snapshot.title).toBe('Barcelona Weekend');
    expect(snapshot.settlementContext).toBe('per-currency balances');
  });

  test('saveLedgerSetup rejects empty required values before writing invalid ledger.created payload', async () => {
    const setup = createLedgerSetupMutations(dbName);

    await expect(
      setup.saveLedgerSetup({
        title: 'Trip',
        settlementContext: '   ',
      }),
    ).rejects.toThrow('Enter a settlement context before creating the ledger');
  });

  test('clearLedgerDb resets setup snapshot to clean state', async () => {
    const setup = createLedgerSetupMutations(dbName);

    await setup.saveLedgerSetup({
      title: 'Weekend Trip',
      settlementContext: 'per-currency balances',
    });
    await setup.addParticipant({ displayName: 'Alice' });

    clearLedgerDb(dbName);

    const snapshot = await loadLedgerDashboardSnapshot(dbName);
    expect(snapshot.hasLedger).toBe(false);
    expect(snapshot.ledgerId).toBeNull();
    expect(snapshot.participantCount).toBe(0);
    expect(snapshot.title).toBe('No ledger yet');
  });

  test('dashboard snapshot recovers from legacy malformed ledger.created payload', async () => {
    const repository = createEventRepository(openLedgerDb(dbName));

    await repository.appendEvent({
      id: 'evt-ledger-created-legacy-1',
      ledgerId: 'ledger-legacy-1',
      eventType: 'ledger.created',
      eventVersion: 1,
      occurredAt: '2026-05-05T10:00:00.000Z',
      actorDeviceId: 'device-organizer-ui',
      payloadJson: JSON.stringify({
        name: ' Legacy Trip ',
      }),
    });

    await repository.appendEvent({
      id: 'evt-participant-added-legacy-1',
      ledgerId: 'ledger-legacy-1',
      eventType: 'participant.added',
      eventVersion: 1,
      occurredAt: '2026-05-05T10:01:00.000Z',
      actorDeviceId: 'device-organizer-ui',
      payloadJson: JSON.stringify({
        participantId: 'participant-legacy-1',
        displayName: 'Alice',
      }),
    });

    const snapshot = await loadLedgerDashboardSnapshot(dbName);

    expect(snapshot.hasLedger).toBe(true);
    expect(snapshot.title).toBe('Legacy Trip');
    expect(snapshot.settlementContext).toBe('Legacy ledger metadata was repaired during load.');
    expect(snapshot.participantCount).toBe(1);
    expect(snapshot.latestActivityLabel).toBe('Participant added');
  });

  test('dashboard snapshot falls back safely when ledger.created payload is non-json', async () => {
    const repository = createEventRepository(openLedgerDb(dbName));

    await repository.appendEvent({
      id: 'evt-ledger-created-legacy-2',
      ledgerId: 'ledger-legacy-2',
      eventType: 'ledger.created',
      eventVersion: 1,
      occurredAt: '2026-05-05T11:00:00.000Z',
      actorDeviceId: 'device-organizer-ui',
      payloadJson: '{broken-json',
    });

    const snapshot = await loadLedgerDashboardSnapshot(dbName);

    expect(snapshot.hasLedger).toBe(true);
    expect(snapshot.title).toBe('Recovered ledger');
    expect(snapshot.settlementContext).toBe('Legacy ledger metadata was repaired during load.');
  });
});
