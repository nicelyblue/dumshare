import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { loadExpenseFormModel, submitExpenseForm } from '../../src/mobile/controllers/expenseFormController';
import { ExpenseSplitEditor } from '../../src/mobile/components/ExpenseSplitEditor';
import { consumePendingExpenseDraft } from '../../src/mobile/state/expenseDraftStore';
import { getActiveShareState } from '../../src/mobile/state/activeShareStore';

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
          <Text style={styles.primaryButtonText}>Save expense</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  body: {
    fontSize: 16,
    color: '#334155',
  },
  card: {
    marginTop: 6,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    gap: 8,
  },
  label: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  inputLike: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: '#f8fafc',
  },
  inputLikeText: {
    color: '#1e293b',
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#f8fafc',
    fontWeight: '600',
  },
});
