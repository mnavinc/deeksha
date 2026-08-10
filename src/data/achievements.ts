export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  condition: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  daysCompleted: number;
  totalPoints: number;
  streakDays: number;
  saranamCount: number;
  walkingKm: number;
  pilgrimageCompleted: boolean;
  groupExpensesRecorded: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_day',
    title: 'Vrutham Begins',
    description: 'Completed your first day of Deeksha',
    icon: '🌅',
    points: 50,
    condition: (s) => s.daysCompleted >= 1,
  },
  {
    id: 'week_one',
    title: 'One Week Strong',
    description: '7 days of disciplined living',
    icon: '💪',
    points: 100,
    condition: (s) => s.daysCompleted >= 7,
  },
  {
    id: 'half_mandala',
    title: 'Half Mandala',
    description: '21 days completed — halfway there',
    icon: '⭐',
    points: 200,
    condition: (s) => s.daysCompleted >= 21,
  },
  {
    id: 'mandala_complete',
    title: 'Mandala Complete',
    description: '41 days of Vrutham completed',
    icon: '🏆',
    points: 500,
    condition: (s) => s.daysCompleted >= 41,
  },
  {
    id: 'saranam_master',
    title: 'Saranam Devotee',
    description: 'Chanted Saranam 108 times',
    icon: '📿',
    points: 150,
    condition: (s) => s.saranamCount >= 108,
  },
  {
    id: 'walker',
    title: 'Pilgrim Walker',
    description: 'Walked 50 km in preparation',
    icon: '🚶',
    points: 100,
    condition: (s) => s.walkingKm >= 50,
  },
  {
    id: 'streak_7',
    title: '7-Day Streak',
    description: '7 consecutive days of checkpoints',
    icon: '🔥',
    points: 75,
    condition: (s) => s.streakDays >= 7,
  },
  {
    id: 'darshan',
    title: 'Darshan Attained',
    description: 'Completed pilgrimage and Darshan',
    icon: '🛕',
    points: 1000,
    condition: (s) => s.pilgrimageCompleted,
  },
  {
    id: 'group_keeper',
    title: 'Group Keeper',
    description: 'Recorded 5 group expenses',
    icon: '💰',
    points: 50,
    condition: (s) => s.groupExpensesRecorded >= 5,
  },
];

export const CHECKPOINT_POINTS = {
  prayer: 10,
  saranam: 10,
  vegetarian: 15,
  noAlcohol: 10,
  noSmoking: 10,
  brahmacharyam: 15,
  walking: 20,
  eveningPrayer: 10,
} as const;

export type CheckpointKey = keyof typeof CHECKPOINT_POINTS;

export const AVATAR_STAGES = [
  { minPoints: 0, emoji: '🧘', label: 'Seeker' },
  { minPoints: 100, emoji: '📿', label: 'Devotee' },
  { minPoints: 300, emoji: '🙏', label: 'Swami' },
  { minPoints: 600, emoji: '⛰️', label: 'Pilgrim' },
  { minPoints: 1000, emoji: '🛕', label: 'Yatri' },
  { minPoints: 2000, emoji: '✨', label: 'Blessed' },
];

export function getAvatarStage(points: number) {
  return [...AVATAR_STAGES].reverse().find((s) => points >= s.minPoints) ?? AVATAR_STAGES[0];
}
