import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';

/**
 * Hook to access theme context
 * Use this in any component to get current theme colors and state
 *
 * Example:
 * ```tsx
 * const { colors, isDark, setThemePreference } = useTheme();
 * return <View style={{ backgroundColor: colors.appBackground }} />
 * ```
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error(
      'useTheme must be used within a ThemeProvider. Make sure ThemeProvider wraps your component tree.'
    );
  }
  return context;
}
