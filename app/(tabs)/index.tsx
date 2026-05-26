import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadHomeSnapshotModel, type HomeSnapshotModel } from '../../src/mobile/controllers/homeSnapshotController';
import { getActiveShareState, subscribeActiveShare } from '../../src/mobile/state/activeShareStore';
import { subscribeExpenseRefresh } from '../../src/mobile/state/expenseRefreshStore';
import { radiusTokens, spacingTokens, touchTarget } from '../../src/mobile/theme/tokens';
import { typographyTokens } from '../../src/mobile/theme/typography';
import { getDefaultParticipantIcon } from '../../src/mobile/utils/participantIcons';
import { getResponsiveMaxWidth } from '../../src/mobile/theme/layout';
import { useTheme } from '../../src/mobile/theme/useTheme';
import { EmptyStateBlock } from '../../src/mobile/components/AppScaffold';
import { AppIcon } from '../../src/mobile/components/AppIcon';

export default function HomeScreen(): JSX.Element {
   const router = useRouter();
   const insets = useSafeAreaInsets();
   const { width } = useWindowDimensions();
   const { colors } = useTheme();
   const maxWidth = getResponsiveMaxWidth(width);
    const isWide = width >= 840;
    const isVeryWide = width >= 1200;
    const statCardWidth = isVeryWide ? '31.5%' : isWide ? '32%' : '48%';
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

   const dynamicStyles = useMemo(
     () => StyleSheet.create({
       screen: {
         flex: 1,
         backgroundColor: colors.appBackground,
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
         color: colors.textMuted,
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
         backgroundColor: colors.card,
         borderWidth: 1,
         borderColor: colors.border,
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
         backgroundColor: colors.groupedSurface,
         alignItems: 'center',
         justifyContent: 'center',
       },
       avatarIcon: {
         fontSize: 18,
       },
       balanceName: {
         color: colors.textPrimary,
         fontSize: 16,
         fontWeight: '600',
       },
       balanceStatus: {
         color: colors.textMuted,
         fontSize: 12,
       },
       balanceAmount: {
         color: colors.textPrimary,
         fontSize: 18,
         fontWeight: '700',
         textAlign: 'right',
       },
       balanceAmountStack: {
         alignItems: 'flex-end',
         gap: spacingTokens.xs,
       },
        primaryButton: {
          marginTop: spacingTokens.md,
          minHeight: touchTarget.minimum,
          backgroundColor: colors.inverse,
          borderRadius: radiusTokens.md,
          alignItems: 'center',
          justifyContent: 'center',
        },
       primaryButtonText: {
         color: colors.card,
         fontSize: 16,
         fontWeight: '600',
       },
       latestExpenseCard: {
         backgroundColor: colors.card,
         borderWidth: 1,
         borderColor: colors.border,
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
         color: colors.textPrimary,
         fontSize: 16,
         fontWeight: '500',
       },
       latestMetaLead: {
         color: colors.textMuted,
         fontSize: 15,
       },
       latestMeta: {
         color: colors.textMuted,
         fontSize: 13,
       },
       latestAmount: {
         color: colors.textPrimary,
         fontSize: 24,
         fontWeight: '700',
       },
       latestBottomRow: {
         marginTop: spacingTokens.sm,
         paddingTop: spacingTokens.sm,
         borderTopWidth: 1,
         borderTopColor: colors.border,
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
         color: colors.textPrimary,
         fontSize: 13,
         textDecorationLine: 'underline',
       },
        statsRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacingTokens.sm,
          marginBottom: spacingTokens.md,
          justifyContent: 'flex-start',
        },
        statCardHalf: {
          width: '48%',
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radiusTokens.md,
          padding: spacingTokens.md,
          gap: spacingTokens.xs,
          minHeight: 100,
          justifyContent: 'center',
        },
       statValue: {
         color: colors.textPrimary,
         fontSize: 18,
         fontWeight: '700',
       },
       statLabel: {
         color: colors.textMuted,
         fontSize: 14,
       },
     }),
     [colors],
   );

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
        style={dynamicStyles.screen}
        contentContainerStyle={[dynamicStyles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + spacingTokens.xl, maxWidth, alignSelf: 'center', width: '100%' }]}
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
       <View style={dynamicStyles.shareTitleBlock}>
          <View style={dynamicStyles.shareTitleRow}>
            <Text style={dynamicStyles.shareTitle}>{model.shareTitle ?? 'No active share'}</Text>
          </View>
        </View>

        {error ? <Text style={dynamicStyles.helper}>{error}</Text> : null}

        {!model.shareTitle ? (
          <View style={{ alignItems: 'center', gap: spacingTokens.lg, marginVertical: spacingTokens.xl }}>
            <AppIcon size={80} />
            <View style={{ alignItems: 'center', gap: spacingTokens.sm }}>
              <Text style={dynamicStyles.shareTitle}>Welcome to DumShare</Text>
              <Text style={dynamicStyles.helper}>Open the menu to create your first share</Text>
            </View>
          </View>
        ) : null}

        {model.participantRows.length === 0 && model.shareTitle ? (
          <EmptyStateBlock title="No expenses yet" message="Add the first expense to see who owes what and how the split works." />
        ) : model.participantRows.length > 0 ? (
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionLabel}>Current Status</Text>
            <View style={dynamicStyles.stack}>
              {model.participantRows.map((row) => (
                <View key={`${row.participantName}-${row.netAmountLabel}`} style={dynamicStyles.balanceCard}>
                  <View style={dynamicStyles.balanceNameColumn}>
                    <View style={dynamicStyles.avatarDot}>
                      <Text style={dynamicStyles.avatarIcon}>{getDefaultParticipantIcon(row.participantName)}</Text>
                    </View>
                    <View>
                      <Text style={dynamicStyles.balanceName}>{row.participantName}</Text>
                      <Text style={dynamicStyles.balanceStatus}>{rowStatus(row.statusLabel)}</Text>
                    </View>
                  </View>
                  <View style={dynamicStyles.balanceAmountStack}>
                    {row.balanceLabels.map((label) => (
                      <Text key={`${row.participantName}-${label}`} style={dynamicStyles.balanceAmount}>
                        {label}
                      </Text>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {model.shareTitle ? (
          <>
            <Pressable style={dynamicStyles.primaryButton} accessibilityRole="button" onPress={() => router.push('/(tabs)/add-expense')}>
              <Text style={dynamicStyles.primaryButtonText}>+  Add New Expense</Text>
            </Pressable>

            {model.latestExpenseCard ? (
              <View style={dynamicStyles.section}>
                <Text style={dynamicStyles.sectionLabel}>Last Entered Expense</Text>
                <View style={dynamicStyles.latestExpenseCard}>
                  <View style={dynamicStyles.latestTopRow}>
                    <View style={dynamicStyles.latestMainBlock}>
                      <Text style={dynamicStyles.latestTitle}>{model.latestExpenseCard.title}</Text>
                      <Text style={dynamicStyles.latestMetaLead}>{model.latestExpenseCard.payerLabel}</Text>
                    </View>
                    <Text style={dynamicStyles.latestAmount}>{model.latestExpenseCard.amountLabel}</Text>
                  </View>
                  <View style={dynamicStyles.latestBottomRow}>
                    <Text style={dynamicStyles.latestMeta}>◷ {model.latestExpenseCard.timestampLabel}</Text>
                    <Pressable
                      accessibilityRole="button"
                      style={dynamicStyles.viewDetailsButton}
                      onPress={() =>
                        router.push({
                          pathname: '/(tabs)/ledger',
                          params: { expenseId: model.latestExpenseCard?.expenseId },
                        })
                      }
                    >
                      <Text style={dynamicStyles.viewDetailsText}>View Details</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : null}

            <View style={dynamicStyles.statsRow}>
              <View style={dynamicStyles.statCardHalf}>
                <Text style={dynamicStyles.statValue}>{model.expenseCount}</Text>
                <Text style={dynamicStyles.statLabel}>Total Expenses</Text>
              </View>
              {model.currencyTotals.length > 0
                ? model.currencyTotals.map((currencyTotal) => (
                    <View key={currencyTotal.currency || 'base'} style={[dynamicStyles.statCardHalf, { width: statCardWidth }]}>
                      <Text style={dynamicStyles.statValue}>{currencyTotal.totalAmountLabel}</Text>
                      <Text style={dynamicStyles.statLabel}>{currencyTotal.currency ? `Total ${currencyTotal.currency}` : 'Total Amount'}</Text>
                    </View>
                  ))
                : (
                    <View style={[dynamicStyles.statCardHalf, { width: statCardWidth }]}>
                      <Text style={dynamicStyles.statValue}>{model.totalAmountLabel}</Text>
                      <Text style={dynamicStyles.statLabel}>Total Amount</Text>
                    </View>
                  )}
            </View>
          </>
        ) : null}
     </ScrollView>
   );
 }
 
 const styles = StyleSheet.create({});
 
