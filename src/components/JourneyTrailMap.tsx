import { StyleSheet, Text, View, ScrollView, Dimensions } from 'react-native';
import Svg, { Circle, Path, Ellipse, G, Rect, Defs, RadialGradient, Stop, LinearGradient } from 'react-native-svg';
import type { JourneyCheckpoint } from '@/data/journeyCheckpoints';
import { colors } from '@/theme/colors';

const { width: SCREEN_W } = Dimensions.get('window');
const MAP_W = Math.min(SCREEN_W - 32, 480);
const MAP_H = MAP_W * 1.5;

// Winding path stops — bottom to top (start at bottom-left, end at top-right)
// Normalized 0–1 coords, scaled to MAP_W x MAP_H
const PATH_STOPS = [
  { x: 0.13, y: 0.92 }, // 0 — start (Mala Dharanam)
  { x: 0.38, y: 0.84 }, // 1
  { x: 0.62, y: 0.88 }, // 2
  { x: 0.78, y: 0.76 }, // 3
  { x: 0.55, y: 0.66 }, // 4
  { x: 0.28, y: 0.60 }, // 5
  { x: 0.18, y: 0.48 }, // 6
  { x: 0.38, y: 0.38 }, // 7
  { x: 0.62, y: 0.44 }, // 8
  { x: 0.75, y: 0.30 }, // 9
  { x: 0.55, y: 0.18 }, // 10
  { x: 0.32, y: 0.14 }, // 11
  { x: 0.18, y: 0.24 }, // 12
  { x: 0.38, y: 0.10 }, // 13
  { x: 0.62, y: 0.06 }, // 14 — finish (Ayyappa Darshan / Sabarimala)
];

// Generate smooth SVG path through the stops
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

// Nature decorations — trees, bushes, ponds
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

