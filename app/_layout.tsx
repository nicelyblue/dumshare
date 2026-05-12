import { Drawer } from 'expo-router/drawer';
import { AppProviders } from '../src/mobile/providers/AppProviders';

export default function RootLayout(): JSX.Element {
  return (
    <AppProviders>
      <Drawer screenOptions={{ headerShown: false }}>
        <Drawer.Screen name="(tabs)" options={{ title: 'Dumshare' }} />
      </Drawer>
    </AppProviders>
  );
}
