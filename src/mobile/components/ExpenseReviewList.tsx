import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ExpenseReviewModel } from '../controllers/expenseReviewController';
import { radiusTokens, spacingTokens } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

type Props = {
  model: ExpenseReviewModel;
};

export function ExpenseReviewList({ model }: Props): JSX.Element {
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          gap: spacingTokens.md,
        },
        card: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radiusTokens.md,
          padding: spacingTokens.md,
          backgroundColor: colors.card,
        },
        title: {
          fontWeight: '700',
          color: colors.textPrimary,
        },
        status: {
          marginTop: 4,
          color: colors.textMuted,
          fontSize: 13,
        },
        line: {
          marginTop: 8,
          color: colors.textPrimary,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.container}>
      {model.items.map((item, index) => {
        const expanded = expandedIds[index] ?? false;
        return (
          <Pressable
            key={`${index}-${item.splitModeLabel}`}
            style={styles.card}
            onPress={() => {
              setExpandedIds((current) => ({ ...current, [index]: !expanded }));
            }}
          >
            <Text style={styles.title}>Split mode: {item.splitModeLabel}</Text>
            <Text style={styles.status}>Pending organizer approval</Text>
            {expanded ? item.impactLines.map((line) => <Text key={line} style={styles.line}>{line}</Text>) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
