import React from 'react';
import Svg, {
  Circle,
  Path,
  Polygon,
  Rect,
  Line,
  G,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

export type SacredIconName =
  | 'temple'
  | 'mala'
  | 'sunrise'
  | 'flame'
  | 'star'
  | 'irumudi'
  | 'trophy'
  | 'coconut'
  | 'forest'
  | 'river'
  | 'mountain'
  | 'arrow'
  | 'steps'
  | 'jyothi'
  | 'lotus'
  | 'lock'
  | 'bhojana'
  | 'footprints'
  | 'kalash';

/** Maps a journey checkpoint id (or fallback) to a crisp SacredIconName */
export function getCheckpointIconName(checkpointId: string): SacredIconName {
  switch (checkpointId) {
    case 'mala_dharanam':
      return 'mala';
    case 'day_1':
      return 'sunrise';
    case 'day_10':
      return 'flame';
    case 'day_21':
      return 'star';
    case 'day_30':
      return 'irumudi';
    case 'day_41':
      return 'trophy';
    case 'kettunirakkal':
      return 'coconut';
    case 'erumeli':
      return 'forest';
    case 'pampa':
      return 'river';
    case 'neelimala':
      return 'mountain';
    case 'saramkuthi':
      return 'arrow';
    case 'pathinettam_padi':
      return 'steps';
    case 'darshan':
      return 'temple';
    default:
      if (checkpointId.includes('padi') || checkpointId.includes('step')) return 'steps';
      if (checkpointId.includes('river') || checkpointId.includes('bath') || checkpointId.includes('snanam')) return 'river';
      if (checkpointId.includes('hill') || checkpointId.includes('trek') || checkpointId.includes('malai')) return 'mountain';
      if (checkpointId.includes('darshan') || checkpointId.includes('temple') || checkpointId.includes('sannidhanam')) return 'temple';
      if (checkpointId.includes('irumudi')) return 'irumudi';
      return 'lotus';
  }
}

/**
 * Renders crisp vector glyph paths centered at (0, 0) in a 24x24 viewBox space.
 * Can be used both inside standalone <SacredIcon /> and directly inside <JourneyTrailMap /> SVG.
 */
export function SacredSvgGlyph({
  name,
  color = '#FFFBE6',
  accent = '#F0B429',
}: {
  name: SacredIconName;
  color?: string;
  accent?: string;
}) {
  switch (name) {
    case 'temple':
      return (
        <G>
          {/* Gopuram / Sabarimala Sannidhanam roof */}
          <Polygon points="12,2 5,8 19,8" fill={accent} stroke={color} strokeWidth={1.3} strokeLinejoin="round" />
          <Line x1="12" y1="0.5" x2="12" y2="2" stroke={accent} strokeWidth={1.6} strokeLinecap="round" />
          <Rect x="6" y="8" width="12" height="2.2" rx={0.6} fill={color} opacity={0.9} />
          {/* Pillars */}
          <Line x1="7.5" y1="10.2" x2="7.5" y2="18.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Line x1="12" y1="10.2" x2="12" y2="18.5" stroke={accent} strokeWidth={1.8} strokeLinecap="round" />
          <Line x1="16.5" y1="10.2" x2="16.5" y2="18.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          {/* Base steps */}
          <Rect x="4" y="18.5" width="16" height="2" rx={0.8} fill={accent} />
          <Rect x="2.5" y="20.5" width="19" height="2" rx={0.8} fill={color} opacity={0.85} />
        </G>
      );

    case 'mala':
      return (
        <G>
          {/* Sacred Rudraksha/Tulsi Mala beads circle */}
          <Circle cx="12" cy="11" r="7.5" fill="none" stroke={color} strokeWidth={1.4} strokeDasharray="1.5 2.4" strokeLinecap="round" />
          <Circle cx="12" cy="3.5" r="1.5" fill={accent} />
          <Circle cx="17.3" cy="5.7" r="1.3" fill={color} />
          <Circle cx="19.5" cy="11" r="1.3" fill={color} />
          <Circle cx="17.3" cy="16.3" r="1.3" fill={color} />
          <Circle cx="6.7" cy="16.3" r="1.3" fill={color} />
          <Circle cx="4.5" cy="11" r="1.3" fill={color} />
          <Circle cx="6.7" cy="5.7" r="1.3" fill={color} />
          {/* Pendant */}
          <Circle cx="12" cy="19.5" r="2.2" fill={accent} stroke={color} strokeWidth={1.1} />
        </G>
      );

    case 'sunrise':
      return (
        <G>
          <Path d="M4 17 H20" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M7 17 A5 5 0 0 1 17 17" fill={accent} stroke={color} strokeWidth={1.3} />
          <Line x1="12" y1="5" x2="12" y2="8.5" stroke={accent} strokeWidth={1.8} strokeLinecap="round" />
          <Line x1="5.5" y1="8.5" x2="7.8" y2="10.8" stroke={accent} strokeWidth={1.6} strokeLinecap="round" />
          <Line x1="18.5" y1="8.5" x2="16.2" y2="10.8" stroke={accent} strokeWidth={1.6} strokeLinecap="round" />
          <Path d="M7 20 H17" stroke={color} strokeWidth={1.4} strokeLinecap="round" opacity={0.7} />
        </G>
      );

    case 'flame':
    case 'jyothi':
      return (
        <G>
          {/* Sacred Diya & Flame */}
          <Path
            d="M12 3 C14.8 6.5 16 9 16 11.2 A4 4 0 0 1 8 11.2 C8 9 9.5 6.2 12 3 Z"
            fill={accent}
            stroke={color}
            strokeWidth={1.2}
          />
          <Path d="M12 7.5 C13 9 13.5 10.2 13.5 11.2 A1.5 1.5 0 0 1 10.5 11.2 C10.5 10.2 11 9 12 7.5 Z" fill="#FFFBE6" />
          <Path d="M5 15.5 Q12 18 19 15.5 L17 19.5 Q12 21 7 19.5 Z" fill={color} opacity={0.92} />
        </G>
      );

    case 'star':
      return (
        <Polygon
          points="12,2.5 14.8,8.5 21.4,9.4 16.6,14 17.8,20.5 12,17.3 6.2,20.5 7.4,14 2.6,9.4 9.2,8.5"
          fill={accent}
          stroke={color}
          strokeWidth={1.3}
          strokeLinejoin="round"
        />
      );

    case 'irumudi':
      return (
        <G>
          {/* Two-compartment Irumudi Kattu */}
          <Path d="M8.5 6 L12 3.5 L15.5 6" fill="none" stroke={accent} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          <Rect x="5.5" y="6.5" width="13" height="6" rx={2.5} fill={accent} stroke={color} strokeWidth={1.3} />
          <Rect x="5" y="13" width="14" height="7" rx={2.8} fill={color} opacity={0.9} stroke={accent} strokeWidth={1.2} />
          <Line x1="9" y1="6.5" x2="9" y2="20" stroke="#0D1117" strokeWidth={1.2} opacity={0.5} />
          <Line x1="15" y1="6.5" x2="15" y2="20" stroke="#0D1117" strokeWidth={1.2} opacity={0.5} />
        </G>
      );

    case 'trophy':
      return (
        <G>
          <Path d="M7 4 H17 V10 A5 5 0 0 1 7 10 Z" fill={accent} stroke={color} strokeWidth={1.3} />
          <Path d="M7 5.5 H4.5 A2 2 0 0 0 4.5 9.5 H7" fill="none" stroke={color} strokeWidth={1.4} />
          <Path d="M17 5.5 H19.5 A2 2 0 0 1 19.5 9.5 H17" fill="none" stroke={color} strokeWidth={1.4} />
          <Line x1="12" y1="15" x2="12" y2="19" stroke={color} strokeWidth={2} />
          <Rect x="8" y="19" width="8" height="2.2" rx={1} fill={color} />
        </G>
      );

    case 'coconut':
      return (
        <G>
          <Circle cx="12" cy="13" r="7" fill={color} opacity={0.92} stroke={accent} strokeWidth={1.6} />
          <Circle cx="10.2" cy="10.5" r="1" fill="#0D1117" />
          <Circle cx="13.8" cy="10.5" r="1" fill="#0D1117" />
          <Circle cx="12" cy="13" r="1" fill="#0D1117" />
          <Path d="M10 6 C11 3.5 13 3.5 14 6" fill="none" stroke={accent} strokeWidth={1.8} strokeLinecap="round" />
        </G>
      );

    case 'forest':
      return (
        <G>
          <Polygon points="12,3 6.5,11 17.5,11" fill={accent} stroke={color} strokeWidth={1.2} strokeLinejoin="round" />
          <Polygon points="12,8 5,16.5 19,16.5" fill={color} opacity={0.9} stroke={accent} strokeWidth={1.2} strokeLinejoin="round" />
          <Rect x="10.7" y="16.5" width="2.6" height="4.5" rx={0.6} fill={accent} />
        </G>
      );

    case 'river':
      return (
        <G>
          <Path d="M3 8.5 Q7.5 5.5 12 8.5 T21 8.5" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <Path d="M3 13 Q7.5 10 12 13 T21 13" fill="none" stroke={accent} strokeWidth={2} strokeLinecap="round" />
          <Path d="M4 17.5 Q8 14.8 12 17.5 T20 17.5" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" opacity={0.8} />
        </G>
      );

    case 'mountain':
      return (
        <G>
          <Polygon points="3,19 10.5,5.5 18,19" fill={color} opacity={0.9} stroke={accent} strokeWidth={1.3} strokeLinejoin="round" />
          <Polygon points="11,19 16,10 21,19" fill={accent} opacity={0.85} stroke={color} strokeWidth={1.2} strokeLinejoin="round" />
          <Path d="M8.5 9.2 L10.5 5.5 L12.5 9.2 L11.2 8.4 L10.5 9.5 L9.8 8.4 Z" fill="#FFFBE6" />
        </G>
      );

    case 'arrow':
      return (
        <G>
          <Line x1="5" y1="19" x2="18.5" y2="5.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <Polygon points="19.5,4.5 13.5,5.5 18.5,10.5" fill={accent} stroke={color} strokeWidth={1} strokeLinejoin="round" />
          <Line x1="4" y1="16.5" x2="7.5" y2="20" stroke={accent} strokeWidth={1.8} strokeLinecap="round" />
        </G>
      );

    case 'steps':
      return (
        <G>
          {/* Pathinettam Padi (Sacred Golden Steps) */}
          <Path
            d="M3 20 H7 V16.5 H11 V13 H15 V9.5 H19 V6 H21"
            fill="none"
            stroke={accent}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Line x1="3" y1="21.5" x2="21" y2="21.5" stroke={color} strokeWidth={1.4} strokeLinecap="round" opacity={0.8} />
          <Circle cx="19" cy="4" r="1.4" fill={color} />
        </G>
      );

    case 'lock':
      return (
        <G>
          <Path d="M8 10.5 V7.5 A4 4 0 0 1 16 7.5 V10.5" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Rect x="6" y="10.5" width="12" height="9.5" rx={2.2} fill={color} opacity={0.85} />
          <Circle cx="12" cy="15" r="1.4" fill="#0D1117" />
        </G>
      );

    case 'bhojana':
      return (
        <G>
          {/* Sacred Banana Leaf / Prasadam Plate */}
          <Path d="M4 13 A8 5 0 0 0 20 13 Z" fill={accent} stroke={color} strokeWidth={1.3} />
          <Path d="M7 9 Q8 6.5 7 4.5" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
          <Path d="M12 8.5 Q13 6 12 4" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
          <Path d="M17 9 Q18 6.5 17 4.5" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
          <Line x1="6" y1="19" x2="18" y2="19" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        </G>
      );

    case 'footprints':
      return (
        <G>
          <Circle cx="9" cy="8" r="2.2" fill={accent} />
          <Path d="M7 12.5 Q9 16 10.5 13.5 Q11 11.5 9 11 Z" fill={color} />
          <Circle cx="15.5" cy="11.5" r="2.2" fill={accent} />
          <Path d="M13.5 16 Q15.5 19.5 17 17 Q17.5 15 15.5 14.5 Z" fill={color} />
        </G>
      );

    case 'kalash':
    case 'lotus':
    default:
      return (
        <G>
          {/* Sacred Lotus */}
          <Path d="M12 4 C14.5 7.5 14.5 12 12 15.5 C9.5 12 9.5 7.5 12 4 Z" fill={accent} stroke={color} strokeWidth={1.1} />
          <Path d="M12 15.5 C7.5 14.5 5 11.5 5.5 7.5 C8.5 9 10.5 12 12 15.5 Z" fill={color} opacity={0.9} />
          <Path d="M12 15.5 C16.5 14.5 19 11.5 18.5 7.5 C15.5 9 13.5 12 12 15.5 Z" fill={color} opacity={0.9} />
          <Path d="M5 18 H19" stroke={accent} strokeWidth={1.8} strokeLinecap="round" />
        </G>
      );
  }
}

export const SacredIcon = React.memo(function SacredIcon({
  name,
  size = 24,
  color = '#FFFBE6',
  accent = '#F0B429',
  withBadge = false,
  badgeBg = '#1B4332',
}: {
  name: SacredIconName;
  size?: number;
  color?: string;
  accent?: string;
  withBadge?: boolean;
  badgeBg?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {withBadge && (
        <>
          <Defs>
            <LinearGradient id="sacredBadgeGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={badgeBg} />
              <Stop offset="1" stopColor="#0B1F17" />
            </LinearGradient>
          </Defs>
          <Circle cx="12" cy="12" r="11.2" fill="url(#sacredBadgeGrad)" stroke={accent} strokeWidth={1.1} />
        </>
      )}
      <G transform={withBadge ? 'translate(2.4, 2.4) scale(0.8)' : undefined}>
        <SacredSvgGlyph name={name} color={color} accent={accent} />
      </G>
    </Svg>
  );
});

