import { create } from 'zustand';
import { useEffect, useState } from 'react';
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
  messages: { id: string; author: string; text: string; createdAt: string }[];
  guruName?: string;
  guruApprovalCount: number;
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
  journeyHistory: DeekshaEnrollment[];
  totalPoints: number;
  pendingPoints: number;
  unlockedAchievements: string[];
  savedTempleIds: string[];
  groups: PilgrimageGroup[];
  expenses: Expense[];
  settlements: Settlement[];
  personalBudget: number;
  theme: 'system' | 'light' | 'dark';
  notificationsEnabled: boolean;

  setTheme: (theme: 'system' | 'light' | 'dark') => void;
  toggleNotifications: () => void;
  signOut: () => void;

  setProfile: (profile: UserProfile) => void;
  setLanguage: (language: UserProfile['language']) => void;
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
  addGroupMember: (groupId: string, name: string) => void;
  removeGroupMember: (groupId: string, userId: string) => void;
  setGroupMemberRole: (groupId: string, userId: string, role: GroupMember['role']) => void;
  addGroupMessage: (groupId: string, text: string) => void;
  nominateGroupGuru: (groupId: string, name: string) => void;
  lastDailyCheckinDate: string | null;
  checkAllTasks: () => boolean;
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
      journeyHistory: [],
      totalPoints: 0,
      pendingPoints: 0,
      unlockedAchievements: [],
      savedTempleIds: [],
      groups: [],
      expenses: [],
      settlements: [],
      personalBudget: 8000,
      theme: 'system',
      notificationsEnabled: true,
      lastDailyCheckinDate: null,

      setTheme: (theme) => set({ theme }),
      toggleNotifications: () => set((s) => ({ notificationsEnabled: !s.notificationsEnabled })),
      signOut: () => {
        set({
          profile: null,
          enrollment: null,
          journeyHistory: [],
          totalPoints: 0,
          pendingPoints: 0,
          unlockedAchievements: [],
          savedTempleIds: [],
          groups: [],
          expenses: [],
          settlements: [],
          lastDailyCheckinDate: null,
        });
        try {
          useAppStore.persist.clearStorage();
        } catch {}
      },

      checkAllTasks: () => {
        const { enrollment, lastDailyCheckinDate } = get();
        if (!enrollment) return false;
        const todayStr = new Date().toISOString().slice(0, 10);
        if (lastDailyCheckinDate === todayStr) return false; // already checked in today
        const log = get().getTodayLog();
        // Mark all checkpoints as done
        const allDone: Record<string, boolean> = {};
        for (const key of Object.keys(log.checkpoints)) allDone[key] = true;
        // Also mark saranam as complete (18)
        const updated = {
          ...log,
          checkpoints: { ...log.checkpoints, ...allDone, morning_prayer: true, saranam: true, vegetarian: true, evening_prayer: true, walking: true },
          saranamCount: Math.max(log.saranamCount, 18),
        };
        const logs = enrollment.dailyLogs.filter((l) => l.date !== log.date);
        set({
          enrollment: { ...enrollment, dailyLogs: [...logs, updated] },
          lastDailyCheckinDate: todayStr,
        });
        get().refreshGamification();
        return true;
      },

      setProfile: (profile) => set({ profile }),
      setLanguage: (language) => {
        const profile = get().profile;
        if (profile) set({ profile: { ...profile, language } });
      },

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
        const { enrollment, profile, pendingPoints, totalPoints } = get();
        if (!enrollment) return;
        const completedEnrollment = { ...enrollment, status: 'completed' as const };
        const earnedPoints = calculateTotalPoints(enrollment.dailyLogs);
        const newTotalPoints = totalPoints + (pendingPoints > 0 ? pendingPoints : earnedPoints);
        set({
          enrollment: completedEnrollment,
          totalPoints: newTotalPoints,
          pendingPoints: 0,
          journeyHistory: [...get().journeyHistory.filter((item) => item.id !== enrollment.id), completedEnrollment],
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
          messages: [],
          guruApprovalCount: 0,
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
      addGroupMember: (groupId, name) => {
        const profile = get().profile;
        if (!profile || !name.trim()) return;
        set({
          groups: get().groups.map((g) =>
            g.id === groupId
              ? { ...g, members: [...g.members, { userId: generateId(), name: name.trim(), role: 'MEMBER' }] }
              : g
          ),
        });
      },
      setGroupMemberRole: (groupId, userId, role) =>
        set({ groups: get().groups.map((g) => g.id === groupId ? { ...g, members: g.members.map((m) => m.userId === userId ? { ...m, role } : m) } : g) }),
      removeGroupMember: (groupId, userId) =>
        set({ groups: get().groups.map((g) => g.id === groupId ? { ...g, members: g.members.filter((m) => m.userId !== userId), guruApprovalCount: Math.min(g.guruApprovalCount, Math.max(0, g.members.length - 2)) } : g) }),
      addGroupMessage: (groupId, text) => {
        const profile = get().profile;
        if (!profile || !text.trim()) return;
        set({ groups: get().groups.map((g) => g.id === groupId ? { ...g, messages: [...(g.messages ?? []), { id: generateId(), author: profile.name, text: text.trim(), createdAt: new Date().toISOString() }] } : g) });
      },
      nominateGroupGuru: (groupId, name) =>
        set({ groups: get().groups.map((g) => g.id === groupId ? { ...g, guruName: name, guruApprovalCount: Math.max(0, g.members.length - 1), announcements: [...(g.announcements ?? []), { id: generateId(), text: `Guru approval requested for ${name}`, createdAt: new Date().toISOString() }] } : g) }),

      refreshGamification: () => {
        const { enrollment, expenses, profile, totalPoints } = get();
        if (!enrollment) return;
        const activePoints = calculateTotalPoints(enrollment.dailyLogs);
        const isCompleted = enrollment.status === 'completed';
        const pendingPoints = isCompleted ? 0 : activePoints;
        const combinedPoints = totalPoints + (isCompleted ? 0 : activePoints);

        const stats = buildAchievementStats(
          enrollment.dailyLogs,
          combinedPoints,
          isCompleted,
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
          const tier = getSwamiTier(profile.pilgrimageCount + (isCompleted ? 1 : 0));
          void tier;
        }

        set({
          pendingPoints,
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

/** Returns true once Zustand has finished hydrating from AsyncStorage */
export function useHasHydrated() {
  const [hydrated, setHydrated] = useState(useAppStore.persist.hasHydrated());
  useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useAppStore.persist.hasHydrated());
    return unsub;
  }, []);
  return hydrated;
}
