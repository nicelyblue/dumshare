import { beforeEach, describe, expect, test } from 'vitest';
import { createLedgerSetupMutations } from '../data/ledger/ledgerMutations';
import { clearLedgerDb, openLedgerDb } from '../data/sqlite/client';
import { loadLedgerDashboardSnapshot } from '../data/ledger/ledgerSnapshot';
import { createEventRepository } from '../domain/events/repository';
import { createExpenseDraftMutations } from '../data/ledger/expenseDrafts';

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
      settlementContext: '  per-currency  ',
    });

    const snapshot = await loadLedgerDashboardSnapshot(dbName);
    expect(snapshot.hasLedger).toBe(true);
    expect(snapshot.title).toBe('Barcelona Weekend');
    expect(snapshot.settlementContext).toBe('per-currency');
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

  test('saveLedgerSetup rejects invalid settlement context values', async () => {
    const setup = createLedgerSetupMutations(dbName);

    await expect(
      setup.saveLedgerSetup({
        title: 'Trip',
        settlementContext: 'custom settlement text',
      }),
    ).rejects.toThrow('Settlement mode must be per-currency or by-ledger-currency:<ISO code>');
  });

  test('saveLedgerSetup accepts by-ledger-currency with valid ISO code', async () => {
    const setup = createLedgerSetupMutations(dbName);

    await setup.saveLedgerSetup({
      title: 'Trip',
      settlementContext: 'by-ledger-currency:EUR',
    });

    const snapshot = await loadLedgerDashboardSnapshot(dbName);
    expect(snapshot.settlementContext).toBe('by-ledger-currency:EUR');
  });

  test('clearLedgerDb resets setup snapshot to clean state', async () => {
    const setup = createLedgerSetupMutations(dbName);

    await setup.saveLedgerSetup({
      title: 'Weekend Trip',
      settlementContext: 'per-currency',
    });
    await setup.addParticipant({ displayName: 'Alice' });

    clearLedgerDb(dbName);

    const snapshot = await loadLedgerDashboardSnapshot(dbName);
    expect(snapshot.hasLedger).toBe(false);
    expect(snapshot.ledgerId).toBeNull();
    expect(snapshot.participantCount).toBe(0);
    expect(snapshot.title).toBe('No ledger yet');
  });

  test('participant can be renamed and updated name appears in snapshot', async () => {
    const setup = createLedgerSetupMutations(dbName);

    await setup.saveLedgerSetup({
      title: 'Weekend Trip',
      settlementContext: 'per-currency',
    });
    const participantId = await setup.addParticipant({ displayName: 'Alice' });

    await setup.renameParticipant({ participantId, displayName: 'Alicia' });

    const snapshot = await loadLedgerDashboardSnapshot(dbName);
    const renamed = snapshot.balanceSummary.participants.find((participant) => participant.participantId === participantId);
    expect(renamed?.displayName).toBe('Alicia');
    expect(snapshot.latestActivityLabel).toBe('Participant renamed');
  });

  test('participant can be removed when no ledger activity references it', async () => {
    const setup = createLedgerSetupMutations(dbName);

    await setup.saveLedgerSetup({
      title: 'Weekend Trip',
      settlementContext: 'per-currency',
    });
    await setup.addParticipant({ displayName: 'Alice' });
    const removableId = await setup.addParticipant({ displayName: 'Bob' });

    await setup.removeParticipant({ participantId: removableId });

    const snapshot = await loadLedgerDashboardSnapshot(dbName);
    expect(snapshot.participantCount).toBe(2);
    const names = snapshot.balanceSummary.participants.map((participant) => participant.displayName);
    expect(names).toContain('Organizer');
    expect(names).toContain('Alice');
    expect(snapshot.latestActivityLabel).toBe('Participant removed');
  });

  test('participant removal is blocked once ledger activity references them', async () => {
    const setup = createLedgerSetupMutations(dbName);
    const draftMutations = createExpenseDraftMutations(dbName);

    await setup.saveLedgerSetup({
      title: 'Weekend Trip',
      settlementContext: 'per-currency',
    });
    const aliceId = await setup.addParticipant({ displayName: 'Alice' });
    const bobId = await setup.addParticipant({ displayName: 'Bob' });

    await draftMutations.submitExpenseDraft({
      description: 'Dinner',
      currency: 'EUR',
      totalAmountMinor: 2000,
      expenseDate: '2026-05-05',
      creatorRole: 'organizer',
      payers: [{ participantId: aliceId, paidAmountMinor: 2000 }],
      split: {
        mode: 'equal',
        participants: [{ participantId: aliceId }, { participantId: bobId }],
      },
    });

    await expect(setup.removeParticipant({ participantId: bobId })).rejects.toThrow(
      'Cannot remove participant with existing ledger activity or invites',
    );
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
