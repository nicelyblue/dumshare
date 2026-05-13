import { StyleSheet, Text, View } from 'react-native';

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
  list: { gap: 8 },
  row: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    gap: 4,
  },
  route: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
  },
  amount: {
    color: '#334155',
  },
  emptyState: {
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  emptyHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyBody: {
    color: '#475569',
  },
});
