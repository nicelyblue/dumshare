import { Link } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createLedgerAppService } from '../src/mobile/services/ledgerAppService';
import { colorTokens, radiusTokens, spacingTokens, touchTarget } from '../src/mobile/theme/tokens';
import { typographyTokens } from '../src/mobile/theme/typography';

const appService = createLedgerAppService();

export default function HomeScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolveWelcomeVisibility(): Promise<void> {
      try {
        const shares = await appService.listShares();
        if (cancelled) {
          return;
        }

        if (shares.length > 0) {
          router.replace('/(tabs)');
          return;
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    }

    void resolveWelcomeVisibility();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return <View style={styles.screen} />;
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacingTokens.sm }]}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Dumshare</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.main}>
        <View style={styles.welcomeIconWrap}>
          <Text style={styles.welcomeIcon}>Share</Text>
        </View>

        <View style={styles.copyWrap}>
          <Text style={styles.title}>Welcome to Dumshare!</Text>
          <Text style={styles.subtitle}>You haven't created your first Share yet. Get started by creating a Share to track expenses with friends.</Text>
        </View>

        <Link href="/(setup)/create-share" asChild>
          <Pressable accessibilityRole="button" style={styles.primaryButton}>
            <Text style={styles.fabIcon}>+</Text>
          </Pressable>
        </Link>
        <Text style={styles.fabLabel}>Create a Share</Text>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colorTokens.appBackground,
    padding: spacingTokens.lg,
    gap: spacingTokens.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacingTokens.sm,
  },
  headerTitle: {
    ...typographyTokens.heading,
    color: colorTokens.textPrimary,
    fontWeight: '500',
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacingTokens.md,
    paddingBottom: spacingTokens.xl,
  },
  welcomeIconWrap: {
    width: 128,
    height: 128,
    borderRadius: radiusTokens.pill,
    backgroundColor: colorTokens.groupedSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacingTokens.xl,
  },
  welcomeIcon: {
    ...typographyTokens.heading,
    color: colorTokens.textMuted,
    fontWeight: '500',
  },
  copyWrap: {
    marginBottom: spacingTokens.x2l,
    alignItems: 'center',
  },
  title: {
    ...typographyTokens.display,
    color: colorTokens.textPrimary,
    marginBottom: spacingTokens.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typographyTokens.body,
    color: colorTokens.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  primaryButton: {
    width: 64,
    height: 64,
    borderRadius: radiusTokens.pill,
    backgroundColor: colorTokens.inverse,
    minHeight: touchTarget.minimum,
    minWidth: touchTarget.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 3,
  },
  fabIcon: {
    color: colorTokens.card,
    fontSize: 32,
    lineHeight: 32,
  },
  fabLabel: {
    marginTop: spacingTokens.sm,
    ...typographyTokens.body,
    color: colorTokens.textMuted,
  },
});
