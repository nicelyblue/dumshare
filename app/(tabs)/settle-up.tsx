import { useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator, Image } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { createSettleUpFlowController } from '../../src/mobile/controllers/settleUpFlowController';
import { SettlementRecommendationList } from '../../src/mobile/components/SettlementRecommendationList';
import { ShareableSettlementList } from '../../src/mobile/components/ShareableSettlementList';
import { getActiveShareState, subscribeActiveShare } from '../../src/mobile/state/activeShareStore';
import { generateSettlementImage, shareSettlementImage } from '../../src/mobile/actions/generateSettlementImage';
import { colorTokens, radiusTokens, spacingTokens, touchTarget } from '../../src/mobile/theme/tokens';
import { typographyTokens } from '../../src/mobile/theme/typography';

const flowController = createSettleUpFlowController();

export default function SettleUpScreen(): JSX.Element {
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
     <View style={styles.screen}>
       <Text style={styles.currencyLabel}>CURRENCY SELECTION</Text>
       <Text style={styles.hint}>Select the settlement currency to calculate amounts</Text>
       <View style={styles.card}>
         <Pressable style={styles.selectLike} accessibilityRole="button" onPress={() => setCurrencyPickerOpen(true)}>
           <Text style={styles.selectValue}>{model.selectedCurrencyCode}</Text>
           <Ionicons name="chevron-down" size={18} color={colorTokens.textMuted} />
         </Pressable>
         <Text style={styles.description}>Selected: {selectedOption ? `${selectedOption.code} - ${selectedOption.label}` : model.selectedCurrencyCode}</Text>
       </View>

      <Modal transparent visible={currencyPickerOpen} animationType="fade" onRequestClose={closeCurrencyPicker}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closeCurrencyPicker} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            <TextInput
              value={currencyQuery}
              onChangeText={(nextQuery) => {
                setCurrencyQuery(nextQuery);
                void flowController.searchAndSelectCurrency({ query: nextQuery }).then((nextModel) => setModel(nextModel));
              }}
              placeholder="Search code or name"
              placeholderTextColor={colorTokens.textMuted}
              style={styles.searchInput}
            />
            <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent} keyboardShouldPersistTaps="handled">
              {model.currencyOptions.map((option) => (
                <Pressable
                  key={option.code}
                  style={styles.modalRow}
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
                  <Text style={styles.modalRowTitle}>{option.code}</Text>
                  <Text style={styles.modalRowSubtitle}>{option.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {!model.hasLedger ? (
        <View style={styles.card}>
          <Text style={styles.description}>Create or select a share to generate settlement recommendations.</Text>
        </View>
      ) : (
        <View style={styles.requiredPaymentsWrap}>
          <Text style={styles.requiredPaymentsLabel}>REQUIRED PAYMENTS</Text>
          <SettlementRecommendationList model={{ recommendations: model.recommendations }} />
        </View>
      )}

        <View style={styles.card}>
          <Pressable
            style={styles.confirmButton}
            accessibilityRole="button"
            disabled={isGeneratingImage}
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
            {isGeneratingImage ? (
              <ActivityIndicator color={colorTokens.card} />
            ) : (
              <Text style={styles.confirmButtonText}>Share settlement</Text>
            )}
          </Pressable>
        </View>

        {/* Preview modal with share options */}
        <Modal transparent visible={previewModalVisible} animationType="fade" onRequestClose={() => setPreviewModalVisible(false)}>
          <View style={styles.previewOverlay}>
            <Pressable style={styles.previewBackdrop} onPress={() => setPreviewModalVisible(false)} />
            <View style={styles.previewSheet}>
              <Text style={styles.previewTitle}>Settlement Preview</Text>
              {settlementImageUri ? (
                 <Image
                   source={{ uri: settlementImageUri }}
                   style={styles.previewImage}
                   resizeMode="contain"
                 />
               ) : null}
               <Pressable style={styles.shareButton} accessibilityRole="button" onPress={async () => {
                 if (!settlementImageUri) return;
                 try {
                   await shareSettlementImage(settlementImageUri);
                 } catch (error) {
                   console.error('Error sharing settlement:', error);
                 }
               }}>
                 <Ionicons name="share-social" size={20} color={colorTokens.card} />
                 <Text style={styles.shareButtonText}>Share image</Text>
               </Pressable>
               <Pressable style={styles.previewCloseButton} accessibilityRole="button" onPress={() => setPreviewModalVisible(false)}>
                 <Text style={styles.previewCloseText}>Done</Text>
               </Pressable>
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
    );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colorTokens.appBackground,
    padding: spacingTokens.lg,
    gap: 8,
  },
  title: {
    ...typographyTokens.heading,
  },
  body: {
    ...typographyTokens.body,
    color: colorTokens.textMuted,
  },
  card: {
    marginTop: 6,
    padding: 14,
    borderRadius: radiusTokens.md,
    borderWidth: 1,
    borderColor: colorTokens.border,
    backgroundColor: colorTokens.card,
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colorTokens.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: colorTokens.border,
    borderRadius: radiusTokens.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colorTokens.inputBackground,
    minHeight: touchTarget.minimum,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  selectLike: {
    borderWidth: 1,
    borderColor: '#D6D7DA',
    borderRadius: radiusTokens.md,
    backgroundColor: colorTokens.card,
    paddingHorizontal: spacingTokens.md,
    minHeight: touchTarget.minimum,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectValue: {
    color: colorTokens.textPrimary,
    fontSize: 22 / 2,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colorTokens.inverse,
    borderRadius: radiusTokens.md,
    paddingVertical: 11,
  },
  secondaryButtonText: {
    color: colorTokens.textPrimary,
    fontWeight: '600',
  },
  amount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  description: {
    color: colorTokens.textMuted,
  },
  hint: {
    fontSize: 13,
    color: colorTokens.textMuted,
    marginBottom: spacingTokens.sm,
  },
  confirmButton: {
    marginTop: 6,
    alignItems: 'center',
    backgroundColor: colorTokens.inverse,
    borderRadius: radiusTokens.md,
    paddingVertical: 11,
  },
  calculateButton: {
    width: '100%',
  },
  disabledButton: {
    opacity: 0.55,
  },
  confirmButtonText: {
    color: colorTokens.card,
    fontWeight: '600',
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
    backgroundColor: 'rgba(61, 60, 79, 0.3)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalCard: {
    backgroundColor: colorTokens.card,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: spacingTokens.lg,
    paddingTop: spacingTokens.md,
    paddingBottom: spacingTokens.md,
    gap: spacingTokens.sm,
    maxHeight: '75%',
  },
  modalTitle: {
    ...typographyTokens.body,
    fontWeight: '700',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#D6D7DA',
    borderRadius: radiusTokens.md,
    minHeight: touchTarget.minimum,
    paddingHorizontal: spacingTokens.md,
    backgroundColor: colorTokens.card,
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
    borderBottomColor: '#ECECEF',
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
    color: colorTokens.textMuted,
    flexShrink: 1,
    marginLeft: spacingTokens.sm,
  },
  previewOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(61, 60, 79, 0.5)',
  },
  previewBackdrop: {
    flex: 1,
  },
  previewSheet: {
    backgroundColor: colorTokens.card,
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
    color: colorTokens.textPrimary,
    textAlign: 'center',
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: radiusTokens.md,
    backgroundColor: colorTokens.appBackground,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacingTokens.sm,
    paddingVertical: 12,
    backgroundColor: colorTokens.inverse,
    borderRadius: radiusTokens.md,
  },
  shareButtonText: {
    color: colorTokens.card,
    fontWeight: '600',
    fontSize: 16,
  },
  previewCloseButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colorTokens.border,
  },
  previewCloseText: {
    color: colorTokens.textMuted,
    fontWeight: '600',
    fontSize: 16,
  },
});
