import { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from './useTheme';
import type { lightColorTokens } from './tokens';

/**
 * Helper function to create theme-aware styles
 * Takes a function that receives color tokens and returns styles
 * Component will automatically re-render when theme changes
 *
 * Example:
 * ```tsx
 * const styles = useThemedStyles((colors) => ({
 *   container: { backgroundColor: colors.appBackground },
 *   text: { color: colors.textPrimary },
 * }));
 * ```
 */
export function useThemedStyles<T extends Record<string, any>>(
  styleFactory: (colors: typeof lightColorTokens) => T
): T {
  const { colors } = useTheme();
  return useMemo(() => styleFactory(colors), [colors]);
}

/**
 * Helper to create a static theme-aware style from a factory function
 * Useful for reducing re-renders when you want to get colors at render time
 *
 * Example:
 * ```tsx
 * const getContainerStyle = makeThemedStyle((colors) => ({
 *   backgroundColor: colors.appBackground,
 * }));
 *
 * // In component:
 * const { colors } = useTheme();
 * const containerStyle = getContainerStyle(colors);
 * ```
 */
export function makeThemedStyle<T extends StyleProp<ViewStyle>>(
  styleFactory: (colors: typeof lightColorTokens) => T
): (colors: typeof lightColorTokens) => T {
  return styleFactory;
}
