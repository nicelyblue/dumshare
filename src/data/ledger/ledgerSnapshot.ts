import { openLedgerDb } from '../../data/sqlite/client';
import { createEventRepository } from '../../domain/events/repository';
import { buildApprovedBalanceSummary } from '../../domain/balances';
import { replayLedger } from '../../domain/projections';
import type { ApprovedBalanceSummary } from '../../domain/balances';

export type LedgerDashboardSnapshot = {
  ledgerId: string | null;
  hasLedger: boolean;
  title: string;
  settlementContext: string;
  participantCount: number;
  pendingApprovalCount: number;
  latestActivityLabel: string;
  latestActivityAt: string | null;
  balanceSummary: ApprovedBalanceSummary;
};

const EMPTY_BALANCE_SUMMARY: ApprovedBalanceSummary = {
  participants: [],
  metadata: {
    pendingSubmissionCount: 0,
    reviewedSubmissionCount: 0,
    approvalScopeNote: '',
  },
};

function createEmptySnapshot(): LedgerDashboardSnapshot {
  return {
    ledgerId: null,
    hasLedger: false,
    title: 'No ledger yet',
    settlementContext: 'Create the trip ledger in Setup to begin.',
    participantCount: 0,
    pendingApprovalCount: 0,
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
    case 'invite.issued':
      return 'Invitation issued';
    case 'invite.revoked':
      return 'Invitation revoked';
    case 'invite.consumed':
      return 'Invitation consumed';
    case 'expense.created':
      return 'Expense recorded';
    case 'expense.submission-created':
      return 'Submission queued';
    case 'expense.submission-reviewed':
      return 'Submission reviewed';
    case 'expense.amendment-submitted':
      return 'Amendment submitted';
    case 'expense.note-added':
      return 'Expense note added';
    default:
      return 'Ledger updated';
  }
}

async function getLatestLedgerId(dbName: string): Promise<string | null> {
  const db = openLedgerDb(dbName);
  const row = db.sqlite
    .prepare('SELECT ledger_id AS ledgerId FROM events ORDER BY sequence DESC LIMIT 1')
    .get() as { ledgerId?: string } | undefined;

  return row?.ledgerId ?? null;
}

export async function loadLedgerDashboardSnapshot(
  dbName = 'dumshare-ui',
): Promise<LedgerDashboardSnapshot> {
  const ledgerId = await getLatestLedgerId(dbName);

  if (!ledgerId) {
    return createEmptySnapshot();
  }

  const db = openLedgerDb(dbName);
  const repository = createEventRepository(db);
  const events = await repository.listEventsByLedger(ledgerId);

  if (events.length === 0) {
    return createEmptySnapshot();
  }

  const projection = replayLedger(events);
  const latestEvent = events[events.length - 1];

  if (!latestEvent) {
    return createEmptySnapshot();
  }

  return {
    ledgerId,
    hasLedger: true,
    title: projection.title,
    settlementContext: projection.settlementContext,
    participantCount: projection.participants.length,
    pendingApprovalCount: projection.pendingSubmissions.length,
    latestActivityLabel: formatActivityLabel(latestEvent.eventType),
    latestActivityAt: latestEvent.occurredAt,
    balanceSummary: buildApprovedBalanceSummary(projection),
  };
}