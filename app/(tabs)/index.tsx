import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { getDeekshaType } from '@/data/deekshaTypes';
import { getCurrentDay, getDaysRemaining, getDayProgress } from '@/engines/deekshaEngine';
import { calculateDayPoints } from '@/engines/gamificationEngine';
import { AvatarDisplay } from '@/components/AvatarDisplay';
import { ProgressBar } from '@/components/ProgressBar';
import { DailyChecklist } from '@/components/DailyChecklist';
import { HeaderNav } from '@/components/HeaderNav';
import { useThemeColors, spacing } from '@/theme/colors';
import { getClayStyle } from '@/theme/claymorphism';
import { useI18n } from '@/i18n';

export default function HomeScreen() {
  const { t } = useI18n();
  const colors = useThemeColors();
  const theme = useAppStore((s) => s.theme);
  const activeTheme = theme === 'system' ? 'dark' : theme;

  const profile = useAppStore((s) => s.profile);
  const enrollment = useAppStore((s) => s.enrollment);
  const totalPoints = useAppStore((s) => s.totalPoints);
  const toggleCheckpoint = useAppStore((s) => s.toggleCheckpoint);
  const incrementSaranam = useAppStore((s) => s.incrementSaranam);
  const getTodayLog = useAppStore((s) => s.getTodayLog);
  const expenses = useAppStore((s) => s.expenses);
  const groups = useAppStore((s) => s.groups);

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

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <HeaderNav />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.saranam, { color: colors.primary }]}>
          {deeksha.rules.commonSaranam ?? 'Swamiye Saranam Ayyappa'}
        </Text>

        <AvatarDisplay
          points={totalPoints}
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
          <Text style={[styles.dayText, { color: colors.text }]}>
            {t('day')} {day} / {enrollment.durationDays}
          </Text>
          <ProgressBar progress={progress} color={colors.primary} />
          <Text style={[styles.remaining, { color: colors.textMuted }]}>{remaining} {t('daysUntilReady')}</Text>
        </View>

        <View style={styles.pointsRow}>
          <Text style={[styles.pointsToday, { color: colors.success }]}>+{todayPoints} {t('today')}</Text>
          <Text style={[styles.pointsTotal, { color: colors.primary }]}>{totalPoints} {t('points')}</Text>
        </View>

        <DailyChecklist
          checkpoints={todayLog.checkpoints}
          onToggle={toggleCheckpoint}
          saranamCount={todayLog.saranamCount}
          onSaranamPress={() => incrementSaranam(18)}
        />

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
            onPress={() => router.push('/store')}
          >
            <Text style={styles.actionIcon}>🛍️</Text>
            <Text style={[styles.actionLabel, { color: colors.textMuted }]}>{t('poojaStore')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.action,
              getClayStyle(activeTheme, 'low'),
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => router.push('/donations')}
          >
            <Text style={styles.actionIcon}>🤲</Text>
            <Text style={[styles.actionLabel, { color: colors.textMuted }]}>{t('donations')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 60, gap: spacing.md },
  saranam: { textAlign: 'center', fontSize: 13, fontWeight: '700' },
  dayCard: {
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.sm,
  },
  deekshaName: { fontSize: 11, letterSpacing: 1.5, fontWeight: '700' },
  dayText: { fontSize: 28, fontWeight: '800' },
  remaining: { fontSize: 12 },
  pointsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pointsToday: { fontWeight: '700' },
  pointsTotal: { fontWeight: '700' },
  section: {
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
  },
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
