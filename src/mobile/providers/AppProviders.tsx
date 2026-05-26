import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { bootstrapDummyData } from '../actions/bootstrapDummyData';
import { ThemeProvider } from '../theme/ThemeProvider';
import { initializePreferences } from '../state/preferencesStore';

export function AppProviders({ children }: PropsWithChildren): JSX.Element {
  useEffect(() => {
    // Initialize app preferences from storage (theme, etc.)
    void initializePreferences();
    // Bootstrap dummy data for demo
    void bootstrapDummyData();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </SafeAreaProvider>
  );
}
