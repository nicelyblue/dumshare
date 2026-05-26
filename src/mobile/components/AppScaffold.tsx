import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions, useMemo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colorTokens, spacingTokens } from '../theme/tokens';
import { getResponsiveMaxWidth, layoutTokens } from '../theme/layout';
import { cardStyles, textStyles } from '../theme/styles';
import { useTheme } from '../theme/useTheme';

type ScreenScrollProps = {
  children: ReactNode;
  bottomInsetOffset?: number;
  topInsetOffset?: number;
};

export function ScreenScroll({ children, bottomInsetOffset = spacingTokens.xl, topInsetOffset = 0 }: ScreenScrollProps): JSX.Element {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const maxWidth = getResponsiveMaxWidth(width);

  const dynamicScreenStyles = useMemo(() => ({
    screen: {
      flex: 1,
      backgroundColor: colors.appBackground,
    },
  }), [colors]);

  return (
    <ScrollView
      style={dynamicScreenStyles.screen}
      contentContainerStyle={[
        styles.scrollContent,
        {
          maxWidth,
          width: '100%',
          alignSelf: 'center',
          paddingTop: insets.top + topInsetOffset,
          paddingBottom: insets.bottom + bottomInsetOffset,
        },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

type BottomActionBarProps = {
  children: ReactNode;
};

export function BottomActionBar({ children }: BottomActionBarProps): JSX.Element {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const maxWidth = getResponsiveMaxWidth(width);

  const dynamicBottomBarStyles = useMemo(() => ({
    bottomBar: {
      position: 'absolute' as const,
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: layoutTokens.screenPadding,
      paddingTop: spacingTokens.sm,
      borderTopWidth: 1,
      borderTopColor: colors.subtleBorder,
      backgroundColor: colors.card,
      alignItems: 'center',
      paddingBottom: insets.bottom + spacingTokens.md,
    },
  }), [colors, insets]);

  return (
    <View style={dynamicBottomBarStyles.bottomBar}>
      <View style={{ width: '100%', maxWidth }}>{children}</View>
    </View>
  );
}

type AppCardProps = {
  children: ReactNode;
};

export function AppCard({ children }: AppCardProps): JSX.Element {
  const { colors } = useTheme();
  
  const dynamicCardStyles = useMemo(() => ({
    standard: {
      backgroundColor: colors.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacingTokens.lg,
    },
  }), [colors]);

  return <View style={dynamicCardStyles.standard}>{children}</View>;
}

type EmptyStateBlockProps = {
  title: string;
  message: string;
};

export function EmptyStateBlock({ title, message }: EmptyStateBlockProps): JSX.Element {
  const { colors } = useTheme();

  const dynamicEmptyCardStyles = useMemo(() => ({
    grouped: {
      backgroundColor: colors.groupedSurface,
      borderRadius: 8,
      padding: spacingTokens.lg,
      gap: spacingTokens.xs,
    },
    title: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    message: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.textPrimary,
    },
  }), [colors]);

  return (
    <View style={dynamicEmptyCardStyles.grouped}>
      <Text style={dynamicEmptyCardStyles.title}>{title}</Text>
      <Text style={dynamicEmptyCardStyles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: layoutTokens.screenPadding,
    gap: spacingTokens.md,
  },
});
