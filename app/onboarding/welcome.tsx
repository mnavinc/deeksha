import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/Button';
import { APP_DISCLAIMER } from '@/engines/contentEngine';
import { colors, spacing } from '@/theme/colors';

export default function WelcomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.emoji}>🛕</Text>
      <Text style={styles.saranam}>Swamiye Saranam Ayyappa</Text>
      <Text style={styles.title}>Welcome, Swami</Text>
      <Text style={styles.body}>
        Your digital companion for Deeksha, spiritual journeys and pilgrimage — combining daily
        discipline, gamified journeys, community coordination, expenses and temple discovery.
      </Text>
      <View style={styles.features}>
        {[
          ['📿', 'Multi-Deeksha Support', 'Ayyappa, Bhavani, Govinda, Shiva, Hanuman & more'],
          ['🎮', 'Gamified Journey', 'Points, achievements, Swami tiers & pilgrimage path'],
          ['👥', 'Group Coordination', 'Guru Swamy groups, announcements & shared progress'],
          ['💰', 'Expense Tracking', 'Splitwise-style group expenses & settlements'],
          ['🗺️', 'Temple Discovery', 'Nearby temples, maps & pilgrimage planning'],
        ].map(([icon, title, desc]) => (
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
      <Button title="Begin Your Journey" onPress={() => router.push('/onboarding/profile')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingTop: 60, paddingBottom: 40 },
  emoji: { fontSize: 64, textAlign: 'center', marginBottom: spacing.md },
  saranam: { color: colors.primary, textAlign: 'center', fontSize: 14 },
  title: { color: colors.text, fontSize: 28, fontWeight: '700', textAlign: 'center', marginTop: spacing.sm },
  body: { color: colors.textMuted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginVertical: spacing.lg },
  features: { gap: spacing.md, marginBottom: spacing.lg },
  feature: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  featureIcon: { fontSize: 28 },
  featureText: { flex: 1 },
  featureTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  featureDesc: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  disclaimer: { color: colors.textDim, fontSize: 11, lineHeight: 16, marginBottom: spacing.lg },
});
