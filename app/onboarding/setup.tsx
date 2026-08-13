import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/Button';
import { getDeekshaType, type DeekshaId } from '@/data/deekshaTypes';
import { getSwamiTier } from '@/data/swamiNames';
import { useAppStore } from '@/store/useAppStore';
import { format } from '@/engines/dateUtils';
import { colors, spacing } from '@/theme/colors';
import { useI18n } from '@/i18n';

export default function SetupScreen() {
  const { deekshaId } = useLocalSearchParams<{ deekshaId: DeekshaId }>();
  const profile = useAppStore((s) => s.profile);
  const startDeeksha = useAppStore((s) => s.startDeeksha);
  const setProfile = useAppStore((s) => s.setProfile);
  const { t } = useI18n();

  const deeksha = getDeekshaType(deekshaId ?? 'ayyappa');
  const [duration, setDuration] = useState(deeksha?.rules.durationOptions[0] ?? 41);
  const [pilgrimageCount, setPilgrimageCount] = useState(profile?.pilgrimageCount ?? 0);
  const [center, setCenter] = useState(deeksha?.pilgrimageCenters[0] ?? '');

  if (!deeksha) return null;

  const tier = getSwamiTier(Math.max(pilgrimageCount + 1, 1));
  const today = format(new Date(), 'yyyy-MM-dd');

  const handleStart = () => {
    startDeeksha({
      deekshaId: deeksha.id,
      pilgrimageCenter: center,
      malaDharanamDate: today,
      durationDays: duration,
      pilgrimageCount: pilgrimageCount + 1,
    });
    if (profile) {
      setProfile({ ...profile, onboardingComplete: true });
    }
    router.replace('/(tabs)');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('startDeeksha').replace('🙏', '')} — {deeksha.name}</Text>

      <Text style={styles.section}>{t('pilgrimageNumber')}</Text>
      <Text style={styles.hint}>
        {t('pilgrimageNumberHint').replace('{n}', String(pilgrimageCount + 1))} {tier.symbol} {tier.traditionalName}
      </Text>
      <View style={styles.row}>
        {[0, 1, 2, 5, 10, 17].map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.chip, pilgrimageCount === n && styles.chipActive]}
            onPress={() => setPilgrimageCount(n)}
          >
            <Text style={[styles.chipText, pilgrimageCount === n && styles.chipTextActive]}>
              {n === 0 ? t('kanni') : n + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {deeksha.rules.durationOptions.length > 0 && (
        <>
          <Text style={styles.section}>{t('duration')}</Text>
          <View style={styles.row}>
            {deeksha.rules.durationOptions.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.chip, duration === d && styles.chipActive]}
                onPress={() => setDuration(d)}
              >
                <Text style={[styles.chipText, duration === d && styles.chipTextActive]}>
                  {d} {t('days')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={styles.section}>{t('pilgrimageCenter')}</Text>
      <View style={styles.row}>
        {deeksha.pilgrimageCenters.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, center === c && styles.chipActive]}
            onPress={() => setCenter(c)}
          >
            <Text style={[styles.chipText, center === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>{t('malaDharanam')}</Text>
        <Text style={styles.summaryText}>
          {duration} {t('days')} · {center}
        </Text>
        {deeksha.rules.commonSaranam && (
          <Text style={styles.saranam}>{deeksha.rules.commonSaranam}</Text>
        )}
      </View>

      <Button title={t('startDeeksha')} onPress={handleStart} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 40 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: spacing.lg },
  section: { color: colors.text, fontSize: 16, fontWeight: '600', marginTop: spacing.md, marginBottom: spacing.sm },
  hint: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.sm, lineHeight: 18 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: '#F0B42920' },
  chipText: { color: colors.textMuted, fontSize: 13 },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
  summary: {
    backgroundColor: colors.surface, padding: spacing.lg, borderRadius: 16,
    borderWidth: 1.5, borderColor: colors.primary, marginVertical: spacing.lg,
  },
  summaryTitle: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  summaryText: { color: colors.textMuted, fontSize: 14, marginTop: spacing.xs },
  saranam: { color: colors.text, fontSize: 15, fontWeight: '600', marginTop: spacing.md, textAlign: 'center' },
});
