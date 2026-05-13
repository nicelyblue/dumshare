import { useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { loadHomeSnapshotModel, type HomeSnapshotModel } from '../../src/mobile/controllers/homeSnapshotController';
import { HomeSnapshotCard } from '../../src/mobile/components/HomeSnapshotCard';
import { getActiveShareState, subscribeActiveShare } from '../../src/mobile/state/activeShareStore';
import { colorTokens, spacingTokens } from '../../src/mobile/theme/tokens';
import { typographyTokens } from '../../src/mobile/theme/typography';

export default function HomeScreen(): JSX.Element {
  const [activeShareId, setActiveShareId] = useState<string | null>(getActiveShareState().activeShareId);
  const [model, setModel] = useState<HomeSnapshotModel>({ participantRows: [], latestExpenseCard: null });
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const requestVersion = useRef(0);

  useEffect(() => subscribeActiveShare((state) => setActiveShareId(state.activeShareId)), []);

  async function reload(nextShareId: string | null): Promise<void> {
    requestVersion.current += 1;
    const version = requestVersion.current;

    try {
      const nextModel = await loadHomeSnapshotModel({ selectedLedgerId: nextShareId });
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
      <Text style={styles.title}>Home Dashboard</Text>
      <Text style={styles.body}>Active share: {activeShareId ?? 'None selected'}</Text>
      {error ? <Text style={styles.helper}>{error}</Text> : null}
      {model.participantRows.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyHeading}>No expenses yet</Text>
          <Text style={styles.helper}>Add the first expense to see who owes what and how the split works.</Text>
        </View>
      ) : (
        <HomeSnapshotCard model={model} />
      )}
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
  helper: {
    color: colorTokens.textMuted,
  },
  emptyState: {
    marginTop: spacingTokens.lg,
    padding: spacingTokens.lg,
    borderRadius: 12,
    backgroundColor: colorTokens.groupedSurface,
    gap: 8,
  },
  emptyHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: colorTokens.textPrimary,
  },
});
