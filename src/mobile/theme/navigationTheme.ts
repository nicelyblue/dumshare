import type { Theme } from '@react-navigation/native';
import type { lightColorTokens } from './tokens';

/**
 * Create a React Navigation theme from our color tokens
 * Ensures navigation chrome (header, tab bar) matches app theme
 */
export function createNavigationTheme(
  colors: typeof lightColorTokens,
  isDark: boolean
): Theme {
  return {
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
