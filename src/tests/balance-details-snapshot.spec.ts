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
    await setup.saveLedgerSetup({ title: 'Trip', settlementContext: 'Beach' });
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
    expect(snapshot.participants[0]?.balancesByCurrency[0]).toHaveProperty('currency');
    expect(snapshot.participants[0]?.balancesByCurrency[0]).not.toHaveProperty('convertedAmount');
  });

  test('returns approved-only scope note when pending submissions exist', async () => {
    const dbName = 'phase12-balance-2';
    clearLedgerDb(dbName);
    const setup = createLedgerSetupMutations(dbName);
    const expense = createExpenseDraftMutations(dbName);
    const ledgerId = await setup.saveLedgerSetup({ title: 'Trip', settlementContext: 'Hike' });
    const alice = await setup.addParticipant({ displayName: 'Alice' });
    const bob = await setup.addParticipant({ displayName: 'Bob' });
    const repository = createEventRepository(openLedgerDb(dbName));

    await repository.appendEvent({
      id: 'evt-invite-issued-pending',
      ledgerId,
      eventType: 'invite.issued',
      eventVersion: 1,
      occurredAt: '2026-05-04T11:00:00.000Z',
      actorDeviceId: 'device-organizer-ui',
      payloadJson: JSON.stringify({
        inviteId: 'invite-pending',
        participantId: bob,
        inviteCode: 'JOIN-BOB',
      }),
    });

    await repository.appendEvent({
      id: 'evt-invite-consumed-pending',
      ledgerId,
      eventType: 'invite.consumed',
      eventVersion: 1,
      occurredAt: '2026-05-04T11:01:00.000Z',
      actorDeviceId: 'device-contributor-ui',
      payloadJson: JSON.stringify({
        inviteId: 'invite-pending',
        participantId: bob,
        contributorDeviceId: 'device-contributor-ui',
      }),
    });

    await expense.submitExpenseDraft({
      description: 'Pending taxi',
      currency: 'EUR',
      totalAmountMinor: 800,
      expenseDate: '2026-05-04',
      creatorRole: 'contributor',
      payers: [{ participantId: bob, paidAmountMinor: 800 }],
      split: { mode: 'equal', participants: [{ participantId: alice }, { participantId: bob }] },
    });

    const snapshot = await loadBalanceDetailSnapshot(dbName);
    expect(snapshot.metadata.approvalScopeNote).toBe('Balances reflect approved entries only; pending changes are not included.');
  });
});
