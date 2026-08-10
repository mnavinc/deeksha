import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { DEEKSHA_TYPES, type DeekshaId } from '@/data/deekshaTypes';
import { MULTI_DEEKSHA_WARNING } from '@/engines/contentEngine';
import { colors, spacing } from '@/theme/colors';

const DEeksha_ICONS: Record<DeekshaId, string> = {
  ayyappa: '🛕',
  bhavani: '🔴',
  govinda: '💛',
  shiva: '🔱',
  hanuman: '🙏',
  nookambika: '🌸',
};

export default function DeekshaSelectScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Which Deeksha are you observing?</Text>
      <Text style={styles.subtitle}>{MULTI_DEEKSHA_WARNING}</Text>
      <View style={styles.list}>
        {DEEKSHA_TYPES.map((d) => (
          <TouchableOpacity
            key={d.id}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: '/onboarding/setup',
                params: { deekshaId: d.id },
              })
            }
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{DEeksha_ICONS[d.id]}</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{d.name}</Text>
              <Text style={styles.cardDeity}>{d.deity}</Text>
              <Text style={styles.cardMeta}>
                {d.rules.durationOptions.length > 0
                  ? `${d.rules.durationOptions.join(' / ')} days`
                  : 'Confirm with temple'}
                {d.rules.specialDestination ? ` · ${d.rules.specialDestination}` : ''}
              </Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 40 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: spacing.sm },
  subtitle: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginBottom: spacing.lg },
  list: { gap: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  icon: { fontSize: 32 },
  cardContent: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  cardDeity: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  cardMeta: { color: colors.primary, fontSize: 12, marginTop: 4 },
  arrow: { color: colors.textMuted, fontSize: 24 },
});
