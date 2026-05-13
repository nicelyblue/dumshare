import { Tabs } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ShareDrawerContent from '../../src/mobile/components/ShareDrawerContent';
import { colorTokens, radiusTokens, shellLayoutTokens, spacingTokens } from '../../src/mobile/theme/tokens';
import { typographyTokens } from '../../src/mobile/theme/typography';

export default function TabsLayout(): JSX.Element {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: colorTokens.card },
          headerTitleStyle: { ...typographyTokens.label, color: colorTokens.textPrimary },
          tabBarStyle: {
            backgroundColor: colorTokens.card,
            borderTopColor: colorTokens.border,
            height: shellLayoutTokens.tabBarHeight,
          },
          tabBarActiveTintColor: colorTokens.inverse,
          tabBarInactiveTintColor: colorTokens.textMuted,
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
    marginLeft: spacingTokens.md,
    borderRadius: radiusTokens.sm,
    borderWidth: 1,
    borderColor: colorTokens.border,
    backgroundColor: colorTokens.groupedSurface,
    paddingHorizontal: spacingTokens.md,
    paddingVertical: spacingTokens.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  menuButtonText: {
    ...typographyTokens.label,
    color: colorTokens.textPrimary,
    fontWeight: '600',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(61, 60, 79, 0.3)',
  },
  drawer: {
    width: 280,
    backgroundColor: colorTokens.card,
    borderLeftWidth: 1,
    borderLeftColor: colorTokens.border,
    paddingTop: 40,
    paddingHorizontal: spacingTokens.lg,
  },
});
