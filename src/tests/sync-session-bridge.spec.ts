import { describe, expect, test } from 'vitest';
import { createEventRepository } from '../domain/events/repository';
import { clearLedgerDb, openLedgerDb } from '../data/sqlite/client';
import { createLedgerSetupMutations } from '../data/ledger/ledgerMutations';
import { buildSyncRequestQr, parseSyncRequestQr, runSyncTransfer } from '../data/ledger/syncSession';
import { createExpenseDraftMutations } from '../data/ledger/expenseDrafts';

describe('sync session bridge helpers', () => {
  test('invalid QR payload returns plain-language parse error', () => {
    const parsed = parseSyncRequestQr('not-json');
    expect(parsed.ok).toBe(false);
    if (parsed.ok === false) {
      expect(parsed.error).toContain('valid JSON');
    }
  });

  test('valid QR payload runs exchange and returns deterministic timeline', async () => {
    const dbName = 'phase12-sync-1';
    clearLedgerDb(dbName);
    const setup = createLedgerSetupMutations(dbName);
    const expense = createExpenseDraftMutations(dbName);
    const ledgerId = await setup.saveLedgerSetup({ title: 'Trip', settlementContext: 'Summer' });
    const alice = await setup.addParticipant({ displayName: 'Alice' });
    const bob = await setup.addParticipant({ displayName: 'Bob' });

    await expense.submitExpenseDraft({
      description: 'Lunch',
      currency: 'EUR',
      totalAmountMinor: 1000,
      expenseDate: '2026-05-04',
      creatorRole: 'organizer',
      payers: [{ participantId: alice, paidAmountMinor: 1000 }],
      split: { mode: 'equal', participants: [{ participantId: alice }, { participantId: bob }] },
    });

    const request = await buildSyncRequestQr(dbName);
    const db = openLedgerDb(dbName);
    const repository = createEventRepository(db);
    const remoteEvents = await repository.listEventsByLedger(ledgerId);
    const result = await runSyncTransfer({ dbName, rawRequestQr: request, remoteEvents });

    expect(result.statusTimeline).toEqual([
      'QR request scanned',
      expect.stringContaining('Sending'),
      expect.stringContaining('Receiving'),
      'Sync complete',
    ]);
  });
});
