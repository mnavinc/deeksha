import { useState } from 'react';
import {
  Alert,
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
import { AYYAPPA_POOJA_VIDHANAM } from '@/data/poojaVidhanam';

export default function VidhanamScreen() {
  const { t, language } = useI18n();
  const colors = useThemeColors();
  const theme = useAppStore((s) => s.theme);
  const activeTheme = theme === 'system' ? 'dark' : theme;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleDownloadEbook = () => {
    Alert.alert(
      'Ayyappa Pooja Vidhanam eBook (PDF)',
      language === 'te'
        ? 'శ్రీ అయ్యప్ప స్వామి నిత్య పూజ విధానం, 108 శరణు ఘోష, భజనలు మరియు హరివరాసనం ఈబుక్ డౌన్‌లోడ్ చేయబడింది!'
        : 'Sree Ayyappa Swamy Nitya Pooja Vidhanam PDF eBook has been saved to your downloads folder.',
      [{ text: 'OK' }]
    );
  };

  const filteredSections = AYYAPPA_POOJA_VIDHANAM.filter((sec) => {
    if (selectedCategory !== 'all' && sec.category !== selectedCategory) return false;
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const matchesTitle = sec.title.toLowerCase().includes(query) || sec.titleTe.includes(query);
    const matchesMantras = sec.mantras.some(
      (m) => m.telugu.includes(query) || m.english.toLowerCase().includes(query)
    );
    return matchesTitle || matchesMantras;
  });

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <HeaderNav />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.heading, { color: colors.text }]}>{t('poojaVidhanamTitle')}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('poojaVidhanamSubtitle')}</Text>

          {/* eBook Download Button */}
          <TouchableOpacity
            style={[styles.downloadBtn, getClayStyle(activeTheme, 'high', colors.primary)]}
            onPress={handleDownloadEbook}
          >
            <Ionicons name="document-text" size={20} color="#0D1117" />
            <Text style={styles.downloadBtnText}>{t('downloadEbook')}</Text>
          </TouchableOpacity>
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
            placeholder={t('searchMantras')}
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {[
            { id: 'all', label: language === 'te' ? 'అన్నీ' : 'All' },
            { id: 'mangalacaranam', label: language === 'te' ? 'సంకల్పం' : 'Sankalpam' },
            { id: 'ganapathi', label: language === 'te' ? 'గణేశ అష్టోత్తరం' : 'Ganesha' },
            { id: 'sharanu_gosha', label: t('sharanuGosha') },
            { id: 'ayyappa_stotra', label: language === 'te' ? 'పంచరత్నం' : 'Stotras' },
            { id: 'bhajans', label: t('bhajans') },
            { id: 'harivarasanam', label: t('harivarasanam') },
          ].map((cat) => {
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
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Pooja Content Sections */}
        <View style={styles.sectionsList}>
          {filteredSections.map((sec) => (
            <View
              key={sec.id}
              style={[
                styles.secCard,
                getClayStyle(activeTheme, 'medium'),
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.secTitle, { color: colors.primary }]}>
                {language === 'te' ? sec.titleTe : sec.title}
              </Text>

              <View style={styles.mantraList}>
                {sec.mantras.map((m, idx) => (
                  <View key={idx} style={[styles.mantraBox, { borderTopColor: colors.border }]}>
                    <Text style={[styles.mantraTelugu, { color: colors.text }]}>{m.telugu}</Text>
                    <Text style={[styles.mantraEnglish, { color: colors.textMuted }]}>{m.english}</Text>
                    {m.meaning && (
                      <Text style={[styles.mantraMeaning, { color: colors.textDim }]}>
                        💡 {m.meaning}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
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
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginTop: 4,
  },
  downloadBtnText: { color: '#0D1117', fontWeight: '800', fontSize: 14 },
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
  filterRow: { gap: 8, paddingVertical: 4 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12 },
  sectionsList: { gap: spacing.md },
  secCard: {
    padding: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
  },
  secTitle: { fontSize: 16, fontWeight: '800' },
  mantraList: { gap: 12 },
  mantraBox: {
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 6,
  },
  mantraTelugu: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 26,
    fontFamily: 'Ramabhadra_400Regular',
  },
  mantraEnglish: { fontSize: 13, lineHeight: 19 },
  mantraMeaning: { fontSize: 11, fontStyle: 'italic', marginTop: 2 },
});
