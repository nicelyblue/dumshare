import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/useTheme';

type AppIconProps = {
  size?: number;
};

export function AppIcon({ size = 64 }: AppIconProps): JSX.Element {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    icon: {
      width: size,
      height: size,
    },
  });

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/dumshare-mark.png')}
        style={styles.icon}
        resizeMode="contain"
      />
    </View>
  );
}
