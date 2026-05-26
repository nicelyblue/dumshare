import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colorTokens, radiusTokens, spacingTokens } from '../theme/tokens';
import { typographyTokens } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  onBack?: () => void;
};

export function ScreenHeader({ title, subtitle, badge, onBack }: ScreenHeaderProps): JSX.Element {
  const { colors } = useTheme();

  const dynamicStyles = useMemo(() => ({
    backButton: {
      width: 40,
      minHeight: 40,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radiusTokens.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      marginBottom: spacingTokens.xs,
    },
    backButtonText: {
      color: colors.textPrimary,
      fontSize: 20,
      lineHeight: 20,
      fontWeight: '600' as const,
    },
    title: {
      ...typographyTokens.heading,
      color: colors.textPrimary,
    },
    subtitle: {
      ...typographyTokens.label,
      color: colors.textPrimary,
    },
    badge: {
      ...typographyTokens.label,
      color: colors.textMuted,
      fontSize: 11,
    },
  }), [colors]);

  return (
    <View style={styles.root}>
      {onBack ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={dynamicStyles.backButton}>
          <Text style={dynamicStyles.backButtonText}>←</Text>
        </Pressable>
      ) : null}
      <Text style={dynamicStyles.title}>{title}</Text>
      {subtitle ? <Text style={dynamicStyles.subtitle}>{subtitle}</Text> : null}
      {badge ? <Text style={dynamicStyles.badge}>{badge}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacingTokens.xs,
  },
});
