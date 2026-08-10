import { differenceInCalendarDays, addDays, format } from './dateUtils';
import type { DeekshaId } from '@/data/deekshaTypes';
import { getDeekshaType } from '@/data/deekshaTypes';
import type { DailyCheckpointId } from '@/data/journeyCheckpoints';

export interface DailyLog {
  date: string;
  dayNumber: number;
  checkpoints: Record<DailyCheckpointId, boolean>;
  walkingKm: number;
  saranamCount: number;
  notes?: string;
}

export interface DeekshaEnrollment {
  id: string;
  deekshaId: DeekshaId;
  pilgrimageCenter: string;
  malaDharanamDate: string;
  durationDays: number;
  targetYatraDate?: string;
  pilgrimageCount: number;
  status: 'active' | 'completed' | 'paused';
  dailyLogs: DailyLog[];
  unlockedJourneyIds: string[];
}

export function getCurrentDay(enrollment: DeekshaEnrollment): number {
  const start = new Date(enrollment.malaDharanamDate);
  const today = new Date();
  return Math.min(
    Math.max(differenceInCalendarDays(today, start) + 1, 1),
    enrollment.durationDays
  );
}

export function getDayProgress(enrollment: DeekshaEnrollment): number {
  return getCurrentDay(enrollment) / enrollment.durationDays;
}

export function getTodayLog(enrollment: DeekshaEnrollment): DailyLog | undefined {
  const today = format(new Date(), 'yyyy-MM-dd');
  return enrollment.dailyLogs.find((l) => l.date === today);
}

export function createTodayLog(enrollment: DeekshaEnrollment): DailyLog {
  const dayNumber = getCurrentDay(enrollment);
  return {
    date: format(new Date(), 'yyyy-MM-dd'),
    dayNumber,
    checkpoints: {
      prayer: false,
      saranam: false,
      vegetarian: false,
      noAlcohol: false,
      noSmoking: false,
      brahmacharyam: false,
      walking: false,
      eveningPrayer: false,
    },
    walkingKm: 0,
    saranamCount: 0,
  };
}

export function getApplicableRules(deekshaId: DeekshaId) {
  const type = getDeekshaType(deekshaId);
  if (!type) throw new Error(`Unknown deeksha: ${deekshaId}`);
  return type.rules;
}

export function getVruthamEndDate(enrollment: DeekshaEnrollment): Date {
  return addDays(new Date(enrollment.malaDharanamDate), enrollment.durationDays - 1);
}

export function getDaysRemaining(enrollment: DeekshaEnrollment): number {
  return Math.max(enrollment.durationDays - getCurrentDay(enrollment), 0);
}

export function countCompletedDays(enrollment: DeekshaEnrollment): number {
  return enrollment.dailyLogs.filter((log) =>
    Object.values(log.checkpoints).some(Boolean)
  ).length;
}
