import React from 'react';
import { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { APP_ROUTES } from './routes';
import type { RootStackParamList } from './types';
import { DashboardScreen } from '../screens/DashboardScreen';
import { HomeDashboardScreen } from '../screens/HomeDashboardScreen';
import { LedgerSetupScreen } from '../screens/LedgerSetupScreen';
import { LedgerSelectionScreen } from '../screens/LedgerSelectionScreen';
import { ExpenseEntryScreen } from '../screens/ExpenseEntryScreen';
import { BalancesScreen } from '../screens/BalancesScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { CreateShareScreen } from '../screens/CreateShareScreen';
import { AddParticipantsScreen } from '../screens/AddParticipantsScreen';
import { AddExpenseScreen } from '../screens/AddExpenseScreen';
import { SplitDetailsScreen } from '../screens/SplitDetailsScreen';
import { LedgerEntriesScreen } from '../screens/LedgerEntriesScreen';
import { LedgerEntryDetailScreen } from '../screens/LedgerEntryDetailScreen';
import { SettleUpScreen } from '../screens/SettleUpScreen';
import { SettlementResultScreen } from '../screens/SettlementResultScreen';
import { useLedgerSession } from '../state/ledgerSession';
import { colors } from '../theme/colors';
import { shouldRedirectAddExpense, shouldRedirectHome } from './guards';

const Stack = createNativeStackNavigator<RootStackParamList>();

function GuardedHomeDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { snapshot } = useLedgerSession();

  useEffect(() => {
    if (shouldRedirectHome(snapshot.hasLedger) === 'welcome') {
      navigation.replace(APP_ROUTES.welcome);
    }
  }, [navigation, snapshot.hasLedger]);

  return <HomeDashboardScreen />;
}

function GuardedAddExpenseScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { snapshot } = useLedgerSession();

  useEffect(() => {
    const redirect = shouldRedirectAddExpense({
      hasLedger: snapshot.hasLedger,
      participantCount: snapshot.balanceSummary.participants.length,
    });

    if (redirect === 'welcome') {
      navigation.replace(APP_ROUTES.welcome);
      return;
    }

    if (redirect === 'addParticipants') {
      navigation.replace(APP_ROUTES.addParticipants);
    }
  }, [navigation, snapshot.balanceSummary.participants.length, snapshot.hasLedger]);

  return <AddExpenseScreen />;
}

export function AppNavigator() {
  return (
    <Stack.Navigator
      id="main-stack"
      initialRouteName={APP_ROUTES.homeDashboard}
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background.panel } }}
    >
      <Stack.Screen name={APP_ROUTES.welcome} component={WelcomeScreen} />
      <Stack.Screen name={APP_ROUTES.createShare} component={CreateShareScreen} />
      <Stack.Screen name={APP_ROUTES.addParticipants} component={AddParticipantsScreen} />
      <Stack.Screen name={APP_ROUTES.homeDashboard} component={GuardedHomeDashboardScreen} />
      <Stack.Screen name={APP_ROUTES.addExpense} component={GuardedAddExpenseScreen} />
      <Stack.Screen name={APP_ROUTES.splitDetails} component={SplitDetailsScreen} />
      <Stack.Screen name={APP_ROUTES.ledgerEntries} component={LedgerEntriesScreen} />
      <Stack.Screen name={APP_ROUTES.ledgerEntryDetail} component={LedgerEntryDetailScreen} />
      <Stack.Screen name={APP_ROUTES.settleUp} component={SettleUpScreen} />
      <Stack.Screen name={APP_ROUTES.settlementResult} component={SettlementResultScreen} />

      <Stack.Screen name={APP_ROUTES.dashboard} component={DashboardScreen} />
      <Stack.Screen name={APP_ROUTES.setup} component={LedgerSetupScreen} />
      <Stack.Screen name={APP_ROUTES.ledgers} component={LedgerSelectionScreen} />
      <Stack.Screen name={APP_ROUTES.expenseEntry} component={ExpenseEntryScreen} />
      <Stack.Screen name={APP_ROUTES.balances} component={BalancesScreen} />
    </Stack.Navigator>
  );
}