export function JourneyTrailMap({ checkpoints, currentDay, unlockedIds }: Props) {
  const visible = checkpoints.slice(0, PATH_STOPS.length);
  const pathD = buildPath(PATH_STOPS, MAP_W, MAP_H);

  // How many checkpoints are unlocked (for progress path)
  const unlockedCount = visible.filter(
    (c, i) => unlockedIds.includes(c.id) || (c.dayUnlock ?? Infinity) <= currentDay
  ).length;
  const progressStops = PATH_STOPS.slice(0, Math.max(1, unlockedCount));
  const progressD = progressStops.length > 1 ? buildPath(progressStops, MAP_W, MAP_H) : '';

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

        {/* Ponds / rivers */}
        {PONDS.map((p, i) => (
          <Pond key={i} {...p} w={MAP_W} h={MAP_H} />
        ))}

        {/* Trees */}
        {TREES.map((t, i) => (
          <Tree key={i} {...t} w={MAP_W} h={MAP_H} />
        ))}

        {/* Bushes */}
        {BUSHES.map((b, i) => (
          <Bush key={i} {...b} w={MAP_W} h={MAP_H} />
        ))}

        {/* Full path — gold road */}
        <Path d={pathD} fill="none" stroke="#D4A017" strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
        {/* Road center dashes */}
        <Path d={pathD} fill="none" stroke="#FFF8DC" strokeWidth={2} strokeLinecap="round" strokeDasharray="8 12" opacity={0.5} />

        {/* Progress path — brighter gold */}
        {progressD ? (
          <Path d={progressD} fill="none" stroke="#F0B429" strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" opacity={0.95} />
        ) : null}

        {/* Checkpoint markers */}
        {visible.map((checkpoint, index) => {
          const stop = PATH_STOPS[index];
          if (!stop) return null;
          const px = stop.x * MAP_W;
          const py = stop.y * MAP_H;
          const unlocked = unlockedIds.includes(checkpoint.id) || (checkpoint.dayUnlock ?? Infinity) <= currentDay;
          const isActive = index === Math.max(0, unlockedCount - 1);
          const isStart = index === 0;
          const isFinish = index === visible.length - 1;

          return (
            <G key={checkpoint.id}>
              {/* Glow for active */}
              {isActive && (
                <Circle cx={px} cy={py} r={26} fill="url(#glowActive)" opacity={0.5} />
              )}
              {/* Shadow */}
              <Circle cx={px + 1} cy={py + 2} r={isFinish ? 18 : 14} fill="#000" opacity={0.2} />
              {/* Marker circle */}
              <Circle
                cx={px}
                cy={py}
                r={isFinish ? 18 : isActive ? 16 : 13}
                fill={isFinish ? '#D4AF37' : unlocked ? (isActive ? '#F0B429' : '#F3D88B') : '#314B42'}
                stroke={unlocked ? '#FFFBE6' : '#4A7C59'}
                strokeWidth={isActive ? 3 : 1.5}
              />
              {/* Icon text — simple emoji representation */}
              <Circle
                cx={px}
                cy={py}
                r={isFinish ? 12 : 8}
                fill={isFinish ? '#B8860B' : unlocked ? '#C17F00' : '#2A4033'}
                opacity={0.8}
              />
              {/* Start label */}
              {isStart && (
                <>
                  <Rect x={px - 35} y={py - 44} width={70} height={22} rx={6} fill="#FFFBE6" />
                  <Rect x={px - 1} y={py - 22} width={2} height={8} fill="#FFFBE6" />
                </>
              )}
              {/* Finish label */}
              {isFinish && (
                <>
                  <Rect x={px - 40} y={py - 50} width={80} height={24} rx={6} fill="#D4AF37" />
                  <Rect x={px - 1} y={py - 26} width={2} height={8} fill="#D4AF37" />
                </>
              )}
            </G>
          );
        })}

        {/* Start / Finish text rendered via React Native overlay */}
      </Svg>

      {/* Checkpoint labels overlay */}
      {visible.map((checkpoint, index) => {
        const stop = PATH_STOPS[index];
        if (!stop) return null;
        const unlocked = unlockedIds.includes(checkpoint.id) || (checkpoint.dayUnlock ?? Infinity) <= currentDay;
        const isStart = index === 0;
        const isFinish = index === visible.length - 1;
        const px = stop.x * MAP_W;
        const py = stop.y * MAP_H;

        if (isStart) {
          return (
            <View key={checkpoint.id} style={[styles.labelBubble, styles.startBubble, { left: px - 35, top: py - 46 }]}>
              <Text style={styles.labelBubbleText}>🛕 {checkpoint.icon}</Text>
            </View>
          );
        }
        if (isFinish) {
          return (
            <View key={checkpoint.id} style={[styles.labelBubble, styles.finishBubble, { left: px - 40, top: py - 52 }]}>
              <Text style={styles.finishText}>🏁 Sabarimala</Text>
            </View>
          );
        }

        return (
          <View
            key={checkpoint.id}
            style={[
              styles.iconLabel,
              { left: px - 12, top: py - 12 },
              !unlocked && styles.iconLabelLocked,
            ]}
          >
            <Text style={styles.iconEmoji}>{unlocked ? checkpoint.icon : '🔒'}</Text>
          </View>
        );
      })}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Unlocked</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#314B42' }]} />
          <Text style={styles.legendText}>Locked</Text>
        </View>
      </View>
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
  iconLabel: {
    position: 'absolute',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLabelLocked: { opacity: 0.5 },
  iconEmoji: { fontSize: 14 },
  labelBubble: {
    position: 'absolute',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBubble: { backgroundColor: '#FFFBE6', width: 70, height: 22 },
  finishBubble: { backgroundColor: '#D4AF37', width: 80, height: 24 },
  labelBubbleText: { fontSize: 10, fontWeight: '700', color: '#3D2B00' },
  finishText: { fontSize: 9, fontWeight: '800', color: '#1A0A00' },
  legend: {
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: '#0D2B1ECC',
    borderRadius: 10,
    padding: 8,
    gap: 4,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#D8F3DC', fontSize: 9, fontWeight: '600' },
});
