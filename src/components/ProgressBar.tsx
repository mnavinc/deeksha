import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, spacing } from '@/theme/colors';

interface ProgressBarProps {
  progress: number;
  label?: string;
  color?: string;
}

export function ProgressBar({ progress, label, color = colors.primary }: ProgressBarProps) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const pct = clamped * 100;

  const animPct = useSharedValue(pct);
  const shimmerX = useSharedValue(-60);

  useEffect(() => {
    animPct.value = withSpring(pct, { damping: 16, stiffness: 120 });
  }, [pct, animPct]);

  useEffect(() => {
    shimmerX.value = withRepeat(
      withTiming(260, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
      -1,
      false
    );
  }, [shimmerX]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${animPct.value}%`,
    backgroundColor: color,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]}>
          <Animated.View style={[styles.shimmer, shimmerStyle]} />
        </Animated.View>
      </View>
      <Text style={styles.pct}>{Math.round(pct)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { color: colors.textMuted, fontSize: 12 },
  track: {
    height: 10,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 5, overflow: 'hidden' },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 48,
    backgroundColor: 'rgba(255, 251, 230, 0.28)',
    borderRadius: 5,
  },
  pct: { color: colors.textMuted, fontSize: 11, textAlign: 'right' },
});
