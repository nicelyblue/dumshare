import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { bootstrapDummyData } from '../actions/bootstrapDummyData';

export function AppProviders({ children }: PropsWithChildren): JSX.Element {
  useEffect(() => {
    void bootstrapDummyData();
  }, []);

  return <SafeAreaProvider>{children}</SafeAreaProvider>;
}
