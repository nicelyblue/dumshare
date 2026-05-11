import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { APP_ROUTES } from '../navigation/routes';
import type { AppRouteName } from '../navigation/types';
import { colors } from '../theme/colors';

type MockScaffoldProps = {
  children: React.ReactNode;
  activeTab: 'home' | 'add' | 'ledger' | 'settle';
  onNavigate: (routeName: AppRouteName) => void;
};

const TABS: Array<{ key: MockScaffoldProps['activeTab']; label: string; route: AppRouteName }> = [
  { key: 'home', label: 'Home', route: APP_ROUTES.homeDashboard },
  { key: 'add', label: 'Add Expense', route: APP_ROUTES.addExpense },
  { key: 'ledger', label: 'Ledger', route: APP_ROUTES.ledgerEntries },
  { key: 'settle', label: 'Settle Up', route: APP_ROUTES.settleUp },
];

const MENU_ITEMS: Array<{ label: string; route: AppRouteName }> = [
  { label: 'Home Dashboard', route: APP_ROUTES.homeDashboard },
  { label: 'Create Share', route: APP_ROUTES.createShare },
  { label: 'Ledger Entries', route: APP_ROUTES.ledgerEntries },
  { label: 'Settle Up', route: APP_ROUTES.settleUp },
];

export function MockScaffold({ children, activeTab, onNavigate }: MockScaffoldProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={styles.root}>
      <View style={styles.statusBar}>
        <Text style={styles.statusLeft}>9:41</Text>
        <Text style={styles.statusRight}>LTE 100%</Text>
      </View>

      <View style={styles.header}>
        <Pressable style={styles.menuButton} onPress={() => setMenuOpen(true)}>
          <Text style={styles.menuGlyph}>≡</Text>
        </Pressable>
        <Text style={styles.title}>Dumshare</Text>
        <View style={styles.menuButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>

      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              style={[styles.tabItem, isActive ? styles.tabItemActive : null]}
              onPress={() => onNavigate(tab.route)}
            >
              <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : null]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Modal transparent visible={menuOpen} onRequestClose={() => setMenuOpen(false)} animationType="fade">
        <View style={styles.menuOverlay}>
          <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)} />
          <View style={styles.menuPanel}>
            <Text style={styles.menuTitle}>Menu</Text>
            {MENU_ITEMS.map((item) => (
              <Pressable
                key={item.label}
                style={styles.menuItem}
                onPress={() => {
                  setMenuOpen(false);
                  onNavigate(item.route);
                }}
              >
                <Text style={styles.menuItemText}>{item.label}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.closeButton} onPress={() => setMenuOpen(false)}>
              <Text style={styles.closeButtonText}>Close Menu</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.neutral.white },
  statusBar: {
    height: 32,
    backgroundColor: colors.neutral.statusNavy,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  statusLeft: { color: colors.neutral.white, fontSize: 12, fontWeight: '700' },
  statusRight: { color: colors.neutral.white, fontSize: 12, fontWeight: '700' },
  header: {
    height: 58,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.slate200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  menuButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuGlyph: { fontSize: 21, color: colors.neutral.slate950, fontWeight: '700' },
  title: { color: colors.neutral.slate950, fontSize: 42 / 2, fontWeight: '700' },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 96, gap: 14 },
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 74,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.slate200,
    backgroundColor: colors.neutral.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },
  tabItem: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: { backgroundColor: colors.neutral.indigo50 },
  tabLabel: { color: colors.neutral.slate600, fontSize: 16, fontWeight: '600' },
  tabLabelActive: { color: colors.neutral.slate950, fontWeight: '700' },
  menuOverlay: { flex: 1, flexDirection: 'row' },
  menuBackdrop: { flex: 1, backgroundColor: colors.neutral.overlay },
  menuPanel: {
    position: 'absolute',
    top: 32,
    left: 0,
    width: 320,
    minHeight: 420,
    backgroundColor: colors.neutral.white,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.neutral.slate300,
    padding: 18,
    gap: 12,
  },
  menuTitle: { color: colors.neutral.slate950, fontSize: 42 / 2, fontWeight: '700', marginBottom: 8 },
  menuItem: {
    borderWidth: 1,
    borderColor: colors.neutral.slate300,
    backgroundColor: colors.neutral.indigo50,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuItemText: { color: colors.neutral.slate950, fontSize: 22 / 2, fontWeight: '700' },
  closeButton: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.neutral.slate300,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  closeButtonText: { color: colors.neutral.slate600, fontSize: 20 / 2, fontWeight: '700' },
});
