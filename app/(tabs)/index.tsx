import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { getDeekshaType } from '@/data/deekshaTypes';
import { getCurrentDay, getDaysRemaining, getDayProgress } from '@/engines/deekshaEngine';
import { calculateDayPoints } from '@/engines/gamificationEngine';
import { AvatarDisplay } from '@/components/AvatarDisplay';
import { ProgressBar } from '@/components/ProgressBar';
import { DailyChecklist } from '@/components/DailyChecklist';
import { colors, spacing } from '@/theme/colors';
import { useI18n } from '@/i18n';

export default function HomeScreen() {
  const { t } = useI18n();
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
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t('deeksha')} — {t('active')}</Text>
        <TouchableOpacity onPress={() => router.push('/onboarding/welcome')}>
          <Text style={styles.link}>{t('startJourney')}</Text>
        </TouchableOpacity>
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.saranam}>{deeksha.rules.commonSaranam ?? 'Swamiye Saranam Ayyappa'}</Text>

      <AvatarDisplay
        points={totalPoints}
        pilgrimageCount={enrollment.pilgrimageCount}
        name={profile.name}
      />

      <View style={styles.dayCard}>
        <Text style={styles.deekshaName}>{deeksha.name.toUpperCase()}</Text>
        <Text style={styles.dayText}>
          {t('day')} {day} / {enrollment.durationDays}
        </Text>
        <ProgressBar progress={progress} color={colors.primary} />
        <Text style={styles.remaining}>{remaining} days until pilgrimage readiness</Text>
      </View>

      <View style={styles.pointsRow}>
        <Text style={styles.pointsToday}>+{todayPoints} {t('today')}</Text>
        <Text style={styles.pointsTotal}>{totalPoints} {t('points')}</Text>
      </View>

      <DailyChecklist
        checkpoints={todayLog.checkpoints}
        onToggle={toggleCheckpoint}
        saranamCount={todayLog.saranamCount}
        onSaranamPress={() => incrementSaranam(18)}
      />

      {groups.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('groups')}</Text>
          <Text style={styles.sectionText}>
            {groups[0].name} · {groups[0].members.length} members
          </Text>
          {groupTotal > 0 && (
            <Text style={styles.sectionMeta}>Group expenses: ₹{groupTotal.toLocaleString('en-IN')}</Text>
          )}
        </View>
      )}

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.action} onPress={() => router.push('/(tabs)/journey')}>
          <Text style={styles.actionIcon}>🗺️</Text>
          <Text style={styles.actionLabel}>{t('journey')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} onPress={() => router.push('/(tabs)/map')}>
          <Text style={styles.actionIcon}>🛕</Text>
          <Text style={styles.actionLabel}>{t('temples')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} onPress={() => router.push('/(tabs)/groups')}>
          <Text style={styles.actionIcon}>👥</Text>
          <Text style={styles.actionLabel}>{t('groups')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40, gap: spacing.md },
  saranam: { color: colors.primary, textAlign: 'center', fontSize: 13, fontWeight: '500' },
  dayCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  deekshaName: { color: colors.textMuted, fontSize: 11, letterSpacing: 1 },
  dayText: { color: colors.text, fontSize: 28, fontWeight: '700' },
  remaining: { color: colors.textMuted, fontSize: 12 },
  pointsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pointsToday: { color: colors.success, fontWeight: '600' },
  pointsTotal: { color: colors.primary, fontWeight: '600' },
  section: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: { color: colors.text, fontWeight: '600', marginBottom: 4 },
  sectionText: { color: colors.textMuted, fontSize: 13 },
  sectionMeta: { color: colors.primary, fontSize: 13, marginTop: 4 },
  quickActions: { flexDirection: 'row', gap: spacing.sm },
  action: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: { fontSize: 24, marginBottom: 4 },
  actionLabel: { color: colors.textMuted, fontSize: 11 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  emptyText: { color: colors.textMuted, fontSize: 16 },
  link: { color: colors.primary, marginTop: spacing.md, fontSize: 16 },
});
