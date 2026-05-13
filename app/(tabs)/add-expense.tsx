import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { loadExpenseFormModel, submitExpenseForm } from '../../src/mobile/controllers/expenseFormController';
import { ExpenseSplitEditor } from '../../src/mobile/components/ExpenseSplitEditor';
import { consumePendingExpenseDraft } from '../../src/mobile/state/expenseDraftStore';
import { getActiveShareState } from '../../src/mobile/state/activeShareStore';
import { colorTokens, radiusTokens, spacingTokens, touchTarget } from '../../src/mobile/theme/tokens';
import { typographyTokens } from '../../src/mobile/theme/typography';

export default function AddExpenseScreen(): JSX.Element {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [splitMode, setSplitMode] = useState<'equal' | 'exact'>('equal');
  const [exactValues, setExactValues] = useState<Record<string, string>>({});
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  useEffect(() => {
    const pending = consumePendingExpenseDraft();
    if (!pending) {
      return;
    }
    setEditingExpenseId(pending.expenseId);
    void loadExpenseFormModel({ selectedLedgerId: pending.selectedLedgerId, editExpenseId: pending.expenseId }).then((model) => {
      setDescription(model.defaults.description);
      setAmount(model.defaults.totalAmountInput);
      setCurrency(model.defaults.currency);
      setExpenseDate(model.defaults.expenseDate);
      setSplitMode(model.defaults.splitMode);
    });
  }, []);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Add Expense</Text>
      <Text style={styles.body}>{editingExpenseId ? 'Editing existing expense' : 'Create a new expense'}</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Description</Text>
        <TextInput style={styles.inputLike} value={description} onChangeText={setDescription} />
        <Text style={styles.label}>Amount</Text>
        <TextInput style={styles.inputLike} value={amount} onChangeText={setAmount} keyboardType="numeric" />
        <Text style={styles.label}>Currency</Text>
        <TextInput style={styles.inputLike} value={currency} onChangeText={setCurrency} autoCapitalize="characters" />
        <Text style={styles.label}>Date</Text>
        <TextInput style={styles.inputLike} value={expenseDate} onChangeText={setExpenseDate} />
        <ExpenseSplitEditor
          participantIds={['participant-1']}
          splitMode={splitMode}
          exactValues={exactValues}
          onSplitModeChange={setSplitMode}
          onExactValueChange={(participantId, value) => setExactValues((prev) => ({ ...prev, [participantId]: value }))}
        />
        <Pressable
          style={styles.primaryButton}
          accessibilityRole="button"
          onPress={() =>
            void submitExpenseForm({
              selectedLedgerId: getActiveShareState().activeShareId,
              editExpenseId: editingExpenseId,
              description,
              totalAmountInput: amount,
              currency,
              expenseDate,
              payerParticipantId: 'participant-1',
              splitMode,
              splitParticipantIds: ['participant-1'],
              splitExactAmountsMinor: Object.fromEntries(Object.entries(exactValues).map(([k, v]) => [k, Math.round(Number.parseFloat(v || '0') * 100)])),
            })
          }
        >
          <Text style={styles.primaryButtonText}>Save Expense</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colorTokens.appBackground,
    padding: spacingTokens.lg,
    gap: spacingTokens.sm,
  },
  title: {
    ...typographyTokens.heading,
  },
  body: {
    ...typographyTokens.body,
    color: colorTokens.textMuted,
  },
  card: {
    marginTop: 6,
    backgroundColor: colorTokens.card,
    borderRadius: radiusTokens.md,
    borderWidth: 1,
    borderColor: colorTokens.border,
    padding: spacingTokens.md,
    gap: 8,
  },
  label: {
    color: colorTokens.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  inputLike: {
    borderWidth: 1,
    borderColor: colorTokens.border,
    borderRadius: radiusTokens.md,
    paddingHorizontal: spacingTokens.md,
    paddingVertical: spacingTokens.md,
    minHeight: touchTarget.minimum,
    backgroundColor: colorTokens.inputBackground,
  },
  inputLikeText: {
    color: colorTokens.textPrimary,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: colorTokens.inverse,
    borderRadius: radiusTokens.md,
    minHeight: touchTarget.minimum,
    paddingVertical: spacingTokens.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colorTokens.card,
    fontWeight: '600',
  },
});
