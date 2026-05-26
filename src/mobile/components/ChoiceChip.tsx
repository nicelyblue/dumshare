import { Pressable, StyleSheet, Text } from 'react-native';
import { colorTokens, radiusTokens, spacingTokens } from '../theme/tokens';

type ChoiceChipProps = {
  label: string;
  active?: boolean;
  onPress: () => void;
};

export function ChoiceChip({ label, active, onPress }: ChoiceChipProps): JSX.Element {
  return (
    <Pressable
      style={({ pressed }) => [styles.chip, active ? styles.chipActive : null, pressed ? styles.chipPressed : null]}
      onPress={onPress}
    >
      <Text style={[styles.text, active ? styles.textActive : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderColor: colorTokens.border,
    borderRadius: radiusTokens.md,
    backgroundColor: colorTokens.card,
    paddingHorizontal: spacingTokens.md,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  chipActive: {
    backgroundColor: colorTokens.inverse,
    borderColor: colorTokens.inverse,
  },
  chipPressed: {
    opacity: 0.75,
  },
  text: {
    color: colorTokens.textPrimary,
    fontWeight: '500',
  },
  textActive: {
    color: colorTokens.card,
  },
});
