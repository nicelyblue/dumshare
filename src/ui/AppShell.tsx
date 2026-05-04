import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AppShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
  children: React.ReactNode;
};

export function AppShell({ eyebrow, title, description, accent, children }: AppShellProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.accentBand, { backgroundColor: accent }]} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.shell}>
          <View style={styles.header}>
            <Text style={[styles.eyebrow, { color: accent }]}>{eyebrow}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>

          <View style={styles.body}>{children}</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#10203a',
  },
  accentBand: {
    height: 6,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  shell: {
    gap: 20,
    borderRadius: 28,
    backgroundColor: '#f5efe4',
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  header: {
    gap: 8,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  title: {
    color: '#10203a',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
  },
  description: {
    color: '#38485f',
    fontSize: 16,
    lineHeight: 23,
  },
  body: {
    gap: 16,
  },
});