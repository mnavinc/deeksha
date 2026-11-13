import { Image, StyleSheet, View } from 'react-native';

interface SwamisevaLogoProps {
  size?: number;
}

/**
 * Official Swamiseva brand logo (uses the uploaded brand-kit logo image only).
 */
export function SwamisevaLogo({ size = 36 }: SwamisevaLogoProps) {
  const radius = Math.round(size * 0.24);
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: radius }]}>
      <Image
        source={require('../../assets/images/swamiseva-logo.jpg')}
        style={{ width: size, height: size, borderRadius: radius }}
        resizeMode="cover"
        accessibilityLabel="Swamiseva logo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

