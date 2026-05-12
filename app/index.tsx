import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen(): JSX.Element {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Dumshare</Text>
      <Text style={styles.subtitle}>Local-first shared expenses with event-backed history.</Text>
      <Link href="/(setup)/create-share" asChild>
        <Pressable accessibilityRole="button" style={styles.button}>
          <Text style={styles.buttonText}>Start setup flow</Text>
        </Pressable>
      </Link>
      <Link href="/(tabs)" asChild>
        <Pressable accessibilityRole="button" style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Open existing share tabs</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 16,
    color: '#334155',
    marginBottom: 8,
  },
  button: {
    borderRadius: 10,
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  buttonText: {
    color: '#f8fafc',
    fontWeight: '600',
  },
  secondaryButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#94a3b8',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontWeight: '600',
  },
});
