import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { colors, spacing } from '@/theme/colors';

export default function IndexScreen() {
  const profile = useAppStore((s) => s.profile);
  const enrollment = useAppStore((s) => s.enrollment);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!profile?.onboardingComplete || !enrollment) {
        router.replace('/onboarding/welcome');
      } else {
        router.replace('/(tabs)');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [profile, enrollment]);

  return (
    <View style={styles.container}>
      <Text style={styles.saranam}>Swamiye Saranam Ayyappa</Text>
      <Text style={styles.title}>Deeksha Journey</Text>
      <Text style={styles.subtitle}>Your Deeksha. Your Journey. Your Yatra.</Text>
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
  saranam: { color: colors.primary, fontSize: 14, marginBottom: spacing.md },
  title: { color: colors.text, fontSize: 32, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: spacing.sm, textAlign: 'center' },
});
