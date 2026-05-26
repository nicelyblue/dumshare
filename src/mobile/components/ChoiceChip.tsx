import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { radiusTokens, spacingTokens } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

type ChoiceChipProps = {
  label: string;
  active?: boolean;
  onPress: () => void;
};

export function ChoiceChip({ label, active, onPress }: ChoiceChipProps): JSX.Element {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        chip: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radiusTokens.md,
          backgroundColor: colors.card,
          paddingHorizontal: spacingTokens.md,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'flex-start',
        },
        chipActive: {
          backgroundColor: colors.inverse,
          borderColor: colors.inverse,
        },
        chipPressed: {
          opacity: 0.75,
        },
        text: {
          color: colors.textPrimary,
          fontWeight: '500',
        },
        textActive: {
          color: colors.card,
        },
      }),
    [colors],
  );

  return (
    <Pressable
      style={({ pressed }) => [styles.chip, active ? styles.chipActive : null, pressed ? styles.chipPressed : null]}
      onPress={onPress}
    >
      <Text style={[styles.text, active ? styles.textActive : null]}>{label}</Text>
    </Pressable>
  );
}
