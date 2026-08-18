import { DefaultTheme, type Theme } from '@react-navigation/native';
import type { ColorTokens } from './tokens';

/**
 * Create a React Navigation theme from our color tokens
 * Ensures navigation chrome (header, tab bar) matches app theme
 */
export function createNavigationTheme(
  colors: ColorTokens,
  isDark: boolean
): Theme {
  return {
    ...DefaultTheme,
    dark: isDark,
    colors: {
      primary: colors.accent,
      background: colors.appBackground,
      card: colors.card,
      text: colors.textPrimary,
      border: colors.border,
      notification: colors.destructive,
    },
  };
}
