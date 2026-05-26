import { openLedgerDb } from '../../data/sqlite/client';
import { createEventRepository } from '../../domain/events/repository';
import { buildApprovedBalanceSummary } from '../../domain/balances';
import { replayLedger } from '../../domain/projections';
import type { ApprovedBalanceSummary } from '../../domain/balances';
import type { LedgerEvent } from '../../domain/events/types';
import { resolveLatestLedgerId } from './latestLedgerId';

export type LedgerDashboardSnapshot = {
  ledgerId: string | null;
  hasLedger: boolean;
  title: string;
  organizerName: string;
  organizerParticipantId: string | null;
  participantCount: number;
  latestActivityLabel: string;
  latestActivityAt: string | null;
  balanceSummary: ApprovedBalanceSummary;
};

const EMPTY_BALANCE_SUMMARY: ApprovedBalanceSummary = {
  participants: [],
  metadata: {},
};

function createEmptySnapshot(): LedgerDashboardSnapshot {
  return {
    ledgerId: null,
    hasLedger: false,
    title: 'No ledger yet',
    organizerName: '',
    organizerParticipantId: null,
    participantCount: 0,
    latestActivityLabel: 'Waiting for the first ledger event',
    latestActivityAt: null,
    balanceSummary: EMPTY_BALANCE_SUMMARY,
  };
}

function formatActivityLabel(eventType: string): string {
  switch (eventType) {
    case 'ledger.created':
      return 'Ledger created';
    case 'participant.added':
      return 'Participant added';
    case 'participant.renamed':
      return 'Participant renamed';
    case 'participant.removed':
      return 'Participant removed';
    case 'invite.issued':
      return 'Access request created';
    case 'invite.revoked':
      return 'Access request revoked';
    case 'invite.consumed':
      return 'Contributor access linked';
    case 'expense.created':
      return 'Expense recorded';
    case 'expense.deleted':
      return 'Expense deleted';
    default:
      return 'Ledger updated';
  }
}

function sanitizeLedgerCreatedPayload(payloadJson: string): string {
  const fallbackTitle = 'Recovered ledger';

  try {
    const parsed = JSON.parse(payloadJson) as Record<string, unknown>;
    const titleCandidates = [parsed.title, parsed.ledgerTitle, parsed.name];

    const title = titleCandidates.find((value) => typeof value === 'string' && value.trim().length > 0);

    return JSON.stringify({
      title: typeof title === 'string' ? title.trim() : fallbackTitle,
    });
  } catch {
    return JSON.stringify({
      title: fallbackTitle,
    });
  }
}

function sanitizeLegacyEventsForReplay(events: LedgerEvent[]): LedgerEvent[] {
  return events.map((event) => {
    if (event.eventType !== 'ledger.created') {
      return event;
    }

    return {
      ...event,
      payloadJson: sanitizeLedgerCreatedPayload(event.payloadJson),
    };
  });
}

export async function loadLedgerDashboardSnapshot(
  dbName = 'dumshare-ui',
  selectedLedgerId?: string | null,
): Promise<LedgerDashboardSnapshot> {
  const ledgerId = selectedLedgerId ?? (await resolveLatestLedgerId(dbName));

  if (!ledgerId) {
    return createEmptySnapshot();
  }

  const db = openLedgerDb(dbName);
  const repository = createEventRepository(db);
  const events = await repository.listEventsByLedger(ledgerId);

  if (events.length === 0) {
    return createEmptySnapshot();
  }

  const projection = replayLedger(sanitizeLegacyEventsForReplay(events));
  const latestEvent = events[events.length - 1];

  if (!latestEvent) {
    return createEmptySnapshot();
  }

  return {
    ledgerId,
    hasLedger: true,
    title: projection.title,
    organizerName: projection.organizerName ?? '',
    organizerParticipantId: projection.organizerParticipantId ?? null,
    participantCount: projection.participants.length,
    latestActivityLabel: formatActivityLabel(latestEvent.eventType),
    latestActivityAt: latestEvent.occurredAt,
    balanceSummary: buildApprovedBalanceSummary(projection),
  };
}
