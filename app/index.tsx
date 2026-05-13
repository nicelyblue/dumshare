import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colorTokens, radiusTokens, spacingTokens, touchTarget } from '../src/mobile/theme/tokens';
import { typographyTokens } from '../src/mobile/theme/typography';

export default function HomeScreen(): JSX.Element {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Welcome to Dumshare!</Text>
      <Text style={styles.subtitle}>You haven't created your first Share yet. Get started by creating a Share to track expenses with friends.</Text>
      <Link href="/(setup)/create-share" asChild>
        <Pressable accessibilityRole="button" style={styles.button}>
          <Text style={styles.buttonText}>Create Share</Text>
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
    padding: spacingTokens.xl,
    gap: spacingTokens.md,
    backgroundColor: colorTokens.appBackground,
  },
  title: {
    ...typographyTokens.display,
  },
  subtitle: {
    ...typographyTokens.body,
    color: colorTokens.textMuted,
    marginBottom: spacingTokens.sm,
  },
  button: {
    borderRadius: radiusTokens.md,
    backgroundColor: colorTokens.inverse,
    minHeight: touchTarget.minimum,
    paddingVertical: spacingTokens.md,
    paddingHorizontal: spacingTokens.lg,
    justifyContent: 'center',
  },
  buttonText: {
    color: colorTokens.card,
    fontWeight: '600',
  },
  secondaryButton: {
    borderRadius: radiusTokens.md,
    borderWidth: 1,
    borderColor: colorTokens.border,
    backgroundColor: colorTokens.card,
    minHeight: touchTarget.minimum,
    paddingVertical: spacingTokens.md,
    paddingHorizontal: spacingTokens.lg,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colorTokens.textPrimary,
    fontWeight: '600',
  },
});
