import { openLedgerDb } from '../../data/sqlite/client';
import { createEventRepository } from '../../domain/events/repository';
import { replayLedger } from '../../domain/projections';
import type { EventInput, ExpenseSplitPayload, ExpenseSubmissionReviewedPayload } from '../../domain/events/types';
import { resolveLatestLedgerId } from './latestLedgerId';

export type ReviewDecision = ExpenseSubmissionReviewedPayload['decision'];

export type ExpenseReviewItem = {
  submissionId: string;
  submissionType: 'expense-create' | 'expense-amendment';
  submittedByParticipantId: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  statusLabel: string;
  targetExpenseId?: string;
  reason?: string;
  proposedExpense: {
    expenseId: string;
    description: string;
    currency: string;
    totalAmountMinor: number;
    expenseDate: string;
    creatorRole: 'organizer' | 'contributor';
    payers: { participantId: string; paidAmountMinor: number }[];
    splitSummary: string;
  };
};

export type ExpenseReviewSnapshot = {
  hasLedger: boolean;
  pendingCount: number;
  reviewedCount: number;
  items: ExpenseReviewItem[];
};

type BuildSubmissionReviewEventInputArgs = {
  ledgerId: string;
  actorDeviceId: string;
  submissionId: string;
  decision: ReviewDecision;
  reviewReason: string;
  occurredAt?: string;
};

type SubmissionReviewMutationInput = {
  submissionId: string;
  decision: ReviewDecision;
  reviewReason: string;
};

type ExpenseReviewMutations = {
  submitExpenseReview: (input: SubmissionReviewMutationInput, selectedLedgerId?: string | null) => Promise<string>;
};

function createEventId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function formatSplitSummary(proposedSplit: ExpenseSplitPayload): string {
  if (proposedSplit.mode === 'equal') {
    return `Equal split across ${proposedSplit.participants.length} participant(s)`;
  }

  if (proposedSplit.mode === 'exact') {
    const totalMinor = proposedSplit.participants.reduce(
      (sum, participant) => sum + participant.owedAmountMinor,
      0,
    );
    return `Exact split total ${totalMinor / 100}`;
  }

  const totalPercent = proposedSplit.participants.reduce(
    (sum, participant) => sum + participant.percentageBps,
    0,
  );
  return `Percentage split total ${totalPercent / 100}%`;
}

function mapDecisionToStatusLabel(decision: 'approved' | 'rejected'): string {
  return decision === 'approved' ? 'Approved by organizer' : 'Rejected by organizer';
}

export async function loadExpenseReviewSnapshot(dbName = 'dumshare-ui', selectedLedgerId?: string | null): Promise<ExpenseReviewSnapshot> {
  const ledgerId = selectedLedgerId ?? (await resolveLatestLedgerId(dbName));

  if (!ledgerId) {
    return {
      hasLedger: false,
      pendingCount: 0,
      reviewedCount: 0,
      items: [],
    };
  }

  const db = openLedgerDb(dbName);
  const repository = createEventRepository(db);
  const events = await repository.listEventsByLedger(ledgerId);
  const projection = replayLedger(events);

  const pendingItems: ExpenseReviewItem[] = projection.pendingSubmissions.map((submission) => ({
    submissionId: submission.submissionId,
    submissionType: submission.submissionType,
    submittedByParticipantId: submission.submittedByParticipantId,
    submittedAt: submission.submittedAt,
    status: 'pending',
    statusLabel: 'Pending organizer approval',
    targetExpenseId: submission.submissionType === 'expense-amendment' ? submission.targetExpenseId : undefined,
    reason: submission.submissionType === 'expense-amendment' ? submission.reason : undefined,
    proposedExpense: {
      expenseId: submission.proposedExpense.expenseId,
      description: submission.proposedExpense.description,
      currency: submission.proposedExpense.currency,
      totalAmountMinor: submission.proposedExpense.totalAmountMinor,
      expenseDate: submission.proposedExpense.expenseDate,
      creatorRole: submission.proposedExpense.creatorRole,
      payers: submission.proposedExpense.payers,
      splitSummary: formatSplitSummary(submission.proposedExpense.split),
    },
  }));

  const reviewedItems: ExpenseReviewItem[] = projection.reviewedSubmissions.map((reviewed) => ({
    submissionId: reviewed.submissionId,
    submissionType: 'expense-create',
    submittedByParticipantId: 'unknown',
    submittedAt: reviewed.reviewedAt,
    status: reviewed.decision,
    statusLabel: mapDecisionToStatusLabel(reviewed.decision),
    proposedExpense: {
      expenseId: reviewed.submissionId,
      description: 'Reviewed submission',
      currency: 'N/A',
      totalAmountMinor: 0,
      expenseDate: reviewed.reviewedAt.slice(0, 10),
      creatorRole: 'contributor',
      payers: [],
      splitSummary: reviewed.reviewReason,
    },
  }));

  return {
    hasLedger: true,
    pendingCount: pendingItems.length,
    reviewedCount: reviewedItems.length,
    items: [...pendingItems, ...reviewedItems],
  };
}

export function buildSubmissionReviewEventInput(
  input: BuildSubmissionReviewEventInputArgs,
): EventInput {
  const reviewReason = input.reviewReason.trim();
  if (!reviewReason) {
    throw new Error('Review reason is required');
  }

  const payload: ExpenseSubmissionReviewedPayload = {
    submissionId: input.submissionId,
    decision: input.decision,
    reviewReason,
  };

  return {
    id: createEventId('expense-submission-reviewed'),
    ledgerId: input.ledgerId,
    eventType: 'expense.submission-reviewed',
    eventVersion: 1,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    actorDeviceId: input.actorDeviceId,
    payloadJson: JSON.stringify(payload),
  };
}

export function createExpenseReviewMutations(dbName = 'dumshare-ui'): ExpenseReviewMutations {
  const db = openLedgerDb(dbName);
  const repository = createEventRepository(db);

  return {
    async submitExpenseReview(input: SubmissionReviewMutationInput, selectedLedgerId?: string | null): Promise<string> {
      const ledgerId = selectedLedgerId ?? (await resolveLatestLedgerId(dbName));

      if (!ledgerId) {
        throw new Error('Create the ledger before reviewing submissions');
      }

      const event = buildSubmissionReviewEventInput({
        ledgerId,
        actorDeviceId: 'device-organizer-ui',
        submissionId: input.submissionId,
        decision: input.decision,
        reviewReason: input.reviewReason,
      });

      await repository.appendEvent(event);
      return input.submissionId;
    },
  };
}
