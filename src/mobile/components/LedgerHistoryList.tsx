import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { LedgerHistoryModel } from '../controllers/ledgerHistoryController';
import { colorTokens, radiusTokens, spacingTokens, touchTarget } from '../theme/tokens';
import { textStyles } from '../theme/styles';
import { useTheme } from '../theme/useTheme';
import { ParticipantAvatar } from './ParticipantAvatar';

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

export function LedgerHistoryList(props: {
   model: LedgerHistoryModel;
   highlightedExpenseId?: string | null;
   onPressEntry: (expenseId: string) => void;
   onLongPressEntry: (expenseId: string) => void;
 }): JSX.Element {
   const { colors } = useTheme();
   const { width } = useWindowDimensions();
   const isTablet = width >= 840;

   const dynamicStyles = useMemo(() => ({
     root: { gap: spacingTokens.md },
     card: {
       borderWidth: 1,
       borderColor: colors.border,
       borderRadius: radiusTokens.md,
       padding: spacingTokens.md,
       backgroundColor: colors.card,
       gap: spacingTokens.md,
       minHeight: isTablet ? 100 : 'auto',
       justifyContent: isTablet ? 'space-between' : 'flex-start',
     },
     highlightedCard: {
       borderColor: colors.textPrimary,
       borderWidth: 2,
     },
     topRow: {
       flexDirection: 'row',
       gap: spacingTokens.md,
     },
     iconTile: {
       width: 56,
       height: 56,
       borderRadius: radiusTokens.sm,
       backgroundColor: colors.subtleSurface,
       alignItems: 'center',
       justifyContent: 'center',
     },
     iconText: { fontSize: 28 },
     mainColumn: { flex: 1, gap: spacingTokens.sm },
     title: { fontWeight: '600', color: colors.textPrimary, fontSize: 16 },
     amount: { color: colors.inverse, fontWeight: '700', fontSize: 18 },
     meta: { color: colors.textMuted },
     payerRow: {
       flexDirection: 'row',
       alignItems: 'center',
       gap: spacingTokens.xs,
     },
     payerName: {
       color: colors.textPrimary,
       fontWeight: '600',
     },
     divider: { height: 1, backgroundColor: colors.subtleBorder, marginVertical: spacingTokens.sm },
     bottomRow: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       gap: spacingTokens.md,
       minHeight: touchTarget.minimum,
     },
     participantsRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
     avatarShift: { marginLeft: -8 },
     participantText: { marginLeft: 10, color: colors.textMuted, fontSize: 14 },
     time: { color: colors.mutedSubtleText, fontSize: 13, minWidth: 60, textAlign: 'right' },
   }), [colors, isTablet]);

  return (
    <View style={dynamicStyles.root}>
      {props.model.entries.map((entry) => (
        <Pressable
          key={entry.expenseId}
          onPress={() => props.onPressEntry(entry.expenseId)}
          onLongPress={() => props.onLongPressEntry(entry.expenseId)}
          style={[dynamicStyles.card, props.highlightedExpenseId === entry.expenseId ? dynamicStyles.highlightedCard : null]}
        >
          <View style={dynamicStyles.topRow}>
            <View style={dynamicStyles.iconTile}>
              <Text style={dynamicStyles.iconText}>{iconForTitle(entry.title)}</Text>
            </View>
            <View style={dynamicStyles.mainColumn}>
              <Text style={[textStyles.body, dynamicStyles.title]}>{entry.title}</Text>
              <Text style={[textStyles.subheading, dynamicStyles.amount]}>{entry.amountLabel}</Text>
              {entry.payerName ? (
                <View style={dynamicStyles.payerRow}>
                  <Text style={dynamicStyles.meta}>Paid by</Text>
                  <ParticipantAvatar name={entry.payerName} size="sm" />
                  <Text style={dynamicStyles.payerName}>{entry.payerName}</Text>
                </View>
              ) : (
                <Text style={dynamicStyles.meta}>{entry.payerLabel}</Text>
              )}
            </View>
          </View>
          <View style={dynamicStyles.divider} />
          <View style={dynamicStyles.bottomRow}>
            <View style={dynamicStyles.participantsRow}>
              {entry.participantPreviewNames.map((name, index) => (
                <View key={`${entry.expenseId}-icon-${index}`} style={index > 0 ? dynamicStyles.avatarShift : null}>
                  <ParticipantAvatar name={name} size="sm" />
                </View>
              ))}
              <Text style={dynamicStyles.participantText}>{entry.participantCountLabel}</Text>
            </View>
            <Text style={dynamicStyles.time}>{entry.createdAtLabel}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Spacing and layout
});

