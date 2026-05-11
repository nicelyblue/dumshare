import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FEATURE_REGISTRY } from './featureRegistry';
import { APP_ROUTES } from './routes';
import type { RootStackParamList } from './types';
import { FeatureScreen } from '../screens/FeatureScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      id="main-stack"
      initialRouteName={APP_ROUTES.dashboard}
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.text.primary } }}
    >
      {FEATURE_REGISTRY.map((feature) => (
        <Stack.Screen key={feature.name} name={feature.name}>
          {({ navigation }) => (
            <FeatureScreen
              feature={feature}
              onNavigate={(routeName) => {
                navigation.navigate(routeName);
              }}
            />
          )}
        </Stack.Screen>
      ))}
    </Stack.Navigator>
  );
}
