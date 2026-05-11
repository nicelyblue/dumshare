import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { APP_ROUTES } from '../navigation/routes';
import type { RootStackParamList } from '../navigation/types';
import { useLedgerSession } from '../state/ledgerSession';
import { MockScaffold } from '../ui/MockScaffold';
import { colors } from '../theme/colors';

export function LedgerEntriesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { snapshot, reviewSnapshot } = useLedgerSession();

  return (
    <MockScaffold activeTab="ledger" onNavigate={(route) => navigation.navigate(route)}>
      <Text style={styles.eyebrow}>Ledger</Text>
      <Text style={styles.activeShare}>Active share: {snapshot.title || 'Weekend Trip 2025'}</Text>
      <Text style={styles.title}>Ledger Entries</Text>
      <Text style={styles.subtitle}>Browse submitted expenses and open entry details.</Text>

      {reviewSnapshot.items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyLabel}>No entries</Text>
          <Text style={styles.emptyTitle}>No submissions yet</Text>
          <Text style={styles.emptyBody}>Add an expense to populate the ledger list.</Text>
        </View>
      ) : (
        <View style={styles.stack}>
          {reviewSnapshot.items.map((item) => (
            <Pressable key={item.submissionId} style={styles.item} onPress={() => navigation.navigate(APP_ROUTES.ledgerEntryDetail, { submissionId: item.submissionId })}>
              <Text style={styles.itemTitle}>{item.proposedExpense.description}</Text>
              <Text style={styles.itemMeta}>{item.proposedExpense.currency} {(item.proposedExpense.totalAmountMinor / 100).toFixed(2)} · {item.proposedExpense.expenseDate}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </MockScaffold>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.neutral.slate600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.4, fontWeight: '700' },
  activeShare: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.neutral.slate300,
    backgroundColor: colors.neutral.indigo50,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: colors.neutral.slate600,
    fontSize: 16 / 1.2,
    fontWeight: '700',
  },
  title: { color: colors.neutral.slate950, fontSize: 58 / 1.6, fontWeight: '700' },
  subtitle: { color: colors.neutral.slate600, fontSize: 17 },
  emptyCard: {
    borderWidth: 1,
    borderColor: colors.neutral.slate300,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    padding: 18,
    gap: 8,
  },
  emptyLabel: { color: colors.neutral.slate600, fontSize: 16 / 1.1, textTransform: 'uppercase', letterSpacing: 1.8, fontWeight: '700' },
  emptyTitle: { color: colors.neutral.slate950, fontSize: 48 / 1.6, fontWeight: '700' },
  emptyBody: { color: colors.neutral.slate600, fontSize: 18 / 1.2 },
  stack: { gap: 10 },
  item: {
    borderWidth: 1,
    borderColor: colors.neutral.slate300,
    borderRadius: 14,
    backgroundColor: colors.neutral.white,
    padding: 14,
    gap: 4,
  },
  itemTitle: { color: colors.neutral.slate950, fontSize: 20 / 1.2, fontWeight: '700' },
  itemMeta: { color: colors.neutral.slate600, fontSize: 13 },
});
