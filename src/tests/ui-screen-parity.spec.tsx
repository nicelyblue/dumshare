import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('phase 05 UI screen parity signals', () => {
  test('add expense and split surfaces expose required headings and CTA copy', () => {
    const addExpense = readProjectFile('app/add-expense.tsx');
    const splitEditor = readProjectFile('src/mobile/components/ExpenseSplitEditor.tsx');

    expect(addExpense).toContain('Add Expense');
    expect(addExpense).toContain('Save Expense');
    expect(splitEditor).toContain('Confirm Split');
    expect(splitEditor).toContain('Percent');
    expect(splitEditor).toContain('Shares');
  });

  test('settle up presents recommendations without implying payment completion', () => {
    const settleUp = readProjectFile('app/(tabs)/settle-up.tsx');

    expect(settleUp).toContain('SETTLEMENT CURRENCY');
    expect(settleUp).toContain('RECOMMENDED TRANSFERS');
    expect(settleUp).not.toContain('Recommendations applied');
  });

  test('empty-state and destructive confirmation copy remains present', () => {
    const recommendations = readProjectFile('src/mobile/components/SettlementRecommendationList.tsx');
    const actionSheet = readProjectFile('src/mobile/components/LongPressActionSheet.tsx');

    expect(recommendations).toContain('No transfers needed');
    expect(actionSheet).toContain('destructive');
  });
});
