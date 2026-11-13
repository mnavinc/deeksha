import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SacredIcon } from '@/components/SacredIcons';
import { useThemeColors, spacing } from '@/theme/colors';
import { getClayStyle } from '@/theme/claymorphism';
import { useAppStore } from '@/store/useAppStore';
import { useI18n } from '@/i18n';

interface InteractiveJapamalaProps {
  saranamCount: number;
  onChant: (count: number) => void;
  onMilestone?: () => void;
}

const TARGET_MALA = 108;
const RING_SIZE = 128;
const STROKE_W = 8;
const RADIUS = (RING_SIZE - STROKE_W) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const BEAD_COUNT = 18;

export const InteractiveJapamala = React.memo(function InteractiveJapamala({
  saranamCount,
  onChant,
  onMilestone,
}: InteractiveJapamalaProps) {
  const colors = useThemeColors();
  const { language } = useI18n();
  const theme = useAppStore((s) => s.theme);
  const activeTheme = theme === 'system' ? 'dark' : theme;
  const isTe = language === 'te';

  const buttonScale = useSharedValue(1);
  const rippleScale = useSharedValue(0.8);
  const rippleOpacity = useSharedValue(0);

  const cycleCount = saranamCount % TARGET_MALA;
  const completedMalas = Math.floor(saranamCount / TARGET_MALA);
  const progress = saranamCount > 0 && cycleCount === 0 ? 1 : cycleCount / TARGET_MALA;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  useEffect(() => {
    if (saranamCount > 0 && (saranamCount === 18 || saranamCount === 54 || saranamCount % 108 === 0)) {
      onMilestone?.();
    }
  }, [saranamCount, onMilestone]);

  const handleTap = (amount: number) => {
    buttonScale.value = withSequence(
      withTiming(0.91, { duration: 60, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 10, stiffness: 260 })
    );
    rippleScale.value = 0.85;
    rippleOpacity.value = 0.65;
    rippleScale.value = withTiming(1.45, { duration: 480, easing: Easing.out(Easing.cubic) });
    rippleOpacity.value = withTiming(0, { duration: 480 });
    onChant(amount);
  };

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const rippleAnimStyle = useAnimatedStyle(() => ({
    opacity: rippleOpacity.value,
    transform: [{ scale: rippleScale.value }],
  }));

  return (
    <View
      style={[
        styles.card,
        getClayStyle(activeTheme, 'medium'),
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>
            {isTe ? '📿 శరణు ఘోష జపమాల' : '📿 Interactive Japamala'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {isTe
              ? 'మధ్యలో నొక్కి శరణు మంత్రం జపించండి'
              : 'Tap the sacred lotus to count each Saranam'}
          </Text>
        </View>
        {completedMalas > 0 && (
          <View style={[styles.malaBadge, { backgroundColor: `${colors.primary}22`, borderColor: colors.primary }]}>
            <Text style={[styles.malaBadgeText, { color: colors.primary }]}>
              {completedMalas} {isTe ? 'మాల' : completedMalas === 1 ? 'Mala' : 'Malas'} ✓
            </Text>
          </View>
        )}
      </View>

      <View style={styles.bodyRow}>
        {/* Tactile 108-bead SVG Ring */}
        <View style={styles.ringContainer}>
          <Animated.View
            style={[
              styles.rippleRing,
              { borderColor: colors.primary },
              rippleAnimStyle,
            ]}
            pointerEvents="none"
          />
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={colors.surfaceElevated}
              strokeWidth={STROKE_W}
              fill="none"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={colors.primary}
              strokeWidth={STROKE_W}
              strokeLinecap="round"
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              fill="none"
            />
            {Array.from({ length: BEAD_COUNT }).map((_, i) => {
              const angle = ((i / BEAD_COUNT) * 360 - 90) * (Math.PI / 180);
              const bx = RING_SIZE / 2 + RADIUS * Math.cos(angle);
              const by = RING_SIZE / 2 + RADIUS * Math.sin(angle);
              const lit = i / BEAD_COUNT < progress;
              return (
                <Circle
                  key={i}
                  cx={bx}
                  cy={by}
                  r={lit ? 3.2 : 2.2}
                  fill={lit ? '#FFFBE6' : colors.border}
                />
              );
            })}
          </Svg>

          <Animated.View style={[styles.centerBtnWrap, buttonAnimStyle]}>
            <TouchableOpacity
              style={[
                styles.centerBtn,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.primary },
              ]}
              onPress={() => handleTap(1)}
              activeOpacity={0.85}
              accessibilityLabel="Chant one Swamiye Saranam Ayyappa"
            >
              <SacredIcon name="lotus" size={26} color="#FFFBE6" accent={colors.primary} />
              <Text style={[styles.countText, { color: colors.primary }]}>{saranamCount}</Text>
              <Text style={[styles.targetText, { color: colors.textDim }]}>/ {TARGET_MALA}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Right Controls & Milestone Chips */}
        <View style={styles.controlsCol}>
          <Text style={[styles.mantraText, { color: colors.primary }]}>
            {isTe ? 'స్వామియే శరణం అయ్యప్ప' : 'Swamiye Saranam Ayyappa'}
          </Text>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.quickBtn, { backgroundColor: colors.primary }]}
              onPress={() => handleTap(1)}
              activeOpacity={0.8}
            >
              <Text style={styles.quickBtnText}>+1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.quickBtnOutline,
                { borderColor: colors.primary, backgroundColor: `${colors.primary}18` },
              ]}
              onPress={() => handleTap(18)}
              activeOpacity={0.8}
            >
              <Text style={[styles.quickBtnOutlineText, { color: colors.primary }]}>+18</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.milestoneRow}>
            {[18, 54, 108].map((goal) => {
              const reached = saranamCount >= goal;
              return (
                <View
                  key={goal}
                  style={[
                    styles.goalChip,
                    {
                      borderColor: reached ? colors.success : colors.border,
                      backgroundColor: reached ? '#34D3991E' : colors.background,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: reached ? colors.success : colors.textDim }}>
                    {reached ? '✓ ' : ''}{goal}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { fontSize: 15, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
  malaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  malaBadgeText: { fontSize: 11, fontWeight: '800' },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rippleRing: {
    position: 'absolute',
    width: RING_SIZE - 16,
    height: RING_SIZE - 16,
    borderRadius: (RING_SIZE - 16) / 2,
    borderWidth: 2,
  },
  centerBtnWrap: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  centerBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontSize: 18, fontWeight: '900', lineHeight: 20, marginTop: 2 },
  targetText: { fontSize: 10, fontWeight: '600' },
  controlsCol: {
    flex: 1,
    gap: spacing.sm,
  },
  mantraText: {
    fontSize: 13,
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickBtnText: {
    color: '#0D1117',
    fontSize: 14,
    fontWeight: '900',
  },
  quickBtnOutline: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  quickBtnOutlineText: {
    fontSize: 14,
    fontWeight: '800',
  },
  milestoneRow: {
    flexDirection: 'row',
    gap: 6,
  },
  goalChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
});

