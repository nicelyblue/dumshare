import 'react-native-gesture-handler';

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation/AppNavigator';
import { LedgerSessionProvider } from './src/state/ledgerSession';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LedgerSessionProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </LedgerSessionProvider>
    </GestureHandlerRootView>
  );
}
