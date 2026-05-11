import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { APP_ROUTES } from '../navigation/routes';
import type { AppRouteName } from '../navigation/types';
import { colors } from '../theme/colors';

type BottomNavProps = {
  activeRoute: AppRouteName;
  onNavigate: (routeName: AppRouteName) => void;
};

const ITEMS: Array<{ label: string; routeName: AppRouteName; icon: string }> = [
  { label: 'Home', routeName: APP_ROUTES.homeDashboard, icon: '⌂' },
  { label: 'Add Expense', routeName: APP_ROUTES.addExpense, icon: '+' },
  { label: 'Ledger', routeName: APP_ROUTES.ledgerEntries, icon: '≡' },
  { label: 'Settle Up', routeName: APP_ROUTES.settleUp, icon: '◉' },
];

export function BottomNav({ activeRoute, onNavigate }: BottomNavProps) {
  return (
    <View style={styles.wrapper}>
      {ITEMS.map((item) => {
        const active = item.routeName === activeRoute;
        return (
          <Pressable key={item.routeName} style={[styles.item, active ? styles.itemActive : styles.itemInactive]} onPress={() => onNavigate(item.routeName)}>
            <Text style={[styles.icon, active ? styles.labelActive : null]}>{item.icon}</Text>
            <Text style={[styles.label, active ? styles.labelActive : null]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.panel,
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 6,
  },
  item: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  itemActive: {
    backgroundColor: colors.background.panelSoft,
  },
  itemInactive: {
    opacity: 0.55,
  },
  icon: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.muted,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.muted,
  },
  labelActive: {
    color: colors.text.primary,
  },
});
