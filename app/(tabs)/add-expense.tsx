import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function AddExpenseScreen(): JSX.Element {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Add Expense</Text>
      <Text style={styles.body}>Capture screen skeleton is ready for interaction flow.</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Who paid?</Text>
        <Pressable style={styles.inputLike} accessibilityRole="button">
          <Text style={styles.inputLikeText}>Select participant</Text>
        </Pressable>
        <Text style={styles.label}>Amount</Text>
        <View style={styles.inputLike}>
          <Text style={styles.inputLikeText}>0.00</Text>
        </View>
        <Pressable style={styles.primaryButton} accessibilityRole="button">
          <Text style={styles.primaryButtonText}>Review split</Text>
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
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    gap: 8,
  },
  label: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  inputLike: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: '#f8fafc',
  },
  inputLikeText: {
    color: '#1e293b',
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#f8fafc',
    fontWeight: '600',
  },
});
