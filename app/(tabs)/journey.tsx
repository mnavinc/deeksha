import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { getJourneyForDeeksha } from '@/data/journeyCheckpoints';
import { useAppStore } from '@/store/useAppStore';
import { getCurrentDay } from '@/engines/deekshaEngine';
import { useThemeColors, spacing } from '@/theme/colors';
import { getClayStyle } from '@/theme/claymorphism';
import { JourneyTrailMap } from '@/components/JourneyTrailMap';
import { HeaderNav } from '@/components/HeaderNav';
import { QuickMalaSetupCard } from '@/components/QuickMalaSetupCard';
import { SacredIcon, getCheckpointIconName } from '@/components/SacredIcons';
import { useI18n } from '@/i18n';

type ViewMode = 'map' | 'timeline';

export default function JourneyScreen() {
  const profile = useAppStore((s) => s.profile);
  const enrollment = useAppStore((s) => s.enrollment);
  const unlock = useAppStore((s) => s.unlockJourneyCheckpoint);
  const groups = useAppStore((s) => s.groups);
  const { t } = useI18n();
  const colors = useThemeColors();
  const theme = useAppStore((s) => s.theme);
  const activeTheme = theme === 'system' ? 'dark' : theme;

  const [viewMode, setViewMode] = useState<ViewMode>('map');

  if (!enrollment) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <HeaderNav />
        {profile ? (
          <ScrollView contentContainerStyle={styles.content}>
            <QuickMalaSetupCard />
          </ScrollView>
        ) : (
          <View style={styles.emptyCenter}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('startDeekshaPrompt')}</Text>
          </View>
        )}
      </View>
    );
  }

  const day = getCurrentDay(enrollment);
  const items = getJourneyForDeeksha(enrollment.deekshaId);
  const isTe = t('home') === 'హోమ్';
  const publicSannidhanams = groups.filter((g) => g.location?.isPublic);

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <HeaderNav />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerText}>
          <Text style={[styles.heading, { color: colors.text }]}>
            {enrollment.deekshaId === 'ayyappa' ? t('journeyTitle') : t('trail')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('trailHint')}</Text>
        </View>

        {/* View Toggle */}
        <View style={[styles.toggle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'map' && { backgroundColor: colors.primary }]}
            onPress={() => setViewMode('map')}
          >
            <Ionicons name="map" size={16} color={viewMode === 'map' ? '#0D1117' : colors.textMuted} />
            <Text style={[styles.toggleText, { color: colors.textMuted }, viewMode === 'map' && { color: '#0D1117', fontWeight: '800' }]}>
              {t('journeyViewMap')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'timeline' && { backgroundColor: colors.primary }]}
            onPress={() => setViewMode('timeline')}
          >
            <Ionicons name="list" size={16} color={viewMode === 'timeline' ? '#0D1117' : colors.textMuted} />
            <Text style={[styles.toggleText, { color: colors.textMuted }, viewMode === 'timeline' && { color: '#0D1117', fontWeight: '800' }]}>
              {t('journeyViewTimeline')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {viewMode === 'map' ? (
          /* ── MAP VIEW ── */
          <>
            <JourneyTrailMap
              checkpoints={items}
              currentDay={day}
              unlockedIds={enrollment.unlockedJourneyIds}
              deekshaId={enrollment.deekshaId}
              onUnlockMilestone={unlock}
            />
          </>
        ) : (
          /* ── TIMELINE VIEW ── */
          <>
            {items.map((item, index) => {
              const unlocked = enrollment.unlockedJourneyIds.includes(item.id) || (item.dayUnlock ?? Infinity) <= day;
              const isLast = index === items.length - 1;
              const titleKey = `cp_${item.id}_title` as any;
              const descKey = `cp_${item.id}_desc` as any;
              const phaseKey = `phase_${item.phase}` as any;

              const title = t(titleKey) !== titleKey ? t(titleKey) : item.name;
              const description = t(descKey) !== descKey ? t(descKey) : item.description;
              const phaseName = t(phaseKey) !== phaseKey ? t(phaseKey) : item.phase;

              return (
                <Animated.View key={item.id} entering={FadeInDown.delay(Math.min(index * 45, 450)).duration(320)}>
                <TouchableOpacity
                  disabled={!unlocked}
                  onPress={() => unlock(item.id)}
                  style={styles.timelineRow}
                  activeOpacity={0.8}
                >
                  {/* Connector line */}
                  <View style={styles.connectorCol}>
                    <View style={[styles.dot, unlocked ? { backgroundColor: colors.primary, borderColor: '#FFFBE6' } : { backgroundColor: '#314B42', borderColor: colors.border }]} />
                    {!isLast && <View style={[styles.connector, { backgroundColor: colors.border }, unlocked && { backgroundColor: colors.primary, opacity: 0.4 }]} />}
                  </View>

                  {/* Card */}
                  <View
                    style={[
                      styles.timelineCard,
                      getClayStyle(activeTheme, unlocked ? 'medium' : 'low'),
                      { backgroundColor: colors.surface, borderColor: unlocked ? colors.primary : colors.border },
                      !unlocked && { opacity: 0.5 },
                    ]}
                  >
                    <View style={styles.timelineTop}>
                      <SacredIcon
                        name={unlocked ? getCheckpointIconName(item.id) : 'lock'}
                        size={30}
                        withBadge
                        accent={unlocked ? colors.primary : '#4A6B57'}
                      />
                      <View style={styles.timelineCopy}>
                        <Text style={[styles.timelineTitle, { color: unlocked ? colors.text : colors.textDim }]}>{title}</Text>
                        <Text style={[styles.timelinePhase, { color: colors.textDim }]}>
                          {phaseName} ·{' '}
                          <Text style={{ color: colors.primary, fontWeight: '600' }}>
                            {item.category === 'OFFICIAL' ? t('officialGuidance') : t('traditionalPractice')}
                          </Text>
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.timelineDesc, { color: unlocked ? colors.textMuted : colors.textDim }]}>
                      {unlocked
                        ? description
                        : item.dayUnlock
                        ? `${t('availableOnDay')} ${item.dayUnlock}`
                        : t('availableDuringPilgrimage')}
                    </Text>
                  </View>
                </TouchableOpacity>
                </Animated.View>
              );
            })}
          </>
        )}

        {/* Public Sannidhanams on Trail */}
        {publicSannidhanams.length > 0 && (
          <View
            style={[
              styles.sannidhanamTrailCard,
              getClayStyle(activeTheme, 'low'),
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.sannidhanamTrailHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <Ionicons name="location" size={16} color={colors.primary} />
                <Text style={[styles.sannidhanamTrailTitle, { color: colors.text }]}>
                  {isTe ? 'ట్రైల్‌పై పబ్లిక్ సన్నిధానాలు' : 'Public Sannidhanams on Trail'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/map')}
                accessibilityRole="button"
                accessibilityLabel="Open Temples and Sannidhanams Map"
              >
                <Text style={[styles.sannidhanamMapLink, { color: colors.primary }]}>
                  {isTe ? 'మ్యాప్ చూడండి →' : 'View on Map →'}
                </Text>
              </TouchableOpacity>
            </View>
            {publicSannidhanams.map((g) => (
              <TouchableOpacity
                key={g.id}
                onPress={() => router.push('/(tabs)/map')}
                style={[styles.sannidhanamRow, { borderColor: colors.border }]}
                accessibilityRole="button"
                accessibilityLabel={`Open ${g.name} on map`}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sannidhanamName, { color: colors.text }]}>{g.name}</Text>
                  <Text style={[styles.sannidhanamLoc, { color: colors.textMuted }]}>
                    {g.location?.name} · {g.location?.latitude.toFixed(4)}, {g.location?.longitude.toFixed(4)}
                  </Text>
                </View>
                <Ionicons name="navigate-outline" size={16} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Compact Official Sabarimala Virtual-Q Darshan & Prasadams Banner */}
        <View
          style={[
            styles.bookingCard,
            getClayStyle(activeTheme, 'low'),
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.bookingTop}>
            <SacredIcon name="temple" size={24} color="#FFFBE6" accent={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bookingTitle, { color: colors.text }]}>
                {isTe ? 'శబరిమల అధికారిక దర్శనం & ప్రసాదాలు' : 'Sabarimala Darshan & Prasadams'}
              </Text>
              <Text style={[styles.bookingSub, { color: colors.textMuted }]}>
                {isTe
                  ? 'Travancore Devaswom Board Virtual-Q & అప్పం/అరవణ బుకింగ్'
                  : 'Official Virtual-Q slot, Appam & Aravana Prasadam'}
              </Text>
            </View>
          </View>
          <View style={styles.bookingActions}>
            <TouchableOpacity
              style={[styles.bookingBtnPrimary, { backgroundColor: colors.primary }]}
              onPress={() => Linking.openURL('https://sabarimalaonline.org/')}
              accessibilityRole="link"
              accessibilityLabel="Book Official Sabarimala Virtual-Q Darshan"
            >
              <Ionicons name="calendar-outline" size={15} color="#0D1117" />
              <Text style={styles.bookingBtnPrimaryText}>
                {isTe ? 'వర్చువల్-Q' : 'Virtual-Q'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bookingBtnOutline, { borderColor: colors.primary, backgroundColor: `${colors.primary}18` }]}
              onPress={() => Linking.openURL('https://sabarimalaonline.org/')}
              accessibilityRole="link"
              accessibilityLabel="Book Sabarimala Appam and Aravana Prasadams"
            >
              <Ionicons name="gift-outline" size={15} color={colors.primary} />
              <Text style={[styles.bookingBtnOutlineText, { color: colors.primary }]}>
                {isTe ? 'ప్రసాదాలు' : 'Prasadams'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.note, { color: colors.textDim }]}>{t('traditionalNote')}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: {
    padding: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
  },
  headerText: { gap: 2 },
  heading: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 12, lineHeight: 17 },
  toggle: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  toggleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
  },
  toggleText: { fontSize: 13, fontWeight: '600' },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: 60 },
  bookingCard: {
    borderWidth: 1.5,
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  bookingTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bookingTitle: { fontSize: 15, fontWeight: '800' },
  bookingSub: { fontSize: 12, marginTop: 2, lineHeight: 17 },
  bookingActions: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  bookingBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: 44,
  },
  bookingBtnPrimaryText: { color: '#0D1117', fontSize: 12, fontWeight: '800' },
  bookingBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 44,
  },
  bookingBtnOutlineText: { fontSize: 12, fontWeight: '800' },
  sannidhanamTrailCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    gap: 8,
    marginTop: spacing.xs,
  },
  sannidhanamTrailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sannidhanamTrailTitle: { fontSize: 14, fontWeight: '800' },
  sannidhanamMapLink: { fontSize: 12, fontWeight: '700' },
  sannidhanamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  sannidhanamName: { fontSize: 13, fontWeight: '700' },
  sannidhanamLoc: { fontSize: 11, marginTop: 1 },
  timelineRow: { flexDirection: 'row', gap: 12 },
  connectorCol: { alignItems: 'center', width: 20 },
  dot: { width: 20, height: 20, borderRadius: 10, zIndex: 1, borderWidth: 2 },
  connector: { width: 2, flex: 1, marginTop: 2 },
  timelineCard: {
    flex: 1, padding: spacing.md, borderRadius: 18,
    borderWidth: 1, gap: 6, marginBottom: 8,
  },
  timelineTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  timelineCopy: { flex: 1 },
  timelineTitle: { fontSize: 15, fontWeight: '700' },
  timelinePhase: { fontSize: 10, marginTop: 2, textTransform: 'capitalize' },
  timelineDesc: { fontSize: 12, lineHeight: 17 },
  note: { fontSize: 11, textAlign: 'center', marginTop: spacing.md, lineHeight: 16 },
  empty: { flex: 1 },
  emptyCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: spacing.lg },
  emptyIcon: { fontSize: 56 },
  emptyText: { fontSize: 16, textAlign: 'center', lineHeight: 22 },
});
