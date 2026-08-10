export interface JourneyCheckpoint {
  id: string;
  name: string;
  description: string;
  dayUnlock?: number;
  phase: 'vrutham' | 'preparation' | 'pilgrimage' | 'completion';
  icon: string;
  category: 'OFFICIAL' | 'TRADITIONAL';
}

export const AYYAPPA_JOURNEY: JourneyCheckpoint[] = [
  { id: 'mala_dharanam', name: 'Mala Dharanam', description: 'Ceremonial wearing of the Ayyappa Mala', dayUnlock: 0, phase: 'vrutham', icon: '📿', category: 'OFFICIAL' },
  { id: 'day_1', name: 'Day 1 — Vrutham Begins', description: 'First day of Mandala Vrutham', dayUnlock: 1, phase: 'vrutham', icon: '🌅', category: 'OFFICIAL' },
  { id: 'day_10', name: '10 Days Complete', description: 'Continue with patience and discipline', dayUnlock: 10, phase: 'vrutham', icon: '💪', category: 'TRADITIONAL' },
  { id: 'day_21', name: 'Half Mandala', description: '21 days of self-control', dayUnlock: 21, phase: 'vrutham', icon: '⭐', category: 'TRADITIONAL' },
  { id: 'day_30', name: 'Prepare Irumudi', description: 'Begin pilgrimage preparation', dayUnlock: 30, phase: 'preparation', icon: '🎒', category: 'TRADITIONAL' },
  { id: 'day_41', name: 'Mandala Complete', description: '41-day Vrutham finished', dayUnlock: 41, phase: 'preparation', icon: '🏆', category: 'OFFICIAL' },
  { id: 'kettunirakkal', name: 'Kettunirakkal', description: 'Irumudi preparation under Guru Swamy', phase: 'preparation', icon: '🥥', category: 'OFFICIAL' },
  { id: 'erumeli', name: 'Erumeli', description: 'Traditional route beginning', phase: 'pilgrimage', icon: '🌲', category: 'TRADITIONAL' },
  { id: 'pampa', name: 'Pampa Snanam', description: 'Sacred bath at Pampa River', phase: 'pilgrimage', icon: '🌊', category: 'OFFICIAL' },
  { id: 'neelimala', name: 'Neelimala', description: 'Steep climb toward Sannidhanam', phase: 'pilgrimage', icon: '⛰️', category: 'TRADITIONAL' },
  { id: 'saramkuthi', name: 'Saramkuthi', description: 'Kanni Swamy tradition — placing Saram', phase: 'pilgrimage', icon: '🏹', category: 'TRADITIONAL' },
  { id: 'pathinettam_padi', name: '18 Sacred Steps', description: 'Pathinettam Padi with Irumudi', phase: 'pilgrimage', icon: '🪜', category: 'OFFICIAL' },
  { id: 'darshan', name: 'Ayyappa Darshan', description: 'Sacred Darshan at Sannidhanam', phase: 'pilgrimage', icon: '🛕', category: 'OFFICIAL' },
  { id: 'neyyabhishekam', name: 'Neyyabhishekam', description: 'Ghee offering from Neyy Thenga', phase: 'pilgrimage', icon: '🪔', category: 'OFFICIAL' },
  { id: 'mala_visarjanam', name: 'Mala Visarjanam', description: 'Deeksha completion — Mala removal', phase: 'completion', icon: '🙏', category: 'TRADITIONAL' },
];

export const DAILY_CHECKPOINTS = [
  { id: 'prayer', label: 'Morning Prayer', icon: '🪔' },
  { id: 'saranam', label: 'Saranam Chanting', icon: '📿' },
  { id: 'vegetarian', label: 'Vegetarian Food', icon: '🥗' },
  { id: 'noAlcohol', label: 'No Alcohol', icon: '🚫' },
  { id: 'noSmoking', label: 'No Smoking', icon: '🚭' },
  { id: 'brahmacharyam', label: 'Brahmacharyam', icon: '🧘' },
  { id: 'walking', label: 'Walking / Exercise', icon: '🚶' },
  { id: 'eveningPrayer', label: 'Evening Prayer', icon: '🌙' },
] as const;

export type DailyCheckpointId = (typeof DAILY_CHECKPOINTS)[number]['id'];
