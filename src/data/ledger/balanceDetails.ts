import { openLedgerDb } from '../../data/sqlite/client';
import { createEventRepository } from '../../domain/events/repository';
import { buildApprovedBalanceSummary } from '../../domain/balances';
import { replayLedger } from '../../domain/projections';
import { resolveLatestLedgerId } from './latestLedgerId';

export type BalanceDetailSnapshot = {
  hasLedger: boolean;
  participants: ReturnType<typeof buildApprovedBalanceSummary>['participants'];
  metadata: ReturnType<typeof buildApprovedBalanceSummary>['metadata'];
};

export async function loadBalanceDetailSnapshot(dbName = 'dumshare-ui'): Promise<BalanceDetailSnapshot> {
  const ledgerId = await resolveLatestLedgerId(dbName);

  if (!ledgerId) {
    return {
      hasLedger: false,
      participants: [],
      metadata: {
        pendingSubmissionCount: 0,
        reviewedSubmissionCount: 0,
        approvalScopeNote: '',
      },
    };
  }

  const repository = createEventRepository(openLedgerDb(dbName));
  const events = await repository.listEventsByLedger(ledgerId);
  const summary = buildApprovedBalanceSummary(replayLedger(events));

  return {
    hasLedger: true,
    participants: summary.participants,
    metadata: summary.metadata,
  };
}
