import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppShell } from '../ui/AppShell';
import { ActionButton } from '../ui/ActionButton';
import { SummaryCard } from '../ui/SummaryCard';
import { SubmissionDetailScreen } from './SubmissionDetailScreen';
import { APP_ROUTES } from '../navigation/routes';
import type { RootStackParamList } from '../navigation/types';
import { useLedgerSession } from '../state/ledgerSession';
import { colors, screenAccents } from '../theme/colors';

export function LedgerEntryDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ledgerEntryDetail'>>();
  const { reviewSnapshot, submitExpenseReview } = useLedgerSession();
  const item = reviewSnapshot.items.find((candidate) => candidate.submissionId === route.params.submissionId);

  return (
    <AppShell
      eyebrow="Ledger"
      title="Ledger Entry Detail"
      description="Inspect and review an individual entry."
      accent={screenAccents.ledgers}
      activeRoute={APP_ROUTES.ledgerEntries}
      onNavigate={(routeName) => navigation.navigate(routeName)}
      enableShellNav
    >
      <ActionButton tone="secondary" compact label="Back to entries" onPress={() => navigation.navigate(APP_ROUTES.ledgerEntries)} />
      {!item ? (
        <SummaryCard label="Entry not found" value="Unable to load entry" detail={route.params.submissionId} tone="warning" />
      ) : (
        <View style={styles.stack}>
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>{item.proposedExpense.currency} {(item.proposedExpense.totalAmountMinor / 100).toFixed(2)}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Paid By</Text>
            <Text style={styles.infoValue}>{item.submittedByParticipantId}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Split Method</Text>
            <Text style={styles.infoValue}>{item.proposedExpense.splitSummary}</Text>
          </View>
          <SubmissionDetailScreen item={item} onSubmitDecision={submitExpenseReview} />
        </View>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 10,
  },
  amountCard: {
    borderRadius: 12,
    backgroundColor: colors.text.primary,
    padding: 14,
    gap: 6,
  },
  amountLabel: {
    color: colors.text.onAccent,
    fontSize: 12,
    opacity: 0.8,
  },
  amountValue: {
    color: colors.text.onAccent,
    fontSize: 30,
    fontWeight: '700',
  },
  infoCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.panel,
    padding: 12,
    gap: 4,
  },
  infoLabel: {
    color: colors.text.muted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoValue: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
