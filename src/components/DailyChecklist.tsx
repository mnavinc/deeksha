import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { DAILY_CHECKPOINTS } from '@/data/journeyCheckpoints';
import type { DailyCheckpointId } from '@/data/journeyCheckpoints';
import { CHECKPOINT_POINTS } from '@/data/achievements';
import { colors, spacing } from '@/theme/colors';
import { useI18n } from '@/i18n';
import { SacredIcon, type SacredIconName } from '@/components/SacredIcons';

const CHECKPOINT_SACRED_ICONS: Record<DailyCheckpointId, SacredIconName> = {
  prayer: 'flame',
  saranam: 'mala',
  vegetarian: 'bhojana',
  noAlcohol: 'lotus',
  noSmoking: 'sunrise',
  brahmacharyam: 'star',
  walking: 'footprints',
  eveningPrayer: 'temple',
};

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

function AnimatedChecklistRow({
  done,
  points,
  label,
  subLabel,
  iconName,
  onPress,
}: {
  done: boolean;
  points: number;
  label: string;
  subLabel?: string;
  iconName: SacredIconName;
  onPress: () => void;
}) {
  const rowScale = useSharedValue(1);

  const handlePress = () => {
    rowScale.value = withSequence(
      withTiming(0.96, { duration: 70 }),
      withSpring(1, { damping: 12, stiffness: 260 })
    );
    onPress();
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rowScale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[styles.row, done && styles.rowDone]}
        onPress={handlePress}
        activeOpacity={0.75}
      >
        <View style={[styles.iconBadge, done && styles.iconBadgeDone]}>
          {done ? (
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
          ) : (
            <SacredIcon name={iconName} size={20} color="#FFFBE6" accent="#F0B429" />
          )}
        </View>
        <View style={styles.textWrap}>
          <Text style={[styles.label, done && styles.labelDone]}>{label}</Text>
          {subLabel ? <Text style={styles.sub}>{subLabel}</Text> : null}
        </View>
        <Text style={[styles.points, done && styles.pointsDone]}>
          {done ? '✓ ' : ''}+{points}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export const DailyChecklist = React.memo(function DailyChecklist({
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
          <AnimatedChecklistRow
            key={item.id}
            done={done}
            points={points}
            label={label}
            subLabel={item.id === 'saranam' ? chantsLabel : undefined}
            iconName={CHECKPOINT_SACRED_ICONS[item.id]}
            onPress={() => (item.id === 'saranam' ? onSaranamPress() : onToggle(item.id))}
          />
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, padding: spacing.md,
    borderRadius: 12, borderWidth: 1, borderColor: colors.border, gap: spacing.sm,
  },
  rowDone: { borderColor: colors.success, backgroundColor: '#3FB95015' },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#1B4332',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0B42940',
  },
  iconBadgeDone: {
    backgroundColor: '#3FB95022',
    borderColor: colors.success,
  },
  textWrap: { flex: 1 },
  label: { color: colors.text, fontSize: 15, fontWeight: '500' },
  labelDone: { color: colors.success },
  sub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  points: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  pointsDone: { color: colors.success },
});
