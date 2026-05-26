import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colorTokens, spacingTokens } from '../theme/tokens';
import { Button } from './Button';
import { getResponsiveMaxWidth } from '../theme/layout';
import { modalSheetStyles } from '../theme/styles';

export type ActionSheetOption = {
  key: string;
  label: string;
  destructive?: boolean;
};

type LongPressActionSheetProps = {
  visible: boolean;
  options: ActionSheetOption[];
  title?: string;
  onSelect: (key: string) => void;
  onClose: () => void;
};

export function LongPressActionSheet({ visible, options, title, onSelect, onClose }: LongPressActionSheetProps): JSX.Element {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const maxWidth = getResponsiveMaxWidth(width);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={modalSheetStyles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            modalSheetStyles.sheetCard,
            styles.sheet,
            { paddingBottom: insets.bottom + spacingTokens.md, width: '100%', maxWidth, alignSelf: 'center' },
          ]}
        >
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {options.map((option) => (
            <Pressable
              key={option.key}
              style={styles.row}
              accessibilityRole="button"
              onPress={() => {
                onSelect(option.key);
                onClose();
              }}
            >
              <Text style={[styles.label, option.destructive ? styles.destructiveLabel : null]}>{option.label}</Text>
            </Pressable>
          ))}
          <View style={styles.cancelRow}>
            <Button variant="secondary" fullWidth onPress={onClose}>
              Cancel
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  sheet: {
    paddingBottom: 24,
    gap: spacingTokens.xs,
  },
  title: {
    fontSize: 13,
    color: colorTokens.textMuted,
    marginBottom: 8,
  },
  row: {
    paddingVertical: 14,
  },
  label: {
    color: colorTokens.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  destructiveLabel: {
    color: colorTokens.destructive,
  },
  cancelRow: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colorTokens.border,
    paddingTop: spacingTokens.sm,
  },
});
