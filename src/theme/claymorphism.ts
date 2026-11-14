import type { ViewStyle } from 'react-native';

export function getClayStyle(
  theme: 'light' | 'dark',
  elevation: 'low' | 'medium' | 'high' = 'medium',
  customBg?: string
): ViewStyle {
  const isDark = theme === 'dark';

  if (isDark) {
    // Minimal Dark Surface
    const bg = customBg ?? '#161B22';
    return {
      backgroundColor: bg,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: '#30363D',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.35,
      shadowRadius: elevation === 'high' ? 10 : elevation === 'medium' ? 6 : 3,
      elevation: elevation === 'high' ? 8 : elevation === 'medium' ? 4 : 2,
    };
  }

  // Minimal Light Surface (Brand-kit Sacred Cream & Divine Blue soft shadow)
  const bg = customBg ?? '#FFFFFF';
  return {
    backgroundColor: bg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ECE4CE',
    shadowColor: '#0B2D6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: elevation === 'high' ? 10 : elevation === 'medium' ? 6 : 3,
    elevation: elevation === 'high' ? 6 : elevation === 'medium' ? 3 : 1,
  };
}

export function getClayButtonStyle(
  theme: 'light' | 'dark',
  variant: 'primary' | 'secondary' | 'accent' = 'primary'
): ViewStyle {
  const isDark = theme === 'dark';
  const primaryBg = '#F7931E';
  const secondaryBg = isDark ? '#21262D' : '#FFF8E1';
  const accentBg = '#0B2D6B';

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
