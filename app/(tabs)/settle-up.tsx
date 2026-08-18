import { useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createSettleUpFlowController } from '../../src/mobile/controllers/settleUpFlowController';
import { SettlementRecommendationList } from '../../src/mobile/components/SettlementRecommendationList';
import { ShareableSettlementList } from '../../src/mobile/components/ShareableSettlementList';
import { getActiveShareState, subscribeActiveShare } from '../../src/mobile/state/activeShareStore';
import { generateSettlementImage, shareSettlementImage } from '../../src/mobile/actions/generateSettlementImage';
import { radiusTokens, spacingTokens, touchTarget } from '../../src/mobile/theme/tokens';
import { typographyTokens } from '../../src/mobile/theme/typography';
import { Button } from '../../src/mobile/components/Button';
import { useTheme } from '../../src/mobile/theme/useTheme';
import { getResponsiveMaxWidth } from '../../src/mobile/theme/layout';
import { EmptyStateBlock } from '../../src/mobile/components/AppScaffold';
import { CurrencyPickerSheet } from '../../src/mobile/components/CurrencyPickerSheet';

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
    const [error, setError] = useState<string | null>(null);
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
         },
        scrollContent: {
          paddingHorizontal: spacingTokens.lg,
          paddingTop: spacingTokens.lg,
          gap: spacingTokens.md,
        },
        content: {
          width: '100%',
          alignSelf: 'center',
          gap: spacingTokens.md,
        },
        bottomAction: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.card,
          paddingHorizontal: spacingTokens.lg,
          paddingTop: spacingTokens.md,
        },
        error: {
          color: colors.destructive,
          fontSize: 14,
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
          backgroundColor: colors.scrim,
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
          backgroundColor: colors.scrim,
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
    setIsCalculating(true);
    try {
      const nextModel = await flowController.load({ selectedLedgerId: nextShareId, selectedCurrencyCode: nextSelectedCurrencyCode });
      if (version !== requestVersion.current) {
        return;
      }
      setModel(nextModel);
      const recommendations = await flowController.generateRecommendations();
      if (version === requestVersion.current) {
        setModel(recommendations);
        setError(null);
      }
    } catch {
      if (version === requestVersion.current) {
        setError('Could not calculate settlement recommendations. Try again.');
      }
    } finally {
      if (version === requestVersion.current) {
        setIsCalculating(false);
      }
    }
  }

  useEffect(() => {
    void reload(activeShareId);
  }, [activeShareId]);

  function closeCurrencyPicker(): void {
    setCurrencyPickerOpen(false);
    setCurrencyQuery('');
    void flowController.searchAndSelectCurrency({ query: '', selectedCurrencyCode: model.selectedCurrencyCode }).then((nextModel) => {
      setModel(nextModel);
    });
  }

    return (
       <View style={dynamicStyles.screen}>
        <ScrollView
          contentContainerStyle={[dynamicStyles.scrollContent, { paddingBottom: spacingTokens.xl }]}
          keyboardShouldPersistTaps="handled"
        >
         <View style={[dynamicStyles.content, { maxWidth }]}>
          <Text style={dynamicStyles.currencyLabel}>SETTLEMENT CURRENCY</Text>
        <View style={dynamicStyles.card}>
           <Text style={dynamicStyles.hint}>Choose the currency for these recommendations.</Text>
          <Pressable style={dynamicStyles.selectLike} accessibilityRole="button" onPress={() => setCurrencyPickerOpen(true)}>
            <Text style={dynamicStyles.selectValue}>{model.selectedCurrencyCode}</Text>
            <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
          </Pressable>
          <Text style={dynamicStyles.description}>Selected: {selectedOption ? `${selectedOption.code} - ${selectedOption.label}` : model.selectedCurrencyCode}</Text>
        </View>

        <CurrencyPickerSheet
          visible={currencyPickerOpen}
          query={currencyQuery}
          options={model.currencyOptions}
          selectedCode={model.selectedCurrencyCode}
          maxWidth={maxWidth}
          onQueryChange={(nextQuery) => {
            setCurrencyQuery(nextQuery);
            void flowController.searchAndSelectCurrency({ query: nextQuery }).then((nextModel) => setModel(nextModel));
          }}
          onSelect={async (code) => {
            setCurrencyPickerOpen(false);
            setCurrencyQuery('');
            setIsCalculating(true);
            try {
               await reload(activeShareId, code);
             } catch {
               setError('Could not calculate settlement recommendations. Try again.');
             } finally {
              setIsCalculating(false);
            }
          }}
          onClose={closeCurrencyPicker}
        />

        {!model.hasLedger ? (
          <EmptyStateBlock title="No active share" message="Create or select a share to generate settlement recommendations." />
        ) : (
         <View style={dynamicStyles.requiredPaymentsWrap}>
            <Text style={dynamicStyles.requiredPaymentsLabel}>RECOMMENDED TRANSFERS</Text>
            {isCalculating ? <Text style={dynamicStyles.hint}>Calculating recommendations...</Text> : null}
            <SettlementRecommendationList model={{ recommendations: model.recommendations }} />
          </View>
         )}
          {error ? (
            <View style={dynamicStyles.card}>
              <Text style={dynamicStyles.error}>{error}</Text>
              <Button variant="secondary" onPress={() => void reload(activeShareId, model.selectedCurrencyCode)}>Retry</Button>
            </View>
          ) : null}

         {/* Preview modal with share options */}
         <Modal transparent visible={previewModalVisible} animationType="fade" onRequestClose={() => setPreviewModalVisible(false)}>
           <View style={dynamicStyles.previewOverlay}>
             <Pressable style={dynamicStyles.previewBackdrop} onPress={() => setPreviewModalVisible(false)} />
             <View style={dynamicStyles.previewSheet}>
                <Text style={dynamicStyles.previewTitle}>Recommendations Preview</Text>
               {settlementImageUri ? (
                  <Image
                    source={{ uri: settlementImageUri }}
                    style={dynamicStyles.previewImage}
                    resizeMode="contain"
                  />
                ) : null}
                  <Button leftIcon={<Ionicons name="share-social" size={20} color={colors.accentForeground} />} fullWidth onPress={async () => {
                    if (!settlementImageUri) return;
                    try {
                      await shareSettlementImage(settlementImageUri);
                      setError(null);
                    } catch {
                      setPreviewModalVisible(false);
                      setError('Could not share the recommendations image. Try again.');
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
        </ScrollView>
        <View style={[dynamicStyles.bottomAction, { paddingBottom: insets.bottom + spacingTokens.sm }]}>
          <View style={{ width: '100%', maxWidth, alignSelf: 'center' }}>
            <Button
              fullWidth
              loading={isGeneratingImage}
              disabled={model.recommendations.length === 0 || isCalculating}
              onPress={async () => {
                setIsGeneratingImage(true);
                try {
                  const imageUri = await generateSettlementImage(viewShotRef);
                  setSettlementImageUri(imageUri);
                  setPreviewModalVisible(true);
                  setError(null);
                } catch {
                  setError('Could not create the recommendations image. Try again.');
                } finally {
                  setIsGeneratingImage(false);
                }
              }}
            >
              Share Recommendations
            </Button>
          </View>
        </View>
       </View>
      );
    }

const styles = StyleSheet.create({});
