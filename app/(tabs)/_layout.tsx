import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ShareDrawerContent from '../../src/mobile/components/ShareDrawerContent';
import { radiusTokens, shellLayoutTokens, spacingTokens } from '../../src/mobile/theme/tokens';
import { typographyTokens } from '../../src/mobile/theme/typography';
import { useTheme } from '../../src/mobile/theme/useTheme';
import { createNavigationTheme } from '../../src/mobile/theme/navigationTheme';

export default function TabsLayout(): JSX.Element {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tabBarBottomPadding = insets.bottom;
  const drawerWidth = Math.min(Math.max(width * 0.78, 300), 420);
  
  // Get theme
  const { colors, isDark } = useTheme();
  
  // Create navigation theme
  const navTheme = useMemo(
    () => createNavigationTheme(colors, isDark),
    [colors, isDark]
  );

  // Create dynamic styles based on theme
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        headerShell: {
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          minHeight: 72,
          justifyContent: 'flex-end',
        },
        headerRow: {
          minHeight: 62,
          paddingHorizontal: spacingTokens.md,
          paddingBottom: 2,
          paddingTop: insets.top,
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
          backgroundColor: colors.textPrimary,
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
          color: colors.textPrimary,
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
          backgroundColor: colors.scrim,
        },
        drawer: {
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: drawerWidth,
          backgroundColor: colors.card,
          borderRightWidth: 1,
          borderRightColor: colors.border,
          paddingTop: 40,
          paddingHorizontal: spacingTokens.lg,
        },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: shellLayoutTokens.tabBarHeight + tabBarBottomPadding + 8,
          paddingBottom: tabBarBottomPadding,
          paddingTop: 8,
        },
      }),
    [colors, insets, drawerWidth, isDark]
  );

  return (
    <>
      <Tabs
        screenOptions={{
          theme: navTheme,
          header: ({ options }) => {
            const title = typeof options.title === 'string' ? options.title : '';
            return (
              <View style={dynamicStyles.headerShell}>
                <View style={dynamicStyles.headerRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Open share drawer"
                    onPress={() => setDrawerOpen((current) => !current)}
                    style={dynamicStyles.menuButton}
                  >
                    <View style={dynamicStyles.menuIcon}>
                      <View style={dynamicStyles.menuLine} />
                      <View style={dynamicStyles.menuLine} />
                      <View style={dynamicStyles.menuLine} />
                    </View>
                  </Pressable>
                  <View style={dynamicStyles.headerRightSpacer} />
                </View>
                <View style={dynamicStyles.headerTitleLayer} pointerEvents="none">
                  <Text numberOfLines={1} style={dynamicStyles.headerTitleText}>
                    {title}
                  </Text>
                </View>
              </View>
            );
          },
          tabBarStyle: dynamicStyles.tabBarStyle,
          tabBarIconStyle: {
            marginBottom: 2,
          },
          tabBarLabelStyle: {
            ...typographyTokens.caption,
            fontSize: 11,
            lineHeight: 14,
          },
          tabBarActiveTintColor: colors.inverse,
          tabBarInactiveTintColor: colors.textMuted,
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
        <View style={dynamicStyles.overlay}>
          <Pressable style={dynamicStyles.backdrop} onPress={() => setDrawerOpen(false)} />
          <View style={dynamicStyles.drawer}>
            <ShareDrawerContent onClose={() => setDrawerOpen(false)} />
          </View>
        </View>
      ) : null}
    </>
  );
}
