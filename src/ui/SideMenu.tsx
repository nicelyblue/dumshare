import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { APP_ROUTES } from '../navigation/routes';
import type { AppRouteName } from '../navigation/types';
import { colors } from '../theme/colors';

type SideMenuProps = {
  visible: boolean;
  onClose: () => void;
  onNavigate: (routeName: AppRouteName) => void;
};

const MENU_ITEMS: Array<{ label: string; routeName: AppRouteName }> = [
  { label: 'Home Dashboard', routeName: APP_ROUTES.homeDashboard },
  { label: 'Create Share', routeName: APP_ROUTES.createShare },
  { label: 'Ledger Entries', routeName: APP_ROUTES.ledgerEntries },
  { label: 'Settle Up', routeName: APP_ROUTES.settleUp },
];

export function SideMenu({ visible, onClose, onNavigate }: SideMenuProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.panel} onPress={() => undefined}>
          <Text style={styles.title}>Menu</Text>
          {MENU_ITEMS.map((item) => (
            <Pressable
              key={item.routeName}
              style={styles.item}
              onPress={() => {
                onClose();
                onNavigate(item.routeName);
              }}
            >
              <Text style={styles.itemLabel}>{item.label}</Text>
            </Pressable>
          ))}
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeLabel}>Close Menu</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'flex-start',
  },
  panel: {
    width: 280,
    marginTop: 28,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.panel,
    padding: 14,
    gap: 8,
    minHeight: 420,
  },
  title: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  item: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.background.panelSoft,
  },
  itemLabel: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  closeBtn: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeLabel: {
    color: colors.text.muted,
    fontSize: 13,
    fontWeight: '700',
  },
});
