import { useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
import { colors, useThemeColors, spacing } from '@/theme/colors';
import { getClayStyle } from '@/theme/claymorphism';
import { HeaderNav } from '@/components/HeaderNav';
import { SacredIcon } from '@/components/SacredIcons';
import { DEVOTIONAL_REELS, type DevotionalReel } from '@/data/devotionalReels';
import { useI18n } from '@/i18n';

const guides = [
  { name: 'Ramesh Swamy', tier: 'Guru Swamy · Guide', reason: 'Supports Ayyappa Kanni Swamis' },
  { name: 'Lakshmi Devi', tier: 'Sevak · Discipline circle', reason: 'Shared daily practice goals' },
  { name: 'Hari Prasad', tier: 'Senior Mentor', reason: 'Nearby community member' },
];

const REEL_CATEGORIES: Array<DevotionalReel['category'] | 'All'> = [
  'All',
  'Ayyappa',
  'Sabarimala',
  'Harivarasanam',
  'Shiva',
  'Hanuman',
];

export default function CommunityScreen() {
  const [q, setQ] = useState('');
  const [reelFilter, setReelFilter] = useState<DevotionalReel['category'] | 'All'>('All');
  const [followedNames, setFollowedNames] = useState<string[]>([]);
  const groups = useAppStore((s) => s.groups);
  const theme = useAppStore((s) => s.theme);
  const logUserAction = useAppStore((s) => s.logUserAction);
  const activeTheme = theme === 'system' ? 'dark' : theme;
  const colors = useThemeColors();
  const { t, language } = useI18n();
  const isTe = language === 'te';

  const people = useMemo(
    () => guides.filter((x) =>
      x.name.toLowerCase().includes(q.toLowerCase()) ||
      x.reason.toLowerCase().includes(q.toLowerCase())
    ),
    [q]
  );

  const reels = useMemo(
    () =>
      DEVOTIONAL_REELS.filter(
        (r) =>
          (reelFilter === 'All' || r.category === reelFilter) &&
          (q.trim() === '' ||
            r.titleEn.toLowerCase().includes(q.toLowerCase()) ||
            r.titleTe.toLowerCase().includes(q.toLowerCase()) ||
            r.hashtags.some((h) => h.toLowerCase().includes(q.toLowerCase())))
      ),
    [reelFilter, q]
  );

  const shareReel = (reel: DevotionalReel, target: 'whatsapp' | 'telegram') => {
    logUserAction('share_devotional_reel', ['viral_reel', reel.category.toLowerCase(), target]);
    const text = `🙏 ${isTe ? reel.titleTe : reel.titleEn}\n${reel.hashtags.join(' ')}\nJoin Deeksha Journey: https://deeksha-sigma.vercel.app`;
    const url =
      target === 'whatsapp'
        ? `https://wa.me/?text=${encodeURIComponent(text)}`
        : `https://t.me/share/url?url=${encodeURIComponent('https://deeksha-sigma.vercel.app')}&text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <HeaderNav />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.heading, { color: colors.text }]}>{t('communityTitle')}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('communitySubtitle')}</Text>

        {/* Search */}
        <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" color={colors.textMuted} size={19} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={t('search')}
            placeholderTextColor={colors.textDim}
            style={[styles.input, { color: colors.text }]}
          />
        </View>

        {/* Viral Devotional InstaFeed / Reels */}
        <View style={styles.reelHeaderRow}>
          <Text style={[styles.section, { color: colors.text }]}>
            {isTe ? '🎬 అయ్యప్ప & భక్తి రీల్స్ (InstaFeed)' : '🎬 Ayyappa & Devotional Reels'}
          </Text>
          <Text style={[styles.reelBadge, { color: colors.primary }]}>InstaFeed</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reelFilterRow}>
          {REEL_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setReelFilter(cat)}
              style={[
                styles.reelChip,
                { borderColor: colors.border, backgroundColor: colors.surface },
                reelFilter === cat && { borderColor: colors.primary, backgroundColor: `${colors.primary}20` },
              ]}
            >
              <Text
                style={[
                  styles.reelChipText,
                  { color: colors.textMuted },
                  reelFilter === cat && { color: colors.primary, fontWeight: '800' },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reelsStrip}>
          {reels.map((reel) => (
            <View
              key={reel.id}
              style={[
                styles.reelCard,
                getClayStyle(activeTheme, 'medium'),
                { backgroundColor: colors.surface, borderColor: reel.accentColor },
              ]}
            >
              <View style={[styles.reelPoster, { backgroundColor: `${reel.accentColor}22` }]}>
                <SacredIcon name="flame" size={34} color="#FFFBE6" accent={reel.accentColor} />
                <View style={styles.reelMetaPill}>
                  <Text style={styles.reelMetaText}>▶ {reel.duration} · ♥ {reel.likesLabel}</Text>
                </View>
              </View>
              <Text style={[styles.reelTitle, { color: colors.text }]} numberOfLines={2}>
                {isTe ? reel.titleTe : reel.titleEn}
              </Text>
              <Text style={[styles.reelCreator, { color: colors.textMuted }]}>{reel.creator}</Text>
              <Text style={[styles.reelTags, { color: colors.primary }]} numberOfLines={1}>
                {reel.hashtags.join(' ')}
              </Text>
              <View style={styles.reelActions}>
                <TouchableOpacity
                  style={[styles.reelWatchBtn, { backgroundColor: reel.accentColor }]}
                  onPress={() => {
                    logUserAction('watch_devotional_reel', ['instafeed', reel.category.toLowerCase()]);
                    Linking.openURL(reel.instagramUrl).catch(() => {});
                  }}
                >
                  <Ionicons name="logo-instagram" size={14} color="#0D1117" />
                  <Text style={styles.reelWatchText}>Reels</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.reelShareBtn, { borderColor: colors.border }]}
                  onPress={() => {
                    logUserAction('watch_youtube_short', ['shorts', reel.category.toLowerCase()]);
                    Linking.openURL(reel.youtubeShortsUrl).catch(() => {});
                  }}
                >
                  <Ionicons name="logo-youtube" size={14} color="#EF4444" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.reelShareBtn, { borderColor: '#25D366' }]}
                  onPress={() => shareReel(reel, 'whatsapp')}
                >
                  <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Recommended */}
        <Text style={[styles.section, { color: colors.text }]}>{t('recommended')}</Text>
        {people.map((person) => {
          const isFollowing = followedNames.includes(person.name);
          return (
            <View
              key={person.name}
              style={[styles.person, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.avatar, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.initial, { color: colors.primary }]}>{person.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: colors.text }]}>{person.name}</Text>
                <Text style={[styles.tier, { color: colors.primary }]}>{person.tier}</Text>
                <Text style={[styles.reason, { color: colors.textMuted }]}>{person.reason}</Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  setFollowedNames((prev) =>
                    prev.includes(person.name) ? prev.filter((n) => n !== person.name) : [...prev, person.name]
                  )
                }
                accessibilityRole="button"
                accessibilityLabel={`${isFollowing ? 'Following' : 'Follow'} ${person.name}`}
                style={[
                  styles.followBtn,
                  isFollowing
                    ? { backgroundColor: 'transparent', borderColor: colors.primary }
                    : { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.followText,
                    { color: isFollowing ? colors.primary : '#0D1117' },
                  ]}
                >
                  {isFollowing ? (isTe ? 'అనుసరిస్తున్నారు ✓' : 'Following ✓') : t('follow')}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Groups */}
        <Text style={[styles.section, { color: colors.text }]}>{t('groups')}</Text>
        {groups.length === 0 ? (
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('noGroup')}</Text>
        ) : (
          groups.map((g) => (
            <View
              key={g.id}
              style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.name, { color: colors.text }]}>{g.name}</Text>
              <Text style={[styles.reason, { color: colors.textMuted }]}>
                {g.members.length} {t('members')} · {g.guruName ?? t('guideNotAssigned')}
              </Text>
            </View>
          ))
        )}

        {/* Reminders notice */}
        <View style={[styles.notice, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="notifications-outline" color={colors.primary} size={22} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.text }]}>{t('reminders')}</Text>
            <Text style={[styles.reason, { color: colors.textMuted }]}>{t('reminderDesc')}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
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
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followText: { fontSize: 12, fontWeight: '800' },
  group: { padding: 13, borderRadius: 14, borderWidth: 1 },
  notice: {
    flexDirection: 'row', gap: 11, padding: 14,
    borderRadius: 14, borderWidth: 1,
  },
  reelHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  reelBadge: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  reelFilterRow: { gap: 8, paddingVertical: 4 },
  reelChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  reelChipText: { fontSize: 12, fontWeight: '600' },
  reelsStrip: { gap: 12, paddingVertical: 4 },
  reelCard: {
    width: 210,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 10,
    gap: 6,
  },
  reelPoster: {
    height: 112,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  reelMetaPill: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(13,17,23,0.78)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  reelMetaText: { color: '#FFFBE6', fontSize: 10, fontWeight: '700' },
  reelTitle: { fontSize: 13, fontWeight: '800', lineHeight: 18 },
  reelCreator: { fontSize: 11 },
  reelTags: { fontSize: 10, fontWeight: '600' },
  reelActions: { flexDirection: 'row', gap: 6, marginTop: 4 },
  reelWatchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 10,
  },
  reelWatchText: { color: '#0D1117', fontSize: 11, fontWeight: '800' },
  reelShareBtn: {
    width: 34,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
