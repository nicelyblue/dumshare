import { describe, expect, test } from 'vitest';
import { clearLedgerDb } from '../data/sqlite/client';
import { createLedgerSetupMutations } from '../data/ledger/ledgerMutations';
import { createExpenseDraftMutations } from '../data/ledger/expenseDrafts';
import { loadBalanceDetailSnapshot } from '../data/ledger/balanceDetails';
import { createEventRepository } from '../domain/events/repository';
import { openLedgerDb } from '../data/sqlite/client';

describe('balance detail snapshot', () => {
  test('returns participant rows grouped per currency with no merged fields', async () => {
    const dbName = 'phase12-balance-1';
    clearLedgerDb(dbName);
    const setup = createLedgerSetupMutations(dbName);
    const expense = createExpenseDraftMutations(dbName);
    await setup.saveLedgerSetup({ title: 'Trip', settlementContext: 'per-currency' });
    const alice = await setup.addParticipant({ displayName: 'Alice' });
    const bob = await setup.addParticipant({ displayName: 'Bob' });

    await expense.submitExpenseDraft({
      description: 'Dinner',
      currency: 'EUR',
      totalAmountMinor: 2000,
      expenseDate: '2026-05-04',
      creatorRole: 'organizer',
      payers: [{ participantId: alice, paidAmountMinor: 2000 }],
      split: { mode: 'equal', participants: [{ participantId: alice }, { participantId: bob }] },
    });

    const snapshot = await loadBalanceDetailSnapshot(dbName);
    const firstBalanceRow = snapshot.participants
      .flatMap((participant) => participant.balancesByCurrency)
      .at(0);
    expect(firstBalanceRow).toHaveProperty('currency');
    expect(firstBalanceRow).not.toHaveProperty('convertedAmount');
  });
});
