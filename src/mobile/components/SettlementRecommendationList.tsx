import { StyleSheet, Text, View } from 'react-native';
import { colorTokens, radiusTokens, spacingTokens } from '../theme/tokens';

export type SettlementRecommendationListModel = {
  recommendations: Array<{
    fromLabel: string;
    toLabel: string;
    amountLabel: string;
  }>;
};

export function SettlementRecommendationList({ model }: { model: SettlementRecommendationListModel }): JSX.Element {
  if (model.recommendations.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyHeading}>No transfers needed</Text>
        <Text style={styles.emptyBody}>Everyone is currently balanced for the selected currency.</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {model.recommendations.map((entry, index) => (
        <View key={`${entry.fromLabel}-${entry.toLabel}-${index}`} style={styles.row}>
          <Text style={styles.route}>{entry.fromLabel} → {entry.toLabel}</Text>
          <Text style={styles.amount}>{entry.amountLabel}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacingTokens.sm },
  row: {
    padding: spacingTokens.md,
    borderRadius: radiusTokens.md,
    borderWidth: 1,
    borderColor: colorTokens.border,
    backgroundColor: colorTokens.card,
    gap: 4,
  },
  route: {
    fontSize: 15,
    color: colorTokens.textPrimary,
    fontWeight: '600',
  },
  amount: {
    color: colorTokens.textMuted,
  },
  emptyState: {
    borderRadius: radiusTokens.md,
    padding: 14,
    backgroundColor: colorTokens.card,
    borderWidth: 1,
    borderColor: colorTokens.border,
    gap: 6,
  },
  emptyHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colorTokens.textPrimary,
  },
  emptyBody: {
    color: colorTokens.textMuted,
  },
});
