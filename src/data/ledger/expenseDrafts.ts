import { openLedgerDb } from '../../data/sqlite/client';
import { createEventRepository } from '../../domain/events/repository';
import type { EventInput, ExpenseCreatedPayload, ExpenseSplitPayload } from '../../domain/events/types';

export type ExpenseDraftInput = {
  description: string;
  currency: string;
  totalAmountMinor: number;
  expenseDate: string;
  creatorRole: 'organizer' | 'contributor';
  payers: {
    participantId: string;
    paidAmountMinor: number;
  }[];
  split: ExpenseSplitPayload;
};

type BuildExpenseEventInput = {
  ledgerId: string;
  actorDeviceId: string;
  draft: ExpenseDraftInput;
  occurredAt?: string;
};

type ExpenseDraftMutations = {
  submitExpenseDraft: (input: ExpenseDraftInput) => Promise<string>;
};

function createEventId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function resolveLatestLedgerId(dbName: string): string | null {
  const db = openLedgerDb(dbName);
  const row = db.sqlite
    .prepare('SELECT ledger_id AS ledgerId FROM events ORDER BY sequence DESC LIMIT 1')
    .get() as { ledgerId?: string } | undefined;

  return row?.ledgerId ?? null;
}

function sanitizeSplit(split: ExpenseSplitPayload): ExpenseSplitPayload {
  if (split.mode === 'equal') {
    return {
      mode: 'equal',
      participants: split.participants
        .map((participant) => ({ participantId: participant.participantId.trim() }))
        .filter((participant) => participant.participantId.length > 0),
    };
  }

  if (split.mode === 'exact') {
    return {
      mode: 'exact',
      participants: split.participants
        .map((participant) => ({
          participantId: participant.participantId.trim(),
          owedAmountMinor: participant.owedAmountMinor,
        }))
        .filter((participant) => participant.participantId.length > 0),
    };
  }

  return {
    mode: 'percentage',
    participants: split.participants
      .map((participant) => ({
        participantId: participant.participantId.trim(),
        percentageBps: participant.percentageBps,
      }))
      .filter((participant) => participant.participantId.length > 0),
  };
}

export function normalizeExpenseDraft(input: ExpenseDraftInput): ExpenseCreatedPayload {
  const description = input.description.trim();
  const currency = input.currency.trim().toUpperCase();
  const expenseDate = input.expenseDate.trim();
  const payers = input.payers
    .map((payer) => ({
      participantId: payer.participantId.trim(),
      paidAmountMinor: payer.paidAmountMinor,
    }))
    .filter((payer) => payer.participantId.length > 0);
  const split = sanitizeSplit(input.split);

  if (!description) {
    throw new Error('Expense description is required');
  }

  if (!currency) {
    throw new Error('Expense currency is required');
  }

  if (!Number.isInteger(input.totalAmountMinor) || input.totalAmountMinor <= 0) {
    throw new Error('Expense total must be a positive whole number');
  }

  if (!expenseDate) {
    throw new Error('Expense date is required');
  }

  if (payers.length === 0) {
    throw new Error('At least one payer row is required');
  }

  if (
    payers.some(
      (payer) => !Number.isInteger(payer.paidAmountMinor) || payer.paidAmountMinor <= 0,
    )
  ) {
    throw new Error('Each payer amount must be a positive whole number');
  }

  if (split.participants.length === 0) {
    throw new Error('Select at least one split participant');
  }

  const expenseId = createEventId('expense');

  return {
    expenseId,
    description,
    currency,
    totalAmountMinor: input.totalAmountMinor,
    expenseDate,
    creatorRole: input.creatorRole,
    payers,
    split,
  };
}

export function buildExpenseCreatedEventInput(input: BuildExpenseEventInput): EventInput {
  const payload = normalizeExpenseDraft(input.draft);

  return {
    id: createEventId('expense-created'),
    ledgerId: input.ledgerId,
    eventType: 'expense.created',
    eventVersion: 1,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    actorDeviceId: input.actorDeviceId,
    payloadJson: JSON.stringify(payload),
  };
}

export function createExpenseDraftMutations(dbName = 'dumshare-ui'): ExpenseDraftMutations {
  const db = openLedgerDb(dbName);
  const repository = createEventRepository(db);

  return {
    async submitExpenseDraft(input: ExpenseDraftInput): Promise<string> {
      const ledgerId = resolveLatestLedgerId(dbName);

      if (!ledgerId) {
        throw new Error('Create the ledger before adding expenses');
      }

      const actorDeviceId =
        input.creatorRole === 'contributor' ? 'device-contributor-ui' : 'device-organizer-ui';
      const event = buildExpenseCreatedEventInput({
        ledgerId,
        actorDeviceId,
        draft: input,
      });
      const payload = JSON.parse(event.payloadJson) as ExpenseCreatedPayload;

      await repository.appendEvent(event);
      return payload.expenseId;
    },
  };
}