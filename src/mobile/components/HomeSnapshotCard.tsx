import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { HomeSnapshotModel } from '../controllers/homeSnapshotController';
import { radiusTokens, spacingTokens } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

type Props = {
  model: HomeSnapshotModel;
};

export function HomeSnapshotCard({ model }: Props): JSX.Element {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.card,
          borderRadius: radiusTokens.lg,
          padding: spacingTokens.lg,
          gap: spacingTokens.md,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingBottom: spacingTokens.sm,
        },
        name: {
          fontSize: 16,
          fontWeight: '600',
          color: colors.textPrimary,
        },
        status: {
          fontSize: 13,
          color: colors.textMuted,
        },
        amount: {
          fontSize: 16,
          fontWeight: '700',
        },
        positive: {
          color: colors.success,
        },
        negative: {
          color: colors.destructive,
        },
        settled: {
          color: colors.accent,
        },
        latestExpense: {
          backgroundColor: colors.groupedSurface,
          borderRadius: radiusTokens.md,
          padding: spacingTokens.md,
          gap: 4,
        },
        latestTitle: {
          color: colors.accent,
          fontWeight: '700',
        },
        latestMeta: {
          color: colors.textMuted,
          fontSize: 13,
        },
        latestAmount: {
          fontSize: 20,
          fontWeight: '700',
          color: colors.textPrimary,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.container}>
      {model.participantRows.map((row) => (
        <View key={`${row.participantName}-${row.netAmountLabel}`} style={styles.row}>
          <View>
            <Text style={styles.name}>{row.participantName}</Text>
            <Text style={styles.status}>{row.statusLabel}</Text>
          </View>
          <Text style={[styles.amount, row.statusLabel === 'owes' ? styles.negative : row.statusLabel === 'is owed' ? styles.positive : styles.settled]}>
            {row.netAmountLabel}
          </Text>
        </View>
      ))}

      {model.latestExpenseCard ? (
        <View style={styles.latestExpense}>
          <Text style={styles.latestTitle}>Review latest expense</Text>
          <Text style={styles.latestMeta}>{model.latestExpenseCard.payerLabel}</Text>
          <Text style={styles.latestAmount}>{model.latestExpenseCard.amountLabel}</Text>
          <Text style={styles.latestMeta}>{model.latestExpenseCard.participantCountLabel}</Text>
          <Text style={styles.latestMeta}>{model.latestExpenseCard.timestampLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}
