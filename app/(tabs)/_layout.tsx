import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ShareDrawerContent from '../../src/mobile/components/ShareDrawerContent';
import { colorTokens, radiusTokens, shellLayoutTokens, spacingTokens } from '../../src/mobile/theme/tokens';
import { typographyTokens } from '../../src/mobile/theme/typography';

export default function TabsLayout(): JSX.Element {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const tabBarBottomPadding = insets.bottom;

  return (
    <>
      <Tabs
        screenOptions={{
          header: ({ options }) => {
            const title = typeof options.title === 'string' ? options.title : '';
            return (
              <View style={styles.headerShell}>
                <View style={styles.headerRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Open share drawer"
                    onPress={() => setDrawerOpen((current) => !current)}
                    style={styles.menuButton}
                  >
                    <View style={styles.menuIcon}>
                      <View style={styles.menuLine} />
                      <View style={styles.menuLine} />
                      <View style={styles.menuLine} />
                    </View>
                  </Pressable>
                  <View style={styles.headerRightSpacer} />
                </View>
                <View style={styles.headerTitleLayer} pointerEvents="none">
                  <Text numberOfLines={1} style={styles.headerTitleText}>
                    {title}
                  </Text>
                </View>
              </View>
            );
          },
          tabBarStyle: {
            backgroundColor: colorTokens.card,
            borderTopColor: colorTokens.border,
            height: shellLayoutTokens.tabBarHeight + tabBarBottomPadding + 8,
            paddingBottom: tabBarBottomPadding,
            paddingTop: 8,
          },
          tabBarIconStyle: {
            marginBottom: 2,
          },
          tabBarLabelStyle: {
            ...typographyTokens.caption,
            fontSize: 11,
            lineHeight: 14,
          },
          tabBarActiveTintColor: colorTokens.inverse,
          tabBarInactiveTintColor: colorTokens.textMuted,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dumshare',
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="add-expense"
          options={{
            href: null,
            title: 'Add Expense',
            headerShown: false,
            tabBarStyle: { display: 'none' },
            tabBarLabel: 'Add Expense',
            tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="ledger"
          options={{
            title: 'Ledger',
            tabBarLabel: 'Ledger',
            tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settle-up"
          options={{
            title: 'Settle Up',
            tabBarLabel: 'Settle Up',
            tabBarIcon: ({ color, size }) => <Ionicons name="swap-horizontal-outline" size={size} color={color} />,
          }}
        />
      </Tabs>
      {isDrawerOpen ? (
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setDrawerOpen(false)} />
          <View style={styles.drawer}>
            <ShareDrawerContent onClose={() => setDrawerOpen(false)} />
          </View>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  headerShell: {
    backgroundColor: colorTokens.card,
    borderBottomWidth: 1,
    borderBottomColor: colorTokens.border,
    minHeight: 96,
    justifyContent: 'flex-end',
  },
  headerRow: {
    minHeight: 56,
    paddingHorizontal: spacingTokens.md,
    paddingBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuButton: {
    borderRadius: radiusTokens.sm,
    width: 40,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  menuIcon: {
    gap: 4,
  },
  menuLine: {
    width: 18,
    height: 2,
    borderRadius: radiusTokens.pill,
    backgroundColor: colorTokens.textPrimary,
  },
  headerRightSpacer: {
    width: 40,
    minHeight: 44,
  },
  headerTitleLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacingTokens.md,
    paddingHorizontal: 64,
  },
  headerTitleText: {
    ...typographyTokens.heading,
    color: colorTokens.textPrimary,
    fontSize: 28,
    lineHeight: 32,
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 50,
  },
  backdrop: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(61, 60, 79, 0.3)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '75%',
    backgroundColor: colorTokens.card,
    borderRightWidth: 1,
    borderRightColor: colorTokens.border,
    paddingTop: 40,
    paddingHorizontal: spacingTokens.lg,
  },
});
