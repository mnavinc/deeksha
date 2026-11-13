import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet, Text, View, useWindowDimensions, TouchableOpacity,
  Modal, ScrollView, Platform,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAppStore } from '@/store/useAppStore';
import Svg, {
  Circle, Path, Ellipse, G, Rect,
  Defs, RadialGradient, Stop, LinearGradient, Polygon,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { JourneyCheckpoint } from '@/data/journeyCheckpoints';
import { DEEKSHA_MAP_THEME } from '@/data/journeyCheckpoints';
import { spacing } from '@/theme/colors';
import { useI18n } from '@/i18n';
import { SacredIcon, SacredSvgGlyph, getCheckpointIconName } from '@/components/SacredIcons';

/** Build normalized path stops for N checkpoints — winding S-curve bottom to top */
function buildStops(n: number): Array<{ x: number; y: number }> {
  if (n === 0) return [];
  if (n === 1) return [{ x: 0.5, y: 0.9 }];

  // Distribute along a winding S-path
  const stops: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1); // 0 → 1 (bottom → top)
    const y = 0.92 - t * 0.86; // y: 0.92 → 0.06

    // Sinusoidal x winding
    const wave = Math.sin(t * Math.PI * 2.5);
    const x = 0.5 + wave * 0.30;

    stops.push({ x: Math.max(0.1, Math.min(0.9, x)), y });
  }
  return stops;
}

function buildSvgPath(stops: Array<{ x: number; y: number }>, w: number, h: number): string {
  if (stops.length < 2) return '';
  const pts = stops.map((s) => ({ x: s.x * w, y: s.y * h }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const cp1x = prev.x + (cur.x - prev.x) * 0.5;
    const cp2x = prev.x + (cur.x - prev.x) * 0.5;
    d += ` C ${cp1x} ${prev.y}, ${cp2x} ${cur.y}, ${cur.x} ${cur.y}`;
  }
  return d;
}

// Phase color mapping
const PHASE_COLORS = {
  vrutham:     { fill: '#F0B429', stroke: '#FFFBE6' },
  preparation: { fill: '#F97316', stroke: '#FEF3C7' },
  pilgrimage:  { fill: '#34D399', stroke: '#D1FAE5' },
  completion:  { fill: '#A78BFA', stroke: '#EDE9FE' },
};

const FIREFLIES = [
  { x: 0.16, y: 0.78, delay: 0, size: 5 },
  { x: 0.78, y: 0.70, delay: 400, size: 4 },
  { x: 0.25, y: 0.56, delay: 800, size: 5 },
  { x: 0.74, y: 0.44, delay: 200, size: 4 },
  { x: 0.22, y: 0.28, delay: 650, size: 5 },
  { x: 0.68, y: 0.16, delay: 300, size: 6 },
];

function JungleFirefly({ x, y, delay, size }: { x: number; y: number; delay: number; size: number }) {
  const driftY = useSharedValue(0);
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    driftY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-12, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.9, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.2, { duration: 1800, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    );
  }, [delay, driftY, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: driftY.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: `${x * 100}%`,
          top: `${y * 100}%`,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#FDE68A',
        },
        animStyle,
      ]}
    />
  );
}

type Props = {
  checkpoints: JourneyCheckpoint[];
  currentDay: number;
  unlockedIds: string[];
  deekshaId?: string;
  onUnlockMilestone?: (id: string) => void;
};

