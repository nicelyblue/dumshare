import { createLedgerAppService } from '../services/ledgerAppService';
import { setActiveShareId } from '../state/activeShareStore';

const DUMMY_SHARE_TITLE = 'Demo Weekend Trip';

let bootstrapPromise: Promise<void> | null = null;

function shouldPrefillDummyData(): boolean {
  return process.env.EXPO_PUBLIC_PREFILL_DUMMY_DATA === '1';
}

async function createDummyData(): Promise<void> {
  const service = createLedgerAppService();
  const existingShares = await service.listShares();
  if (existingShares.length > 0) {
    const mostRecentShare = existingShares[existingShares.length - 1];
    setActiveShareId(mostRecentShare?.id ?? null);
    return;
  }

  const ledgerId = await service.createShare({
    title: DUMMY_SHARE_TITLE,
    organizerName: 'Avery',
  });

  const homeSnapshot = await service.loadHomeSnapshot({ selectedLedgerId: ledgerId });
  const organizerId = homeSnapshot.organizerParticipantId;
  if (!organizerId) {
    throw new Error('Organizer participant was not created');
  }

  const blakeId = await service.addParticipant({ displayName: 'Blake', selectedLedgerId: ledgerId });
  const caseyId = await service.addParticipant({ displayName: 'Casey', selectedLedgerId: ledgerId });
  const drewId = await service.addParticipant({ displayName: 'Drew', selectedLedgerId: ledgerId });

  const everyone = [organizerId, blakeId, caseyId, drewId];

  await service.submitExpenseDraft(
    {
      description: 'Cab to hotel',
      currency: 'USD',
      totalAmountMinor: 7600,
      expenseDate: '2026-05-20',
      creatorRole: 'organizer',
      payers: [{ participantId: organizerId, paidAmountMinor: 7600 }],
      split: {
        mode: 'equal',
        participants: everyone.map((participantId) => ({ participantId })),
      },
    },
    ledgerId,
  );

  await service.submitExpenseDraft(
    {
      description: 'Groceries',
      currency: 'USD',
      totalAmountMinor: 9600,
      expenseDate: '2026-05-21',
      creatorRole: 'contributor',
      payers: [{ participantId: blakeId, paidAmountMinor: 9600 }],
      split: {
        mode: 'equal',
        participants: everyone.map((participantId) => ({ participantId })),
      },
    },
    ledgerId,
  );

  await service.submitExpenseDraft(
    {
      description: 'Museum tickets',
      currency: 'USD',
      totalAmountMinor: 11200,
      expenseDate: '2026-05-22',
      creatorRole: 'contributor',
      payers: [{ participantId: caseyId, paidAmountMinor: 11200 }],
      split: {
        mode: 'equal',
        participants: everyone.map((participantId) => ({ participantId })),
      },
    },
    ledgerId,
  );

  await service.submitExpenseDraft(
    {
      description: 'Dinner',
      currency: 'USD',
      totalAmountMinor: 18600,
      expenseDate: '2026-05-22',
      creatorRole: 'contributor',
      payers: [{ participantId: drewId, paidAmountMinor: 18600 }],
      split: {
        mode: 'equal',
        participants: everyone.map((participantId) => ({ participantId })),
      },
    },
    ledgerId,
  );

  await service.submitExpenseDraft(
    {
      description: 'Breakfast run',
      currency: 'USD',
      totalAmountMinor: 4800,
      expenseDate: '2026-05-23',
      creatorRole: 'organizer',
      payers: [{ participantId: organizerId, paidAmountMinor: 4800 }],
      split: {
        mode: 'equal',
        participants: everyone.map((participantId) => ({ participantId })),
      },
    },
    ledgerId,
  );

  await service.submitExpenseDraft(
    {
      description: 'Snacks and water',
      currency: 'USD',
      totalAmountMinor: 5300,
      expenseDate: '2026-05-23',
      creatorRole: 'contributor',
      payers: [{ participantId: blakeId, paidAmountMinor: 5300 }],
      split: {
        mode: 'exact',
        participants: [
          { participantId: organizerId, owedAmountMinor: 1200 },
          { participantId: blakeId, owedAmountMinor: 1800 },
          { participantId: caseyId, owedAmountMinor: 900 },
          { participantId: drewId, owedAmountMinor: 1400 },
        ],
      },
    },
    ledgerId,
  );

  await service.submitExpenseDraft(
    {
      description: 'Souvenirs',
      currency: 'USD',
      totalAmountMinor: 8900,
      expenseDate: '2026-05-24',
      creatorRole: 'contributor',
      payers: [{ participantId: caseyId, paidAmountMinor: 8900 }],
      split: {
        mode: 'percentage',
        participants: [
          { participantId: organizerId, percentageBps: 1500 },
          { participantId: blakeId, percentageBps: 2500 },
          { participantId: caseyId, percentageBps: 3500 },
          { participantId: drewId, percentageBps: 2500 },
        ],
      },
    },
    ledgerId,
  );

  await service.submitExpenseDraft(
    {
      description: 'Fuel top-up',
      currency: 'USD',
      totalAmountMinor: 6700,
      expenseDate: '2026-05-24',
      creatorRole: 'contributor',
      payers: [{ participantId: drewId, paidAmountMinor: 6700 }],
      split: {
        mode: 'exact',
        participants: [
          { participantId: organizerId, owedAmountMinor: 1000 },
          { participantId: blakeId, owedAmountMinor: 1200 },
          { participantId: caseyId, owedAmountMinor: 2800 },
          { participantId: drewId, owedAmountMinor: 1700 },
        ],
      },
    },
    ledgerId,
  );

  await service.submitExpenseDraft(
    {
      description: 'Late-night taxi',
      currency: 'USD',
      totalAmountMinor: 3800,
      expenseDate: '2026-05-24',
      creatorRole: 'contributor',
      payers: [{ participantId: organizerId, paidAmountMinor: 3800 }],
      split: {
        mode: 'exact',
        participants: [
          { participantId: organizerId, owedAmountMinor: 0 },
          { participantId: drewId, owedAmountMinor: 3800 },
        ],
      },
    },
    ledgerId,
  );

  await service.submitExpenseDraft(
    {
      description: 'Coffee break',
      currency: 'USD',
      totalAmountMinor: 2400,
      expenseDate: '2026-05-25',
      creatorRole: 'contributor',
      payers: [{ participantId: caseyId, paidAmountMinor: 2400 }],
      split: {
        mode: 'percentage',
        participants: [
          { participantId: blakeId, percentageBps: 5000 },
          { participantId: caseyId, percentageBps: 5000 },
        ],
      },
    },
    ledgerId,
  );

  setActiveShareId(ledgerId);
}

export async function bootstrapDummyData(): Promise<void> {
  if (!shouldPrefillDummyData()) {
    return;
  }

  if (!bootstrapPromise) {
    bootstrapPromise = createDummyData().finally(() => {
      bootstrapPromise = null;
    });
  }

  await bootstrapPromise;
}
