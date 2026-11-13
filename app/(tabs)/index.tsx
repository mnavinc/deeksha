import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Animated, useWindowDimensions } from 'react-native';
import { useState, useCallback } from 'react';
import { router } from 'expo-router';
import { isProfileComplete, useAppStore } from '@/store/useAppStore';
import { getDeekshaType } from '@/data/deekshaTypes';
import { getCurrentDay, getDaysRemaining, getDayProgress } from '@/engines/deekshaEngine';
import { calculateDayPoints } from '@/engines/gamificationEngine';
import { calculateSunTimes, getTimelyDeekshaAlert } from '@/utils/solarTimes';
import { AvatarDisplay } from '@/components/AvatarDisplay';
import { ProgressBar } from '@/components/ProgressBar';
import { DailyChecklist } from '@/components/DailyChecklist';
import { InteractiveJapamala } from '@/components/InteractiveJapamala';
import { SacredCelebrationBurst } from '@/components/SacredCelebrationBurst';
import { HeaderNav } from '@/components/HeaderNav';
import { useThemeColors, useFontScale, spacing } from '@/theme/colors';
import { getClayStyle } from '@/theme/claymorphism';
import { useI18n } from '@/i18n';

export default function HomeScreen() {
  const { t } = useI18n();
  const colors = useThemeColors();
  const fontScale = useFontScale();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const theme = useAppStore((s) => s.theme);
  const reduceMotion = useAppStore((s) => s.reduceMotion);
  const activeTheme = theme === 'system' ? 'dark' : theme;

  const profile = useAppStore((s) => s.profile);
  const enrollment = useAppStore((s) => s.enrollment);
  const totalPoints = useAppStore((s) => s.totalPoints);
  const toggleCheckpoint = useAppStore((s) => s.toggleCheckpoint);
  const incrementSaranam = useAppStore((s) => s.incrementSaranam);
  const checkAllTasks = useAppStore((s) => s.checkAllTasks);
  const lastDailyCheckinDate = useAppStore((s) => s.lastDailyCheckinDate);
  const getTodayLog = useAppStore((s) => s.getTodayLog);
  const expenses = useAppStore((s) => s.expenses);
  const groups = useAppStore((s) => s.groups);

  const pendingPoints = useAppStore((s) => s.pendingPoints);

  const [tasksExpanded, setTasksExpanded] = useState(false);
  const [checkinDone, setCheckinDone] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const [pulseAnim] = useState(() => new Animated.Value(1));

  const todayStr = new Date().toISOString().slice(0, 10);
  const alreadyCheckedIn = lastDailyCheckinDate === todayStr;

  const handleCheckin = useCallback(() => {
    checkAllTasks();
    setCheckinDone(true);
    if (!reduceMotion) {
      setBurstKey((k) => k + 1);
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 150, useNativeDriver: true }),
        Animated.spring(pulseAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();
    }
  }, [checkAllTasks, pulseAnim, reduceMotion]);

  if (!enrollment || !profile) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <HeaderNav />
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyIcon}>🛕</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('deeksha')} — {t('active')}</Text>
          <TouchableOpacity onPress={() => router.push('/onboarding/welcome')}>
            <Text style={[styles.link, { color: colors.primary }]}>{t('startJourney')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const deeksha = getDeekshaType(enrollment.deekshaId)!;
  const day = getCurrentDay(enrollment);
  const remaining = getDaysRemaining(enrollment);
  const progress = getDayProgress(enrollment);
  const todayLog = getTodayLog();
  const todayPoints = calculateDayPoints(todayLog);
  const groupExpenses = expenses.filter((e) => e.groupId);
  const groupTotal = groupExpenses.reduce((s, e) => s + e.amount, 0);

  const isCheckedIn = alreadyCheckedIn || checkinDone;
  const sunTimes = calculateSunTimes();
  const needsProfileCompletion = !isProfileComplete(profile);
  const timelyAlert = getTimelyDeekshaAlert(new Date(), sunTimes, needsProfileCompletion, profile.language);

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <HeaderNav />
      {!reduceMotion && <SacredCelebrationBurst triggerKey={burstKey} />}

      <ScrollView contentContainerStyle={[styles.content, isWide && styles.contentWide]}>
        {/* Saranam Banner */}
        <Text style={[styles.saranam, { color: colors.primary, fontSize: Math.round(13 * fontScale) }]}>
          {deeksha.rules.commonSaranam ?? 'Swamiye Saranam Ayyappa'}
        </Text>

        {/* Compact Sunrise, Sunset & Timely Alert Strip */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/groups')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Today's Sunrise, Sunset and Timely Alert"
          style={[
            {
              backgroundColor: colors.surface,
              borderColor: timelyAlert.urgency === 'warning' ? colors.primary : colors.border,
              borderWidth: 1,
              borderRadius: 14,
              padding: spacing.sm,
              marginBottom: spacing.xs,
            },
          ]}
        >
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>
            🌅 {sunTimes.sunrise} · 🌇 {sunTimes.sunset} — {timelyAlert.title}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
            {timelyAlert.body}
          </Text>
        </TouchableOpacity>

        <View style={[styles.widgetGrid, isWide && styles.widgetGridWide]}>
          {/* Left Column (or Top on Mobile): Check-in, Avatar, Progress, Streak */}
          <View style={[styles.widgetCol, isWide && styles.widgetColWide]}>
            {/* ✅ Daily Check-in Card */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.checkinCard,
                  getClayStyle(activeTheme, 'medium'),
                  isCheckedIn
                    ? { backgroundColor: '#1a4a2e', borderColor: '#34d399' }
                    : { backgroundColor: colors.primary + '18', borderColor: colors.primary },
                ]}
                onPress={isCheckedIn ? undefined : handleCheckin}
                activeOpacity={isCheckedIn ? 1 : 0.85}
                accessibilityRole="button"
                accessibilityLabel="Daily check-in"
                accessibilityState={{ checked: isCheckedIn }}
              >
                <View style={styles.checkinRow}>
                  <Text style={styles.checkinIcon}>{isCheckedIn ? '✅' : '☀️'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.checkinTitle, { color: isCheckedIn ? '#34d399' : colors.primary, fontSize: Math.round(15 * fontScale) }]}>
                      {isCheckedIn ? 'నేటి దీక్ష సంపన్నం! • Today Complete!' : "నేటి దీక్ష చేయి • Today's Check-in"}
                    </Text>
                    <Text style={[styles.checkinSub, { color: colors.textMuted, fontSize: Math.round(12 * fontScale) }]}>
                      {isCheckedIn
                        ? `+${todayPoints} పాయింట్లు జమ అయ్యాయి • points earned`
                        : 'అన్ని నిత్య నియమాలు ఒకే క్లిక్‌తో • All tasks in one tap'}
                    </Text>
                  </View>
                  {!isCheckedIn && (
                    <View style={[styles.checkinBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.checkinBadgeText}>+{todayPoints}pts</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Avatar + Progress */}
            <AvatarDisplay
              points={totalPoints + pendingPoints}
              pilgrimageCount={enrollment.pilgrimageCount}
              name={profile.name}
            />

            <View
              style={[
                styles.dayCard,
                getClayStyle(activeTheme, 'medium'),
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.deekshaName, { color: colors.textDim }]}>{deeksha.name.toUpperCase()}</Text>
              <Text style={[styles.dayText, { color: colors.text, fontSize: Math.round(28 * fontScale) }]}>
                {t('day')} {day} / {enrollment.durationDays}
              </Text>
              <ProgressBar progress={progress} color={colors.primary} />
              <Text style={[styles.remaining, { color: colors.textMuted, fontSize: Math.round(12 * fontScale) }]}>{remaining} {t('daysUntilReady')}</Text>
            </View>

            <View style={styles.pointsRow}>
              <Text style={[styles.pointsToday, { color: colors.success, fontSize: Math.round(14 * fontScale) }]}>+{todayPoints} {t('today')}</Text>
              <Text style={[styles.pointsTotal, { color: colors.primary, fontSize: Math.round(14 * fontScale) }]}>
                {totalPoints} pts {pendingPoints > 0 ? `(+${pendingPoints} active)` : ''}
              </Text>
            </View>

            {/* 🔥 Gamified Lifestyle Streak & Habit Pillars */}
            <View
              style={[
                styles.section,
                getClayStyle(activeTheme, 'medium'),
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.tasksHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontSize: Math.round(14 * fontScale) }]}>
                  🔥 {enrollment.dailyLogs.length} Day Streak · Lifestyle Pillars
                </Text>
                <TouchableOpacity onPress={() => router.push('/guide' as any)} accessibilityRole="link">
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>
                    Kanni Guide →
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                {[
                  { label: '🌅 Pooja', done: todayLog.checkpoints.prayer },
                  { label: `📿 ${todayLog.saranamCount}/108`, done: todayLog.saranamCount >= 18 },
                  { label: '🍽️ Sattvic', done: todayLog.checkpoints.vegetarian },
                  { label: '👣 Walk', done: todayLog.checkpoints.walking },
                  { label: '🕯️ Evening', done: todayLog.checkpoints.eveningPrayer },
                ].map((pill, i) => (
                  <View
                    key={i}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: pill.done ? colors.success : colors.border,
                      backgroundColor: pill.done ? '#3FB95018' : colors.background,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: pill.done ? colors.success : colors.textMuted }}>
                      {pill.done ? '✓ ' : ''}{pill.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Right Column (or Bottom on Mobile): Japamala, Daily Niyamas, Groups, Quick Actions */}
          <View style={[styles.widgetCol, isWide && styles.widgetColWide]}>
            {/* Interactive 108-Bead Japamala */}
            <InteractiveJapamala
              saranamCount={todayLog.saranamCount}
              onChant={(amount) => incrementSaranam(amount)}
              onMilestone={() => {
                if (!reduceMotion) setBurstKey((k) => k + 1);
              }}
            />

            {/* Tasks collapsible section */}
            <View style={[styles.tasksSection, getClayStyle(activeTheme, 'low'), { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.tasksHeader}
                onPress={() => setTasksExpanded(!tasksExpanded)}
                accessibilityRole="button"
                accessibilityLabel="Toggle daily tasks"
                accessibilityState={{ expanded: tasksExpanded }}
              >
                <Text style={[styles.tasksSectionTitle, { color: colors.text, fontSize: Math.round(14 * fontScale) }]}>
                  📋 నిత్య నియమాలు • Daily Niyamas
                </Text>
                <Text style={[styles.tasksChevron, { color: colors.textMuted }]}>
                  {tasksExpanded ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>

              {tasksExpanded && (
                <DailyChecklist
                  checkpoints={todayLog.checkpoints}
                  onToggle={toggleCheckpoint}
                  saranamCount={todayLog.saranamCount}
                  onSaranamPress={() => incrementSaranam(18)}
                />
              )}
            </View>

            {groups.length > 0 && (
              <View
                style={[
                  styles.section,
                  getClayStyle(activeTheme, 'low'),
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('groups')}</Text>
                <Text style={[styles.sectionText, { color: colors.textMuted }]}>
                  {groups[0].name} · {groups[0].members.length} {t('members')}
                </Text>
                {groupTotal > 0 && (
                  <Text style={[styles.sectionMeta, { color: colors.primary }]}>
                    {t('groupExpenses')}: ₹{groupTotal.toLocaleString('en-IN')}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[
                  styles.action,
                  getClayStyle(activeTheme, 'low'),
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={() => router.push('/(tabs)/journey')}
                accessibilityRole="button"
                accessibilityLabel={t('journey')}
              >
                <Text style={styles.actionIcon}>🗺️</Text>
                <Text style={[styles.actionLabel, { color: colors.textMuted }]}>{t('journey')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.action,
                  getClayStyle(activeTheme, 'low'),
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={() => router.push('/(tabs)/map')}
                accessibilityRole="button"
                accessibilityLabel={t('temples')}
              >
                <Text style={styles.actionIcon}>🛕</Text>
                <Text style={[styles.actionLabel, { color: colors.textMuted }]}>{t('temples')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.action,
                  getClayStyle(activeTheme, 'low'),
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={() => router.push('/donations' as any)}
                accessibilityRole="button"
                accessibilityLabel={t('donations')}
              >
                <Text style={styles.actionIcon}>🤲</Text>
                <Text style={[styles.actionLabel, { color: colors.textMuted }]}>{t('donations')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 60, gap: spacing.md },
  contentWide: { maxWidth: 1140, width: '100%', alignSelf: 'center', paddingHorizontal: spacing.lg },
  widgetGrid: { gap: spacing.md },
  widgetGridWide: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg },
  widgetCol: { gap: spacing.md },
  widgetColWide: { flex: 1 },
  saranam: { textAlign: 'center', fontSize: 13, fontWeight: '700' },

  // --- Check-in card ---
  checkinCard: {
    padding: spacing.md,
    borderRadius: 20,
    borderWidth: 2,
  },
  checkinRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkinIcon: { fontSize: 32 },
  checkinTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  checkinSub: { fontSize: 12 },
  checkinBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  checkinBadgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  // --- Day card ---
  dayCard: { padding: spacing.lg, borderRadius: 20, borderWidth: 1, gap: spacing.sm },
  deekshaName: { fontSize: 11, letterSpacing: 1.5, fontWeight: '700' },
  dayText: { fontSize: 28, fontWeight: '800' },
  remaining: { fontSize: 12 },

  pointsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pointsToday: { fontWeight: '700' },
  pointsTotal: { fontWeight: '700' },

  // --- Tasks collapsible ---
  tasksSection: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  tasksSectionTitle: { fontWeight: '700', fontSize: 14 },
  tasksChevron: { fontSize: 12 },

  section: { padding: spacing.md, borderRadius: 16, borderWidth: 1 },
  sectionTitle: { fontWeight: '700', marginBottom: 4 },
  sectionText: { fontSize: 13 },
  sectionMeta: { fontSize: 13, marginTop: 4, fontWeight: '600' },

  quickActions: { flexDirection: 'row', gap: spacing.sm },
  action: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  actionIcon: { fontSize: 24, marginBottom: 4 },
  actionLabel: { fontSize: 11, fontWeight: '600' },

  empty: { flex: 1 },
  emptyCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { fontSize: 56 },
  emptyText: { fontSize: 16 },
  link: { fontSize: 16, fontWeight: '600' },
});
