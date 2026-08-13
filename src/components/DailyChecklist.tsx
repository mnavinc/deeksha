import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DAILY_CHECKPOINTS } from '@/data/journeyCheckpoints';
import type { DailyCheckpointId } from '@/data/journeyCheckpoints';
import { CHECKPOINT_POINTS } from '@/data/achievements';
import { colors, spacing } from '@/theme/colors';
import { useI18n } from '@/i18n';

interface DailyChecklistProps {
  checkpoints: Record<DailyCheckpointId, boolean>;
  onToggle: (id: DailyCheckpointId) => void;
  saranamCount: number;
  onSaranamPress: () => void;
}

// Map checkpoint IDs to i18n keys
const CHECKPOINT_I18N_KEYS: Record<DailyCheckpointId, Parameters<ReturnType<typeof useI18n>['t']>[0]> = {
  prayer: 'morningPrayer',
  saranam: 'saranamChanting',
  vegetarian: 'vegetarianFood',
  noAlcohol: 'noAlcohol',
  noSmoking: 'noSmoking',
  brahmacharyam: 'brahmacharyam',
  walking: 'walkingExercise',
  eveningPrayer: 'eveningPrayer',
};

export function DailyChecklist({
  checkpoints,
  onToggle,
  saranamCount,
  onSaranamPress,
}: DailyChecklistProps) {
  const { t, language } = useI18n();
  const chantsLabel = language === 'te' ? `${saranamCount} జపాలు ఈరోజు` : `${saranamCount} chants today`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{language === 'te' ? 'ఈరోజు తపశ్చర్య' : "Today's Checkpoints"}</Text>
      {DAILY_CHECKPOINTS.map((item) => {
        const done = checkpoints[item.id];
        const points = CHECKPOINT_POINTS[item.id as keyof typeof CHECKPOINT_POINTS] ?? 0;
        const label = t(CHECKPOINT_I18N_KEYS[item.id]);
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.row, done && styles.rowDone]}
            onPress={() => (item.id === 'saranam' ? onSaranamPress() : onToggle(item.id))}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{done ? '✅' : item.icon}</Text>
            <View style={styles.textWrap}>
              <Text style={[styles.label, done && styles.labelDone]}>{label}</Text>
              {item.id === 'saranam' && (
                <Text style={styles.sub}>{chantsLabel}</Text>
              )}
            </View>
            <Text style={styles.points}>+{points}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, padding: spacing.md,
    borderRadius: 12, borderWidth: 1, borderColor: colors.border, gap: spacing.sm,
  },
  rowDone: { borderColor: colors.success, backgroundColor: '#3FB95015' },
  icon: { fontSize: 22 },
  textWrap: { flex: 1 },
  label: { color: colors.text, fontSize: 15, fontWeight: '500' },
  labelDone: { color: colors.success },
  sub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  points: { color: colors.primary, fontSize: 13, fontWeight: '700' },
});
