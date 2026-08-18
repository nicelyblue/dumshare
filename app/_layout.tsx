import { ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useMemo } from 'react';
import { AppProviders } from '../src/mobile/providers/AppProviders';
import { createNavigationTheme } from '../src/mobile/theme/navigationTheme';
import { useTheme } from '../src/mobile/theme/useTheme';

function RootNavigator(): JSX.Element {
  const { colors, isDark } = useTheme();
  const navigationTheme = useMemo(
    () => createNavigationTheme(colors, isDark),
    [colors, isDark],
  );

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <Stack screenOptions={{ headerShown: false }} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout(): JSX.Element {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
