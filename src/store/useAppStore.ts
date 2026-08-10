import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DeekshaId } from '@/data/deekshaTypes';
import type { DeekshaEnrollment, DailyLog } from '@/engines/deekshaEngine';
import {
  createTodayLog,
  getCurrentDay,
  getTodayLog,
} from '@/engines/deekshaEngine';
import type { DailyCheckpointId } from '@/data/journeyCheckpoints';
import { calculateDayPoints, calculateTotalPoints, buildAchievementStats, getUnlockedAchievements } from '@/engines/gamificationEngine';
import type { Expense, Settlement } from '@/engines/expenseEngine';
import { getSwamiTier } from '@/data/swamiNames';

export interface GroupMember {
  userId: string;
  name: string;
  role: 'GROUP_ADMIN' | 'EXPENSE_MANAGER' | 'MEMBER';
}

export interface PilgrimageGroup {
  id: string;
  name: string;
  season: string;
  route?: string;
  members: GroupMember[];
  announcements: { id: string; text: string; createdAt: string }[];
}

export interface UserProfile {
  id: string;
  name: string;
  language: 'en' | 'te' | 'ml';
  pilgrimageCount: number;
  onboardingComplete: boolean;
}

interface AppState {
  profile: UserProfile | null;
  enrollment: DeekshaEnrollment | null;
  totalPoints: number;
  unlockedAchievements: string[];
  savedTempleIds: string[];
  groups: PilgrimageGroup[];
  expenses: Expense[];
  settlements: Settlement[];
  personalBudget: number;

  setProfile: (profile: UserProfile) => void;
  startDeeksha: (params: {
    deekshaId: DeekshaId;
    pilgrimageCenter: string;
    malaDharanamDate: string;
    durationDays: number;
    pilgrimageCount: number;
    targetYatraDate?: string;
  }) => void;
  toggleCheckpoint: (checkpointId: DailyCheckpointId) => void;
  updateWalking: (km: number) => void;
  incrementSaranam: (count?: number) => void;
  unlockJourneyCheckpoint: (checkpointId: string) => void;
  completeDeeksha: () => void;
  saveTemple: (templeId: string) => void;
  createGroup: (name: string, season: string) => void;
  addExpense: (expense: Expense) => void;
  addSettlement: (settlement: Settlement) => void;
  setPersonalBudget: (amount: number) => void;
  getTodayLog: () => DailyLog;
  refreshGamification: () => void;
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: null,
      enrollment: null,
      totalPoints: 0,
      unlockedAchievements: [],
      savedTempleIds: [],
      groups: [],
      expenses: [],
      settlements: [],
      personalBudget: 8000,

      setProfile: (profile) => set({ profile }),

      startDeeksha: (params) => {
        const enrollment: DeekshaEnrollment = {
          id: generateId(),
          deekshaId: params.deekshaId,
          pilgrimageCenter: params.pilgrimageCenter,
          malaDharanamDate: params.malaDharanamDate,
          durationDays: params.durationDays,
          targetYatraDate: params.targetYatraDate,
          pilgrimageCount: params.pilgrimageCount,
          status: 'active',
          dailyLogs: [],
          unlockedJourneyIds: ['mala_dharanam'],
        };
        set({ enrollment });
        get().refreshGamification();
      },

      getTodayLog: () => {
        const { enrollment } = get();
        if (!enrollment) throw new Error('No active enrollment');
        let log = getTodayLog(enrollment);
        if (!log) {
          log = createTodayLog(enrollment);
          set({
            enrollment: {
              ...enrollment,
              dailyLogs: [...enrollment.dailyLogs, log!],
            },
          });
        }
        return log!;
      },

      toggleCheckpoint: (checkpointId) => {
        const { enrollment } = get();
        if (!enrollment) return;
        const log = get().getTodayLog();
        const updated: DailyLog = {
          ...log,
          checkpoints: {
            ...log.checkpoints,
            [checkpointId]: !log.checkpoints[checkpointId],
          },
        };
        const logs = enrollment.dailyLogs.filter((l) => l.date !== log.date);
        set({
          enrollment: { ...enrollment, dailyLogs: [...logs, updated] },
        });
        get().refreshGamification();
      },

