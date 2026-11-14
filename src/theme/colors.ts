import { useColorScheme } from 'react-native';
import { useAppStore } from '@/store/useAppStore';

export const darkColors = {
  background: '#0D1117',
  surface: '#161B22',
  surfaceElevated: '#21262D',
  border: '#30363D',
  text: '#FFF8E1',          // Sacred Cream text on minimal dark
  textMuted: '#B8C4D4',
  textDim: '#8B949E',
  primary: '#F7931E',       // Swamiseva Saffron
  primaryDark: '#D4AF37',   // Swamiseva Golden
  onPrimary: '#0D1117',
  success: '#3FB950',
  warning: '#F7931E',
  error: '#F85149',
  ayyappaGold: '#D4AF37',
  ayyappaBlack: '#0D1117',
  accent: '#2E86EB',        // Swamiseva Sky Blue
};

export const lightColors = {
  background: '#FFFDF7',    // Airy Sacred Cream
  surface: '#FFFFFF',       // Crisp White cards
  surfaceElevated: '#FFF8E1', // Sacred Cream
  border: '#ECE4CE',
  text: '#0B2D6B',          // Swamiseva Divine Blue
  textMuted: '#3E5680',
  textDim: '#6A7FA3',
  primary: '#F7931E',       // Swamiseva Saffron
  primaryDark: '#D4AF37',   // Swamiseva Golden
  onPrimary: '#0D1117',
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  ayyappaGold: '#D4AF37',
  ayyappaBlack: '#0B2D6B',
  accent: '#2E86EB',        // Swamiseva Sky Blue
};


export const highContrastDarkColors = {
  ...darkColors,
  background: '#000000',
  surface: '#0B0F14',
  surfaceElevated: '#161D24',
  border: '#8B949E',
  text: '#FFFFFF',
  textMuted: '#E6EDF3',
  textDim: '#C9D1D9',
  primary: '#FFD43B',
  success: '#4AE168',
};

export const highContrastLightColors = {
  ...lightColors,
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#F0F3F6',
  border: '#1F2328',
  text: '#000000',
  textMuted: '#1F2328',
  textDim: '#24292F',
  primary: '#9A6700',
  success: '#116329',
};

export const colors = lightColors;

export function useThemeColors() {
  const theme = useAppStore((s) => s.theme);
  const highContrast = useAppStore((s) => s.highContrast);
  const systemScheme = useColorScheme();

  const activeTheme = theme === 'system' ? (systemScheme ?? 'light') : theme;
  if (highContrast) {
    return activeTheme === 'dark' ? highContrastDarkColors : highContrastLightColors;
  }
  return activeTheme === 'dark' ? darkColors : lightColors;
}

export function useFontScale(): number {
  const fontScale = useAppStore((s) => s.fontScale);
  if (fontScale === 'xlarge') return 1.28;
  if (fontScale === 'large') return 1.14;
  return 1;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = {
  hero: { fontSize: 28, fontWeight: '700' as const },
  title: { fontSize: 22, fontWeight: '600' as const },
  subtitle: { fontSize: 16, fontWeight: '500' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
};
