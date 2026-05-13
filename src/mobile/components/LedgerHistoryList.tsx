import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LedgerHistoryModel } from '../controllers/ledgerHistoryController';
import { colorTokens, radiusTokens, spacingTokens } from '../theme/tokens';

export function LedgerHistoryList(props: {
  model: LedgerHistoryModel;
  onLongPressEntry: (expenseId: string) => void;
}): JSX.Element {
  return (
    <View style={styles.root}>
      {props.model.entries.map((entry) => (
        <Pressable key={entry.expenseId} onLongPress={() => props.onLongPressEntry(entry.expenseId)} style={styles.card}>
          <Text style={styles.title}>{entry.title}</Text>
          <Text style={styles.meta}>{entry.amountLabel}</Text>
          <Text style={styles.meta}>{entry.payerLabel}</Text>
          <Text style={styles.meta}>{entry.splitLabel}</Text>
          <Text style={styles.time}>{entry.createdAtLabel}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacingTokens.sm },
  card: {
    borderWidth: 1,
    borderColor: colorTokens.border,
    borderRadius: radiusTokens.md,
    padding: spacingTokens.md,
    backgroundColor: colorTokens.card,
    gap: spacingTokens.xs,
  },
  title: { fontWeight: '700', color: colorTokens.textPrimary },
  meta: { color: colorTokens.textMuted },
  time: { color: colorTokens.textMuted, fontSize: 12 },
});
