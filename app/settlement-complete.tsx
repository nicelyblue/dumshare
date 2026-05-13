import { useLocalSearchParams, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function SettlementCompleteScreen(): JSX.Element {
  const params = useLocalSearchParams<{ currency?: string; recommendationCount?: string; summary?: string }>();

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Settlement complete 🎉</Text>
      <Text style={styles.body}>All suggested transfers were reviewed for {params.currency ?? 'your selected currency'}.</Text>

      <View style={styles.card}>
        <Text style={styles.heading}>Final breakdown</Text>
        <Text style={styles.detail}>Recommendations applied: {params.recommendationCount ?? '0'}</Text>
        <Text style={styles.detail}>{params.summary ?? 'No transfer summary available.'}</Text>
      </View>

      <Pressable style={styles.button} onPress={() => router.replace('/(tabs)/settle-up')} accessibilityRole="button">
        <Text style={styles.buttonText}>Back to Settle Up</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  body: {
    color: '#334155',
  },
  card: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    padding: 14,
    gap: 6,
  },
  heading: {
    fontWeight: '700',
    color: '#0f172a',
  },
  detail: {
    color: '#475569',
  },
  button: {
    marginTop: 10,
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 11,
  },
  buttonText: {
    color: '#f8fafc',
    fontWeight: '600',
  },
});
