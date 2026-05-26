import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colorTokens, radiusTokens, spacingTokens } from '../theme/tokens';
import { typographyTokens } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

type SelectionRowProps = {
  label: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  leading?: ReactNode;
};

export function SelectionRow({ label, title, subtitle, onPress, leading }: SelectionRowProps): JSX.Element {
  const { colors } = useTheme();

  const dynamicStyles = useMemo(() => ({
    root: {
      gap: spacingTokens.sm,
    },
    label: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: '500',
    },
    row: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radiusTokens.md,
      backgroundColor: colors.card,
      minHeight: 58,
      paddingHorizontal: spacingTokens.md,
      paddingVertical: spacingTokens.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingTokens.sm,
    },
    leading: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    content: {
      flex: 1,
    },
    title: {
      ...typographyTokens.body,
      fontSize: 14,
      color: colors.textPrimary,
    },
    subtitle: {
      ...typographyTokens.label,
      color: colors.textMuted,
      fontSize: 10,
    },
  }), [colors]);

  return (
    <View style={dynamicStyles.root}>
      <Text style={dynamicStyles.label}>{label}</Text>
      <Pressable style={dynamicStyles.row} accessibilityRole="button" onPress={onPress}>
        {leading ? <View style={dynamicStyles.leading}>{leading}</View> : null}
        <View style={dynamicStyles.content}>
          <Text style={dynamicStyles.title}>{title}</Text>
          {subtitle ? <Text style={dynamicStyles.subtitle}>{subtitle}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // Spacing only, colors are now dynamic
});
