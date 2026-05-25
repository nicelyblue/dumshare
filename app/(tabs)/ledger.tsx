import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { deleteExpenseById, loadLedgerHistoryModel, loadLedgerExpenseDetailsModel, type LedgerHistoryModel, type LedgerExpenseDetailsModel } from '../../src/mobile/controllers/ledgerHistoryController';
import { LedgerHistoryList } from '../../src/mobile/components/LedgerHistoryList';
import { LedgerEntryDetailModal } from '../../src/mobile/components/LedgerEntryDetailModal';
import { getActiveShareState, subscribeActiveShare } from '../../src/mobile/state/activeShareStore';
import { LongPressActionSheet } from '../../src/mobile/components/LongPressActionSheet';
import { setPendingExpenseDraft } from '../../src/mobile/state/expenseDraftStore';
import { router, useLocalSearchParams } from 'expo-router';
import { colorTokens, radiusTokens, spacingTokens } from '../../src/mobile/theme/tokens';

export default function LedgerScreen(): JSX.Element {
  const params = useLocalSearchParams<{ expenseId?: string }>();
  const [activeShareId, setActiveShareId] = useState<string | null>(getActiveShareState().activeShareId);
  const [model, setModel] = useState<LedgerHistoryModel>({
    summary: {
      currencyTotals: [],
    },
    entries: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailModel, setDetailModel] = useState<LedgerExpenseDetailsModel | null>(null);
  const requestVersion = useRef(0);

  const openEntryDetail = useCallback((expenseId: string) => {
    void loadLedgerExpenseDetailsModel({
      expenseId,
      selectedLedgerId: activeShareId,
    }).then((model) => {
      setDetailModel(model);
      setDetailModalVisible(true);
    });
  }, [activeShareId]);

  const openEntryActions = useCallback((expenseId: string) => {
    setSelectedExpenseId(expenseId);
    setActionSheetVisible(true);
  }, []);

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

  useFocusEffect(
    useCallback(() => {
      void reload(getActiveShareState().activeShareId);
      return undefined;
    }, []),
  );

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
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Expenses</Text>
        {model.summary.currencyTotals.length === 0 ? (
          <Text style={styles.summaryValue}>0.00</Text>
        ) : (
          <View style={styles.summaryTotalsList}>
            {model.summary.currencyTotals.map((total) => (
              <View key={total.currency || 'base'} style={styles.summaryTotalRow}>
                <Text style={styles.summaryCurrencyLabel}>{total.currency || 'BASE'}</Text>
                <Text style={styles.summaryValue}>{total.totalLabel}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      {model.entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyHeading}>No expenses yet</Text>
          <Text style={styles.emptyBody}>Add the first expense to see who owes what and how the split works.</Text>
        </View>
       ) : (
        <LedgerHistoryList
          model={model}
          highlightedExpenseId={params.expenseId ?? null}
          onPressEntry={openEntryDetail}
          onLongPressEntry={openEntryActions}
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
      <LedgerEntryDetailModal visible={detailModalVisible} model={detailModel} onClose={() => setDetailModalVisible(false)} />
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
  error: {
    color: colorTokens.destructive,
  },
  summaryCard: {
    borderRadius: radiusTokens.md,
    paddingVertical: spacingTokens.lg,
    paddingHorizontal: spacingTokens.lg,
    backgroundColor: colorTokens.inverseSoft,
    gap: spacingTokens.md,
  },
  summaryLabel: {
    color: colorTokens.inverseSecondary,
    fontSize: 29 / 2,
  },
  summaryTotalsList: {
    gap: spacingTokens.xs,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryCurrencyLabel: {
    color: colorTokens.inverseMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  summaryValue: {
    color: colorTokens.card,
    fontSize: 54 / 2,
    fontWeight: '700',
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
