import { describe, expect, test } from "vitest";

import { formatSplitSummary } from "../data/ledger/expenseReview";

describe("expense review split summary", () => {
  test("formats equal split summary", () => {
    const summary = formatSplitSummary({
      mode: "equal",
      participants: [
        { participantId: "participant-001" },
        { participantId: "participant-002" },
        { participantId: "participant-003" },
      ],
    });

    expect(summary).toBe("Equal split across 3 participant(s)");
  });

  test("formats exact split summary from owed amount total", () => {
    const summary = formatSplitSummary({
      mode: "exact",
      participants: [
        { participantId: "participant-001", owedAmountMinor: 500 },
        { participantId: "participant-002", owedAmountMinor: 750 },
      ],
    });

    expect(summary).toBe("Exact split total 12.5");
  });

  test("formats percentage split summary from basis point total", () => {
    const summary = formatSplitSummary({
      mode: "percentage",
      participants: [
        { participantId: "participant-001", percentageBps: 6000 },
        { participantId: "participant-002", percentageBps: 4000 },
      ],
    });

    expect(summary).toBe("Percentage split total 100%");
  });
});
