import React, { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOptionalLedgerSession } from '../state/ledgerSession';
import type { AppRouteName } from '../navigation/types';
import { colors } from '../theme/colors';
import { BottomNav } from './BottomNav';
import { SideMenu } from './SideMenu';

type AppShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
  children: React.ReactNode;
  activeRoute?: AppRouteName;
  onNavigate?: (routeName: AppRouteName) => void;
  enableShellNav?: boolean;
};

export function AppShell({ eyebrow, title, description, accent, children, activeRoute, onNavigate, enableShellNav = false }: AppShellProps) {
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const session = useOptionalLedgerSession();
  const activeLedger =
    session?.activeLedgerId
      ? session.ledgers.find((ledger) => ledger.ledgerId === session.activeLedgerId)
      : null;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardInset(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardInset(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>9:41</Text>
        <Text style={styles.statusText}>LTE 100%</Text>
      </View>
      <View style={styles.header}>
        {enableShellNav ? (
          <Pressable style={styles.headerIconButton} onPress={() => setMenuOpen(true)}>
            <Text style={styles.headerIcon}>≡</Text>
          </Pressable>
        ) : (
          <View style={styles.headerIconPlaceholder} />
        )}
        <Text style={styles.headerTitle}>Dumshare</Text>
        <View style={styles.headerIconPlaceholder} />
      </View>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 + keyboardInset }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.bodyWrap}>
            <View className="gap-2">
              <Text style={[styles.eyebrow, { color: accent }]}>{eyebrow}</Text>
              {activeLedger ? (
                <View style={styles.activeLedgerPill}>
                  <Text style={styles.activeLedgerLabel}>Active share: {activeLedger.title}</Text>
                </View>
              ) : null}
              <Text style={styles.pageTitle}>{title}</Text>
              <Text style={styles.pageDescription}>{description}</Text>
            </View>

            <View className="gap-4">{children}</View>
          </View>
        </ScrollView>
        {enableShellNav && activeRoute && onNavigate ? <BottomNav activeRoute={activeRoute} onNavigate={onNavigate} /> : null}
      </KeyboardAvoidingView>
      {enableShellNav && onNavigate ? <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={onNavigate} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.panel,
  },
  statusBar: {
    height: 28,
    backgroundColor: colors.text.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  statusText: {
    color: colors.text.onAccent,
    fontSize: 11,
    fontWeight: '700',
  },
  header: {
    height: 56,
    borderBottomWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.panel,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  headerIconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  headerIconPlaceholder: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'flex-start',
  },
  bodyWrap: {
    gap: 20,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  activeLedgerPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.background.panelSoft,
  },
  activeLedgerLabel: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  pageTitle: {
    color: colors.text.primary,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 36,
  },
  pageDescription: {
    color: colors.text.muted,
    fontSize: 15,
    lineHeight: 22,
  },
});
