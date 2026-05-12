import { Tabs } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ShareDrawerContent from '../../src/mobile/components/ShareDrawerContent';

export default function TabsLayout(): JSX.Element {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open share drawer"
              onPress={() => setDrawerOpen((current) => !current)}
              style={styles.menuButton}
            >
              <Text style={styles.menuButtonText}>Menu</Text>
            </Pressable>
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarLabel: 'Home',
          }}
        />
        <Tabs.Screen
          name="add-expense"
          options={{
            title: 'Add Expense',
            tabBarLabel: 'Add Expense',
          }}
        />
        <Tabs.Screen
          name="ledger"
          options={{
            title: 'Ledger',
            tabBarLabel: 'Ledger',
          }}
        />
        <Tabs.Screen
          name="settle-up"
          options={{
            title: 'Settle Up',
            tabBarLabel: 'Settle Up',
          }}
        />
      </Tabs>
      {isDrawerOpen ? (
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setDrawerOpen(false)} />
          <View style={styles.drawer}>
            <ShareDrawerContent />
          </View>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    marginLeft: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  menuButtonText: {
    color: '#0f172a',
    fontWeight: '600',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
  },
  drawer: {
    width: 280,
    backgroundColor: '#ffffff',
    borderLeftWidth: 1,
    borderLeftColor: '#e2e8f0',
    paddingTop: 40,
    paddingHorizontal: 16,
  },
});
