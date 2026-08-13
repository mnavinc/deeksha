import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AYYAPPA_JOURNEY } from '@/data/journeyCheckpoints';
import { useAppStore } from '@/store/useAppStore';
import { getCurrentDay } from '@/engines/deekshaEngine';
import { colors, spacing } from '@/theme/colors';
import { JourneyTrailMap } from '@/components/JourneyTrailMap';
import { useI18n } from '@/i18n';

type ViewMode = 'map' | 'timeline';

export default function JourneyScreen() {
  const enrollment = useAppStore((s) => s.enrollment);
  const unlock = useAppStore((s) => s.unlockJourneyCheckpoint);
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<ViewMode>('map');

  if (!enrollment) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🗺️</Text>
        <Text style={styles.emptyText}>{t('startDeekshaPrompt')}</Text>
      </View>
    );
  }

  const day = getCurrentDay(enrollment);
  const items = enrollment.deekshaId === 'ayyappa' ? AYYAPPA_JOURNEY : AYYAPPA_JOURNEY.slice(0, 6);

  return (
    <View style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.heading}>
            {enrollment.deekshaId === 'ayyappa' ? t('journeyTitle') : t('trail')}
          </Text>
          <Text style={styles.subtitle}>{t('trailHint')}</Text>
        </View>
        {/* View Toggle */}
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'map' && styles.toggleActive]}
            onPress={() => setViewMode('map')}
          >
            <Ionicons name="map" size={16} color={viewMode === 'map' ? colors.background : colors.textMuted} />
            <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>
              {t('journeyViewMap')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'timeline' && styles.toggleActive]}
            onPress={() => setViewMode('timeline')}
          >
            <Ionicons name="list" size={16} color={viewMode === 'timeline' ? colors.background : colors.textMuted} />
            <Text style={[styles.toggleText, viewMode === 'timeline' && styles.toggleTextActive]}>
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
            />
            <Text style={styles.note}>{t('traditionalNote')}</Text>
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
                <TouchableOpacity
                  key={item.id}
                  disabled={!unlocked}
                  onPress={() => unlock(item.id)}
                  style={styles.timelineRow}
                  activeOpacity={0.8}
                >
                  {/* Connector line */}
                  <View style={styles.connectorCol}>
                    <View style={[styles.dot, unlocked ? styles.dotUnlocked : styles.dotLocked]} />
                    {!isLast && <View style={[styles.connector, unlocked && styles.connectorUnlocked]} />}
                  </View>
                  {/* Card */}
                  <View style={[styles.timelineCard, unlocked && styles.timelineCardUnlocked, !unlocked && styles.timelineCardLocked]}>
                    <View style={styles.timelineTop}>
                      <Text style={styles.timelineIcon}>{unlocked ? item.icon : '🔒'}</Text>
                      <View style={styles.timelineCopy}>
                        <Text style={[styles.timelineTitle, !unlocked && styles.dimText]}>{title}</Text>
                        <Text style={styles.timelinePhase}>
                          {phaseName} ·{' '}
                          <Text style={styles.tag}>
                            {item.category === 'OFFICIAL' ? t('officialGuidance') : t('traditionalPractice')}
                          </Text>
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.timelineDesc, !unlocked && styles.dimText]}>
                      {unlocked
                        ? description
                        : item.dayUnlock
                        ? `${t('availableOnDay')} ${item.dayUnlock}`
                        : t('availableDuringPilgrimage')}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            <Text style={styles.note}>{t('traditionalNote')}</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  header: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: { gap: 2 },
  heading: { color: colors.text, fontSize: 20, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  toggleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9,
  },
  toggleActive: { backgroundColor: colors.primary },
  toggleText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  toggleTextActive: { color: colors.background, fontWeight: '700' },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: 40 },
  // Timeline
  timelineRow: { flexDirection: 'row', gap: 12 },
  connectorCol: { alignItems: 'center', width: 20 },
  dot: { width: 20, height: 20, borderRadius: 10, zIndex: 1 },
  dotUnlocked: { backgroundColor: colors.primary, borderWidth: 2, borderColor: '#FFFBE6' },
  dotLocked: { backgroundColor: '#314B42', borderWidth: 2, borderColor: colors.border },
  connector: { width: 2, flex: 1, backgroundColor: colors.border, marginTop: 2 },
  connectorUnlocked: { backgroundColor: colors.primary, opacity: 0.4 },
  timelineCard: {
    flex: 1, padding: spacing.md, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, gap: 6, marginBottom: 8,
  },
  timelineCardUnlocked: { borderColor: colors.primary, backgroundColor: '#163229' },
  timelineCardLocked: { opacity: 0.5 },
  timelineTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  timelineIcon: { fontSize: 22, width: 30 },
  timelineCopy: { flex: 1 },
  timelineTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  timelinePhase: { color: colors.textDim, fontSize: 10, marginTop: 2, textTransform: 'capitalize' },
  tag: { color: colors.primary, fontWeight: '600' },
  timelineDesc: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  dimText: { color: colors.textDim },
  note: { color: colors.textDim, fontSize: 11, textAlign: 'center', marginTop: spacing.md, lineHeight: 16 },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.background, padding: spacing.lg, gap: 12,
  },
  emptyIcon: { fontSize: 56 },
  emptyText: { color: colors.textMuted, fontSize: 16, textAlign: 'center', lineHeight: 22 },
});
