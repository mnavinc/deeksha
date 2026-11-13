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
import { calculateTotalPoints, buildAchievementStats, getUnlockedAchievements } from '@/engines/gamificationEngine';
import type { Expense, Settlement } from '@/engines/expenseEngine';
import { getSwamiTier } from '@/data/swamiNames';
import { ApiClient } from '@/services/api';

export interface GroupMember {
  userId: string;
  name: string;
  role: 'GROUP_ADMIN' | 'EXPENSE_MANAGER' | 'MEMBER';
}

export interface SannidhanamLocation {
  name: string;
  latitude: number;
  longitude: number;
  isPublic: boolean;
}

export interface PilgrimageGroup {
  id: string;
  name: string;
  season: string;
  route?: string;
  location?: SannidhanamLocation;
  createdAt?: string;
  members: GroupMember[];
  announcements: { id: string; text: string; createdAt: string }[];
  messages: { id: string; author: string; text: string; createdAt: string }[];
  guruName?: string;
  guruApprovalCount: number;
}

export interface UserProfile {
  id: string;
  name: string;
  phone?: string;
  language: 'en' | 'te' | 'ml';
  pilgrimageCount: number;
  onboardingComplete: boolean;
}

export interface QrJoinedMemberTrack {
  userId: string;
  name: string;
  phone?: string;
  sharedName: boolean;
  sharedPhone: boolean;
  pointsAwarded: number;
  joinedAt: string;
}

export interface QrShareLinkRecord {
  trackingId: string;
  sannidhanamId: string;
  sannidhanamName: string;
  referrerId: string;
  channel: 'qr' | 'whatsapp' | 'telegram' | 'instagram' | 'copy';
  url: string;
  createdAt: string;
  joinedMembers: QrJoinedMemberTrack[];
}

export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function isProfileComplete(profile: UserProfile | null): boolean {
  if (!profile) return false;
  const cleanName = profile.name?.trim() ?? '';
  const digits = (profile.phone ?? '').replace(/\D/g, '');
  const isGenericName = cleanName === '' || cleanName.toLowerCase() === 'swami' || cleanName.toLowerCase() === 'member swami';
  return !isGenericName && digits.length >= 10;
}

export interface UserActionLog {
  id: string;
  action: string;
  sannidhanamId?: string;
  referrerId?: string;
  joinedDate?: string;
  eventTags: string[];
  createdAt: string;
}

interface AppState {
  authToken: string | null;
  backendEnrollmentId: string | null;
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
  fontScale: 'normal' | 'large' | 'xlarge';
  highContrast: boolean;
  reduceMotion: boolean;
  joinedSannidhanamId: string | null;
  referrerId: string | null;
  joinedDate: string | null;
  userActionLogs: UserActionLog[];
  qrTrackingLinks: QrShareLinkRecord[];
  pendingProfilePointsClaim: boolean;