      updateWalking: (km) => {
        const { enrollment } = get();
        if (!enrollment) return;
        const log = get().getTodayLog();
        const updated = { ...log, walkingKm: km };
        if (km >= 1) updated.checkpoints = { ...updated.checkpoints, walking: true };
        const logs = enrollment.dailyLogs.filter((l) => l.date !== log.date);
        set({ enrollment: { ...enrollment, dailyLogs: [...logs, updated] } });
        get().refreshGamification();
      },

      incrementSaranam: (count = 1) => {
        const { enrollment } = get();
        if (!enrollment) return;
        const log = get().getTodayLog();
        const newCount = log.saranamCount + count;
        const updated = {
          ...log,
          saranamCount: newCount,
          checkpoints: { ...log.checkpoints, saranam: newCount >= 18 },
        };
        const logs = enrollment.dailyLogs.filter((l) => l.date !== log.date);
        set({ enrollment: { ...enrollment, dailyLogs: [...logs, updated] } });
        get().refreshGamification();
      },

      unlockJourneyCheckpoint: (checkpointId) => {
        const { enrollment } = get();
        if (!enrollment || enrollment.unlockedJourneyIds.includes(checkpointId)) return;
        set({
          enrollment: {
            ...enrollment,
            unlockedJourneyIds: [...enrollment.unlockedJourneyIds, checkpointId],
          },
        });
      },

      completeDeeksha: () => {
        const { enrollment, profile } = get();
        if (!enrollment) return;
        set({
          enrollment: { ...enrollment, status: 'completed' },
          profile: profile
            ? { ...profile, pilgrimageCount: profile.pilgrimageCount + 1, onboardingComplete: true }
            : profile,
        });
        get().refreshGamification();
      },

      saveTemple: (templeId) => {
        const { savedTempleIds } = get();
        if (savedTempleIds.includes(templeId)) return;
        set({ savedTempleIds: [...savedTempleIds, templeId] });
      },

      createGroup: (name, season) => {
        const { profile, groups } = get();
        const group: PilgrimageGroup = {
          id: generateId(),
          name,
          season,
          members: profile
            ? [{ userId: profile.id, name: profile.name, role: 'GROUP_ADMIN' }]
            : [],
          announcements: [],
        };
        set({ groups: [...groups, group] });
      },

      addExpense: (expense) => {
        set({ expenses: [...get().expenses, expense] });
        get().refreshGamification();
      },

      addSettlement: (settlement) => {
        set({ settlements: [...get().settlements, settlement] });
      },

      setPersonalBudget: (amount) => set({ personalBudget: amount }),

      refreshGamification: () => {
        const { enrollment, expenses, profile } = get();
        if (!enrollment) return;
        const totalPoints = calculateTotalPoints(enrollment.dailyLogs);
        const stats = buildAchievementStats(
          enrollment.dailyLogs,
          totalPoints,
          enrollment.status === 'completed',
          expenses.filter((e) => e.groupId).length
        );
        const unlocked = getUnlockedAchievements(stats);

        const day = getCurrentDay(enrollment);
        const autoUnlock = ['day_1', 'day_10', 'day_21', 'day_30', 'day_41'].filter((id) => {
          const num = parseInt(id.replace('day_', ''), 10);
          return day >= num;
        });
        const newUnlocked = [...new Set([...enrollment.unlockedJourneyIds, ...autoUnlock])];

        if (profile) {
          const tier = getSwamiTier(profile.pilgrimageCount + (enrollment.status === 'completed' ? 1 : 0));
          void tier;
        }

        set({
          totalPoints,
          unlockedAchievements: unlocked,
          enrollment: { ...enrollment, unlockedJourneyIds: newUnlocked },
        });
      },
    }),
    {
      name: 'deeksha-journey-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
