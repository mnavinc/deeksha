import { useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
import { useThemeColors, spacing } from '@/theme/colors';
import { getClayStyle } from '@/theme/claymorphism';
import { useI18n } from '@/i18n';
import { HeaderNav } from '@/components/HeaderNav';
import { AYYAPPA_POOJA_VIDHANAM, DEVOTIONAL_PLAYLISTS } from '@/data/poojaVidhanam';

const CATEGORY_FILTERS = [
  { id: 'all', labelTe: 'అన్నీ', labelEn: 'All' },
  { id: 'playlists', labelTe: '🎵 భజన పాటలు & ప్లేలిస్టులు', labelEn: '🎵 Songs & Playlists' },
  { id: 'instructions', labelTe: 'నియమాలు', labelEn: 'Rules' },
  { id: 'mangalacaranam', labelTe: 'సంకల్పం', labelEn: 'Sankalpam' },
  { id: 'ganapathi', labelTe: 'గణేశ పూజ', labelEn: 'Ganesha' },
  { id: 'sharanu_gosha', labelTe: 'శరణు ఘోష', labelEn: 'Sharanu Ghosha' },
  { id: 'ashtottaram', labelTe: 'అష్టోత్తరం', labelEn: 'Ashtottaram' },
  { id: 'pancharatnam', labelTe: 'పంచరత్నం', labelEn: 'Pancharatnam' },
  { id: 'bhajans', labelTe: 'భజనలు', labelEn: 'Bhajans' },
  { id: 'ninadalu', labelTe: 'నినాదాలు', labelEn: 'Ninadalu' },
  { id: 'harivarasanam', labelTe: 'హరివరాసనం', labelEn: 'Harivarasanam' },
];

export default function VidhanamScreen() {
  const { t, language } = useI18n();
  const colors = useThemeColors();
  const theme = useAppStore((s) => s.theme);
  const activeTheme = theme === 'system' ? 'dark' : theme;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['instructions', 'playlists']));

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOpenPlaylist = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  const filteredSections = AYYAPPA_POOJA_VIDHANAM.filter((sec) => {
    if (selectedCategory !== 'all' && selectedCategory !== 'playlists' && sec.category !== selectedCategory) return false;
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const matchesTitle = sec.title.toLowerCase().includes(query) || sec.titleTe.includes(query);
    const matchesMantras = sec.mantras.some(
      (m) => m.telugu.includes(query) || m.english.toLowerCase().includes(query)
    );
    return matchesTitle || matchesMantras;
  });

  const showPlaylists = selectedCategory === 'all' || selectedCategory === 'playlists' || selectedCategory === 'bhajans';

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <HeaderNav />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.heading, { color: colors.text }]}>🕉️ {t('poojaVidhanamTitle')}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {language === 'te'
              ? 'అయ్యప్ప స్వామి నిత్య పూజ విధానం • 108 శరణు ఘోష • భజనలు • హరివరాసనం'
              : 'Daily Nitya Pooja • 108 Sharanu Ghosha • Bhajans & YouTube Playlists'}
          </Text>
        </View>

        {/* Search Input */}
        <View
          style={[
            styles.searchCard,
            getClayStyle(activeTheme, 'low'),
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={language === 'te' ? 'మంత్రాలు, భజన పాటలు వెతకండి...' : 'Search mantras, bhajans, songs...'}
            placeholderTextColor={colors.textDim}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filters */}
        <View style={styles.filtersWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {CATEGORY_FILTERS.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  style={[
                    styles.filterChip,
                    { borderColor: colors.border },
                    isSelected && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
                  ]}
                >
                  <Text style={[styles.filterChipText, { color: colors.textMuted }, isSelected && { color: colors.primary, fontWeight: '700' }]}>
                    {language === 'te' ? cat.labelTe : cat.labelEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Pooja Content Sections */}
        <View style={styles.sectionsList}>
          {filteredSections.map((sec) => {
            const isExpanded = expandedSections.has(sec.id);
            return (
              <View
                key={sec.id}
                style={[
                  styles.secCard,
                  getClayStyle(activeTheme, 'medium'),
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                {/* Section Header — tappable to expand/collapse */}
                <TouchableOpacity
                  style={styles.secHeader}
                  onPress={() => toggleSection(sec.id)}
                  accessibilityLabel={`Toggle ${sec.title}`}
                >
                  <Text style={[styles.secTitle, { color: colors.primary, flex: 1 }]}>
                    {language === 'te' ? sec.titleTe : sec.title}
                  </Text>
                  <Text style={[styles.secChevron, { color: colors.textMuted }]}>
                    {isExpanded ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.mantraList}>
                    {sec.mantras.map((m, idx) => (
                      <View key={idx} style={[styles.mantraBox, { borderTopColor: colors.border }]}>
                        <Text style={[styles.mantraTelugu, { color: colors.text }]}>{m.telugu}</Text>
                        {m.english && (
                          <Text style={[styles.mantraEnglish, { color: colors.textMuted }]}>{m.english}</Text>
                        )}
                        {m.meaning && (
                          <Text style={[styles.mantraMeaning, { color: colors.textDim }]}>
                            💡 {m.meaning}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* 🎧 Devotional Song Playlists — shown at bottom */}
        {showPlaylists && (!searchQuery.trim() || 'bhajan song youtube playlist yesudas spb veeramani'.includes(searchQuery.toLowerCase())) && (
          <View
            style={[
              styles.playlistCard,
              getClayStyle(activeTheme, 'medium'),
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity style={styles.secHeader} onPress={() => toggleSection('playlists')}>
              <Text style={[styles.secTitle, { color: colors.primary, flex: 1 }]}>
                🎧 {language === 'te' ? 'భక్తి పాటలు & భజన ప్లేలిస్టులు (YouTube)' : 'Devotional Songs & Playlists (YouTube)'}
              </Text>
              <Text style={[styles.secChevron, { color: colors.textMuted }]}>
                {expandedSections.has('playlists') ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {expandedSections.has('playlists') && (
              <View style={styles.playlistList}>
                {DEVOTIONAL_PLAYLISTS.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.playlistItem, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => handleOpenPlaylist(item.youtubeUrl)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.playlistEmoji}>{item.iconEmoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.playlistTitle, { color: colors.text }]}>
                        {language === 'te' ? item.titleTe : item.titleEn}
                      </Text>
                      <Text style={[styles.playlistArtist, { color: colors.textMuted }]}>
                        🎙️ {item.artist}
                      </Text>
                    </View>
                    <Ionicons name="open-outline" size={18} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 60 },
  header: { gap: spacing.sm },
  heading: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 13, lineHeight: 18 },

  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },
  filtersWrapper: { height: 52, minHeight: 52, flexShrink: 0, zIndex: 10, marginVertical: 4 },
  filterRow: { gap: 8, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12 },

  playlistCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  playlistList: { gap: 10, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  playlistEmoji: { fontSize: 24 },
  playlistTitle: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  playlistArtist: { fontSize: 11, marginTop: 2 },

  sectionsList: { gap: spacing.md },
  secCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  secHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  secTitle: { fontSize: 15, fontWeight: '800' },
  secChevron: { fontSize: 12, paddingLeft: 8 },
  mantraList: { gap: 12, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  mantraBox: {
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 6,
  },
  mantraTelugu: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 28,
  },
  mantraEnglish: { fontSize: 13, lineHeight: 20 },
  mantraMeaning: { fontSize: 11, fontStyle: 'italic', marginTop: 2 },
});
