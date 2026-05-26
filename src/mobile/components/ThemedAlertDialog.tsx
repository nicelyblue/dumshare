import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';
import { spacingTokens, radiusTokens, touchTarget } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

export type ThemedAlertButton = {
  label: string;
  style?: 'default' | 'destructive';
  onPress?: () => void;
};

type ThemedAlertDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  buttons: ThemedAlertButton[];
  onClose: () => void;
};

export function ThemedAlertDialog({ visible, title, message, buttons, onClose }: ThemedAlertDialogProps): JSX.Element {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.scrim,
          padding: spacingTokens.lg,
        },
        card: {
          width: '100%',
          maxWidth: 420,
          backgroundColor: colors.card,
          borderRadius: radiusTokens.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacingTokens.lg,
          gap: spacingTokens.md,
        },
        title: {
          color: colors.textPrimary,
          fontSize: 18,
          fontWeight: '700',
        },
        message: {
          color: colors.textSecondary,
          fontSize: 14,
          lineHeight: 20,
        },
        buttonRow: {
          flexDirection: 'row',
          gap: spacingTokens.sm,
          justifyContent: 'flex-end',
          marginTop: spacingTokens.xs,
        },
        button: {
          minHeight: touchTarget.minimum,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radiusTokens.md,
          paddingHorizontal: spacingTokens.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.card,
        },
        buttonDestructive: {
          borderColor: colors.destructive,
          backgroundColor: colors.destructive,
        },
        buttonText: {
          color: colors.textPrimary,
          fontSize: 14,
          fontWeight: '600',
        },
        buttonTextDestructive: {
          color: colors.card,
        },
      }),
    [colors],
  );

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonRow}>
            {buttons.map((button) => (
              <Pressable
                key={button.label}
                style={[styles.button, button.style === 'destructive' ? styles.buttonDestructive : null]}
                onPress={() => {
                  onClose();
                  button.onPress?.();
                }}
              >
                <Text style={[styles.buttonText, button.style === 'destructive' ? styles.buttonTextDestructive : null]}>{button.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
