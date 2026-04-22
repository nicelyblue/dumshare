import type { LedgerProjection } from "../projections/types";

import { derivePerCurrencyBalances } from "./derive";
import type { ParticipantCurrencyBalances } from "./types";

export const APPROVED_ONLY_SCOPE_NOTE =
  "Balances reflect approved entries only; pending changes are not included.";

export type ApprovedBalanceSummary = {
  participants: ParticipantCurrencyBalances[];
  metadata: {
    pendingSubmissionCount: number;
    reviewedSubmissionCount: number;
    approvalScopeNote: string;
  };
};

export function buildApprovedBalanceSummary(
  projection: LedgerProjection,
): ApprovedBalanceSummary {
  const pendingSubmissionCount = projection.pendingSubmissions.length;

  return {
    participants: derivePerCurrencyBalances(projection),
    metadata: {
      pendingSubmissionCount,
      reviewedSubmissionCount: projection.reviewedSubmissions.length,
      approvalScopeNote:
        pendingSubmissionCount > 0
          ? APPROVED_ONLY_SCOPE_NOTE
          : "",
    },
  };
}
