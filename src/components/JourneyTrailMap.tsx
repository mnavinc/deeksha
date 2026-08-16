import { useState, useMemo } from 'react';
import {
  StyleSheet, Text, View, Dimensions, TouchableOpacity,
  Modal, ScrollView, Platform,
} from 'react-native';
import Svg, {
  Circle, Path, Ellipse, G, Rect,
  Defs, RadialGradient, Stop, LinearGradient, Polygon,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { JourneyCheckpoint } from '@/data/journeyCheckpoints';
import { DEEKSHA_MAP_THEME } from '@/data/journeyCheckpoints';
import { colors as globalColors, spacing } from '@/theme/colors';
import { useI18n } from '@/i18n';

const { width: SCREEN_W } = Dimensions.get('window');
const MAP_W = Math.min(SCREEN_W - 32, 480);
const MAP_H = MAP_W * 1.6;

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

type Props = {
  checkpoints: JourneyCheckpoint[];
  currentDay: number;
  unlockedIds: string[];
  deekshaId?: string;
  onUnlockMilestone?: (id: string) => void;
};

export function JourneyTrailMap({ checkpoints, currentDay, unlockedIds, deekshaId = 'ayyappa', onUnlockMilestone }: Props) {
  const { language } = useI18n();
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<JourneyCheckpoint | null>(null);

  const theme = DEEKSHA_MAP_THEME[deekshaId] ?? DEEKSHA_MAP_THEME.ayyappa;
  const stops = useMemo(() => buildStops(checkpoints.length), [checkpoints.length]);
  const pathD = useMemo(() => buildSvgPath(stops, MAP_W, MAP_H), [stops]);

  const unlockedCount = checkpoints.filter(
    (c, i) => unlockedIds.includes(c.id) || (c.dayUnlock ?? Infinity) <= currentDay
  ).length;

  const progressStops = stops.slice(0, Math.max(1, unlockedCount));
  const progressD = progressStops.length > 1 ? buildSvgPath(progressStops, MAP_W, MAP_H) : '';

  const selectedUnlocked = selectedCheckpoint
    ? unlockedIds.includes(selectedCheckpoint.id) || (selectedCheckpoint.dayUnlock ?? Infinity) <= currentDay
    : false;

  return (
    <View style={[styles.frame, { width: MAP_W, height: MAP_H }]}>
      <Svg width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`}>
        <Defs>
          <LinearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.bg1} />
            <Stop offset="1" stopColor={theme.bg2} />
          </LinearGradient>
          <RadialGradient id="glowActive" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={theme.activeRoad} stopOpacity="0.9" />
            <Stop offset="1" stopColor={theme.activeRoad} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="glowFinish" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFD700" stopOpacity="1" />
            <Stop offset="1" stopColor="#FFD700" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Background */}
        <Rect width={MAP_W} height={MAP_H} fill="url(#bgGrad)" rx={20} />

        {/* Decorative terrain */}
        <Ellipse cx={MAP_W * 0.2} cy={MAP_H * 0.85} rx={MAP_W * 0.18} ry={MAP_H * 0.04} fill="#40916C" opacity={0.3} />
        <Ellipse cx={MAP_W * 0.8} cy={MAP_H * 0.55} rx={MAP_W * 0.12} ry={MAP_H * 0.06} fill="#40916C" opacity={0.25} />
        <Ellipse cx={MAP_W * 0.15} cy={MAP_H * 0.30} rx={MAP_W * 0.08} ry={MAP_H * 0.04} fill="#90E0EF" opacity={0.5} />
        <Ellipse cx={MAP_W * 0.75} cy={MAP_H * 0.25} rx={MAP_W * 0.06} ry={MAP_H * 0.03} fill="#90E0EF" opacity={0.4} />

        {/* Full trail road */}
        <Path d={pathD} fill="none" stroke={theme.roadColor} strokeWidth={24} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
        {/* Road dashes */}
        <Path d={pathD} fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeDasharray="8 14" opacity={0.4} />

        {/* Progress road (completed sections) */}
        {progressD ? (
          <Path d={progressD} fill="none" stroke={theme.activeRoad} strokeWidth={24} strokeLinecap="round" strokeLinejoin="round" opacity={0.95} />
        ) : null}

        {/* Checkpoint SVG circles */}
        {checkpoints.map((cp, index) => {
          const stop = stops[index];
          if (!stop) return null;
          const px = stop.x * MAP_W;
          const py = stop.y * MAP_H;
          const unlocked = unlockedIds.includes(cp.id) || (cp.dayUnlock ?? Infinity) <= currentDay;
          const isActive = index === Math.max(0, unlockedCount - 1);
          const isFinish = index === checkpoints.length - 1;
          const phaseColor = PHASE_COLORS[cp.phase] ?? PHASE_COLORS.vrutham;
          const r = isFinish ? 22 : isActive ? 18 : 14;

          return (
            <G key={cp.id}>
              {/* Glow for active / finish */}
              {(isActive || isFinish) && (
                <Circle
                  cx={px} cy={py} r={r + 14}
                  fill={isFinish ? 'url(#glowFinish)' : 'url(#glowActive)'}
                  opacity={0.5}
                />
              )}
              {/* Shadow */}
              <Circle cx={px + 2} cy={py + 3} r={r} fill="#000" opacity={0.2} />
              {/* Main node circle */}
              <Circle
                cx={px} cy={py} r={r}
                fill={unlocked ? phaseColor.fill : '#1E3A2E'}
                stroke={unlocked ? phaseColor.stroke : '#3A5C48'}
                strokeWidth={isActive ? 3.5 : 2}
              />
              {/* Star for finish */}
              {isFinish && unlocked && (
                <Polygon
                  points={`${px},${py - 10} ${px + 3},${py - 4} ${px + 10},${py - 4} ${px + 5},${py + 1} ${px + 7},${py + 8} ${px},${py + 4} ${px - 7},${py + 8} ${px - 5},${py + 1} ${px - 10},${py - 4} ${px - 3},${py - 4}`}
                  fill="#FFD700"
                  opacity={0.9}
                />
              )}
            </G>
          );
        })}
      </Svg>

      {/* Interactive node buttons + name labels overlay */}
      {checkpoints.map((cp, index) => {
        const stop = stops[index];
        if (!stop) return null;
        const unlocked = unlockedIds.includes(cp.id) || (cp.dayUnlock ?? Infinity) <= currentDay;
        const isFinish = index === checkpoints.length - 1;
        const px = stop.x * MAP_W;
        const py = stop.y * MAP_H;
        const label = language === 'te' ? cp.shortNameTe : cp.shortName;

        return (
          <View key={cp.id} style={{ position: 'absolute', left: px - 36, top: py - 18 }}>
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.nodeTouch}
              onPress={() => setSelectedCheckpoint(cp)}
              accessibilityLabel={`View ${cp.name}`}
            >
              <Text style={[styles.nodeIcon, isFinish && styles.finishIcon]}>
                {unlocked ? cp.icon : '🔒'}
              </Text>
            </TouchableOpacity>
            {/* Node name label */}
            <View style={[styles.nodeLabelBubble, isFinish && styles.finishLabelBubble]}>
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
                <Text style={styles.modalEmoji}>{selectedCheckpoint.icon}</Text>
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
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 20,
    overflow: 'hidden',
    alignSelf: 'center',
    position: 'relative',
    backgroundColor: '#1B4332',
  },
  nodeTouch: {
    width: 72,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeIcon: { fontSize: 18 },
  finishIcon: { fontSize: 24 },
  nodeLabelBubble: {
    backgroundColor: '#000000A0',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignSelf: 'center',
    maxWidth: 84,
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
