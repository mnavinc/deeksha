/**
 * map.web.tsx — OpenStreetMap / Leaflet web fallback using responsive iframe,
 * providing a clean, responsive interactive map alternative on web.
 */
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DeityFilter, SAMPLE_TEMPLES } from '@/data/temples';
import { useAppStore } from '@/store/useAppStore';
import { useThemeColors, spacing } from '@/theme/colors';
import { getClayStyle } from '@/theme/claymorphism';
import { useI18n } from '@/i18n';
import { HeaderNav } from '@/components/HeaderNav';

const filters: Array<DeityFilter | 'All'> = ['All', 'Ayyappa', 'Durga', 'Venkateswara', 'Shiva', 'Hanuman', 'Nookambika'];

export default function MapScreen() {
  const { t } = useI18n();
  const colors = useThemeColors();
  const theme = useAppStore((s) => s.theme);
  const activeTheme = theme === 'system' ? 'dark' : theme;

  const [filter, setFilter] = useState<DeityFilter | 'All'>('All');
  const [selectedTemple, setSelectedTemple] = useState<typeof SAMPLE_TEMPLES[0] | null>(SAMPLE_TEMPLES[0]);
  const saved = useAppStore((s) => s.savedTempleIds);
  const save = useAppStore((s) => s.saveTemple);

  const temples = useMemo(
    () => SAMPLE_TEMPLES.filter((t) => filter === 'All' || t.deity === filter),
    [filter]
  );

  const mapCenter = selectedTemple
    ? `${selectedTemple.latitude - 0.01}%2C${selectedTemple.longitude - 0.02}%2C${selectedTemple.latitude + 0.01}%2C${selectedTemple.longitude + 0.02}`
    : `9.42%2C77.05%2C9.46%2C77.10`;

  const mapMarker = selectedTemple
    ? `&mlat=${selectedTemple.latitude}&mlon=${selectedTemple.longitude}`
    : `&mlat=9.434&mlon=77.081`;

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <HeaderNav />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.heading, { color: colors.text }]}>{t('temples')}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('discoverTemples')}</Text>
      </View>

      {/* Deity Filters */}
      <ScrollView horizontal contentContainerStyle={styles.filters} showsHorizontalScrollIndicator={false}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filter,
              { borderColor: colors.border },
              filter === f && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
            ]}
          >
            <Text style={[styles.filterText, { color: colors.textMuted }, filter === f && { color: colors.primary, fontWeight: '700' }]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Web Interactive Map — OpenStreetMap Embed */}
      <View
        style={[
          styles.mapContainer,
          getClayStyle(activeTheme, 'medium'),
          { borderColor: colors.border, backgroundColor: colors.surface },
        ]}
      >
        {typeof window !== 'undefined' ? (
          <iframe
            title="OpenStreetMap Web View"
            width="100%"
            height="100%"
            style={{ border: 0, borderRadius: 16 }}
            loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter}&layer=mapnik${mapMarker}`}
          />
        ) : (
          <View style={styles.fallbackBox}>
            <Text style={{ color: colors.textMuted }}>{t('interactiveMap')}</Text>
          </View>
        )}
      </View>

      {/* Temple List */}
      <ScrollView contentContainerStyle={styles.content}>
        {temples.map((temple) => {
          const isSelected = selectedTemple?.id === temple.id;
          return (
            <TouchableOpacity
              key={temple.id}
              activeOpacity={0.85}
              onPress={() => setSelectedTemple(temple)}
              style={[
                styles.card,
                getClayStyle(activeTheme, 'low'),
                { backgroundColor: colors.surface, borderColor: isSelected ? colors.primary : colors.border },
                isSelected && { borderWidth: 2 },
              ]}
            >
              <View style={styles.cardTop}>
                <View style={styles.copy}>
                  <Text style={[styles.title, { color: colors.text }]}>{temple.name}</Text>
                  <Text style={[styles.meta, { color: colors.textMuted }]}>{temple.address}, {temple.state}</Text>
                  <Text style={[styles.verified, { color: colors.success }]}>
                    {temple.verificationStatus.replaceAll('_', ' ').toLowerCase()}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => save(temple.id)}>
                  <Ionicons
                    name={saved.includes(temple.id) ? 'bookmark' : 'bookmark-outline'}
                    color={colors.primary}
                    size={24}
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.dirBtn, { borderColor: `${colors.primary}40`, backgroundColor: `${colors.primary}15` }]}
                onPress={() =>
                  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${temple.latitude},${temple.longitude}`)
                }
              >
                <Ionicons name="navigate" size={14} color={colors.primary} />
                <Text style={[styles.dirText, { color: colors.primary }]}>{t('getDirections')}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
        {!temples.length && <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('noTemples')}</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: 2,
  },
  heading: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 12 },
  filters: { gap: 8, paddingHorizontal: spacing.md, paddingVertical: 10 },
  filter: { paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderRadius: 20 },
  filterText: { fontSize: 12 },
  mapContainer: {
    height: 220,
    marginHorizontal: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fallbackBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 60 },
  card: {
    borderWidth: 1, borderRadius: 20, padding: spacing.md, gap: 10,
  },
  cardTop: { flexDirection: 'row', gap: 12 },
  copy: { flex: 1 },
  title: { fontWeight: '700', fontSize: 15 },
  meta: { fontSize: 12, marginTop: 4 },
  verified: { fontSize: 10, textTransform: 'capitalize', marginTop: 6 },
  dirBtn: {
    flexDirection: 'row', gap: 5, alignItems: 'center',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1,
  },
  dirText: { fontSize: 13, fontWeight: '600' },
});
