import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { getAvatarStage } from '@/data/achievements';
import { getSwamiTier } from '@/data/swamiNames';
import { colors, spacing } from '@/theme/colors';
import { SacredIcon } from '@/components/SacredIcons';

interface AvatarDisplayProps {
  points: number;
  pilgrimageCount: number;
  name: string;
}

const RING_SIZE = 74;
const RING_RADIUS = 33;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export const AvatarDisplay = React.memo(function AvatarDisplay({
  points,
  pilgrimageCount,
  name,
}: AvatarDisplayProps) {
  const stage = getAvatarStage(points);
  const tier = getSwamiTier(Math.max(pilgrimageCount, 1));
  const iconName = points >= 1000 ? 'temple' : points >= 500 ? 'flame' : points >= 200 ? 'lotus' : 'mala';

  // Progress within current 250-pt milestone band toward next aura tier
  const nextGoal = points >= 1000 ? 1500 : points >= 500 ? 1000 : points >= 200 ? 500 : 200;
  const prevGoal = points >= 1000 ? 1000 : points >= 500 ? 500 : points >= 200 ? 200 : 0;
  const bandProgress = Math.min(1, Math.max(0.08, (points - prevGoal) / (nextGoal - prevGoal)));
  const dashOffset = RING_CIRCUMFERENCE * (1 - bandProgress);

  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.45);

  useEffect(() => {
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.07, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: 1600, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.35, { duration: 1600, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [glowScale, glowOpacity]);

  const auraStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.ringWrap}>
        <Animated.View style={[styles.auraRing, auraStyle]} pointerEvents="none" />
        <Svg width={RING_SIZE} height={RING_SIZE} style={styles.svgRing}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={colors.surfaceElevated}
            strokeWidth={4}
            fill="none"
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={colors.primary}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            fill="none"
          />
        </Svg>
        <View style={styles.avatarCircle}>
          <SacredIcon name={iconName} size={32} color="#FFFBE6" accent="#F0B429" />
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>Swami {name}</Text>
        <Text style={styles.tier}>
          {tier.symbol} {tier.traditionalName}
        </Text>
        <Text style={styles.stage}>
          {stage.label} · {points} / {nextGoal} XP
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auraRing: {
    position: 'absolute',
    width: RING_SIZE + 4,
    height: RING_SIZE + 4,
    borderRadius: (RING_SIZE + 4) / 2,
    borderWidth: 2,
    borderColor: '#F0B42955',
    backgroundColor: '#F0B42914',
  },
  svgRing: {
    position: 'absolute',
  },
  avatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { color: colors.text, fontSize: 18, fontWeight: '700' },
  tier: { color: colors.primary, fontSize: 14, marginTop: 2 },
  stage: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
});
