import { StyleSheet, Text, View } from 'react-native';
import type { HomeSnapshotModel } from '../controllers/homeSnapshotController';

type Props = {
  model: HomeSnapshotModel;
};

export function HomeSnapshotCard({ model }: Props): JSX.Element {
  return (
    <View style={styles.container}>
      {model.participantRows.map((row) => (
        <View key={`${row.participantName}-${row.netAmountLabel}`} style={styles.row}>
          <View>
            <Text style={styles.name}>{row.participantName}</Text>
            <Text style={styles.status}>{row.statusLabel}</Text>
          </View>
          <Text style={[styles.amount, row.statusLabel === 'owes' ? styles.negative : row.statusLabel === 'is owed' ? styles.positive : styles.settled]}>
            {row.netAmountLabel}
          </Text>
        </View>
      ))}

      {model.latestExpenseCard ? (
        <View style={styles.latestExpense}>
          <Text style={styles.latestTitle}>Review latest expense</Text>
          <Text style={styles.latestMeta}>{model.latestExpenseCard.payerLabel}</Text>
          <Text style={styles.latestAmount}>{model.latestExpenseCard.amountLabel}</Text>
          <Text style={styles.latestMeta}>{model.latestExpenseCard.participantCountLabel}</Text>
          <Text style={styles.latestMeta}>{model.latestExpenseCard.timestampLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'antiquewhite',
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'tan',
    paddingBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
  },
  status: {
    fontSize: 13,
    color: 'dimgrey',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  positive: {
    color: 'seagreen',
  },
  negative: {
    color: 'firebrick',
  },
  settled: {
    color: 'teal',
  },
  latestExpense: {
    backgroundColor: 'linen',
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  latestTitle: {
    color: 'teal',
    fontWeight: '700',
  },
  latestMeta: {
    color: 'saddlebrown',
    fontSize: 13,
  },
  latestAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: 'black',
  },
});
