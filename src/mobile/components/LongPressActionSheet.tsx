import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacingTokens } from '../theme/tokens';
import { Button } from './Button';
import { getResponsiveMaxWidth } from '../theme/layout';
import { useTheme } from '../theme/useTheme';

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
  const { colors } = useTheme();
  const maxWidth = getResponsiveMaxWidth(width);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
        },
        overlay: {
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: colors.scrim,
        },
        sheet: {
          backgroundColor: colors.card,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingHorizontal: spacingTokens.lg,
          paddingTop: spacingTokens.md,
          paddingBottom: 24,
          gap: spacingTokens.xs,
        },
        title: {
          fontSize: 13,
          color: colors.textMuted,
          marginBottom: 8,
        },
        row: {
          paddingVertical: 14,
        },
        label: {
          color: colors.textPrimary,
          fontSize: 16,
          fontWeight: '600',
        },
        destructiveLabel: {
          color: colors.destructive,
        },
        cancelRow: {
          marginTop: 8,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: spacingTokens.sm,
        },
      }),
    [colors],
  );

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
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
