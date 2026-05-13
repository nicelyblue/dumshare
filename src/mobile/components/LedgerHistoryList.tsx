import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LedgerHistoryModel } from '../controllers/ledgerHistoryController';

export function LedgerHistoryList(props: {
  model: LedgerHistoryModel;
  onLongPressEntry: (expenseId: string) => void;
}): JSX.Element {
  return (
    <View style={styles.root}>
      {props.model.entries.map((entry) => (
        <Pressable key={entry.expenseId} onLongPress={() => props.onLongPressEntry(entry.expenseId)} style={styles.card}>
          <Text style={styles.title}>{entry.title}</Text>
          <Text style={styles.meta}>{entry.amountLabel}</Text>
          <Text style={styles.meta}>{entry.payerLabel}</Text>
          <Text style={styles.meta}>{entry.splitLabel}</Text>
          <Text style={styles.time}>{entry.createdAtLabel}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  card: { borderWidth: 1, borderColor: 'lightgray', borderRadius: 10, padding: 10, backgroundColor: 'white' },
  title: { fontWeight: '700', color: 'black' },
  meta: { color: 'dimgray' },
  time: { color: 'slategray', fontSize: 12 },
});
