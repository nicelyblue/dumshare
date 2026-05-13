import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('phase 05 UI screen parity signals', () => {
  test('add expense and split surfaces expose required headings and CTA copy', () => {
    const addExpense = readProjectFile('app/(tabs)/add-expense.tsx');
    const splitEditor = readProjectFile('src/mobile/components/ExpenseSplitEditor.tsx');

    expect(addExpense).toContain('Add Expense');
    expect(addExpense).toContain('Save Expense');
    expect(splitEditor).toContain('Confirm Split');
    expect(splitEditor).toContain('Percent');
    expect(splitEditor).toContain('Shares');
  });

  test('settle up and completion surfaces expose required summary labels and completion copy', () => {
    const settleUp = readProjectFile('app/(tabs)/settle-up.tsx');
    const completion = readProjectFile('app/settlement-complete.tsx');

    expect(settleUp).toContain('Calculate Settlement');
    expect(settleUp).toContain('REQUIRED PAYMENTS');
    expect(completion).toContain('Settlement Calculated!');
  });

  test('empty-state and destructive confirmation copy remains present', () => {
    const recommendations = readProjectFile('src/mobile/components/SettlementRecommendationList.tsx');
    const ledger = readProjectFile('app/(tabs)/ledger.tsx');

    expect(recommendations).toContain('No transfers needed');
    expect(ledger).toContain('Delete Expense: This removes the expense and recalculates balances for all participants.');
  });
});
