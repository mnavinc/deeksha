import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { getLocales } from 'expo-localization';
import { useAppStore, useHasHydrated } from '@/store/useAppStore';
import { getDeekshaType } from '@/data/deekshaTypes';
import { colors, spacing } from '@/theme/colors';

function getDeviceLanguage(): 'te' | 'en' {
  try {
    const locales = getLocales();
    const lang = locales[0]?.languageCode ?? 'en';
    if (lang === 'te') return 'te';
    return 'en';
  } catch {
    return 'en';
  }
}

function getSaranam(deekshaId?: string, language?: string): string {
  const saranams: Record<string, { en: string; te: string }> = {
    ayyappa: { en: 'Swamiye Saranam Ayyappa', te: 'స్వామియే శరణం అయ్యప్ప' },
    bhavani: { en: 'Jai Bhavani', te: 'జై భవాని' },
    govinda: { en: 'Govinda Govinda', te: 'గోవిందా గోవిందా' },
    shiva: { en: 'Om Namah Shivaya', te: 'ఓం నమః శివాయ' },
    hanuman: { en: 'Jai Hanuman', te: 'జై హనుమాన్' },
    nookambika: { en: 'Jai Nookambika', te: 'జై నూకాంబిక' },
  };
  const key = deekshaId ?? 'ayyappa';
  const lang = language === 'te' ? 'te' : 'en';
  return saranams[key]?.[lang] ?? saranams.ayyappa[lang];
}

export default function IndexScreen() {
  const hasHydrated = useHasHydrated();
  const profile = useAppStore((s) => s.profile);
  const enrollment = useAppStore((s) => s.enrollment);
  const setProfile = useAppStore((s) => s.setProfile);
  const setLanguage = useAppStore((s) => s.setLanguage);

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;

    // Auto-detect device language for new users
    if (!profile) {
      const deviceLang = getDeviceLanguage();
      // Language will be set during onboarding, but we note the preference
      void deviceLang;
    }

    const timer = setTimeout(() => {
      if (!profile?.onboardingComplete || !enrollment) {
        // Pass detected device language to onboarding
        const deviceLang = getDeviceLanguage();
        if (!profile) {
          router.replace({
            pathname: '/onboarding/welcome',
            params: { detectedLang: deviceLang },
          });
        } else {
          router.replace('/onboarding/welcome');
        }
      } else {
        router.replace('/(tabs)');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [hasHydrated, profile, enrollment]);

  const saranam = getSaranam(enrollment?.deekshaId, profile?.language);
  const subtitle = profile?.language === 'te'
    ? 'మీ దీక్ష. మీ యాత్ర. మీ సంకల్పం.'
    : 'Your Deeksha. Your Journey. Your Yatra.';

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.inner, { opacity, transform: [{ scale }] }]}>
        <Text style={styles.temple}>🛕</Text>
        <Text style={styles.saranam}>{saranam}</Text>
        <Text style={styles.title}>Deeksha Journey</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {!hasHydrated && (
          <View style={styles.loadingRow}>
            <Text style={styles.loading}>●●●</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  inner: { alignItems: 'center', gap: 8 },
  temple: { fontSize: 64, marginBottom: 8 },
  saranam: { color: colors.primary, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  title: { color: colors.text, fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 4, textAlign: 'center' },
  loadingRow: { marginTop: 24 },
  loading: { color: colors.primary, fontSize: 10, letterSpacing: 4, opacity: 0.6 },
});
