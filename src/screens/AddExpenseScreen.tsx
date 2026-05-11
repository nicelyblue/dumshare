import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ExpenseSplitPayload } from '../domain/events/types';
import { LabeledField } from '../ui/LabeledField';
import { SearchableSelect } from '../ui/SearchableSelect';
import { CURRENCY_OPTIONS } from '../domain/currency/catalog';
import { APP_ROUTES } from '../navigation/routes';
import type { RootStackParamList } from '../navigation/types';
import { useLedgerSession } from '../state/ledgerSession';
import { saveExpenseFlowDraft } from '../state/expenseFlowDraft';
import { MockScaffold } from '../ui/MockScaffold';
import { colors } from '../theme/colors';

function toMinorAmount(value: string): number {
  const sanitized = value.replace(/[^0-9.]/g, '').trim();
  if (!sanitized) {
    return 0;
  }
  const parsed = Number.parseFloat(sanitized);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) : 0;
}

export function AddExpenseScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { snapshot } = useLedgerSession();
  const participants = useMemo(
    () => snapshot.balanceSummary.participants.map((participant) => ({ participantId: participant.participantId, displayName: participant.displayName })),
    [snapshot.balanceSummary.participants],
  );

  const [description, setDescription] = useState('');
  const [amountText, setAmountText] = useState('0.00');
  const [currency, setCurrency] = useState('USD');
  const totalAmountMinor = toMinorAmount(amountText);

  const primaryPayer = participants[0];

  return (
    <MockScaffold activeTab="add" onNavigate={(route) => navigation.navigate(route)}>
      <Text style={styles.tripContext}>{snapshot.title || 'Weekend Trip 2025'}</Text>

      <View style={styles.form}>
        <LabeledField label="Expense Name" value={description} onChangeText={setDescription} placeholder="e.g., Dinner, Gas, Hotel" />
        <View style={styles.row}>
          <View style={styles.flexField}>
            <LabeledField label="Amount" value={amountText} onChangeText={setAmountText} placeholder="0.00" keyboardType="decimal-pad" />
          </View>
          <View style={styles.flexField}>
            <SearchableSelect label="Currency" value={currency} options={CURRENCY_OPTIONS} onChange={setCurrency} />
          </View>
        </View>

        <View style={styles.selectCard}>
          <Text style={styles.selectLabel}>Paid By</Text>
          <View style={styles.selectRow}>
            <Text style={styles.selectValue}>{primaryPayer?.displayName ?? 'You'}</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
        </View>

        <Pressable style={styles.selectCard} onPress={() => navigation.navigate(APP_ROUTES.splitDetails)}>
          <Text style={styles.selectLabel}>Split Between</Text>
          <View style={styles.selectRow}>
            <Text style={styles.selectValue}>{participants.length} participants</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
        </Pressable>

        <Pressable style={styles.selectCard} onPress={() => navigation.navigate(APP_ROUTES.splitDetails)}>
          <Text style={styles.selectLabel}>Split Type</Text>
          <View style={styles.selectRow}>
            <View>
              <Text style={styles.selectValue}>Split Equally</Text>
              <Text style={styles.selectHint}>${participants.length > 0 ? (totalAmountMinor / participants.length / 100).toFixed(2) : '0.00'} per person</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </Pressable>
      </View>

      <Pressable
        style={[styles.primaryButton, !description.trim() || totalAmountMinor <= 0 || participants.length === 0 ? styles.primaryDisabled : null]}
        disabled={!description.trim() || totalAmountMinor <= 0 || participants.length === 0}
        onPress={() => {
          const split: ExpenseSplitPayload = {
            mode: 'equal',
            participants: participants.map((participant) => ({ participantId: participant.participantId })),
          };
          saveExpenseFlowDraft({
            description,
            currency,
            expenseDate: new Date().toISOString().slice(0, 10),
            totalAmountMinor,
            creatorRole: 'organizer',
            payers: primaryPayer ? [{ participantId: primaryPayer.participantId, paidAmountMinor: totalAmountMinor }] : [],
            split,
          });
          navigation.navigate(APP_ROUTES.splitDetails);
        }}
      >
        <Text style={styles.primaryLabel}>Save Expense</Text>
      </Pressable>
    </MockScaffold>
  );
}

const styles = StyleSheet.create({
  tripContext: { color: colors.neutral.slate600, fontSize: 14 },
  form: { gap: 14 },
  row: { flexDirection: 'row', gap: 10 },
  flexField: { flex: 1 },
  selectCard: {
    borderWidth: 1,
    borderColor: colors.neutral.slate300,
    borderRadius: 12,
    backgroundColor: colors.neutral.white,
    padding: 12,
    gap: 8,
  },
  selectLabel: { color: colors.neutral.slate600, fontSize: 14 },
  selectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  selectValue: { color: colors.neutral.slate950, fontSize: 18, fontWeight: '600' },
  selectHint: { color: colors.neutral.slate600, fontSize: 12, marginTop: 2 },
  chevron: { color: colors.neutral.slate600, fontSize: 22 },
  primaryButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.neutral.slate950,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDisabled: { opacity: 0.45 },
  primaryLabel: { color: colors.neutral.white, fontSize: 16, fontWeight: '700' },
});
