import { useState } from 'react';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native';
import Svg, { Circle, Path, Ellipse, G, Rect, Defs, RadialGradient, Stop, LinearGradient } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { JourneyCheckpoint } from '@/data/journeyCheckpoints';
import { colors, spacing } from '@/theme/colors';
import { useI18n } from '@/i18n';

const { width: SCREEN_W } = Dimensions.get('window');
const MAP_W = Math.min(SCREEN_W - 32, 480);
const MAP_H = MAP_W * 1.5;

const PATH_STOPS = [
  { x: 0.13, y: 0.92 }, // 0 — Mala Dharanam
  { x: 0.38, y: 0.84 }, // 1 — Day 1
  { x: 0.62, y: 0.88 }, // 2 — Day 10
  { x: 0.78, y: 0.76 }, // 3 — Day 21
  { x: 0.55, y: 0.66 }, // 4 — Day 30
  { x: 0.28, y: 0.60 }, // 5 — Day 41
  { x: 0.18, y: 0.48 }, // 6 — Kettunirakkal
  { x: 0.38, y: 0.38 }, // 7 — Erumeli
  { x: 0.62, y: 0.44 }, // 8 — Pampa
  { x: 0.75, y: 0.30 }, // 9 — Neelimala
  { x: 0.55, y: 0.18 }, // 10 — Saramkuthi
  { x: 0.32, y: 0.14 }, // 11 — 18 Steps
  { x: 0.18, y: 0.24 }, // 12 — Darshan
  { x: 0.38, y: 0.10 }, // 13 — Neyyabhishekam
  { x: 0.62, y: 0.06 }, // 14 — Mala Visarjanam
];

