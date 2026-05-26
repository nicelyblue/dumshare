import { useCallback, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import type { PropsWithChildren } from 'react';
import { ThemeContext } from './ThemeContext';
import { getColorTokensByTheme } from './tokens';
import type { ThemePreference } from '../state/preferencesStore';
import {
  getThemePreference,
  setThemePreference,
  subscribeThemePreference,
} from '../state/preferencesStore';

/**
 * ThemeProvider - manages theme state and provides to entire app
 * Handles:
 * - System appearance detection (useColorScheme)
 * - User theme preference (from preferencesStore)
 * - Runtime theme switching
 * - Persistence of user preference
 *
 * Must wrap the entire app in AppProviders
 */
export function ThemeProvider({ children }: PropsWithChildren): JSX.Element {
  // Get system color scheme (light/dark/null)
  const systemColorScheme = useColorScheme();

  // Local state for theme preference (synced from store)
  const [themePreference, setLocalThemePreference] =
    useState<ThemePreference>('system');

  // Subscribe to preference store changes
  useEffect(() => {
    const unsubscribe = subscribeThemePreference((preference) => {
      setLocalThemePreference(preference);
    });
    return unsubscribe;
  }, []);

  // Resolve current theme: preference + system appearance
  const currentTheme: 'light' | 'dark' = useMemo(() => {
    if (themePreference === 'light') return 'light';
    if (themePreference === 'dark') return 'dark';
    // System preference
    return systemColorScheme === 'dark' ? 'dark' : 'light';
  }, [themePreference, systemColorScheme]);

  // Get color tokens for current theme
  const colors = useMemo(
    () => getColorTokensByTheme(currentTheme),
    [currentTheme]
  );

  // Handler to update theme preference
  const handleSetThemePreference = useCallback((preference: ThemePreference) => {
    setThemePreference(preference);
  }, []);

  // Context value
  const value = useMemo(
    () => ({
      currentTheme,
      themePreference,
      isDark: currentTheme === 'dark',
      colors,
      setThemePreference: handleSetThemePreference,
    }),
    [currentTheme, themePreference, colors, handleSetThemePreference]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
