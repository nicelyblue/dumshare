import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colorTokens, radiusTokens, spacingTokens } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { ParticipantAvatar } from './ParticipantAvatar';

export function SettlementRow({ fromLabel, toLabel, amount }: { fromLabel: string; toLabel: string; amount: string }): JSX.Element {
  const { colors } = useTheme();

  const dynamicStyles = useMemo(() => ({
    row: {
      padding: spacingTokens.md,
      borderRadius: radiusTokens.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      gap: spacingTokens.xs,
    },
    routeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacingTokens.xs,
    },
    routeName: {
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    routeArrow: {
      color: colors.textMuted,
      fontSize: 14,
    },
    amount: {
      color: colors.textMuted,
    },
  }), [colors]);

  return (
    <View style={dynamicStyles.row}>
      <View style={dynamicStyles.routeRow}>
        <ParticipantAvatar name={fromLabel} size="sm" />
        <Text style={dynamicStyles.routeName}>{fromLabel}</Text>
        <Text style={dynamicStyles.routeArrow}>→</Text>
        <ParticipantAvatar name={toLabel} size="sm" />
        <Text style={dynamicStyles.routeName}>{toLabel}</Text>
      </View>
      <Text style={dynamicStyles.amount}>{amount}</Text>
    </View>
  );
}

export function SettlementEmptyState({ title = 'No transfers needed' }: { title?: string } = {}): JSX.Element {
  const { colors } = useTheme();

  const dynamicStyles = useMemo(() => ({
    emptyState: {
      borderRadius: radiusTokens.md,
      padding: spacingTokens.md,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacingTokens.xs,
    },
    emptyHeading: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    emptyBody: {
      color: colors.textMuted,
    },
  }), [colors]);

  return (
    <View style={dynamicStyles.emptyState}>
      <Text style={dynamicStyles.emptyHeading}>{title}</Text>
      <Text style={dynamicStyles.emptyBody}>Everyone is currently balanced for the selected currency.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Layout styles only, colors are now dynamic
});