export const JourneyTrailMap = React.memo(function JourneyTrailMap({
  checkpoints,
  currentDay,
  unlockedIds,
  deekshaId = 'ayyappa',
  onUnlockMilestone,
}: Props) {
  const { language } = useI18n();
  const reduceMotion = useAppStore((s) => s.reduceMotion);
  const { width: screenW } = useWindowDimensions();
  const mapW = Math.max(280, Math.min(screenW - 32, 520));
  const mapH = Math.round(mapW * 1.62);

  const [selectedCheckpoint, setSelectedCheckpoint] = useState<JourneyCheckpoint | null>(null);

  const theme = DEEKSHA_MAP_THEME[deekshaId] ?? DEEKSHA_MAP_THEME.ayyappa;
  const stops = useMemo(() => buildStops(checkpoints.length), [checkpoints.length]);
  const pathD = useMemo(() => buildSvgPath(stops, mapW, mapH), [stops, mapW, mapH]);

  const unlockedSet = useMemo(() => new Set(unlockedIds), [unlockedIds]);

  const unlockedCount = useMemo(
    () =>
      checkpoints.filter(
        (c) => unlockedSet.has(c.id) || (c.dayUnlock ?? Infinity) <= currentDay
      ).length,
    [checkpoints, unlockedSet, currentDay]
  );

  const progressStops = useMemo(
    () => stops.slice(0, Math.max(1, unlockedCount)),
    [stops, unlockedCount]
  );
  const progressD = useMemo(
    () => (progressStops.length > 1 ? buildSvgPath(progressStops, mapW, mapH) : ''),
    [progressStops, mapW, mapH]
  );

  const selectedUnlocked = selectedCheckpoint
    ? unlockedSet.has(selectedCheckpoint.id) || (selectedCheckpoint.dayUnlock ?? Infinity) <= currentDay
    : false;

  const beaconScale = useSharedValue(1);
  const beaconOpacity = useSharedValue(0.75);

  useEffect(() => {
    beaconScale.value = withRepeat(
      withSequence(
        withTiming(1.55, { duration: 1500, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 0 })
      ),
      -1,
      false
    );
    beaconOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1500, easing: Easing.out(Easing.quad) }),
        withTiming(0.75, { duration: 0 })
      ),
      -1,
      false
    );
  }, [beaconScale, beaconOpacity]);

  const beaconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: beaconScale.value }],
    opacity: beaconOpacity.value,
  }));

  return (
    <View style={[styles.frame, { width: mapW, height: mapH }]}>
      <Svg width={mapW} height={mapH} viewBox={`0 0 ${mapW} ${mapH}`}>
        <Defs>
          <LinearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.bg1} />
            <Stop offset="0.55" stopColor={theme.bg2} />
            <Stop offset="1" stopColor="#091C14" />
          </LinearGradient>
          <LinearGradient id="ridgeGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#2D6A4F" stopOpacity="0.45" />
            <Stop offset="1" stopColor="#0D2B1E" stopOpacity="0.1" />
          </LinearGradient>
          <LinearGradient id="riverGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#48CAE4" stopOpacity="0.35" />
            <Stop offset="0.5" stopColor="#90E0EF" stopOpacity="0.55" />
            <Stop offset="1" stopColor="#48CAE4" stopOpacity="0.25" />
          </LinearGradient>
          <RadialGradient id="glowActive" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={theme.activeRoad} stopOpacity="0.95" />
            <Stop offset="1" stopColor={theme.activeRoad} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="glowFinish" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFD700" stopOpacity="1" />
            <Stop offset="1" stopColor="#FFD700" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Background */}
        <Rect width={mapW} height={mapH} fill="url(#bgGrad)" rx={20} />

        {/* Subtle Sacred Summit Sunburst / Makara Jyothi Glow */}
        <Circle cx={mapW * 0.5} cy={mapH * 0.08} r={mapW * 0.34} fill="url(#glowFinish)" opacity={0.18} />

        {/* Layered Western Ghats / Sabarimala Mountain Silhouettes */}
        <Polygon
          points={`0,${mapH * 0.28} ${mapW * 0.22},${mapH * 0.14} ${mapW * 0.48},${mapH * 0.24} ${mapW * 0.78},${mapH * 0.11} ${mapW},${mapH * 0.26} ${mapW},${mapH * 0.38} 0,${mapH * 0.38}`}
          fill="url(#ridgeGrad)"
        />
        <Polygon
          points={`0,${mapH * 0.54} ${mapW * 0.3},${mapH * 0.43} ${mapW * 0.65},${mapH * 0.51} ${mapW},${mapH * 0.41} ${mapW},${mapH * 0.64} 0,${mapH * 0.64}`}
          fill="#1B4332"
          opacity={0.35}
        />

        {/* Pampa River Ribbon */}
        <Path
          d={`M -10 ${mapH * 0.36} Q ${mapW * 0.35} ${mapH * 0.31}, ${mapW * 0.6} ${mapH * 0.37} T ${mapW + 10} ${mapH * 0.33}`}
          fill="none"
          stroke="url(#riverGrad)"
          strokeWidth={14}
          strokeLinecap="round"
        />

        {/* Forest Canopy Clusters & Jungle Trail Trees */}
        <Ellipse cx={mapW * 0.18} cy={mapH * 0.85} rx={mapW * 0.16} ry={mapH * 0.035} fill="#40916C" opacity={0.28} />
        <Ellipse cx={mapW * 0.82} cy={mapH * 0.68} rx={mapW * 0.14} ry={mapH * 0.04} fill="#40916C" opacity={0.24} />
        {[
          { x: 0.10, y: 0.72 },
          { x: 0.88, y: 0.56 },
          { x: 0.14, y: 0.44 },
          { x: 0.84, y: 0.26 },
        ].map((tree, idx) => (
          <Polygon
            key={`tree-${idx}`}
            points={`${mapW * tree.x},${mapH * (tree.y - 0.035)} ${mapW * (tree.x - 0.035)},${mapH * tree.y} ${mapW * (tree.x + 0.035)},${mapH * tree.y}`}
            fill="#2D6A4F"
            opacity={0.55}
          />
        ))}
        {/* 18 Sacred Steps (Pathinettam Padi) Summit Accent */}
        <Rect x={mapW * 0.44} y={mapH * 0.035} width={mapW * 0.12} height={4} rx={2} fill="#F0B429" opacity={0.75} />
        <Rect x={mapW * 0.455} y={mapH * 0.025} width={mapW * 0.09} height={3} rx={1.5} fill="#FFFBE6" opacity={0.65} />
        <Ellipse cx={mapW * 0.16} cy={mapH * 0.52} rx={mapW * 0.11} ry={mapH * 0.03} fill="#52B788" opacity={0.2} />

        {/* Trail Outer Shadow */}
        <Path d={pathD} fill="none" stroke="#000000" strokeWidth={28} strokeLinecap="round" strokeLinejoin="round" opacity={0.28} />
        {/* Full Trail Base Road */}
        <Path d={pathD} fill="none" stroke={theme.roadColor} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
        {/* Road Center Dashes */}
        <Path d={pathD} fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeDasharray="7 12" opacity={0.35} />

        {/* Progress Road (Completed Sections) */}
        {progressD ? (
          <>
            <Path d={progressD} fill="none" stroke={theme.activeRoad} strokeWidth={24} strokeLinecap="round" strokeLinejoin="round" opacity={0.35} />
            <Path d={progressD} fill="none" stroke={theme.activeRoad} strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" opacity={0.95} />
            <Path d={progressD} fill="none" stroke="#FFFBE6" strokeWidth={2} strokeLinecap="round" strokeDasharray="6 10" opacity={0.65} />
          </>
        ) : null}

        {/* Finely Rendered SVG Checkpoint Nodes & Vector Icons */}
        {checkpoints.map((cp, index) => {
          const stop = stops[index];
          if (!stop) return null;
          const px = stop.x * mapW;
          const py = stop.y * mapH;
          const unlocked = unlockedSet.has(cp.id) || (cp.dayUnlock ?? Infinity) <= currentDay;
          const isActive = index === Math.max(0, unlockedCount - 1);
          const isFinish = index === checkpoints.length - 1;
          const phaseColor = PHASE_COLORS[cp.phase] ?? PHASE_COLORS.vrutham;
          const r = isFinish ? 23 : isActive ? 19 : 15;
          const iconName = unlocked ? getCheckpointIconName(cp.id) : 'lock';
          const iconScale = isFinish ? 0.95 : isActive ? 0.8 : 0.65;
          const glyphOffset = 12 * iconScale;

          return (
            <G key={cp.id}>
              {/* Outer Halo for Active / Finish */}
              {(isActive || isFinish) && (
                <Circle
                  cx={px} cy={py} r={r + 14}
                  fill={isFinish ? 'url(#glowFinish)' : 'url(#glowActive)'}
                  opacity={0.55}
                />
              )}
              {/* Drop Shadow */}
              <Circle cx={px + 1.5} cy={py + 3} r={r} fill="#000" opacity={0.35} />
              {/* Outer Ring */}
              <Circle
                cx={px} cy={py} r={r}
                fill={unlocked ? '#0F241B' : '#162820'}
                stroke={unlocked ? phaseColor.fill : '#3A5C48'}
                strokeWidth={isActive ? 3.5 : 2.2}
              />
              {/* Inner Disc */}
              <Circle
                cx={px} cy={py} r={r - 3}
                fill={unlocked ? `${phaseColor.fill}28` : '#0D1B14'}
              />
              {/* Crisp Vector Glyph */}
              <G transform={`translate(${px - glyphOffset}, ${py - glyphOffset}) scale(${iconScale})`}>
                <SacredSvgGlyph
                  name={iconName}
                  color={unlocked ? '#FFFBE6' : '#6E8F7B'}
                  accent={unlocked ? phaseColor.fill : '#4A6B57'}
                />
              </G>
            </G>
          );
        })}
      </Svg>

      {/* Drifting Forest Fireflies */}
      {!reduceMotion &&
        FIREFLIES.map((f, idx) => (
          <JungleFirefly key={idx} x={f.x} y={f.y} delay={f.delay} size={f.size} />
        ))}

      {/* Interactive node touch targets + crisp bilingual name labels */}
      {checkpoints.map((cp, index) => {
        const stop = stops[index];
        if (!stop) return null;
        const unlocked = unlockedSet.has(cp.id) || (cp.dayUnlock ?? Infinity) <= currentDay;
        const isFinish = index === checkpoints.length - 1;
        const px = stop.x * mapW;
        const py = stop.y * mapH;
        const isActive = index === unlockedCount - 1;
        const label = language === 'te' ? cp.shortNameTe : cp.shortName;

        return (
          <View key={cp.id} style={{ position: 'absolute', left: px - 40, top: py - 22, width: 80, alignItems: 'center' }}>
            {isActive && (
              <Animated.View
                pointerEvents="none"
                style={[
                  {
                    position: 'absolute',
                    top: -2,
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    borderWidth: 2,
                    borderColor: '#34D399',
                  },
                  beaconStyle,
                ]}
              />
            )}
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.nodeTouch}
              onPress={() => setSelectedCheckpoint(cp)}
              accessibilityLabel={`View ${cp.name}`}
            />
            {/* Node name label */}
            <View style={[styles.nodeLabelBubble, isFinish && styles.finishLabelBubble, !unlocked && styles.lockedLabelBubble]}>
              <Text style={[styles.nodeLabelText, isFinish && styles.finishLabelText]} numberOfLines={1}>
                {label}
              </Text>
            </View>
          </View>
        );
      })}

      {/* Map legend */}
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: theme.activeRoad }]} />
          <Text style={styles.legendText}>{unlockedCount}/{checkpoints.length}</Text>
        </View>
        <View style={styles.legendRow}>
          <Text style={styles.legendTextSmall}>
            {language === 'te' ? 'పై నొక్కి వివరాలు చూడండి' : 'Tap node for details'}
          </Text>
        </View>
      </View>

      {/* Milestone Detail Modal */}
      <Modal
        visible={!!selectedCheckpoint}
        transparent
        animationType="slide"
        accessibilityViewIsModal
        onRequestClose={() => setSelectedCheckpoint(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={() => setSelectedCheckpoint(null)} />
          {selectedCheckpoint && (
            <View style={styles.modalCard}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <SacredIcon
                  name={selectedUnlocked ? getCheckpointIconName(selectedCheckpoint.id) : 'lock'}
                  size={44}
                  withBadge
                  accent={selectedUnlocked ? '#F0B429' : '#6E8F7B'}
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.modalTitle}>
                    {language === 'te' ? selectedCheckpoint.titleTe : selectedCheckpoint.name}
                  </Text>
                  <Text style={styles.modalSubTitle}>{selectedCheckpoint.description}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedCheckpoint(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={26} color="#8B949E" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Unlock Status */}
                <View style={[styles.statusBadge, selectedUnlocked ? styles.unlockedBadge : styles.lockedBadge]}>
                  <Ionicons
                    name={selectedUnlocked ? 'checkmark-circle' : 'lock-closed'}
                    size={15}
                    color={selectedUnlocked ? '#34D399' : '#F0B429'}
                  />
                  <Text style={[styles.statusText, { color: selectedUnlocked ? '#34D399' : '#F0B429' }]}>
                    {selectedUnlocked
                      ? (language === 'te' ? '✓ అన్‌లాక్ అయింది (Unlocked)' : '✓ Milestone Unlocked')
                      : (language === 'te'
                          ? `🔒 రోజు ${selectedCheckpoint.dayUnlock ?? '—'} న అన్‌లాక్ అవుతుంది`
                          : `🔒 Unlocks on Day ${selectedCheckpoint.dayUnlock ?? '—'}`)}
                  </Text>
                </View>

                {/* Phase pill */}
                <View style={styles.phasePill}>
                  <Text style={styles.phaseText}>
                    {selectedCheckpoint.phase.toUpperCase()} · {selectedCheckpoint.category}
                  </Text>
                </View>

                {/* Ritual Guide */}
                {selectedCheckpoint.ritualGuideTe && (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxTitle}>📜 {language === 'te' ? 'పూజా మార్గదర్శకం' : 'Ritual Guide'}</Text>
                    <Text style={styles.infoBoxBody}>{selectedCheckpoint.ritualGuideTe}</Text>
                  </View>
                )}

                {/* Guru Advice */}
                {selectedCheckpoint.guruAdviceTe && (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxTitle}>🕉️ {language === 'te' ? 'గురు స్వామి ఆదేశం' : 'Guru Swamy Advice'}</Text>
                    <Text style={styles.infoBoxBody}>{selectedCheckpoint.guruAdviceTe}</Text>
                  </View>
                )}
              </ScrollView>

              {/* Action buttons */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={() => { setSelectedCheckpoint(null); router.push('/(tabs)/vidhanam' as any); }}
                >
                  <Ionicons name="musical-notes-outline" size={17} color="#F0B429" />
                  <Text style={styles.btnSecondaryText}>
                    {language === 'te' ? 'మంత్రాలు & పాటలు' : 'Mantras & Songs'}
                  </Text>
                </TouchableOpacity>
                {!selectedUnlocked && onUnlockMilestone && (
                  <TouchableOpacity
                    style={styles.btnPrimary}
                    onPress={() => { onUnlockMilestone(selectedCheckpoint.id); setSelectedCheckpoint(null); }}
                  >
                    <Ionicons name="key-outline" size={17} color="#0D1117" />
                    <Text style={styles.btnPrimaryText}>
                      {language === 'te' ? 'అన్‌లాక్ చేయి' : 'Unlock Now'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  frame: {
    borderRadius: 20,
    overflow: 'hidden',
    alignSelf: 'center',
    position: 'relative',
    backgroundColor: '#1B4332',
  },
  nodeTouch: {
    width: 48,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeLabelBubble: {
    backgroundColor: '#091610D8',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'center',
    maxWidth: 84,
    borderWidth: 0.5,
    borderColor: '#FFFFFF22',
  },
  lockedLabelBubble: {
    backgroundColor: '#0D1B14B8',
  },
  finishLabelBubble: {
    backgroundColor: '#D4AF37CC',
  },
  nodeLabelText: {
    color: '#FFFBE6',
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
  finishLabelText: {
    color: '#0D1117',
    fontSize: 9,
  },
  legend: {
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: '#0D2B1ECC',
    borderRadius: 10,
    padding: 8,
    gap: 3,
    zIndex: 20,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#D8F3DC', fontSize: 11, fontWeight: '700' },
  legendTextSmall: { color: '#A0B8A8', fontSize: 8, fontStyle: 'italic' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000A8',
    justifyContent: 'flex-end',
  },
  modalDismiss: { flex: 1 },
  modalCard: {
    backgroundColor: '#161B22',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#30363D',
    padding: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 32 : spacing.md,
    maxHeight: '78%',
    gap: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#30363D',
    paddingBottom: 12,
  },
  modalEmoji: { fontSize: 38 },
  modalTitle: { color: '#F0F6FC', fontSize: 17, fontWeight: '800' },
  modalSubTitle: { color: '#8B949E', fontSize: 12, lineHeight: 17 },
  modalBody: { gap: 10, paddingVertical: 4 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  unlockedBadge: { backgroundColor: '#34D39912', borderColor: '#34D399' },
  lockedBadge: { backgroundColor: '#F0B42912', borderColor: '#F0B429' },
  statusText: { fontSize: 12, fontWeight: '700', flex: 1 },
  phasePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#30363D',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  phaseText: { color: '#8B949E', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  infoBox: {
    backgroundColor: '#0D1117',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#30363D',
    gap: 6,
  },
  infoBoxTitle: { color: '#F0B429', fontSize: 12, fontWeight: '700' },
  infoBoxBody: { color: '#C9D1D9', fontSize: 13, lineHeight: 20 },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#30363D',
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0B429',
  },
  btnSecondaryText: { color: '#F0B429', fontWeight: '700', fontSize: 13 },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F0B429',
  },
  btnPrimaryText: { color: '#0D1117', fontWeight: '800', fontSize: 13 },
});
