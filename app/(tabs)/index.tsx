import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { loadHomeSnapshotModel, type HomeSnapshotModel } from '../../src/mobile/controllers/homeSnapshotController';
import { getActiveShareState, subscribeActiveShare } from '../../src/mobile/state/activeShareStore';
import { subscribeExpenseRefresh } from '../../src/mobile/state/expenseRefreshStore';
import { colorTokens, radiusTokens, spacingTokens, touchTarget } from '../../src/mobile/theme/tokens';
import { typographyTokens } from '../../src/mobile/theme/typography';

const PARTICIPANT_ICON_POOL = ['😎', '🦊', '🐼', '🐯', '🦉', '🐙', '🐸', '🐧', '🐨', '🦁', '🐬', '🦄'] as const;

function hashName(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function getDefaultParticipantIcon(displayName: string): string {
  const hash = hashName(displayName.trim().toLowerCase());
  return PARTICIPANT_ICON_POOL[hash % PARTICIPANT_ICON_POOL.length] ?? '😎';
}

export default function HomeScreen(): JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ refreshToken?: string }>();
  const [activeShareId, setActiveShareId] = useState<string | null>(getActiveShareState().activeShareId);
  const [model, setModel] = useState<HomeSnapshotModel>({
    shareTitle: null,
    latestActivityLabel: 'No activity',
    participantCount: 0,
    expenseCount: 0,
    totalAmountLabel: '0.00',
    currencyTotals: [],
    participantRows: [],
    latestExpenseCard: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const requestVersion = useRef(0);

  useEffect(() => subscribeActiveShare((state) => setActiveShareId(state.activeShareId)), []);
  useEffect(
    () =>
      subscribeExpenseRefresh(() => {
        void reload(getActiveShareState().activeShareId);
      }),
    [],
  );

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

  useFocusEffect(
    useCallback(() => {
      void reload(getActiveShareState().activeShareId);
      return undefined;
    }, []),
  );

  useEffect(() => {
    if (!params.refreshToken) {
      return;
    }
    void reload(getActiveShareState().activeShareId);
  }, [params.refreshToken]);

  function rowStatus(statusLabel: HomeSnapshotModel['participantRows'][number]['statusLabel']): string {
    if (statusLabel === 'mixed') {
      return 'Mixed by currency';
    }
    if (statusLabel === 'owes') {
      return 'You owe';
    }
    if (statusLabel === 'is owed') {
      return 'You are owed';
    }
    return 'All settled up';
  }

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
      <View style={styles.shareTitleBlock}>
        <View style={styles.shareTitleRow}>
          <Text style={styles.shareTitle}>{model.shareTitle ?? 'No active share'}</Text>
        </View>
      </View>

      {error ? <Text style={styles.helper}>{error}</Text> : null}

      {model.participantRows.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyHeading}>No expenses yet</Text>
          <Text style={styles.helper}>Add the first expense to see who owes what and how the split works.</Text>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Current Status</Text>
          <View style={styles.stack}>
            {model.participantRows.map((row) => (
              <View key={`${row.participantName}-${row.netAmountLabel}`} style={styles.balanceCard}>
                <View style={styles.balanceNameColumn}>
                  <View style={styles.avatarDot}>
                    <Text style={styles.avatarIcon}>{getDefaultParticipantIcon(row.participantName)}</Text>
                  </View>
                  <View>
                    <Text style={styles.balanceName}>{row.participantName}</Text>
                    <Text style={styles.balanceStatus}>{rowStatus(row.statusLabel)}</Text>
                  </View>
                </View>
                <View style={styles.balanceAmountStack}>
                  {row.balanceLabels.map((label) => (
                    <Text key={`${row.participantName}-${label}`} style={styles.balanceAmount}>
                      {label}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <Pressable style={styles.primaryButton} accessibilityRole="button" onPress={() => router.push('/(tabs)/add-expense')}>
        <Text style={styles.primaryButtonText}>+  Add New Expense</Text>
      </Pressable>

      {model.latestExpenseCard ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Last Entered Expense</Text>
          <View style={styles.latestExpenseCard}>
            <View style={styles.latestTopRow}>
              <View style={styles.latestMainBlock}>
                <Text style={styles.latestTitle}>{model.latestExpenseCard.title}</Text>
                <Text style={styles.latestMetaLead}>{model.latestExpenseCard.payerLabel}</Text>
              </View>
              <Text style={styles.latestAmount}>{model.latestExpenseCard.amountLabel}</Text>
            </View>
            <View style={styles.latestBottomRow}>
              <Text style={styles.latestMeta}>◷ {model.latestExpenseCard.timestampLabel}</Text>
              <Pressable
                accessibilityRole="button"
                style={styles.viewDetailsButton}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/ledger',
                    params: { expenseId: model.latestExpenseCard?.expenseId },
                  })
                }
              >
                <Text style={styles.viewDetailsText}>View Details</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      <View style={styles.statsRow}>
        <View style={styles.statCardHalf}>
          <Text style={styles.statValue}>{model.expenseCount}</Text>
          <Text style={styles.statLabel}>Total Expenses</Text>
        </View>
        {model.currencyTotals.length > 0
          ? model.currencyTotals.map((currencyTotal) => (
              <View key={currencyTotal.currency || 'base'} style={styles.statCardHalf}>
                <Text style={styles.statValue}>{currencyTotal.totalAmountLabel}</Text>
                <Text style={styles.statLabel}>{currencyTotal.currency ? `Total ${currencyTotal.currency}` : 'Total Amount'}</Text>
              </View>
            ))
          : (
              <View style={styles.statCardHalf}>
                <Text style={styles.statValue}>{model.totalAmountLabel}</Text>
                <Text style={styles.statLabel}>Total Amount</Text>
              </View>
            )}
      </View>
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
  shareTitleBlock: {
    gap: spacingTokens.xs,
  },
  shareTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacingTokens.sm,
  },
  shareTitle: {
    ...typographyTokens.heading,
    flex: 1,
  },
  helper: {
    color: colorTokens.textMuted,
  },
  section: {
    gap: spacingTokens.sm,
  },
  sectionLabel: {
    ...typographyTokens.sectionLabel,
  },
  stack: {
    gap: spacingTokens.sm,
  },
  balanceCard: {
    backgroundColor: colorTokens.card,
    borderWidth: 1,
    borderColor: colorTokens.border,
    borderRadius: radiusTokens.md,
    padding: spacingTokens.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceNameColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingTokens.sm,
  },
  avatarDot: {
    width: 34,
    height: 34,
    borderRadius: radiusTokens.pill,
    backgroundColor: colorTokens.groupedSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontSize: 18,
  },
  balanceName: {
    color: colorTokens.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  balanceStatus: {
    color: colorTokens.textMuted,
    fontSize: 12,
  },
  balanceAmount: {
    color: colorTokens.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
  },
  balanceAmountStack: {
    alignItems: 'flex-end',
    gap: spacingTokens.xs,
  },
  primaryButton: {
    marginTop: spacingTokens.sm,
    minHeight: 54,
    backgroundColor: colorTokens.inverse,
    borderRadius: radiusTokens.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colorTokens.card,
    fontSize: 16,
    fontWeight: '600',
  },
  latestExpenseCard: {
    backgroundColor: colorTokens.card,
    borderWidth: 1,
    borderColor: colorTokens.border,
    borderRadius: radiusTokens.md,
    padding: spacingTokens.md,
    gap: spacingTokens.xs,
  },
  latestTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacingTokens.sm,
  },
  latestMainBlock: {
    flex: 1,
    gap: spacingTokens.xs,
  },
  latestTitle: {
    color: colorTokens.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  latestMetaLead: {
    color: colorTokens.textMuted,
    fontSize: 15,
  },
  latestMeta: {
    color: colorTokens.textMuted,
    fontSize: 13,
  },
  latestAmount: {
    color: colorTokens.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  latestBottomRow: {
    marginTop: spacingTokens.sm,
    paddingTop: spacingTokens.sm,
    borderTopWidth: 1,
    borderTopColor: colorTokens.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewDetailsButton: {
    minHeight: touchTarget.minimum,
    justifyContent: 'center',
    paddingHorizontal: spacingTokens.xs,
  },
  viewDetailsText: {
    color: colorTokens.textPrimary,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacingTokens.sm,
    marginBottom: spacingTokens.xl,
  },
  statCardHalf: {
    width: '48%',
    backgroundColor: colorTokens.card,
    borderWidth: 1,
    borderColor: colorTokens.border,
    borderRadius: radiusTokens.md,
    padding: spacingTokens.md,
    gap: spacingTokens.xs,
  },
  statValue: {
    color: colorTokens.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: colorTokens.textMuted,
    fontSize: 14,
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
