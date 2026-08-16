import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { useThemeColors, spacing } from '@/theme/colors';
import { getClayStyle, getClayButtonStyle } from '@/theme/claymorphism';
import { useI18n } from '@/i18n';
import { AuthModal } from '@/components/AuthModal';

export default function WelcomeScreen() {
  const { t, language } = useI18n();
  const colors = useThemeColors();
  const theme = useAppStore((s) => s.theme);
  const activeTheme = theme === 'system' ? 'dark' : theme;
  const { height } = useWindowDimensions();
  const { action } = useLocalSearchParams<{ action?: string }>();

  const [authVisible, setAuthVisible] = useState(false);

  useEffect(() => {
    if (action === 'signin') {
      setAuthVisible(true);
    }
  }, [action]);

  const features = [
    {
      title: t('feat1Title'),
      desc: t('feat1Desc'),
      icon: '📿',
    },
    {
      title: t('feat2Title'),
      desc: t('feat2Desc'),
      icon: '🏆',
    },
    {
      title: t('feat3Title'),
      desc: t('feat3Desc'),
      icon: '👥',
    },
  ];

  const handleAuthSuccess = () => {
    setAuthVisible(false);
    router.replace('/onboarding/profile');
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { minHeight: height, backgroundColor: colors.background }]}>
      {/* Top Branding Section */}
      <View style={styles.topSection}>
        <View style={[styles.logoCard, getClayStyle(activeTheme, 'high', colors.surface)]}>
          <Text style={styles.logoSymbol}>🛕</Text>
        </View>
        <Text style={[styles.saranamText, { color: colors.primary }]}>{t('saranam')}</Text>
        <Text style={[styles.welcomeTitle, { color: colors.text }]}>{t('welcomeTitle')}</Text>
        <Text style={[styles.welcomeBody, { color: colors.textMuted }]}>{t('welcomeBody')}</Text>
      </View>

      {/* Feature Highlights Grid */}
      <View style={styles.featuresGrid}>
        {features.map((item, idx) => (
          <View
            key={idx}
            style={[
              styles.featCard,
              getClayStyle(activeTheme, 'low', colors.surface),
              { borderColor: colors.border },
            ]}
          >
            <Text style={styles.featIcon}>{item.icon}</Text>
            <View style={styles.featCopy}>
              <Text style={[styles.featTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.featDesc, { color: colors.textMuted }]}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Bottom Call-to-Actions */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.primaryBtn, getClayButtonStyle(activeTheme, 'primary')]}
          onPress={() => setAuthVisible(true)}
        >
          <Text style={styles.btnText}>{t('beginJourney')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.secondaryBtn,
            getClayStyle(activeTheme, 'low', colors.surface),
            { borderColor: colors.border, marginTop: spacing.sm },
          ]}
          onPress={() => router.push('/guide' as any)}
        >
          <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
            {language === 'te' ? '📖 దీక్ష విశిష్టత & యాప్ గైడ్ చూడండి' : '📖 Deeksha Benefits & App Tutorial'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Auth Modal Overlay */}
      <AuthModal
        visible={authVisible}
        onClose={() => setAuthVisible(false)}
        onSuccess={handleAuthSuccess}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  topSection: {
    alignItems: 'center',
    gap: 6,
  },
  logoCard: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  logoSymbol: {
    fontSize: 40,
  },
  saranamText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 2,
  },
  welcomeBody: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 340,
  },
  featuresGrid: {
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  featCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
  },
  featIcon: {
    fontSize: 24,
  },
  featCopy: {
    flex: 1,
  },
  featTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  featDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  bottomSection: {
    width: '100%',
  },
  primaryBtn: {
    width: '100%',
  },
  btnText: {
    color: '#0D1117',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryBtn: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
