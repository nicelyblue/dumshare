import React, { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOptionalLedgerSession } from '../state/ledgerSession';

type AppShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
  children: React.ReactNode;
};

export function AppShell({ eyebrow, title, description, accent, children }: AppShellProps) {
  const [keyboardInset, setKeyboardInset] = useState(0);
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
      <View style={[styles.accentBand, { backgroundColor: accent }]} />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 + keyboardInset }]}
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-5 rounded-card border border-border bg-panel p-6" style={styles.shellShadow}>
            <View className="gap-2">
              <Text style={[styles.eyebrow, { color: accent }]}>{eyebrow}</Text>
              {activeLedger ? (
                <View className="self-start flex-row items-center gap-1.5 rounded-full border border-border bg-shellSoft px-3 py-1.5">
                  <Text className="text-[10px] font-extrabold uppercase tracking-[0.8px] text-muted">Active ledger</Text>
                  <Text className="text-[11px] font-extrabold text-ink">{activeLedger.title}</Text>
                </View>
              ) : null}
              <Text className="text-[34px] font-extrabold leading-10 text-ink">{title}</Text>
              <Text className="text-base leading-6 text-muted">{description}</Text>
            </View>

            <View className="gap-4">{children}</View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f8ff',
  },
  accentBand: {
    height: 6,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  shellShadow: {
    shadowColor: '#284c91',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
});
