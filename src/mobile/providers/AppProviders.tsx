import type { PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export function AppProviders({ children }: PropsWithChildren): JSX.Element {
  return <SafeAreaProvider>{children}</SafeAreaProvider>;
}
