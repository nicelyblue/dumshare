import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { createSettleUpFlowController } from '../../src/mobile/controllers/settleUpFlowController';
import { SettlementRecommendationList } from '../../src/mobile/components/SettlementRecommendationList';
import { getActiveShareState, subscribeActiveShare } from '../../src/mobile/state/activeShareStore';
import { colorTokens, radiusTokens, spacingTokens, touchTarget } from '../../src/mobile/theme/tokens';
import { typographyTokens } from '../../src/mobile/theme/typography';

const flowController = createSettleUpFlowController();

export default function SettleUpScreen(): JSX.Element {
  const [activeShareId, setActiveShareId] = useState<string | null>(getActiveShareState().activeShareId);
  const [currencyQuery, setCurrencyQuery] = useState('');
  const [model, setModel] = useState(flowController.getState());
  const requestVersion = useRef(0);

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
    void reload(activeShareId);
  }, [activeShareId]);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Settle Up</Text>
      <Text style={styles.body}>Choose a currency, generate settle-up recommendations, and confirm completion.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Search currency</Text>
        <TextInput
          value={currencyQuery}
          onChangeText={(nextQuery) => {
            setCurrencyQuery(nextQuery);
            void flowController.searchAndSelectCurrency({ query: nextQuery }).then((nextModel) => setModel(nextModel));
          }}
          placeholder="Type code or name"
          style={styles.input}
        />
        <Text style={styles.description}>Selected: {selectedOption ? `${selectedOption.code} — ${selectedOption.label}` : model.selectedCurrencyCode}</Text>
        <View style={styles.actionsRow}>
          <Pressable
            style={styles.secondaryButton}
            accessibilityRole="button"
            onPress={() => {
              const first = model.currencyOptions[0];
              if (!first) {
                return;
              }
              void reload(activeShareId, first.code);
            }}
          >
            <Text style={styles.secondaryButtonText}>Use first match</Text>
          </Pressable>
          <Pressable
            style={styles.confirmButton}
            accessibilityRole="button"
            onPress={() => {
              void flowController.generateRecommendations().then((nextModel) => setModel(nextModel));
            }}
          >
             <Text style={styles.confirmButtonText}>Calculate Settlement</Text>
           </Pressable>
        </View>
      </View>

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
          onPress={() => {
            if (model.recommendations.length === 0) {
              return;
            }
            router.navigate(flowController.buildCompletionRoute());
          }}
        >
          <Text style={styles.confirmButtonText}>Mark as settled</Text>
        </Pressable>
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
  confirmButton: {
    marginTop: 6,
    alignItems: 'center',
    backgroundColor: colorTokens.inverse,
    borderRadius: radiusTokens.md,
    paddingVertical: 11,
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
});
