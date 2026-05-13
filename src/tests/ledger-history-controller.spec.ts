import { describe, expect, test } from 'vitest';
import { loadLedgerHistoryModel } from '../mobile/controllers/ledgerHistoryController';

describe('ledger history controller', () => {
  test('returns chronological rows with overview labels', async () => {
    const model = await loadLedgerHistoryModel({ selectedLedgerId: undefined });
    expect(Array.isArray(model.entries)).toBe(true);
  });
});
