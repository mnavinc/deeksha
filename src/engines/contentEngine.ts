import { colors } from '@/theme/colors';
import type { DeekshaId } from '@/data/deekshaTypes';

export function getDeekshaTheme(deekshaId: DeekshaId) {
  const themes: Record<DeekshaId, { primary: string; accent: string; gradient: [string, string] }> = {
    ayyappa: { primary: colors.ayyappaGold, accent: colors.ayyappaBlack, gradient: ['#1a1a2e', '#16213e'] },
    bhavani: { primary: '#DC2626', accent: '#FEE2E2', gradient: ['#450a0a', '#7f1d1d'] },
    govinda: { primary: '#EAB308', accent: '#FEF9C3', gradient: ['#422006', '#713f12'] },
    shiva: { primary: '#6366F1', accent: '#E0E7FF', gradient: ['#1e1b4b', '#312e81'] },
    hanuman: { primary: '#F97316', accent: '#FFEDD5', gradient: ['#431407', '#7c2d12'] },
    nookambika: { primary: '#EC4899', accent: '#FCE7F3', gradient: ['#500724', '#831843'] },
  };
  return themes[deekshaId] ?? themes.ayyappa;
}

export const APP_DISCLAIMER =
  'Ayyappa Deeksha and Sabarimala pilgrimage practices can vary by region, temple, family tradition and Guru Swamy. This app provides general devotional and pilgrimage information. Current temple, route, safety, booking and access instructions issued by Sabarimala authorities always take precedence.';

export const MULTI_DEEKSHA_WARNING =
  'Practices vary by temple, region and Guru. Please confirm the exact Deeksha rules with your Guru Swamy or the temple before beginning the Vratham.';
