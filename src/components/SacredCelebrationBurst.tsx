import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

interface ParticleSpec {
  angle: number;
  distance: number;
  size: number;
  color: string;
  delay: number;
}

const PARTICLES: ParticleSpec[] = [
  { angle: 0, distance: 78, size: 8, color: '#F0B429', delay: 0 },
  { angle: 30, distance: 92, size: 6, color: '#34D399', delay: 20 },
  { angle: 60, distance: 74, size: 9, color: '#FFFBE6', delay: 10 },
  { angle: 90, distance: 88, size: 7, color: '#F97316', delay: 30 },
  { angle: 120, distance: 76, size: 8, color: '#F0B429', delay: 0 },
  { angle: 150, distance: 94, size: 6, color: '#A78BFA', delay: 25 },
  { angle: 180, distance: 80, size: 9, color: '#34D399', delay: 15 },
  { angle: 210, distance: 90, size: 7, color: '#F0B429', delay: 35 },
  { angle: 240, distance: 72, size: 8, color: '#FFFBE6', delay: 5 },
  { angle: 270, distance: 86, size: 7, color: '#F97316', delay: 20 },
  { angle: 300, distance: 78, size: 8, color: '#34D399', delay: 10 },
  { angle: 330, distance: 92, size: 6, color: '#F0B429', delay: 30 },
];

function BurstParticle({ spec, triggerKey }: { spec: ParticleSpec; triggerKey: number }) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (triggerKey <= 0) return;
    progress.value = 0;
    opacity.value = 1;
    progress.value = withDelay(
      spec.delay,
      withTiming(1, { duration: 680, easing: Easing.out(Easing.cubic) })
    );
    opacity.value = withDelay(
      spec.delay + 260,
      withTiming(0, { duration: 420, easing: Easing.in(Easing.quad) })
    );
  }, [triggerKey, spec.delay, progress, opacity]);

  const rad = (spec.angle * Math.PI) / 180;
  const dx = Math.cos(rad) * spec.distance;
  const dy = Math.sin(rad) * spec.distance;

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: progress.value * dx },
      { translateY: progress.value * dy },
      { scale: 1 - progress.value * 0.45 },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
          backgroundColor: spec.color,
        },
        animStyle,
      ]}
    />
  );
}

interface SacredCelebrationBurstProps {
  triggerKey: number;
}

export const SacredCelebrationBurst = React.memo(function SacredCelebrationBurst({
  triggerKey,
}: SacredCelebrationBurstProps) {
  if (triggerKey <= 0) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <View style={styles.center}>
        {PARTICLES.map((spec, idx) => (
          <BurstParticle key={idx} spec={spec} triggerKey={triggerKey} />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  center: {
    width: 1,
    height: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
  },
});
