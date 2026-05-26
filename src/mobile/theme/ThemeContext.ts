import { createContext } from 'react';
import type { ThemePreference } from '../state/preferencesStore';
import type { lightColorTokens } from './tokens';

/**
 * Theme context value structure
 * Provides current theme state and color tokens to all components
 */
export interface ThemeContextValue {
  /**
   * Current active theme: 'light' or 'dark'
   * Resolved from preference (light/dark/system) + system appearance
   */
  currentTheme: 'light' | 'dark';

  /**
   * User's preference: 'light' | 'dark' | 'system'
   */
  themePreference: ThemePreference;

  /**
   * True if currentTheme is 'dark'
   */
  isDark: boolean;

  /**
   * Color tokens for the current theme
   */
  colors: typeof lightColorTokens;

  /**
   * Update user's theme preference
   * If 'system', follows device appearance
   */
  setThemePreference: (preference: ThemePreference) => void;
}

/**
 * ThemeContext - provides theme values to entire app
 * Default value is light mode (will be overridden by provider)
 */
export const ThemeContext = createContext<ThemeContextValue>({
  currentTheme: 'light',
  themePreference: 'system',
  isDark: false,
  colors: {} as typeof lightColorTokens,
  setThemePreference: () => {},
});
