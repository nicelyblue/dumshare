import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

describe('add expense correctness guards', () => {
  const source = readFileSync(resolve(process.cwd(), 'app/add-expense.tsx'), 'utf8');

  test('does not fall back when no split participants are selected', () => {
    expect(source).toContain("if (splitParticipantIds.length === 0)");
    expect(source).toContain('Select at least one split participant.');
    expect(source).not.toContain("[payerParticipantId || 'participant-1']");
  });

  test('keeps percentage mode and submits its deterministic exact-minor allocation', () => {
    expect(source).toContain("setSplitMode('percent')");
    expect(source).toContain('allocatePercentageSplitMinor(totalMinor, ids, percentValues)');
    expect(source).toContain("splitMode: splitMode === 'equal' ? 'equal' : 'exact'");
  });

  test('exposes date and edit controls and gates split confirmation', () => {
    expect(source).toContain('label="Expense Date"');
    expect(source).toContain("editingExpenseId ? 'Edit Expense' : 'Add Expense'");
    expect(source).toContain("editingExpenseId ? 'Update Expense' : 'Save Expense'");
    expect(source).toContain('disabled={!canConfirmSplit}');
  });
});
