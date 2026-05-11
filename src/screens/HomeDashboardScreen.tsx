import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { APP_ROUTES } from '../navigation/routes';
import type { RootStackParamList } from '../navigation/types';
import { useLedgerSession } from '../state/ledgerSession';
import { MockScaffold } from '../ui/MockScaffold';
import { colors } from '../theme/colors';

function formatAmount(minor: number): string {
  return `$${(Math.abs(minor) / 100).toFixed(2)}`;
}

export function HomeDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { snapshot, balanceDetailSnapshot, reviewSnapshot } = useLedgerSession();

  const rows = balanceDetailSnapshot.participants.map((participant) => {
    const netMinor = participant.balancesByCurrency.reduce((sum, row) => sum + row.netMinor, 0);
    return {
      id: participant.participantId,
      name: participant.displayName,
      netMinor,
      label: netMinor === 0 ? 'All settled up' : netMinor > 0 ? 'Owes you' : 'You owe',
    };
  });

  const meaningfulItems = reviewSnapshot.items.filter((item) => item.proposedExpense.totalAmountMinor > 0);
  const totalAmountMinor = meaningfulItems.reduce((sum, item) => sum + item.proposedExpense.totalAmountMinor, 0);

  return (
    <MockScaffold activeTab="home" onNavigate={(route) => navigation.navigate(route)}>
      <View style={styles.headerBlock}>
        <Text style={styles.title}>{snapshot.title || 'Weekend Trip 2025'}</Text>
        <Text style={styles.subtitle}>{rows.length} participants • {meaningfulItems.length} expenses</Text>
      </View>

      <Text style={styles.sectionLabel}>Current Status</Text>
      <View style={styles.stack}>
        {rows.map((row) => (
          <View key={row.id} style={styles.card}>
            <View>
              <Text style={styles.name}>{row.name}</Text>
              <Text style={styles.meta}>{row.label}</Text>
            </View>
            <Text style={styles.amount}>{formatAmount(row.netMinor)}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.primaryButton} onPress={() => navigation.navigate(APP_ROUTES.addExpense)}>
        <Text style={styles.primaryLabel}>Add New Expense</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>Last Entered Expense</Text>
      <View style={styles.lastCard}>
        <View style={styles.lastTopRow}>
          <View style={styles.lastTextWrap}>
            <Text style={styles.lastTitle}>{meaningfulItems[0]?.proposedExpense.description ?? 'No expense yet'}</Text>
            <Text style={styles.meta}>{meaningfulItems[0] ? `Paid by ${meaningfulItems[0].submittedByParticipantId}` : 'Add an expense to begin'}</Text>
          </View>
          <Text style={styles.lastAmount}>{meaningfulItems[0] ? formatAmount(meaningfulItems[0].proposedExpense.totalAmountMinor) : '$0.00'}</Text>
        </View>
        <View style={styles.lastBottomRow}>
          <Text style={styles.meta}>{meaningfulItems[0]?.proposedExpense.expenseDate ?? '-'}</Text>
          <Pressable onPress={() => navigation.navigate(APP_ROUTES.ledgerEntries)}>
            <Text style={styles.link}>View Details</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{meaningfulItems.length}</Text>
          <Text style={styles.statLabel}>Total Expenses</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatAmount(totalAmountMinor)}</Text>
          <Text style={styles.statLabel}>Total Amount</Text>
        </View>
      </View>
    </MockScaffold>
  );
}

const styles = StyleSheet.create({
  headerBlock: { gap: 2 },
  title: { color: colors.neutral.slate950, fontSize: 46, fontWeight: '700' },
  subtitle: { color: colors.neutral.slate600, fontSize: 14 },
  sectionLabel: { color: colors.neutral.slate600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  stack: { gap: 8 },
  card: {
    borderWidth: 1,
    borderColor: colors.neutral.slate200,
    borderRadius: 14,
    backgroundColor: colors.neutral.white,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: { color: colors.neutral.slate950, fontSize: 20, fontWeight: '700' },
  meta: { color: colors.neutral.slate600, fontSize: 12 },
  amount: { color: colors.neutral.slate950, fontSize: 22, fontWeight: '700' },
  primaryButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: { color: colors.neutral.white, fontSize: 16, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  lastCard: {
    borderWidth: 1,
    borderColor: colors.neutral.slate200,
    borderRadius: 14,
    backgroundColor: colors.background.panelSoft,
    padding: 14,
    gap: 10,
  },
  lastTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  lastTextWrap: { flex: 1, gap: 4 },
  lastTitle: { color: colors.neutral.slate950, fontSize: 16, fontWeight: '700' },
  lastAmount: { color: colors.neutral.slate950, fontSize: 24, fontWeight: '700' },
  lastBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { color: colors.neutral.slate950, fontSize: 12, textDecorationLine: 'underline' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.neutral.slate200,
    borderRadius: 14,
    backgroundColor: colors.background.panelSoft,
    padding: 12,
    gap: 3,
  },
  statValue: { color: colors.neutral.slate950, fontSize: 24, fontWeight: '700' },
  statLabel: { color: colors.neutral.slate600, fontSize: 11 },
});
