import { useLocalSearchParams, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colorTokens, radiusTokens, spacingTokens, touchTarget } from '../src/mobile/theme/tokens';
import { typographyTokens } from '../src/mobile/theme/typography';

export default function SettlementCompleteScreen(): JSX.Element {
  const params = useLocalSearchParams<{ currency?: string; recommendationCount?: string; summary?: string }>();

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Settlement Calculated!</Text>
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
    backgroundColor: colorTokens.appBackground,
    padding: spacingTokens.lg,
    gap: 12,
  },
  title: {
    ...typographyTokens.heading,
  },
  body: {
    color: colorTokens.textMuted,
  },
  card: {
    marginTop: 8,
    borderRadius: radiusTokens.md,
    borderWidth: 1,
    borderColor: colorTokens.border,
    backgroundColor: colorTokens.card,
    padding: 14,
    gap: 6,
  },
  heading: {
    fontWeight: '700',
    color: colorTokens.textPrimary,
  },
  detail: {
    color: colorTokens.textMuted,
  },
  button: {
    marginTop: 10,
    alignItems: 'center',
    backgroundColor: colorTokens.inverse,
    borderRadius: radiusTokens.md,
    minHeight: touchTarget.minimum,
    paddingVertical: spacingTokens.md,
    justifyContent: 'center',
  },
  buttonText: {
    color: colorTokens.card,
    fontWeight: '600',
  },
});
