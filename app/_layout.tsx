import { Stack } from 'expo-router';
import { AppProviders } from '../src/mobile/providers/AppProviders';

export default function RootLayout(): JSX.Element {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  );
}
