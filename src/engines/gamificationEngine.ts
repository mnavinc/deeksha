import { CHECKPOINT_POINTS, ACHIEVEMENTS, getAvatarStage, type CheckpointKey, type AchievementStats } from '@/data/achievements';
import type { DailyLog } from './deekshaEngine';

export function calculateDayPoints(log: DailyLog): number {
  let points = 0;
  for (const [key, completed] of Object.entries(log.checkpoints)) {
    if (completed && key in CHECKPOINT_POINTS) {
      points += CHECKPOINT_POINTS[key as CheckpointKey];
    }
  }
  if (log.saranamCount >= 18) points += 5;
  if (log.walkingKm >= 3) points += 10;
  return points;
}

export function calculateTotalPoints(logs: DailyLog[]): number {
  return logs.reduce((sum, log) => sum + calculateDayPoints(log), 0);
}

export function calculateStreak(logs: DailyLog[]): number {
  if (logs.length === 0) return 0;
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  for (const log of sorted) {
    const meaningful = Object.values(log.checkpoints).filter(Boolean).length >= 3;
    if (meaningful) streak++;
    else break;
  }
  return streak;
}

export function getUnlockedAchievements(stats: AchievementStats): string[] {
  return ACHIEVEMENTS.filter((a) => a.condition(stats)).map((a) => a.id);
}

export function buildAchievementStats(
  logs: DailyLog[],
  totalPoints: number,
  pilgrimageCompleted: boolean,
  groupExpensesRecorded: number
): AchievementStats {
  return {
    daysCompleted: logs.filter((l) => Object.values(l.checkpoints).some(Boolean)).length,
    totalPoints,
    streakDays: calculateStreak(logs),
    saranamCount: logs.reduce((s, l) => s + l.saranamCount, 0),
    walkingKm: logs.reduce((s, l) => s + l.walkingKm, 0),
    pilgrimageCompleted,
    groupExpensesRecorded,
  };
}

export { getAvatarStage, ACHIEVEMENTS, CHECKPOINT_POINTS };
