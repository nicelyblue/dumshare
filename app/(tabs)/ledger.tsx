import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { deleteExpenseById, loadLedgerHistoryModel, loadLedgerExpenseDetailsModel, type LedgerHistoryModel, type LedgerExpenseDetailsModel } from '../../src/mobile/controllers/ledgerHistoryController';
import { LedgerHistoryList } from '../../src/mobile/components/LedgerHistoryList';
import { LedgerEntryDetailModal } from '../../src/mobile/components/LedgerEntryDetailModal';
import { getActiveShareState, subscribeActiveShare } from '../../src/mobile/state/activeShareStore';
import { LongPressActionSheet } from '../../src/mobile/components/LongPressActionSheet';
import { setPendingExpenseDraft } from '../../src/mobile/state/expenseDraftStore';
import { router, useLocalSearchParams } from 'expo-router';
import { radiusTokens, spacingTokens } from '../../src/mobile/theme/tokens';
import { useTheme } from '../../src/mobile/theme/useTheme';
import { EmptyStateBlock } from '../../src/mobile/components/AppScaffold';
import { getResponsiveMaxWidth } from '../../src/mobile/theme/layout';
import { Button } from '../../src/mobile/components/Button';
import { modalSheetStyles } from '../../src/mobile/theme/styles';

export default function LedgerScreen(): JSX.Element {
   const insets = useSafeAreaInsets();
   const { width } = useWindowDimensions();
   const { colors } = useTheme();
   const maxWidth = getResponsiveMaxWidth(width);
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
   const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
   const [detailModalVisible, setDetailModalVisible] = useState(false);
   const [detailModel, setDetailModel] = useState<LedgerExpenseDetailsModel | null>(null);
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
       error: {
         color: colors.destructive,
       },
        summaryCard: {
          borderRadius: radiusTokens.md,
          borderWidth: 1,
          borderColor: colors.inverseBorder,
          paddingVertical: spacingTokens.lg,
          paddingHorizontal: spacingTokens.lg,
          backgroundColor: colors.inverseSoft,
          gap: spacingTokens.md,
          minHeight: 120,
          justifyContent: 'center',
        },
       summaryLabel: {
         color: colors.inverseSecondary,
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
         color: colors.inverseMuted,
         fontSize: 13,
         fontWeight: '600',
       },
       summaryValue: {
         color: colors.card,
         fontSize: 54 / 2,
         fontWeight: '700',
       },
       modalBackdrop: {
         flex: 1,
       },
       confirmCard: {
         gap: spacingTokens.sm,
       },
       confirmTitle: {
         color: colors.textPrimary,
         fontSize: 18,
         fontWeight: '700',
       },
       confirmBody: {
         color: colors.textMuted,
         marginBottom: spacingTokens.xs,
       },
     }),
     [colors],
   );

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
       {error ? <Text style={dynamicStyles.error}>{error}</Text> : null}
       <View style={dynamicStyles.summaryCard}>
         <Text style={dynamicStyles.summaryLabel}>Total Expenses</Text>
         {model.summary.currencyTotals.length === 0 ? (
           <Text style={dynamicStyles.summaryValue}>0.00</Text>
         ) : (
           <View style={dynamicStyles.summaryTotalsList}>
             {model.summary.currencyTotals.map((total) => (
               <View key={total.currency || 'base'} style={dynamicStyles.summaryTotalRow}>
                 <Text style={dynamicStyles.summaryCurrencyLabel}>{total.currency || 'BASE'}</Text>
                 <Text style={dynamicStyles.summaryValue}>{total.totalLabel}</Text>
               </View>
             ))}
           </View>
         )}
       </View>
       {model.entries.length === 0 ? (
         <EmptyStateBlock title="No expenses yet" message="Add the first expense to see who owes what and how the split works." />
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

           setDeleteConfirmVisible(true);
         }}
       />
       <Modal transparent visible={deleteConfirmVisible} animationType="fade" onRequestClose={() => setDeleteConfirmVisible(false)}>
         <View style={modalSheetStyles.overlay}>
           <Pressable style={dynamicStyles.modalBackdrop} onPress={() => setDeleteConfirmVisible(false)} />
           <View
             style={[
               modalSheetStyles.sheetCard,
               dynamicStyles.confirmCard,
               { width: '100%', maxWidth, alignSelf: 'center', paddingBottom: insets.bottom + spacingTokens.md },
             ]}
           >
             <Text style={dynamicStyles.confirmTitle}>Delete expense?</Text>
             <Text style={dynamicStyles.confirmBody}>This action cannot be undone.</Text>
             <Button
               variant="destructive"
               fullWidth
               onPress={() => {
                 if (!selectedExpenseId) {
                   setDeleteConfirmVisible(false);
                   return;
                 }
                 setDeleteConfirmVisible(false);
                 void deleteExpenseById({ expenseId: selectedExpenseId, selectedLedgerId: activeShareId }).then(() => reload(activeShareId));
               }}
             >
               Delete
             </Button>
             <Button variant="secondary" fullWidth onPress={() => setDeleteConfirmVisible(false)}>
               Cancel
             </Button>
           </View>
         </View>
       </Modal>
       <LedgerEntryDetailModal visible={detailModalVisible} model={detailModel} onClose={() => setDetailModalVisible(false)} />
     </ScrollView>
   );
 }
 
 const styles = StyleSheet.create({});
