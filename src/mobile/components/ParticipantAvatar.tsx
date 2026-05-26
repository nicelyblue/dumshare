import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getDefaultParticipantIcon } from '../utils/participantIcons';
import { colorTokens, radiusTokens } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

type ParticipantAvatarProps = {
  name: string;
  size?: 'sm' | 'md';
};

export function ParticipantAvatar({ name, size = 'md' }: ParticipantAvatarProps): JSX.Element {
  const { colors } = useTheme();

  const dynamicStyles = useMemo(() => ({
    avatar: {
      borderRadius: radiusTokens.pill,
      backgroundColor: colors.subtleSurface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatarSm: {
      width: 26,
      height: 26,
    },
    avatarMd: {
      width: 34,
      height: 34,
    },
    iconSm: {
      fontSize: 11,
      color: colors.textPrimary,
    },
    iconMd: {
      fontSize: 13,
      color: colors.textPrimary,
    },
  }), [colors]);

  const sizeStyle = size === 'sm' ? dynamicStyles.avatarSm : dynamicStyles.avatarMd;
  const iconStyle = size === 'sm' ? dynamicStyles.iconSm : dynamicStyles.iconMd;

  return (
    <View style={[dynamicStyles.avatar, sizeStyle]}>
      <Text style={iconStyle}>{getDefaultParticipantIcon(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Size definitions only, colors are now dynamic
});