  setTheme: (theme: 'system' | 'light' | 'dark') => void;
  toggleNotifications: () => void;
  setFontScale: (fontScale: 'normal' | 'large' | 'xlarge') => void;
  toggleHighContrast: () => void;
  toggleReduceMotion: () => void;
  logUserAction: (action: string, eventTags: string[], extra?: { sannidhanamId?: string; referrerId?: string; joinedDate?: string }) => void;
  createQrTrackingLink: (params: {
    sannidhanamId: string;
    sannidhanamName: string;
    season: string;
    referrerId: string;
    channel: QrShareLinkRecord['channel'];
    eventTag?: string;
    urlBuilder: (trackingId: string) => string;
  }) => QrShareLinkRecord;
  joinSannidhanamByQr: (params: {
    sannidhanamId: string;
    sannidhanamName: string;
    season: string;
    referrerId: string;
    eventTag: string;
    memberName: string;
    phone?: string;
    trackingId?: string;
    pilgrimageCount?: number;
    awardPoints?: boolean;
  }) => void;
  completeProfileForPoints: (params: {
    name: string;
    phone: string;
    pilgrimageCount?: number;
  }) => { awardedPoints: number };
  pruneEmptySannidhanams: (nowMs?: number) => number;
  setGroupPublicLocation: (groupId: string, location: SannidhanamLocation) => void;
  setAuth: (token: string, profile: UserProfile) => void;
  hydrateFromBackend: () => Promise<boolean>;
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

function syncLogIfAuthenticated(authToken: string | null, enrollmentId: string | null, log: DailyLog) {
  if (!authToken || !enrollmentId) return;
  new ApiClient(authToken)
    .saveDailyLog(enrollmentId, {
      logDate: log.date,
      checkpoints: log.checkpoints,
      walkingKm: log.walkingKm,
      saranamCount: log.saranamCount,
      notes: log.notes,
    })
    .catch(() => { });
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      authToken: null,
      backendEnrollmentId: null,
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
      fontScale: 'normal',
      highContrast: false,
      reduceMotion: false,
      joinedSannidhanamId: null,
      referrerId: null,
      joinedDate: null,
      userActionLogs: [],
      qrTrackingLinks: [],
      pendingProfilePointsClaim: false,
      lastDailyCheckinDate: null,

      setTheme: (theme) => set({ theme }),
      toggleNotifications: () => set((s) => ({ notificationsEnabled: !s.notificationsEnabled })),
      setFontScale: (fontScale) => set({ fontScale }),
      toggleHighContrast: () => set((s) => ({ highContrast: !s.highContrast })),
      toggleReduceMotion: () => set((s) => ({ reduceMotion: !s.reduceMotion })),
      setAuth: (token, profile) => set({ authToken: token, profile }),
      hydrateFromBackend: async () => {
        const { authToken } = get();
        if (!authToken) return false;
        const client = new ApiClient(authToken);
        let hasActiveEnrollment = false;

        try {
          const [me, active, remoteGroups] = await Promise.all([
            client.getMe().catch(() => null),
            client.getActiveEnrollment().catch(() => null),
            client.getGroups().catch(() => null),
          ]);

          if (me) {
            const current = get().profile;
            set({
              profile: {
                id: me.id,
                name: me.display_name || current?.name || 'Swami',
                language: me.language ?? current?.language ?? 'te',
                pilgrimageCount: current?.pilgrimageCount ?? 1,
                onboardingComplete: Boolean(active) || Boolean(current?.onboardingComplete),
              },
            });
          }

          if (active && active.id) {
            hasActiveEnrollment = true;
            const remoteLogs = await client.getEnrollmentLogs(active.id).catch(() => []);
            const dailyLogs: DailyLog[] = remoteLogs.map((l, idx) => ({
              date: String(l.log_date).slice(0, 10),
              dayNumber: idx + 1,
              checkpoints: l.checkpoints as Record<DailyCheckpointId, boolean>,
              walkingKm: Number(l.walking_km ?? 0),
              saranamCount: Number(l.saranam_count ?? 0),
              notes: l.notes ?? undefined,
            }));

            const hydratedEnrollment: DeekshaEnrollment = {
              id: active.id,
              deekshaId: active.deeksha_type_id as DeekshaId,
              pilgrimageCenter: active.deeksha_type_id === 'ayyappa' ? 'Sabarimala' : active.deeksha_type_id,
              malaDharanamDate: String(active.mala_dharanam_date).slice(0, 10),
              durationDays: active.duration_days,
              targetYatraDate: active.target_yatra_date ? String(active.target_yatra_date).slice(0, 10) : undefined,
              pilgrimageCount: active.pilgrimage_count ?? 1,
              status: active.status === 'COMPLETED' ? 'completed' : 'active',
              dailyLogs,
              unlockedJourneyIds: ['mala_dharanam'],
            };
            set({ enrollment: hydratedEnrollment, backendEnrollmentId: active.id });
            get().refreshGamification();
          }

          if (Array.isArray(remoteGroups) && remoteGroups.length > 0) {
            set({
              groups: remoteGroups.map((g) => ({
                id: g.id,
                name: g.name,
                season: g.season,
                route: g.route ?? undefined,
                members: g.members ?? [],
                announcements: [],
                messages: [],
                guruApprovalCount: 0,
              })),
            });
          }
        } catch {
          // Offline-first: keep local state if backend is unreachable
        }

        return hasActiveEnrollment;
      },
      signOut: () => {
        set({
          authToken: null,
          backendEnrollmentId: null,
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
        } catch { }
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

        const { authToken } = get();
        if (authToken) {
          new ApiClient(authToken)
            .createEnrollment({
              deekshaTypeId: params.deekshaId,
              malaDharanamDate: params.malaDharanamDate.slice(0, 10),
              durationDays: params.durationDays,
              targetYatraDate: params.targetYatraDate?.slice(0, 10),
              pilgrimageCount: Math.max(1, params.pilgrimageCount),
            })
            .then((remote) => {
              if (remote?.id) set({ backendEnrollmentId: remote.id });
            })
            .catch(() => { });
        }
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
        syncLogIfAuthenticated(get().authToken, get().backendEnrollmentId, updated);
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
        syncLogIfAuthenticated(get().authToken, get().backendEnrollmentId, updated);
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
        syncLogIfAuthenticated(get().authToken, get().backendEnrollmentId, updated);
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
          createdAt: new Date().toISOString(),
          members: profile
            ? [{ userId: profile.id, name: profile.name, role: 'GROUP_ADMIN' }]
            : [],
          announcements: [],
          messages: [],
          guruApprovalCount: 0,
        };
        set({ groups: [...groups, group] });
      },

      logUserAction: (action, eventTags, extra) => {
        const entry: UserActionLog = {
          id: generateId(),
          action,
          sannidhanamId: extra?.sannidhanamId,
          referrerId: extra?.referrerId,
          joinedDate: extra?.joinedDate,
          eventTags,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          userActionLogs: [entry, ...s.userActionLogs].slice(0, 100),
        }));
      },

      createQrTrackingLink: ({ sannidhanamId, sannidhanamName, referrerId, channel, urlBuilder }) => {
        const trackingId = `trk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        const record: QrShareLinkRecord = {
          trackingId,
          sannidhanamId,
          sannidhanamName,
          referrerId,
          channel,
          url: urlBuilder(trackingId),
          createdAt: new Date().toISOString(),
          joinedMembers: [],
        };
        set((s) => ({
          qrTrackingLinks: [record, ...s.qrTrackingLinks].slice(0, 100),
        }));
        return record;
      },

      joinSannidhanamByQr: ({
        sannidhanamId,
        sannidhanamName,
        season,
        referrerId,
        eventTag,
        memberName,
        phone,
        trackingId,
        pilgrimageCount = 1,
        awardPoints = false,
      }) => {
        const nowIso = new Date().toISOString();
        const currentProfile = get().profile;
        const cleanName = memberName.trim() || currentProfile?.name || 'Swami';
        const cleanPhone = (phone ?? currentProfile?.phone ?? '').trim();
        const activeProfile: UserProfile = currentProfile
          ? {
              ...currentProfile,
              name: cleanName !== 'Swami' && cleanName !== 'Member Swami' ? cleanName : currentProfile.name,
              ...(cleanPhone ? { phone: cleanPhone } : {}),
            }
          : {
              id: generateId(),
              name: cleanName,
              ...(cleanPhone ? { phone: cleanPhone } : {}),
              language: 'en',
              pilgrimageCount: Math.max(1, pilgrimageCount),
              onboardingComplete: true,
            };

        const profileReady = isProfileComplete(activeProfile);
        const pointsToAward = awardPoints && profileReady ? 50 : 0;

        const existingGroups = get().groups;
        const existingIndex = existingGroups.findIndex((g) => g.id === sannidhanamId);
        let updatedGroups: PilgrimageGroup[];

        if (existingIndex >= 0) {
          const target = existingGroups[existingIndex];
          const alreadyMember = target.members.some(
            (m) => m.userId === activeProfile.id || m.name.toLowerCase() === activeProfile.name.toLowerCase()
          );
          const updatedTarget = alreadyMember
            ? target
            : {
                ...target,
                members: [
                  ...target.members,
                  { userId: activeProfile.id, name: activeProfile.name, role: 'MEMBER' as const },
                ],
              };
          updatedGroups = existingGroups.map((g, idx) => (idx === existingIndex ? updatedTarget : g));
        } else {
          const newGroup: PilgrimageGroup = {
            id: sannidhanamId,
            name: sannidhanamName,
            season,
            createdAt: nowIso,
            members: [
              { userId: activeProfile.id, name: activeProfile.name, role: 'MEMBER' },
            ],
            announcements: [],
            messages: [
              {
                id: generateId(),
                author: 'Sannidhanam',
                text: `${activeProfile.name} joined via QR invite! Swamiye Saranam Ayyappa 🙏`,
                createdAt: nowIso,
              },
            ],
            guruApprovalCount: 0,
          };
          updatedGroups = [newGroup, ...existingGroups];
        }

        const resolvedTrackingId = trackingId?.trim() || `qr_${sannidhanamId}`;
        const existingLinks = get().qrTrackingLinks;
        const linkIdx = existingLinks.findIndex((l) => l.trackingId === resolvedTrackingId);
        const joinedEntry: QrJoinedMemberTrack = {
          userId: activeProfile.id,
          name: activeProfile.name,
          ...(activeProfile.phone ? { phone: activeProfile.phone } : {}),
          sharedName: activeProfile.name.toLowerCase() !== 'swami' && activeProfile.name.toLowerCase() !== 'member swami',
          sharedPhone: (activeProfile.phone ?? '').replace(/\D/g, '').length >= 10,
          pointsAwarded: pointsToAward,
          joinedAt: nowIso,
        };

        let updatedLinks: QrShareLinkRecord[];
        if (linkIdx >= 0) {
          updatedLinks = existingLinks.map((l, idx) => {
            if (idx !== linkIdx) return l;
            const filtered = l.joinedMembers.filter((jm) => jm.userId !== activeProfile.id);
            return { ...l, joinedMembers: [joinedEntry, ...filtered] };
          });
        } else {
          updatedLinks = [
            {
              trackingId: resolvedTrackingId,
              sannidhanamId,
              sannidhanamName,
              referrerId,
              channel: 'qr' as const,
              url: `https://deeksha-sigma.vercel.app/invite?s=${encodeURIComponent(sannidhanamId)}&tid=${encodeURIComponent(resolvedTrackingId)}`,
              createdAt: nowIso,
              joinedMembers: [joinedEntry],
            },
            ...existingLinks,
          ].slice(0, 100);
        }

        const logEntry: UserActionLog = {
          id: generateId(),
          action: 'joined_sannidhanam_qr',
          sannidhanamId,
          referrerId,
          joinedDate: nowIso,
          eventTags: Array.from(new Set([eventTag, 'qr_invite', 'sannidhanam_join', profileReady ? 'profile_complete' : 'profile_pending'])),
          createdAt: nowIso,
        };

        set((s) => ({
          profile: activeProfile,
          groups: updatedGroups,
          joinedSannidhanamId: sannidhanamId,
          referrerId,
          joinedDate: nowIso,
          totalPoints: s.totalPoints + pointsToAward,
          pendingProfilePointsClaim: !profileReady,
          qrTrackingLinks: updatedLinks,
          userActionLogs: [logEntry, ...s.userActionLogs].slice(0, 100),
        }));
      },

      completeProfileForPoints: ({ name, phone, pilgrimageCount }) => {
        const cleanName = name.trim();
        const cleanPhone = phone.trim();
        const digits = cleanPhone.replace(/\D/g, '');
        if (!cleanName || digits.length < 10) {
          return { awardedPoints: 0 };
        }

        const state = get();
        const currentProfile = state.profile;
        const updatedProfile: UserProfile = currentProfile
          ? {
              ...currentProfile,
              name: cleanName,
              phone: cleanPhone,
              pilgrimageCount: pilgrimageCount ? Math.max(1, pilgrimageCount) : currentProfile.pilgrimageCount,
              onboardingComplete: true,
            }
          : {
              id: generateId(),
              name: cleanName,
              phone: cleanPhone,
              language: 'en',
              pilgrimageCount: Math.max(1, pilgrimageCount ?? 1),
              onboardingComplete: true,
            };

        const shouldAward = state.pendingProfilePointsClaim || !isProfileComplete(currentProfile);
        const awardedPoints = shouldAward ? 50 : 0;

        const updatedGroups = state.groups.map((g) => ({
          ...g,
          members: g.members.map((m) =>
            m.userId === updatedProfile.id ? { ...m, name: cleanName } : m
          ),
        }));

        const updatedLinks = state.qrTrackingLinks.map((link) => ({
          ...link,
          joinedMembers: link.joinedMembers.map((jm) =>
            jm.userId === updatedProfile.id
              ? {
                  ...jm,
                  name: cleanName,
                  phone: cleanPhone,
                  sharedName: true,
                  sharedPhone: true,
                  pointsAwarded: Math.max(jm.pointsAwarded, awardedPoints),
                }
              : jm
          ),
        }));

        set({
          profile: updatedProfile,
          groups: updatedGroups,
          qrTrackingLinks: updatedLinks,
          totalPoints: state.totalPoints + awardedPoints,
          pendingProfilePointsClaim: false,
        });

        return { awardedPoints };
      },

      pruneEmptySannidhanams: (nowMs = Date.now()) => {
        const { groups } = get();
        const kept = groups.filter((g) => {
          if (g.members.length > 0) return true;
          if (!g.createdAt) return true;
          const ageMs = nowMs - Date.parse(g.createdAt);
          return Number.isNaN(ageMs) || ageMs < THIRTY_DAYS_MS;
        });
        const removedCount = groups.length - kept.length;
        if (removedCount > 0) {
          set({ groups: kept });
        }
        return removedCount;
      },

      setGroupPublicLocation: (groupId, location) => {
        set((s) => ({
          groups: s.groups.map((g) => (g.id === groupId ? { ...g, location } : g)),
        }));
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
        if (!isProfileComplete(profile) || !name.trim()) return;
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
        if (!isProfileComplete(profile) || !profile || !text.trim()) return;
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
      onRehydrateStorage: () => (state) => {
        state?.pruneEmptySannidhanams();
      },
    }
  )
);

/** Returns true once Zustand has finished hydrating from AsyncStorage */
export function useHasHydrated() {
  const [hydrated, setHydrated] = useState(() => useAppStore.persist.hasHydrated());
  useEffect(() => {
    if (useAppStore.persist.hasHydrated()) return;
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);
  return hydrated;
}
