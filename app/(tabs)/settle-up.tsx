import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { createSettleUpFlowController } from '../../src/mobile/controllers/settleUpFlowController';
import { SettlementRecommendationList } from '../../src/mobile/components/SettlementRecommendationList';
import { getActiveShareState, subscribeActiveShare } from '../../src/mobile/state/activeShareStore';

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
            <Text style={styles.confirmButtonText}>Settle up</Text>
          </Pressable>
        </View>
      </View>

      {!model.hasLedger ? (
        <View style={styles.card}>
          <Text style={styles.description}>Create or select a share to generate settlement recommendations.</Text>
        </View>
      ) : (
        <SettlementRecommendationList model={{ recommendations: model.recommendations }} />
      )}

      <View style={styles.card}>
        <Pressable style={styles.confirmButton} accessibilityRole="button">
          <Text style={styles.confirmButtonText}>Mark as settled</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  body: {
    fontSize: 16,
    color: '#334155',
  },
  card: {
    marginTop: 6,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 11,
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontWeight: '600',
  },
  amount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  description: {
    color: '#475569',
  },
  confirmButton: {
    marginTop: 6,
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 11,
  },
  confirmButtonText: {
    color: '#f8fafc',
    fontWeight: '600',
  },
});
