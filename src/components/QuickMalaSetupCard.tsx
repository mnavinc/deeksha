import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import { format } from '@/engines/dateUtils';
import { computeMalaStartDate, resolveDeekshaDuration } from '@/engines/deekshaEngine';
import { MalaSetupFields, type MalaStatus } from '@/components/MalaSetupFields';
import { useThemeColors, spacing } from '@/theme/colors';
import { getClayStyle } from '@/theme/claymorphism';
import { useI18n } from '@/i18n';

export function QuickMalaSetupCard() {
  const colors = useThemeColors();
  const { language } = useI18n();
  const isTe = language === 'te';
  const theme = useAppStore((s) => s.theme);
  const activeTheme = theme === 'system' ? 'dark' : theme;
  const profile = useAppStore((s) => s.profile);
  const startDeeksha = useAppStore((s) => s.startDeeksha);

  const pilgrimageCount = Math.max(1, profile?.pilgrimageCount ?? 1);
  const [malaStatus, setMalaStatus] = useState<MalaStatus>('existing');
  const [completedDays, setCompletedDays] = useState('1');
  const [plannedStartDate, setPlannedStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [durationDays, setDurationDays] = useState('41');

  const handleSave = () => {
    const resolvedDuration = resolveDeekshaDuration(
      pilgrimageCount,
      parseInt(durationDays, 10)
    );
    const startDate = computeMalaStartDate({
      malaStatus,
      completedDays: parseInt(completedDays, 10) || 0,
      plannedStartDate,
    });

    startDeeksha({
      deekshaId: 'ayyappa',
      pilgrimageCenter: 'Sabarimala',
      malaDharanamDate: startDate,
      durationDays: resolvedDuration,
      pilgrimageCount,
    });
  };

  return (
    <View
      style={[
        styles.card,
        getClayStyle(activeTheme, 'medium'),
        { backgroundColor: colors.surface, borderColor: colors.primary },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        {isTe ? '🪔 మీ మాల & దీక్ష వివరాలు' : '🪔 Complete Your Mala Details'}
      </Text>
      <Text style={[styles.sub, { color: colors.textMuted }]}>
        {isTe
          ? 'సైన్-ఇన్ అవసరం లేదు. మీ ప్రస్తుత లేదా రాబోయే దీక్షను సెట్ చేయండి.'
          : 'No sign-in needed. Set your current or upcoming Mala to track your journey.'}
      </Text>

      <MalaSetupFields
        pilgrimageCount={pilgrimageCount}
        malaStatus={malaStatus}
        onChangeMalaStatus={setMalaStatus}
        completedDays={completedDays}
        onChangeCompletedDays={setCompletedDays}
        plannedStartDate={plannedStartDate}
        onChangePlannedStartDate={setPlannedStartDate}
        durationDays={durationDays}
        onChangeDurationDays={setDurationDays}
        isTe={isTe}
      />

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: colors.primary }]}
        onPress={handleSave}
        accessibilityRole="button"
      >
        <Text style={styles.btnText}>
          {isTe ? 'దీక్ష ప్రారంభించండి 🙏' : 'Start Tracking Deeksha 🙏'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  sub: {
    fontSize: 13,
    lineHeight: 18,
  },
  btn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: {
    color: '#0D1117',
    fontSize: 15,
    fontWeight: '800',
  },
});
