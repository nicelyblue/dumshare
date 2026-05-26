import { useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, Image, useWindowDimensions } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createSettleUpFlowController } from '../../src/mobile/controllers/settleUpFlowController';
import { SettlementRecommendationList } from '../../src/mobile/components/SettlementRecommendationList';
import { ShareableSettlementList } from '../../src/mobile/components/ShareableSettlementList';
import { getActiveShareState, subscribeActiveShare } from '../../src/mobile/state/activeShareStore';
import { generateSettlementImage, shareSettlementImage } from '../../src/mobile/actions/generateSettlementImage';
import { radiusTokens, spacingTokens, touchTarget } from '../../src/mobile/theme/tokens';
import { typographyTokens } from '../../src/mobile/theme/typography';
import { FormTextInput } from '../../src/mobile/components/FormFields';
import { Button } from '../../src/mobile/components/Button';
import { useTheme } from '../../src/mobile/theme/useTheme';
import { getResponsiveMaxWidth } from '../../src/mobile/theme/layout';
import { EmptyStateBlock } from '../../src/mobile/components/AppScaffold';

const flowController = createSettleUpFlowController();

export default function SettleUpScreen(): JSX.Element {
   const insets = useSafeAreaInsets();
   const { width } = useWindowDimensions();
   const { colors } = useTheme();
   const maxWidth = getResponsiveMaxWidth(width);
   const [activeShareId, setActiveShareId] = useState<string | null>(getActiveShareState().activeShareId);
   const [currencyQuery, setCurrencyQuery] = useState('');
   const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);
   const [isCalculating, setIsCalculating] = useState(false);
   const [isGeneratingImage, setIsGeneratingImage] = useState(false);
   const [previewModalVisible, setPreviewModalVisible] = useState(false);
   const [settlementImageUri, setSettlementImageUri] = useState<string | null>(null);
   const [model, setModel] = useState(flowController.getState());
   const requestVersion = useRef(0);
   const viewShotRef = useRef<ViewShot>(null);

   const dynamicStyles = useMemo(
     () => StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: colors.appBackground,
          gap: 0,
        },
       title: {
         ...typographyTokens.heading,
       },
       body: {
         ...typographyTokens.body,
         color: colors.textMuted,
       },
       card: {
         marginTop: 6,
         padding: 14,
         borderRadius: radiusTokens.md,
         borderWidth: 1,
         borderColor: colors.border,
         backgroundColor: colors.card,
         gap: 6,
       },
       label: {
         fontSize: 13,
         fontWeight: '600',
         color: colors.textPrimary,
       },
       input: {
         borderWidth: 1,
         borderColor: colors.border,
         borderRadius: radiusTokens.md,
         paddingHorizontal: 10,
         paddingVertical: 8,
         backgroundColor: colors.inputBackground,
         minHeight: touchTarget.minimum,
       },
       actionsRow: {
         flexDirection: 'row',
         gap: 8,
       },
       selectLike: {
         borderWidth: 1,
         borderColor: colors.border,
         borderRadius: radiusTokens.md,
         backgroundColor: colors.card,
         paddingHorizontal: spacingTokens.md,
         minHeight: touchTarget.minimum,
         flexDirection: 'row',
         alignItems: 'center',
         justifyContent: 'space-between',
       },
       selectValue: {
         color: colors.textPrimary,
         fontSize: 22 / 2,
       },
       secondaryButton: {
         flex: 1,
         alignItems: 'center',
         borderWidth: 1,
         borderColor: colors.inverse,
         borderRadius: radiusTokens.md,
         paddingVertical: 11,
       },
       secondaryButtonText: {
         color: colors.textPrimary,
         fontWeight: '600',
       },
       amount: {
         fontSize: 24,
         fontWeight: '700',
         color: colors.textPrimary,
       },
       description: {
         color: colors.textMuted,
       },
       hint: {
         fontSize: 13,
         color: colors.textMuted,
       },
       calculateButton: {
         width: '100%',
       },
       disabledButton: {
         opacity: 0.55,
       },
       requiredPaymentsWrap: {
         gap: spacingTokens.sm,
       },
       requiredPaymentsLabel: {
         ...typographyTokens.sectionLabel,
       },
       currencyLabel: {
         ...typographyTokens.sectionLabel,
       },
       modalOverlay: {
         flex: 1,
         justifyContent: 'flex-end',
         backgroundColor: 'rgba(16, 17, 20, 0.3)',
       },
       modalBackdrop: {
         flex: 1,
       },
        modalCard: {
          backgroundColor: colors.card,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          paddingHorizontal: spacingTokens.lg,
          paddingTop: spacingTokens.md,
          paddingBottom: insets.bottom + spacingTokens.md,
          gap: spacingTokens.sm,
          maxHeight: '75%',
        },
       modalTitle: {
         ...typographyTokens.body,
         fontWeight: '700',
       },
       modalList: {
         maxHeight: 320,
       },
       modalListContent: {
         paddingBottom: spacingTokens.sm,
       },
       modalRow: {
         minHeight: touchTarget.minimum,
         borderBottomWidth: 1,
         borderBottomColor: colors.subtleBorder,
         paddingVertical: spacingTokens.sm,
         flexDirection: 'row',
         alignItems: 'center',
         justifyContent: 'space-between',
       },
       modalRowTitle: {
         ...typographyTokens.body,
         fontSize: 15,
       },
       modalRowSubtitle: {
         ...typographyTokens.label,
         color: colors.textMuted,
         flexShrink: 1,
         marginLeft: spacingTokens.sm,
       },
       previewOverlay: {
         flex: 1,
         justifyContent: 'center',
         backgroundColor: 'rgba(16, 17, 20, 0.5)',
       },
       previewBackdrop: {
         flex: 1,
       },
       previewSheet: {
         backgroundColor: colors.card,
         marginHorizontal: spacingTokens.lg,
         borderRadius: radiusTokens.md,
         paddingHorizontal: spacingTokens.lg,
         paddingTop: spacingTokens.lg,
         paddingBottom: spacingTokens.lg,
         gap: spacingTokens.md,
         maxHeight: '80%',
       },
       previewTitle: {
         fontSize: 18,
         fontWeight: '700',
         color: colors.textPrimary,
         textAlign: 'center',
       },
       previewImage: {
         width: '100%',
         height: 300,
         borderRadius: radiusTokens.md,
         backgroundColor: colors.appBackground,
       },
     }),
     [colors],
   );

  useEffect(() => subscribeActiveShare((state) => setActiveShareId(state.activeShareId)), []);

  const selectedOption = useMemo(
    () => model.currencyOptions.find((option) => option.code === model.selectedCurrencyCode),
    [model.currencyOptions, model.selectedCurrencyCode],
  );

  async function reload(nextShareId: string | null, nextSelectedCurrencyCode?: string): Promise<void> {
    requestVersion.current += 1;
    const version = requestVersion.current;
    const nextModel = await flowController.load({ selectedLedgerId: nextShareId, selectedCurrencyCode: nextSelectedCurrencyCode });
    if (version !== requestVersion.current) {
      return;
    }
    setModel(nextModel);
  }

  useEffect(() => {
    void reload(activeShareId).then(() => {
      // Auto-calculate settlement when screen loads
      void flowController.generateRecommendations().then(setModel);
    });
  }, [activeShareId]);

  function closeCurrencyPicker(): void {
    setCurrencyPickerOpen(false);
    setCurrencyQuery('');
    void flowController.searchAndSelectCurrency({ query: '', selectedCurrencyCode: model.selectedCurrencyCode }).then((nextModel) => {
      setModel(nextModel);
    });
  }

    return (
       <View style={[dynamicStyles.screen, { paddingTop: insets.top + spacingTokens.lg, paddingBottom: insets.bottom + spacingTokens.lg, paddingHorizontal: spacingTokens.lg }]}>
         <View style={{ width: '100%', maxWidth, alignSelf: 'center', gap: spacingTokens.md }}>
         <Text style={dynamicStyles.currencyLabel}>CURRENCY SELECTION</Text>
        <View style={dynamicStyles.card}>
          <Text style={dynamicStyles.hint}>Select the settlement currency to calculate amounts</Text>
          <Pressable style={dynamicStyles.selectLike} accessibilityRole="button" onPress={() => setCurrencyPickerOpen(true)}>
            <Text style={dynamicStyles.selectValue}>{model.selectedCurrencyCode}</Text>
            <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
          </Pressable>
          <Text style={dynamicStyles.description}>Selected: {selectedOption ? `${selectedOption.code} - ${selectedOption.label}` : model.selectedCurrencyCode}</Text>
        </View>

       <Modal transparent visible={currencyPickerOpen} animationType="fade" onRequestClose={closeCurrencyPicker}>
         <View style={dynamicStyles.modalOverlay}>
           <Pressable style={dynamicStyles.modalBackdrop} onPress={closeCurrencyPicker} />
           <View style={dynamicStyles.modalCard}>
             <Text style={dynamicStyles.modalTitle}>Select Currency</Text>
             <FormTextInput
               value={currencyQuery}
               onChangeText={(nextQuery) => {
                 setCurrencyQuery(nextQuery);
                 void flowController.searchAndSelectCurrency({ query: nextQuery }).then((nextModel) => setModel(nextModel));
               }}
               placeholder="Search code or name"
             />
             <ScrollView style={dynamicStyles.modalList} contentContainerStyle={dynamicStyles.modalListContent} keyboardShouldPersistTaps="handled">
               {model.currencyOptions.map((option) => (
                 <Pressable
                   key={option.code}
                   style={dynamicStyles.modalRow}
                   accessibilityRole="button"
                   onPress={async () => {
                     setCurrencyPickerOpen(false);
                     setCurrencyQuery('');
                     setIsCalculating(true);
                     try {
                       const nextModel = await flowController.load({ selectedLedgerId: activeShareId, selectedCurrencyCode: option.code });
                       setModel(nextModel);
                       
                       // If there were previous recommendations, recalculate in the new currency
                       if (nextModel.recommendations.length > 0) {
                         const recalculated = await flowController.generateRecommendations();
                         setModel(recalculated);
                       }
                     } finally {
                       setIsCalculating(false);
                     }
                   }}
                 >
                   <Text style={dynamicStyles.modalRowTitle}>{option.code}</Text>
                   <Text style={dynamicStyles.modalRowSubtitle}>{option.label}</Text>
                 </Pressable>
               ))}
             </ScrollView>
           </View>
         </View>
       </Modal>

        {!model.hasLedger ? (
          <EmptyStateBlock title="No active share" message="Create or select a share to generate settlement recommendations." />
        ) : (
         <View style={dynamicStyles.requiredPaymentsWrap}>
           <Text style={dynamicStyles.requiredPaymentsLabel}>REQUIRED PAYMENTS</Text>
           <SettlementRecommendationList model={{ recommendations: model.recommendations }} />
         </View>
        )}

         <Button
           fullWidth
           loading={isGeneratingImage}
           onPress={async () => {
             if (model.recommendations.length === 0) {
               return;
             }
             setIsGeneratingImage(true);
            try {
              const imageUri = await generateSettlementImage(viewShotRef);
              setSettlementImageUri(imageUri);
              setPreviewModalVisible(true);
            } catch (error) {
              console.error('Error generating settlement image:', error);
            } finally {
              setIsGeneratingImage(false);
            }
           }}
         >
           Share settlement
         </Button>

         {/* Preview modal with share options */}
         <Modal transparent visible={previewModalVisible} animationType="fade" onRequestClose={() => setPreviewModalVisible(false)}>
           <View style={dynamicStyles.previewOverlay}>
             <Pressable style={dynamicStyles.previewBackdrop} onPress={() => setPreviewModalVisible(false)} />
             <View style={dynamicStyles.previewSheet}>
               <Text style={dynamicStyles.previewTitle}>Settlement Preview</Text>
               {settlementImageUri ? (
                  <Image
                    source={{ uri: settlementImageUri }}
                    style={dynamicStyles.previewImage}
                    resizeMode="contain"
                  />
                ) : null}
                 <Button leftIcon={<Ionicons name="share-social" size={20} color={colors.card} />} fullWidth onPress={async () => {
                   if (!settlementImageUri) return;
                   try {
                     await shareSettlementImage(settlementImageUri);
                   } catch (error) {
                     console.error('Error sharing settlement:', error);
                   }
                 }}>
                   Share image
                 </Button>
                 <Button variant="secondary" fullWidth onPress={() => setPreviewModalVisible(false)}>
                   Done
                 </Button>
               </View>
             </View>
           </Modal>

         {/* Hidden component for capturing settlement as PNG */}
         <View style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
           <ShareableSettlementList
             ref={viewShotRef}
             model={{
               currency: model.selectedCurrencyCode,
               recommendations: model.recommendations,
             }}
           />
         </View>
        </View>
       </View>
      );
    }

const styles = StyleSheet.create({});
