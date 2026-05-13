import { useEffect, useRef, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { deleteExpenseById, loadLedgerHistoryModel, type LedgerHistoryModel } from '../../src/mobile/controllers/ledgerHistoryController';
import { LedgerHistoryList } from '../../src/mobile/components/LedgerHistoryList';
import { getActiveShareState, subscribeActiveShare } from '../../src/mobile/state/activeShareStore';
import { LongPressActionSheet } from '../../src/mobile/components/LongPressActionSheet';
import { setPendingExpenseDraft } from '../../src/mobile/state/expenseDraftStore';
import { router } from 'expo-router';
import { colorTokens, spacingTokens } from '../../src/mobile/theme/tokens';
import { typographyTokens } from '../../src/mobile/theme/typography';

export default function LedgerScreen(): JSX.Element {
  const [activeShareId, setActiveShareId] = useState<string | null>(getActiveShareState().activeShareId);
  const [model, setModel] = useState<LedgerHistoryModel>({ entries: [] });
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const requestVersion = useRef(0);

  useEffect(() => subscribeActiveShare((state) => setActiveShareId(state.activeShareId)), []);

  async function reload(nextShareId: string | null): Promise<void> {
    requestVersion.current += 1;
    const version = requestVersion.current;

    try {
      const nextModel = await loadLedgerHistoryModel({ selectedLedgerId: nextShareId });
      if (version !== requestVersion.current) {
        return;
      }
      setModel(nextModel);
      setError(null);
    } catch {
      if (version !== requestVersion.current) {
        return;
      }
      setError('Could not load share snapshot. Pull to refresh or switch share from the menu.');
    }
  }

  useEffect(() => {
    void reload(activeShareId);
  }, [activeShareId]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            if (refreshing) {
              return;
            }
            setRefreshing(true);
            void reload(activeShareId).finally(() => setRefreshing(false));
          }}
        />
      }
    >
      <Text style={styles.title}>Ledger Entries</Text>
      <Text style={styles.body}>Active share: {activeShareId ?? 'None selected'}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>CURRENT STATUS</Text>
        <Text style={styles.summaryValue}>{model.entries.length} entries</Text>
      </View>
      {model.entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyHeading}>No expenses yet</Text>
          <Text style={styles.emptyBody}>Add the first expense to see who owes what and how the split works.</Text>
        </View>
      ) : (
        <LedgerHistoryList
          model={model}
          onLongPressEntry={(expenseId) => {
            setSelectedExpenseId(expenseId);
            setActionSheetVisible(true);
          }}
        />
      )}
      <LongPressActionSheet
        visible={actionSheetVisible}
        onClose={() => setActionSheetVisible(false)}
        title="Expense actions"
        options={[
          { key: 'edit', label: 'Edit' },
          { key: 'delete', label: 'Delete', destructive: true },
        ]}
        onSelect={(key) => {
          if (!selectedExpenseId) {
            return;
          }

          if (key === 'edit') {
            setPendingExpenseDraft({ expenseId: selectedExpenseId, selectedLedgerId: activeShareId });
            router.navigate('/(tabs)/add-expense');
            return;
          }

          Alert.alert('Delete expense?', 'This action cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                void deleteExpenseById({ expenseId: selectedExpenseId, selectedLedgerId: activeShareId }).then(() => reload(activeShareId));
              },
            },
          ]);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colorTokens.appBackground,
  },
  content: {
    padding: spacingTokens.lg,
    gap: spacingTokens.md,
  },
  title: {
    ...typographyTokens.heading,
  },
  body: {
    ...typographyTokens.body,
    color: colorTokens.textMuted,
  },
  error: {
    color: colorTokens.destructive,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: colorTokens.border,
    borderRadius: 12,
    padding: spacingTokens.md,
    backgroundColor: colorTokens.card,
    gap: spacingTokens.xs,
  },
  summaryLabel: {
    ...typographyTokens.sectionLabel,
  },
  summaryValue: {
    ...typographyTokens.heading,
    fontSize: 20,
  },
  emptyState: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: colorTokens.groupedSurface,
    gap: 8,
  },
  emptyHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: colorTokens.textPrimary,
  },
  emptyBody: {
    color: colorTokens.textMuted,
  },
});
