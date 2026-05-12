import { useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { loadExpenseReviewModel, type ExpenseReviewModel } from '../../src/mobile/controllers/expenseReviewController';
import { ExpenseReviewList } from '../../src/mobile/components/ExpenseReviewList';
import { getActiveShareState, subscribeActiveShare } from '../../src/mobile/state/activeShareStore';

export default function LedgerScreen(): JSX.Element {
  const [activeShareId, setActiveShareId] = useState<string | null>(getActiveShareState().activeShareId);
  const [model, setModel] = useState<ExpenseReviewModel>({ items: [] });
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const requestVersion = useRef(0);

  useEffect(() => subscribeActiveShare((state) => setActiveShareId(state.activeShareId)), []);

  async function reload(nextShareId: string | null): Promise<void> {
    requestVersion.current += 1;
    const version = requestVersion.current;

    try {
      const nextModel = await loadExpenseReviewModel({ selectedLedgerId: nextShareId });
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
      <Text style={styles.title}>Ledger</Text>
      <Text style={styles.body}>Active share: {activeShareId ?? 'None selected'}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {model.items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyHeading}>No expenses yet</Text>
          <Text style={styles.emptyBody}>Add the first expense to see who owes what and how the split works.</Text>
        </View>
      ) : (
        <ExpenseReviewList model={model} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'floralwhite',
  },
  content: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: 'black',
  },
  body: {
    fontSize: 16,
    color: 'dimgray',
  },
  error: {
    color: 'firebrick',
  },
  emptyState: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'antiquewhite',
    gap: 8,
  },
  emptyHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: 'black',
  },
  emptyBody: {
    color: 'slategray',
  },
});
