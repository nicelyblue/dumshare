import { Link } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createLedgerAppService } from '../src/mobile/services/ledgerAppService';
import { bootstrapDummyData } from '../src/mobile/actions/bootstrapDummyData';
import { spacingTokens } from '../src/mobile/theme/tokens';
import { typographyTokens } from '../src/mobile/theme/typography';
import { useTheme } from '../src/mobile/theme/useTheme';
import { Button } from '../src/mobile/components/Button';
import { AppIcon } from '../src/mobile/components/AppIcon';

const appService = createLedgerAppService();

export default function HomeScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [ready, setReady] = useState(false);
  const styles = useMemo(() => StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.appBackground,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: spacingTokens.lg,
      paddingBottom: insets.bottom + spacingTokens.xl,
    },
    header: {
      minHeight: 56,
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      ...typographyTokens.heading,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    main: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacingTokens.x2l,
      gap: spacingTokens.xl,
    },
    copyWrap: {
      alignItems: 'center',
      gap: spacingTokens.sm,
      maxWidth: 420,
    },
    title: {
      ...typographyTokens.display,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      ...typographyTokens.body,
      color: colors.textMuted,
      textAlign: 'center',
    },
    actionWrap: {
      width: '100%',
      maxWidth: 360,
    },
  }), [colors, insets.bottom]);

  useEffect(() => {
    let cancelled = false;

    async function resolveWelcomeVisibility(): Promise<void> {
      try {
        await bootstrapDummyData();
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
    return <View accessibilityLabel="Loading Dumshare" style={styles.screen} />;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dumshare</Text>
      </View>

      <View style={styles.main}>
        <AppIcon size={112} />

        <View style={styles.copyWrap}>
          <Text style={styles.title}>Split expenses without the noise</Text>
          <Text style={styles.subtitle}>Create a share, add the people involved, and keep every balance clear.</Text>
        </View>

        <View style={styles.actionWrap}>
          <Link href="/(setup)/create-share" asChild>
            <Button fullWidth>Create a Share</Button>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
