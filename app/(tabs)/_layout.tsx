import { Tabs } from 'expo-router';

const MENU_LABEL = '☰';

export default function TabsLayout(): JSX.Element {
  return (
    <Tabs
      screenOptions={{
        headerLeft: () => MENU_LABEL,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="add-expense" options={{ title: 'Add Expense' }} />
      <Tabs.Screen name="ledger" options={{ title: 'Ledger' }} />
      <Tabs.Screen name="settle-up" options={{ title: 'Settle Up' }} />
    </Tabs>
  );
}
