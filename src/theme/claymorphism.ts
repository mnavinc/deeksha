import { StyleSheet, ViewStyle } from 'react-native';
import { darkColors, lightColors } from './colors';

export function getClayStyle(
  theme: 'light' | 'dark',
  elevation: 'low' | 'medium' | 'high' = 'medium',
  customBg?: string
): ViewStyle {
  const isDark = theme === 'dark';

  if (isDark) {
    // Dark Claymorphism
    const bg = customBg ?? '#12171E';
    return {
      backgroundColor: bg,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#30363D80',
      shadowColor: '#000',
      shadowOffset: { width: 4, height: 6 },
      shadowOpacity: 0.6,
      shadowRadius: elevation === 'high' ? 12 : elevation === 'medium' ? 8 : 4,
      elevation: elevation === 'high' ? 10 : elevation === 'medium' ? 6 : 3,
    };
  }

  // Light Claymorphism (Soft inflated 3D feel)
  const bg = customBg ?? '#EAF0F6';
  return {
    backgroundColor: bg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#B0C0D0',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: elevation === 'high' ? 14 : elevation === 'medium' ? 8 : 4,
    elevation: elevation === 'high' ? 8 : elevation === 'medium' ? 5 : 2,
  };
}

export function getClayButtonStyle(
  theme: 'light' | 'dark',
  variant: 'primary' | 'secondary' | 'accent' = 'primary'
): ViewStyle {
  const isDark = theme === 'dark';
  const primaryBg = isDark ? '#F0B429' : '#D49000';
  const secondaryBg = isDark ? '#1C232D' : '#DDE5ED';
  const accentBg = isDark ? '#E65100' : '#CC4400';

  const bg = variant === 'primary' ? primaryBg : variant === 'accent' ? accentBg : secondaryBg;

  return {
    backgroundColor: bg,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: variant === 'primary' ? '#F0B429' : '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  };
}
