import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function SettleUpScreen(): JSX.Element {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Settle Up</Text>
      <Text style={styles.body}>Settlement skeleton is interaction-ready for payment confirmations.</Text>
      <View style={styles.card}>
        <Text style={styles.amount}>$42.50</Text>
        <Text style={styles.description}>Alex pays Sam to settle current balance</Text>
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
