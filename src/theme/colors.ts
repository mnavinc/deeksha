import { useColorScheme } from 'react-native';
import { useAppStore } from '@/store/useAppStore';

export const darkColors = {
  background: '#0D1117',
  surface: '#161B22',
  surfaceElevated: '#21262D',
  border: '#30363D',
  text: '#F0F6FC',
  textMuted: '#B0BEC5',   // was #8B949E — brighter for readability
  textDim: '#8B949E',     // was #6E7681 — was barely visible in dark
  primary: '#F0B429',
  primaryDark: '#D4A017',
  success: '#3FB950',
  warning: '#D29922',
  error: '#F85149',
  ayyappaGold: '#F0B429',
  ayyappaBlack: '#1a1a2e',
  accent: '#58A6FF',
};

export const lightColors = {
  background: '#F6F8FA',
  surface: '#FFFFFF',
  surfaceElevated: '#EAEEF2',
  border: '#D0D7DE',
  text: '#1F2328',
  textMuted: '#424A53',   // was #57606A — darker for better contrast on light bg
  textDim: '#57606A',     // was #6E7781
  primary: '#D49000',
  primaryDark: '#B37800',
  success: '#1F883D',
  warning: '#9A6700',
  error: '#CF222E',
  ayyappaGold: '#D49000',
  ayyappaBlack: '#1a1a2e',
  accent: '#0969DA',
};


export const colors = darkColors;

export function useThemeColors() {
  const theme = useAppStore((s) => s.theme);
  const systemScheme = useColorScheme();

  const activeTheme = theme === 'system' ? systemScheme ?? 'dark' : theme;
  return activeTheme === 'light' ? lightColors : darkColors;
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