function buildPath(stops: typeof PATH_STOPS, w: number, h: number): string {
  const pts = stops.map((s) => ({ x: s.x * w, y: s.y * h }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const cp1x = prev.x + (cur.x - prev.x) * 0.5;
    const cp1y = prev.y;
    const cp2x = prev.x + (cur.x - prev.x) * 0.5;
    const cp2y = cur.y;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${cur.x} ${cur.y}`;
  }
  return d;
}

const TREES = [
  { x: 0.06, y: 0.72 }, { x: 0.88, y: 0.56 }, { x: 0.12, y: 0.34 },
  { x: 0.82, y: 0.12 }, { x: 0.46, y: 0.52 }, { x: 0.68, y: 0.68 },
  { x: 0.22, y: 0.78 }, { x: 0.90, y: 0.90 },
];
const BUSHES = [
  { x: 0.50, y: 0.78 }, { x: 0.25, y: 0.40 }, { x: 0.70, y: 0.22 },
  { x: 0.08, y: 0.58 }, { x: 0.85, y: 0.38 }, { x: 0.42, y: 0.28 },
];
const PONDS = [
  { x: 0.45, y: 0.72, rx: 0.09, ry: 0.04 },
  { x: 0.20, y: 0.18, rx: 0.07, ry: 0.03 },
];

type Props = {
  checkpoints: JourneyCheckpoint[];
  currentDay: number;
  unlockedIds: string[];
  onUnlockMilestone?: (id: string) => void;
};

function Tree({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const px = x * w;
  const py = y * h;
  return (
    <G>
      <Rect x={px - 3} y={py + 8} width={6} height={10} rx={2} fill="#5C3A1E" />
      <Ellipse cx={px} cy={py + 6} rx={10} ry={12} fill="#2D6A4F" />
      <Ellipse cx={px} cy={py} rx={7} ry={9} fill="#40916C" />
    </G>
  );
}

function Bush({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const px = x * w;
  const py = y * h;
  return (
    <G>
      <Ellipse cx={px - 6} cy={py + 2} rx={8} ry={6} fill="#52B788" />
      <Ellipse cx={px + 6} cy={py + 2} rx={8} ry={6} fill="#52B788" />
      <Ellipse cx={px} cy={py - 2} rx={9} ry={7} fill="#74C69D" />
    </G>
  );
}

function Pond({ x, y, rx: prx, ry: pry, w, h }: { x: number; y: number; rx: number; ry: number; w: number; h: number }) {
  return (
    <Ellipse cx={x * w} cy={y * h} rx={prx * w} ry={pry * h} fill="#90E0EF" opacity={0.7} />
  );
}

export function JourneyTrailMap({ checkpoints, currentDay, unlockedIds, onUnlockMilestone }: Props) {
  const { language } = useI18n();
  const visible = checkpoints.slice(0, PATH_STOPS.length);
  const pathD = buildPath(PATH_STOPS, MAP_W, MAP_H);

  const [selectedCheckpoint, setSelectedCheckpoint] = useState<JourneyCheckpoint | null>(null);

  const unlockedCount = visible.filter(
    (c) => unlockedIds.includes(c.id) || (c.dayUnlock ?? Infinity) <= currentDay
  ).length;

  const progressStops = PATH_STOPS.slice(0, Math.max(1, unlockedCount));
  const progressD = progressStops.length > 1 ? buildPath(progressStops, MAP_W, MAP_H) : '';

  const selectedUnlocked = selectedCheckpoint
    ? unlockedIds.includes(selectedCheckpoint.id) || (selectedCheckpoint.dayUnlock ?? Infinity) <= currentDay
    : false;

  return (
    <View style={[styles.frame, { width: MAP_W, height: MAP_H }]}>
      <Svg width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`}>
        <Defs>
          <LinearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1B4332" />
            <Stop offset="1" stopColor="#2D6A4F" />
          </LinearGradient>
          <RadialGradient id="glowActive" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#F0B429" stopOpacity="0.9" />
            <Stop offset="1" stopColor="#F0B429" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Background */}
        <Rect width={MAP_W} height={MAP_H} fill="url(#bgGrad)" rx={20} />

        {/* Grass patches */}
        <Ellipse cx={MAP_W * 0.3} cy={MAP_H * 0.85} rx={MAP_W * 0.22} ry={MAP_H * 0.05} fill="#40916C" opacity={0.4} />
        <Ellipse cx={MAP_W * 0.75} cy={MAP_H * 0.5} rx={MAP_W * 0.15} ry={MAP_H * 0.08} fill="#40916C" opacity={0.3} />

        {/* Ponds */}
        {PONDS.map((p, i) => (
          <Pond key={i} {...p} w={MAP_W} h={MAP_H} />
        ))}

        {/* Trees & Bushes */}
        {TREES.map((t, i) => (
          <Tree key={i} {...t} w={MAP_W} h={MAP_H} />
        ))}
        {BUSHES.map((b, i) => (
          <Bush key={i} {...b} w={MAP_W} h={MAP_H} />
        ))}

        {/* Full trail road */}
        <Path d={pathD} fill="none" stroke="#D4A017" strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
        <Path d={pathD} fill="none" stroke="#FFF8DC" strokeWidth={2} strokeLinecap="round" strokeDasharray="8 12" opacity={0.5} />

        {/* Progress active path */}
        {progressD ? (
          <Path d={progressD} fill="none" stroke="#F0B429" strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" opacity={0.95} />
        ) : null}

        {/* Checkpoint SVG markers */}
        {visible.map((checkpoint, index) => {
          const stop = PATH_STOPS[index];
          if (!stop) return null;
          const px = stop.x * MAP_W;
          const py = stop.y * MAP_H;
          const unlocked = unlockedIds.includes(checkpoint.id) || (checkpoint.dayUnlock ?? Infinity) <= currentDay;
          const isActive = index === Math.max(0, unlockedCount - 1);
          const isFinish = index === visible.length - 1;

          return (
            <G key={checkpoint.id}>
              {isActive && <Circle cx={px} cy={py} r={28} fill="url(#glowActive)" opacity={0.6} />}
              <Circle cx={px + 1} cy={py + 2} r={isFinish ? 20 : 16} fill="#000" opacity={0.25} />
              <Circle
                cx={px}
                cy={py}
                r={isFinish ? 20 : isActive ? 18 : 15}
                fill={isFinish ? '#D4AF37' : unlocked ? (isActive ? '#F0B429' : '#F3D88B') : '#314B42'}
                stroke={unlocked ? '#FFFBE6' : '#4A7C59'}
                strokeWidth={isActive ? 3.5 : 2}
              />
            </G>
          );
        })}
      </Svg>

      {/* Interactive Checkpoint Buttons Overlay */}
      {visible.map((checkpoint, index) => {
        const stop = PATH_STOPS[index];
        if (!stop) return null;
        const unlocked = unlockedIds.includes(checkpoint.id) || (checkpoint.dayUnlock ?? Infinity) <= currentDay;
        const isStart = index === 0;
        const isFinish = index === visible.length - 1;
        const px = stop.x * MAP_W;
        const py = stop.y * MAP_H;

        return (
          <TouchableOpacity
            key={checkpoint.id}
            activeOpacity={0.7}
            style={[
              styles.nodeTouch,
              { left: px - 20, top: py - 20 },
            ]}
            onPress={() => setSelectedCheckpoint(checkpoint)}
            accessibilityLabel={`View ${checkpoint.name}`}
          >
            <Text style={styles.nodeIconText}>
              {unlocked ? checkpoint.icon : '🔒'}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* Map Legend */}
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#F0B429' }]} />
          <Text style={styles.legendText}>Unlocked ({unlockedCount})</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#314B42' }]} />
          <Text style={styles.legendText}>Locked ({visible.length - unlockedCount})</Text>
        </View>
      </View>

      {/* Dynamic Milestone Detail Modal */}
      <Modal
        visible={!!selectedCheckpoint}
        transparent
        animationType="fade"
        accessibilityViewIsModal={true}
        onRequestClose={() => setSelectedCheckpoint(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} onPress={() => setSelectedCheckpoint(null)} />
          {selectedCheckpoint && (
            <View style={styles.modalCard}>
              {/* Top header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalEmoji}>{selectedCheckpoint.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>
                    {language === 'te' ? selectedCheckpoint.titleTe : selectedCheckpoint.name}
                  </Text>
                  <Text style={styles.modalSubTitle}>{selectedCheckpoint.description}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedCheckpoint(null)}>
                  <Ionicons name="close-circle" size={26} color="#8B949E" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalBody}>
                {/* Status Badge */}
                <View style={[styles.statusBadge, selectedUnlocked ? styles.unlockedBadge : styles.lockedBadge]}>
                  <Ionicons
                    name={selectedUnlocked ? 'checkmark-circle' : 'lock-closed'}
                    size={16}
                    color={selectedUnlocked ? '#34d399' : '#F0B429'}
                  />
                  <Text style={[styles.statusBadgeText, { color: selectedUnlocked ? '#34d399' : '#F0B429' }]}>
                    {selectedUnlocked
                      ? (language === 'te' ? '✓ సిద్ధం / అన్‌లాక్ అయింది (Unlocked)' : '✓ Unlocked Milestone')
                      : (language === 'te'
                        ? `🔒 రోజు ${selectedCheckpoint.dayUnlock ?? ''} న అన్‌లాక్ అవుతుంది`
                        : `🔒 Unlocks on Day ${selectedCheckpoint.dayUnlock ?? ''}`)}
                  </Text>
                </View>

                {/* Ritual Guide */}
                {selectedCheckpoint.ritualGuideTe && (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxTitle}>📜 పూజా మార్గదర్శకం (Ritual Guide)</Text>
                    <Text style={styles.infoBoxText}>{selectedCheckpoint.ritualGuideTe}</Text>
                  </View>
                )}

                {/* Guru Swamy Advice */}
                {selectedCheckpoint.guruAdviceTe && (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxTitle}>🕉️ గురు స్వామి ఆదేశం (Guru Swamy Advice)</Text>
                    <Text style={styles.infoBoxText}>{selectedCheckpoint.guruAdviceTe}</Text>
                  </View>
                )}
              </ScrollView>

              {/* Footer Actions */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.actionBtnSecondary}
                  onPress={() => {
                    setSelectedCheckpoint(null);
                    router.push('/(tabs)/vidhanam');
                  }}
                >
                  <Ionicons name="book-outline" size={18} color="#F0B429" />
                  <Text style={styles.actionBtnSecondaryText}>
                    {language === 'te' ? 'మంత్రాలు & పాటలు' : 'Pooja Mantras'}
                  </Text>
                </TouchableOpacity>

                {!selectedUnlocked && onUnlockMilestone && (
                  <TouchableOpacity
                    style={styles.actionBtnPrimary}
                    onPress={() => {
                      onUnlockMilestone(selectedCheckpoint.id);
                      setSelectedCheckpoint(null);
                    }}
                  >
                    <Ionicons name="key-outline" size={18} color="#0D1117" />
                    <Text style={styles.actionBtnPrimaryText}>
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
    backgroundColor: '#1B4332',
    alignSelf: 'center',
    position: 'relative',
  },
  nodeTouch: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  nodeIconText: { fontSize: 16 },
  legend: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: '#0D2B1ECC',
    borderRadius: 12,
    padding: 8,
    gap: 4,
    zIndex: 20,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#D8F3DC', fontSize: 10, fontWeight: '600' },

  // Modal styling
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000A0',
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  modalDismiss: { flex: 1 },
  modalCard: {
    backgroundColor: '#161B22',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#30363D',
    padding: spacing.md,
    maxHeight: '75%',
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#30363D',
    paddingBottom: 10,
  },
  modalEmoji: { fontSize: 36 },
  modalTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  modalSubTitle: { color: '#8B949E', fontSize: 12, marginTop: 2 },
  modalBody: { gap: 12, paddingVertical: 4 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  unlockedBadge: { backgroundColor: '#34d39918', borderColor: '#34d399' },
  lockedBadge: { backgroundColor: '#F0B42918', borderColor: '#F0B429' },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  infoBox: {
    backgroundColor: '#0D1117',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#30363D',
    gap: 6,
  },
  infoBoxTitle: { color: '#F0B429', fontSize: 13, fontWeight: '700' },
  infoBoxText: { color: '#E6EDF3', fontSize: 13, lineHeight: 20 },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#30363D',
  },
  actionBtnSecondary: {
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
  actionBtnSecondaryText: { color: '#F0B429', fontWeight: '700', fontSize: 13 },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F0B429',
  },
  actionBtnPrimaryText: { color: '#0D1117', fontWeight: '800', fontSize: 13 },
});
