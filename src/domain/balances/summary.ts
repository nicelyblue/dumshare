import type { LedgerProjection } from "../projections/types";

import { derivePerCurrencyBalances } from "./derive";
import type { ParticipantCurrencyBalances } from "./types";

export type ApprovedBalanceSummary = {
  participants: ParticipantCurrencyBalances[];
  metadata: {};
};

export function buildApprovedBalanceSummary(
  projection: LedgerProjection,
): ApprovedBalanceSummary {
  return {
    participants: derivePerCurrencyBalances(projection),
    metadata: {},
  };
}
