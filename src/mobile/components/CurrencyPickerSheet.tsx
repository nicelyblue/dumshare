import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacingTokens, touchTarget } from '../theme/tokens';
import { typographyTokens } from '../theme/typography';
import { modalSheetStyles } from '../theme/styles';
import { FormTextInput } from './FormFields';
import { useTheme } from '../theme/useTheme';

export type CurrencyOption = {
  code: string;
  label: string;
};

type CurrencyPickerSheetProps = {
  visible: boolean;
  query: string;
  options: CurrencyOption[];
  selectedCode?: string;
  maxWidth: number;
  onQueryChange: (value: string) => void;
  onSelect: (code: string) => void;
  onClose: () => void;
};

export function CurrencyPickerSheet({
  visible,
  query,
  options,
  selectedCode,
  maxWidth,
  onQueryChange,
  onSelect,
  onClose,
}: CurrencyPickerSheetProps): JSX.Element {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    title: {
      ...typographyTokens.body,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    list: {
      height: 320,
      flexShrink: 1,
    },
    listContent: {
      paddingBottom: spacingTokens.sm,
    },
    row: {
      minHeight: touchTarget.minimum,
      borderBottomWidth: 1,
      borderBottomColor: colors.subtleBorder,
      paddingVertical: spacingTokens.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacingTokens.sm,
    },
    rowTitle: {
      ...typographyTokens.body,
      fontSize: 15,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    rowSubtitle: {
      ...typographyTokens.label,
      color: colors.textMuted,
      flexShrink: 1,
      marginLeft: spacingTokens.sm,
    },
    selectedPill: {
      backgroundColor: colors.groupedSurface,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    selectedPillText: {
      color: colors.textPrimary,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    card: {
      backgroundColor: colors.card,
      gap: spacingTokens.sm,
      maxHeight: '75%',
    },
  });

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={modalSheetStyles.overlay}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={[
            modalSheetStyles.sheetCard,
            styles.card,
            {
              paddingBottom: insets.bottom + spacingTokens.md,
              width: '100%',
              maxWidth,
              alignSelf: 'center',
              paddingHorizontal: spacingTokens.lg,
            },
          ]}
        >
          <Text style={styles.title}>Select Currency</Text>
          <FormTextInput
            value={query}
            onChangeText={onQueryChange}
            placeholder="Search code or name"
          />
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled">
            {options.map((option) => {
              const selected = selectedCode === option.code;
              return (
                <Pressable key={option.code} style={styles.row} accessibilityRole="button" onPress={() => onSelect(option.code)}>
                  <Text style={styles.rowTitle}>{option.code}</Text>
                  <Text style={styles.rowSubtitle}>{option.label}</Text>
                  {selected ? (
                    <View style={styles.selectedPill}>
                      <Text style={styles.selectedPillText}>Selected</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
