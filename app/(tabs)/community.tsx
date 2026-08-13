import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
import { colors, spacing } from '@/theme/colors';
import { useI18n } from '@/i18n';

const guides = [
  { name: 'Ramesh Swamy', tier: 'Guru Swamy · Guide', reason: 'Supports Ayyappa Kanni Swamis' },
  { name: 'Lakshmi Devi', tier: 'Sevak · Discipline circle', reason: 'Shared daily practice goals' },
  { name: 'Hari Prasad', tier: 'Senior Mentor', reason: 'Nearby community member' },
];

export default function CommunityScreen() {
  const [q, setQ] = useState('');
  const groups = useAppStore((s) => s.groups);
  const { t } = useI18n();

  const people = useMemo(
    () => guides.filter((x) =>
      x.name.toLowerCase().includes(q.toLowerCase()) ||
      x.reason.toLowerCase().includes(q.toLowerCase())
    ),
    [q]
  );

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{t('communityTitle')}</Text>
      <Text style={styles.subtitle}>{t('communitySubtitle')}</Text>

      {/* Search */}
      <View style={styles.search}>
        <Ionicons name="search" color={colors.textMuted} size={19} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={t('search')}
          placeholderTextColor={colors.textDim}
          style={styles.input}
        />
      </View>

      {/* Recommended */}
      <Text style={styles.section}>{t('recommended')}</Text>
      {people.map((person) => (
        <View key={person.name} style={styles.person}>
          <View style={styles.avatar}>
            <Text style={styles.initial}>{person.name[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{person.name}</Text>
            <Text style={styles.tier}>{person.tier}</Text>
            <Text style={styles.reason}>{person.reason}</Text>
          </View>
          <TouchableOpacity style={styles.followBtn}>
            <Text style={styles.followText}>{t('follow')}</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Groups */}
      <Text style={styles.section}>{t('groups')}</Text>
      {groups.length === 0 ? (
        <Text style={styles.subtitle}>{t('noGroup')}</Text>
      ) : (
        groups.map((g) => (
          <View key={g.id} style={styles.group}>
            <Text style={styles.name}>{g.name}</Text>
            <Text style={styles.reason}>
              {g.members.length} {t('members')} · {g.guruName ?? t('guideNotAssigned')}
            </Text>
          </View>
        ))
      )}

      {/* Reminders notice */}
      <View style={styles.notice}>
        <Ionicons name="notifications-outline" color={colors.primary} size={22} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{t('reminders')}</Text>
          <Text style={styles.reason}>{t('reminderDesc')}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: 12, paddingBottom: 40 },
  heading: { color: colors.text, fontSize: 23, fontWeight: '800' },
  subtitle: { color: colors.textMuted, lineHeight: 19 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12,
  },
  input: { flex: 1, color: colors.text, paddingVertical: 12 },
  section: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 7 },
  person: {
    flexDirection: 'row', gap: 10, alignItems: 'center',
    padding: 13, backgroundColor: colors.surface,
    borderRadius: 15, borderWidth: 1, borderColor: colors.border,
  },
  avatar: {
    width: 43, height: 43, borderRadius: 22,
    backgroundColor: '#58A6FF22', alignItems: 'center', justifyContent: 'center',
  },
  initial: { color: colors.accent, fontSize: 17, fontWeight: '800' },
  name: { color: colors.text, fontWeight: '700' },
  tier: { color: colors.primary, fontSize: 11, marginTop: 2 },
  reason: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  followBtn: {
    borderColor: colors.primary, borderWidth: 1,
    borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6,
  },
  followText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  group: { padding: 13, backgroundColor: colors.surface, borderRadius: 14 },
  notice: {
    flexDirection: 'row', gap: 11, padding: 14,
    backgroundColor: '#F0B42912', borderRadius: 14,
  },
});
