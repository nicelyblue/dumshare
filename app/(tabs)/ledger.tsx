import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function LedgerScreen(): JSX.Element {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Ledger</Text>
      <Text style={styles.body}>Timeline skeleton now supports row-level interactions.</Text>
      <View style={styles.timeline}>
        {[1, 2, 3].map((entry) => (
          <Pressable key={entry} style={styles.row} accessibilityRole="button">
            <Text style={styles.rowTitle}>Expense item #{entry}</Text>
            <Text style={styles.rowMeta}>Tap to view detail</Text>
          </Pressable>
        ))}
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
  timeline: {
    marginTop: 6,
    gap: 8,
  },
  row: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  rowTitle: {
    color: '#0f172a',
    fontWeight: '600',
  },
  rowMeta: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
});
