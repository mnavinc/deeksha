import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/Button';
import { APP_DISCLAIMER } from '@/engines/contentEngine';
import { colors, spacing } from '@/theme/colors';
import { useI18n } from '@/i18n';

export default function WelcomeScreen() {
  const { t } = useI18n();

  const features = [
    ['📿', t('feat1Title'), t('feat1Desc')],
    ['🎮', t('feat2Title'), t('feat2Desc')],
    ['👥', t('feat3Title'), t('feat3Desc')],
    ['💰', t('feat4Title'), t('feat4Desc')],
    ['🗺️', t('feat5Title'), t('feat5Desc')],
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.emoji}>🛕</Text>
      <Text style={styles.saranam}>Swamiye Saranam Ayyappa</Text>
      <Text style={styles.title}>{t('welcomeTitle')}</Text>
      <Text style={styles.body}>{t('welcomeBody')}</Text>
      <View style={styles.features}>
        {features.map(([icon, title, desc]) => (
          <View key={title as string} style={styles.feature}>
            <Text style={styles.featureIcon}>{icon}</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{title}</Text>
              <Text style={styles.featureDesc}>{desc}</Text>
            </View>
          </View>
        ))}
      </View>
      <Text style={styles.disclaimer}>{APP_DISCLAIMER}</Text>
      <Button title={t('beginJourney')} onPress={() => router.push('/onboarding/profile')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingTop: 60, paddingBottom: 40 },
  emoji: { fontSize: 64, textAlign: 'center', marginBottom: spacing.md },
  saranam: { color: colors.primary, textAlign: 'center', fontSize: 14, fontWeight: '500' },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', textAlign: 'center', marginTop: spacing.sm },
  body: { color: colors.textMuted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginVertical: spacing.lg },
  features: { gap: spacing.md, marginBottom: spacing.lg },
  feature: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  featureIcon: { fontSize: 28 },
  featureText: { flex: 1 },
  featureTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  featureDesc: { color: colors.textMuted, fontSize: 12, marginTop: 2, lineHeight: 17 },
  disclaimer: { color: colors.textDim, fontSize: 11, lineHeight: 16, marginBottom: spacing.lg },
});
