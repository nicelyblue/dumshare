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
    borderColor: 'lightsteelblue',
    backgroundColor: 'white',
    gap: 4,
  },
  route: {
    fontSize: 15,
    color: 'midnightblue',
    fontWeight: '600',
  },
  amount: {
    color: 'slategray',
  },
  emptyState: {
    borderRadius: 12,
    padding: 14,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'aliceblue',
    gap: 6,
  },
  emptyHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: 'midnightblue',
  },
  emptyBody: {
    color: 'slategray',
  },
});
