import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LedgerHistoryModel } from '../controllers/ledgerHistoryController';
import { colorTokens, radiusTokens, spacingTokens } from '../theme/tokens';

const PARTICIPANT_ICON_POOL = ['😎', '🦊', '🐼', '🐯', '🦉', '🐙', '🐸', '🐧', '🐨', '🦁', '🐬', '🦄'] as const;

function hashValue(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function iconForTitle(title: string): string {
  const normalized = title.toLowerCase();
  if (normalized.includes('dinner') || normalized.includes('lunch') || normalized.includes('food') || normalized.includes('restaurant')) {
    return '🍽️';
  }
  if (normalized.includes('grocer') || normalized.includes('market')) {
    return '🛒';
  }
  if (normalized.includes('gas') || normalized.includes('fuel') || normalized.includes('petrol')) {
    return '⛽';
  }
  return '🧾';
}

function participantsPreview(seed: string, count: number): string[] {
  const safeCount = Math.max(0, count);
  const visible = Math.min(3, safeCount);
  const base = hashValue(seed.trim().toLowerCase());
  return Array.from({ length: visible }, (_, index) => PARTICIPANT_ICON_POOL[(base + index) % PARTICIPANT_ICON_POOL.length] ?? '😎');
}

export function LedgerHistoryList(props: {
  model: LedgerHistoryModel;
  highlightedExpenseId?: string | null;
  onPressEntry: (expenseId: string) => void;
  onLongPressEntry: (expenseId: string) => void;
}): JSX.Element {
  return (
    <View style={styles.root}>
      {props.model.entries.map((entry) => (
        <Pressable
          key={entry.expenseId}
          onPress={() => props.onPressEntry(entry.expenseId)}
          onLongPress={() => props.onLongPressEntry(entry.expenseId)}
          style={[styles.card, props.highlightedExpenseId === entry.expenseId ? styles.highlightedCard : null]}
        >
          <View style={styles.topRow}>
            <View style={styles.iconTile}>
              <Text style={styles.iconText}>{iconForTitle(entry.title)}</Text>
            </View>
            <View style={styles.mainColumn}>
              <Text style={styles.title}>{entry.title}</Text>
              <Text style={styles.amount}>{entry.amountLabel}</Text>
              <Text style={styles.meta}>{entry.payerLabel}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.bottomRow}>
            <View style={styles.participantsRow}>
              {participantsPreview(entry.expenseId, entry.participantCount).map((icon, index) => (
                <Text key={`${entry.expenseId}-icon-${index}`} style={styles.avatarEmoji}>
                  {icon}
                </Text>
              ))}
              <Text style={styles.participantText}>{entry.participantCountLabel}</Text>
            </View>
            <Text style={styles.time}>{entry.createdAtLabel}</Text>
          </View>
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
    gap: spacingTokens.sm,
  },
  highlightedCard: {
    borderColor: colorTokens.textPrimary,
    borderWidth: 2,
  },
  topRow: {
    flexDirection: 'row',
    gap: spacingTokens.md,
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: radiusTokens.sm,
    backgroundColor: colorTokens.subtleSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 22 },
  mainColumn: { flex: 1, gap: spacingTokens.xs },
  title: { fontWeight: '500', color: colorTokens.textPrimary, fontSize: 28 / 2 },
  amount: { color: colorTokens.inverse, fontSize: 36 / 2, fontWeight: '600' },
  meta: { color: colorTokens.textMuted, fontSize: 15 },
  divider: { height: 1, backgroundColor: colorTokens.subtleBorder },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacingTokens.sm,
  },
  participantsRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarEmoji: { marginRight: -4, fontSize: 16 },
  participantText: { marginLeft: 10, color: colorTokens.textMuted, fontSize: 14 },
  time: { color: colorTokens.mutedSubtleText, fontSize: 13 },
});
