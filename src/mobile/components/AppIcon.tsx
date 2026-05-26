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
      backgroundColor: colors.inverse,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    icon: {
      width: size * 0.6,
      height: size * 0.6,
    },
  });

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../dumshare.png')}
        style={styles.icon}
        resizeMode="contain"
      />
    </View>
  );
}
