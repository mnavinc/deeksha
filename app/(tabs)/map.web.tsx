/**
 * map.web.tsx — OpenStreetMap / Leaflet web fallback using responsive iframe,
 * providing a clean, responsive interactive map alternative on web.
 */
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking, useWindowDimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DeityFilter, SAMPLE_TEMPLES } from '@/data/temples';
import { fetchNearbyTemplesOSM, getOpenStreetMapUrl, type OsmTemple } from '@/services/openMapsService';
import { useAppStore } from '@/store/useAppStore';
import { useThemeColors, spacing } from '@/theme/colors';
import { getClayStyle } from '@/theme/claymorphism';
import { useI18n } from '@/i18n';
import { HeaderNav } from '@/components/HeaderNav';

const filters: Array<DeityFilter | 'All'> = ['All', 'Ayyappa', 'Durga', 'Venkateswara', 'Shiva', 'Hanuman', 'Nookambika'];

export default function MapScreen() {
  const { t } = useI18n();
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const theme = useAppStore((s) => s.theme);
  const activeTheme = theme === 'system' ? 'dark' : theme;

  const [filter, setFilter] = useState<DeityFilter | 'All'>('All');
  const [nearby, setNearby] = useState<OsmTemple[] | null>(null);
  const [locating, setLocating] = useState(false);
  const [selectedTemple, setSelectedTemple] = useState<typeof SAMPLE_TEMPLES[0] | OsmTemple | null>(SAMPLE_TEMPLES[0]);
  const saved = useAppStore((s) => s.savedTempleIds);
  const save = useAppStore((s) => s.saveTemple);

  const temples = useMemo(
    () => (nearby ?? SAMPLE_TEMPLES).filter((item) => filter === 'All' || item.deity === filter),
    [nearby, filter]
  );

  const locateOpenMaps = async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const list = await fetchNearbyTemplesOSM(
          pos.coords.latitude,
          pos.coords.longitude,
          25000,
          filter === 'All' ? undefined : filter
        );
        setNearby(list);
        if (list.length > 0) setSelectedTemple(list[0]);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

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
      <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heading, { color: colors.text }]}>{t('temples')}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {nearby ? `${nearby.length} OpenStreetMap & regional temples nearby` : t('discoverTemples')}
          </Text>
        </View>
        <TouchableOpacity
          onPress={locateOpenMaps}
          disabled={locating}
          accessibilityRole="button"
          accessibilityLabel="Find nearby temples via OpenStreetMap"
          style={[styles.locateBtn, { backgroundColor: colors.primary }]}
        >
          {locating ? (
            <ActivityIndicator size="small" color="#0D1117" />
          ) : (
            <Ionicons name="locate" color="#0D1117" size={16} />
          )}
          <Text style={styles.locateText}>{t('nearby')} (OSM)</Text>
        </TouchableOpacity>
      </View>

      {/* Deity Filters */}
      <View style={styles.filtersWrapper}>
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
      </View>

      {/* Responsive Split View on Desktop/Tablet, Stacked on Mobile */}
      <View style={[styles.bodyWrap, isWide && styles.bodyWrapWide]}>
        {/* Web Interactive Map — OpenStreetMap Embed */}
        <View
          style={[
            styles.mapContainer,
            isWide && styles.mapContainerWide,
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
        <ScrollView style={isWide ? { flex: 1 } : undefined} contentContainerStyle={styles.content}>
          {temples.map((temple) => {
            const isSelected = selectedTemple?.id === temple.id;
            const distKm = 'distanceKm' in temple && typeof temple.distanceKm === 'number' ? temple.distanceKm : undefined;
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
                    <Text style={[styles.meta, { color: colors.textMuted }]}>
                      {temple.address}, {temple.state}
                      {distKm !== undefined ? ` · ${distKm.toFixed(1)} km` : ''}
                    </Text>
                    <Text style={[styles.verified, { color: colors.success }]}>
                      {'source' in temple && temple.source === 'osm' ? 'OpenStreetMap · ' : ''}
                      {temple.verificationStatus.replaceAll('_', ' ').toLowerCase()}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => save(temple.id)} accessibilityLabel={`Save ${temple.name}`}>
                    <Ionicons
                      name={saved.includes(temple.id) ? 'bookmark' : 'bookmark-outline'}
                      color={colors.primary}
                      size={24}
                    />
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.dirBtn, { flex: 1, justifyContent: 'center', borderColor: `${colors.primary}40`, backgroundColor: `${colors.primary}15` }]}
                    onPress={() =>
                      Linking.openURL(getOpenStreetMapUrl(temple.latitude, temple.longitude))
                    }
                  >
                    <Ionicons name="map-outline" size={14} color={colors.primary} />
                    <Text style={[styles.dirText, { color: colors.primary }]}>OpenStreetMap</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.dirBtn, { flex: 1, justifyContent: 'center', borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
                    onPress={() =>
                      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${temple.latitude},${temple.longitude}`)
                    }
                  >
                    <Ionicons name="navigate" size={14} color={colors.text} />
                    <Text style={[styles.dirText, { color: colors.text }]}>{t('getDirections')}</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
          {!temples.length && <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('noTemples')}</Text>}
        </ScrollView>
      </View>
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
  filtersWrapper: { height: 52, minHeight: 52, flexShrink: 0, zIndex: 10, marginVertical: 4 },
  filters: { gap: 8, paddingHorizontal: spacing.md, alignItems: 'center' },
  filter: { paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderRadius: 20 },
  filterText: { fontSize: 12 },
  locateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minHeight: 40,
  },
  locateText: { color: '#0D1117', fontSize: 12, fontWeight: '800' },
  bodyWrap: { flex: 1 },
  bodyWrapWide: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.md },
  mapContainer: {
    height: 220,
    marginHorizontal: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mapContainerWide: {
    flex: 1.1,
    height: 'auto' as any,
    minHeight: 420,
    marginHorizontal: 0,
    marginBottom: spacing.md,
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
