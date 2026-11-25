import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { addDays, format } from '@/engines/dateUtils';
import { useThemeColors, spacing } from '@/theme/colors';

export type MalaStatus = 'existing' | 'upcoming';

interface MalaSetupFieldsProps {
  pilgrimageCount: number;
  malaStatus: MalaStatus;
  onChangeMalaStatus: (status: MalaStatus) => void;
  completedDays: string;
  onChangeCompletedDays: (days: string) => void;
  plannedStartDate: string;
  onChangePlannedStartDate: (date: string) => void;
  durationDays: string;
  onChangeDurationDays: (days: string) => void;
  isTe: boolean;
}

export function MalaSetupFields({
  pilgrimageCount,
  malaStatus,
  onChangeMalaStatus,
  completedDays,
  onChangeCompletedDays,
  plannedStartDate,
  onChangePlannedStartDate,
  durationDays,
  onChangeDurationDays,
  isTe,
}: MalaSetupFieldsProps) {
  const colors = useThemeColors();
  const isKanni = pilgrimageCount <= 1;

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const nextWeekStr = format(addDays(new Date(), 7), 'yyyy-MM-dd');

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.text }]}>
        {isTe ? 'మాల స్థితి (Mala Status)' : 'Mala Status'}
      </Text>
      <View style={styles.chipRow}>
        <TouchableOpacity
          style={[
            styles.chip,
            { backgroundColor: colors.background, borderColor: colors.border },
            malaStatus === 'existing' && { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
          onPress={() => onChangeMalaStatus('existing')}
          accessibilityRole="button"
          accessibilityState={{ selected: malaStatus === 'existing' }}
        >
          <Text
            style={[
              styles.chipText,
              { color: colors.textMuted },
              malaStatus === 'existing' && { color: '#0D1117', fontWeight: '800' },
            ]}
          >
            {isTe ? 'ఇప్పటికే మాల ధరించాను' : 'Existing Mala'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chip,
            { backgroundColor: colors.background, borderColor: colors.border },
            malaStatus === 'upcoming' && { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
          onPress={() => onChangeMalaStatus('upcoming')}
          accessibilityRole="button"
          accessibilityState={{ selected: malaStatus === 'upcoming' }}
        >
          <Text
            style={[
              styles.chipText,
              { color: colors.textMuted },
              malaStatus === 'upcoming' && { color: '#0D1117', fontWeight: '800' },
            ]}
          >
            {isTe ? 'త్వరలో మాల వేస్తాను' : 'To Be Taken'}
          </Text>
        </TouchableOpacity>
      </View>

      {malaStatus === 'existing' ? (
        <>
          <Text style={[styles.label, { color: colors.text }]}>
            {isTe ? 'ఇప్పటివరకు పూర్తయిన దీక్ష రోజులు' : 'Days of Deeksha Completed'}
          </Text>
          <TextInput
            value={completedDays}
            onChangeText={onChangeCompletedDays}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textDim}
            style={[
              styles.input,
              { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
            ]}
          />
        </>
      ) : (
        <>
          <Text style={[styles.label, { color: colors.text }]}>
            {isTe ? 'మాల ఎప్పుడు ప్రారంభిస్తారు? (YYYY-MM-DD)' : 'When to Start? (YYYY-MM-DD)'}
          </Text>
          <View style={styles.chipRow}>
            {[
              { label: isTe ? 'ఈరోజు' : 'Today', value: todayStr },
              { label: isTe ? 'రేపు' : 'Tomorrow', value: tomorrowStr },
              { label: isTe ? '+7 రోజులు' : '+7 Days', value: nextWeekStr },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.smallChip,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  plannedStartDate === opt.value && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => onChangePlannedStartDate(opt.value)}
              >
                <Text
                  style={[
                    styles.smallChipText,
                    { color: colors.textMuted },
                    plannedStartDate === opt.value && { color: '#0D1117', fontWeight: '800' },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            value={plannedStartDate}
            onChangeText={onChangePlannedStartDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textDim}
            style={[
              styles.input,
              { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
            ]}
          />
        </>
      )}

      {isKanni ? (
        <View style={[styles.kanniNote, { backgroundColor: `${colors.primary}14`, borderColor: colors.primary }]}>
          <Text style={[styles.kanniNoteText, { color: colors.primary }]}>
            {isTe
              ? '🪔 కన్నె స్వామి దీక్ష: సంప్రదాయ 41 రోజుల మండల దీక్ష'
              : '🪔 Kanni Swamy: 41-day Mandala Deeksha'}
          </Text>
        </View>
      ) : (
        <>
          <Text style={[styles.label, { color: colors.text }]}>
            {isTe ? 'దీక్ష రోజుల సంఖ్య (Duration Days)' : 'How Many Days of Deeksha?'}
          </Text>
          <View style={styles.chipRow}>
            {['41', '21', '11', '5'].map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.smallChip,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  durationDays === d && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => onChangeDurationDays(d)}
              >
                <Text
                  style={[
                    styles.smallChipText,
                    { color: colors.textMuted },
                    durationDays === d && { color: '#0D1117', fontWeight: '800' },
                  ]}
                >
                  {d} {isTe ? 'రోజులు' : 'days'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            value={durationDays}
            onChangeText={onChangeDurationDays}
            keyboardType="numeric"
            placeholder="41"
            placeholderTextColor={colors.textDim}
            style={[
              styles.input,
              { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
            ]}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 8,
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flex: 1,
    minWidth: 130,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  smallChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 11,
  },
  smallChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm + 4,
    fontSize: 15,
  },
  kanniNote: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginTop: 4,
  },
  kanniNoteText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
