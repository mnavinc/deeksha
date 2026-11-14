import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Linking } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { DeityFilter, SAMPLE_TEMPLES } from '@/data/temples';
import { fetchNearbyTemplesOSM, getOpenStreetMapUrl, searchPlaceSuggestionsOSM, type OsmPlaceSuggestion, type OsmTemple } from '@/services/openMapsService';
import { useAppStore } from '@/store/useAppStore';
import { colors, spacing } from '@/theme/colors';
import { useI18n } from '@/i18n';

const filters: Array<DeityFilter | 'All'> = ['All', 'Ayyappa', 'Durga', 'Venkateswara', 'Shiva', 'Hanuman', 'Nookambika'];

type ViewMode = 'list' | 'map';

export default function MapScreen() {
  const { t } = useI18n();
  const [filter, setFilter] = useState<DeityFilter | 'All'>('All');
  const [nearby, setNearby] = useState<OsmTemple[] | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [placeQuery, setPlaceQuery] = useState('');
  const [suggestions, setSuggestions] = useState<OsmPlaceSuggestion[]>([]);
  const saved = useAppStore((s) => s.savedTempleIds);
  const save = useAppStore((s) => s.saveTemple);
  const groups = useAppStore((s) => s.groups);

  const publicSannidhanamTemples = useMemo<OsmTemple[]>(
    () =>
      groups
        .filter((g) => g.location?.isPublic)
        .map((g) => ({
          id: `sannidhanam-${g.id}`,
          name: `${g.name} (Sannidhanam)`,
          deity: 'Ayyappa',
          deekshaSupported: ['Ayyappa'],
          latitude: g.location!.latitude,
          longitude: g.location!.longitude,
          address: g.location!.name,
          district: g.location!.name,
          state: 'Public Sannidhanam',
          malaDharanam: true,
          verificationStatus: 'COMMUNITY_VERIFIED',
          distanceKm: 0,
          source: 'curated',
        })),
    [groups]
  );

  const temples = useMemo(() => {
    const base = nearby ?? SAMPLE_TEMPLES;
    const combined = [...publicSannidhanamTemples, ...base];
    return combined.filter((item) => filter === 'All' || item.deity === filter);
  }, [nearby, publicSannidhanamTemples, filter]);

  useEffect(() => {
    const clean = placeQuery.trim();
    if (clean.length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const res = await searchPlaceSuggestionsOSM(clean, 5);
      if (!cancelled) setSuggestions(res);
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [placeQuery]);

  const selectSuggestion = async (item: OsmPlaceSuggestion) => {
    setPlaceQuery(item.name);
    setSuggestions([]);
    setUserLocation({ latitude: item.latitude, longitude: item.longitude });
    const osmList = await fetchNearbyTemplesOSM(
      item.latitude,
      item.longitude,
      25000,
      filter === 'All' ? undefined : filter
    );
    setNearby(osmList);
  };

  const locate = async () => {
    const result = await Location.requestForegroundPermissionsAsync();
    if (result.status !== 'granted') return;
    const p = await Location.getCurrentPositionAsync({});
    setUserLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude });
    const osmList = await fetchNearbyTemplesOSM(
      p.coords.latitude,
      p.coords.longitude,
      25000,
      filter === 'All' ? undefined : filter
    );
    setNearby(osmList);
  };

  // Map region — center on first temple or user location
  const mapRegion = userLocation
    ? { ...userLocation, latitudeDelta: 5, longitudeDelta: 5 }
    : temples.length > 0
      ? { latitude: temples[0].latitude, longitude: temples[0].longitude, latitudeDelta: 10, longitudeDelta: 10 }
      : { latitude: 9.4321, longitude: 77.0839, latitudeDelta: 15, longitudeDelta: 15 }; // Sabarimala default

  return (
    <View style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>{t('temples')}</Text>
          <Text style={styles.subtitle}>{nearby ? t('nearby') : t('discoverTemples')}</Text>
        </View>
        <View style={styles.headerActions}>
          {/* View toggle */}
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'list' && styles.toggleActive]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons name="list" size={15} color={viewMode === 'list' ? colors.background : colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'map' && styles.toggleActive]}
              onPress={() => setViewMode('map')}
            >
              <Ionicons name="map" size={15} color={viewMode === 'map' ? colors.background : colors.textMuted} />
            </TouchableOpacity>
          </View>
          {/* Locate button */}
          <TouchableOpacity onPress={locate} style={styles.locateBtn}>
            <Ionicons name="locate" color={colors.background} size={16} />
            <Text style={styles.locateText}>{t('nearby')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* OpenMaps Location Search & Autocomplete */}
      <View style={{ paddingHorizontal: spacing.md, paddingBottom: 8 }}>
        <View style={styles.osmSearchRow}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            value={placeQuery}
            onChangeText={setPlaceQuery}
            placeholder="Search city or area via OpenMaps..."
            placeholderTextColor={colors.textDim}
            style={styles.osmSearchInput}
          />
          {placeQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setPlaceQuery(''); setSuggestions([]); }}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        {suggestions.length > 0 && (
          <View style={styles.osmDropdown}>
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => void selectSuggestion(item)}
                style={styles.osmDropdownRow}
              >
                <Ionicons name="location-outline" size={15} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }} numberOfLines={1}>
                    {item.displayName}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filtersWrapper}>
        <ScrollView horizontal contentContainerStyle={styles.filters} showsHorizontalScrollIndicator={false}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filter, filter === f && styles.active]}
            >
              <Text style={[styles.filterText, filter === f && styles.activeText]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {viewMode === 'map' ? (
        /* ── MAP VIEW ── */
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            region={mapRegion}
            showsUserLocation={!!userLocation}
          >
            {temples.map((temple) => (
              <Marker
                key={temple.id}
                coordinate={{ latitude: temple.latitude, longitude: temple.longitude }}
                title={temple.name}
                description={temple.address}
                pinColor={colors.primary}
                onCalloutPress={() =>
                  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${temple.latitude},${temple.longitude}`)
                }
              />
            ))}
          </MapView>
        </View>
      ) : (
        /* ── LIST VIEW ── */
        <ScrollView contentContainerStyle={styles.content}>
          {temples.map((temple) => (
            <View key={temple.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.copy}>
                  <Text style={styles.title}>{temple.name}</Text>
                  <Text style={styles.meta}>{temple.address}, {temple.state}</Text>
                  <Text style={styles.verified}>{temple.verificationStatus.replaceAll('_', ' ').toLowerCase()}</Text>
                </View>
                <TouchableOpacity onPress={() => save(temple.id)}>
                  <Ionicons
                    name={saved.includes(temple.id) ? 'bookmark' : 'bookmark-outline'}
                    color={colors.primary}
                    size={24}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.dirBtn}
                  onPress={() =>
                    Linking.openURL(getOpenStreetMapUrl(temple.latitude, temple.longitude))
                  }
                >
                  <Ionicons name="navigate" size={14} color={colors.primary} />
                  <Text style={styles.dirText}>OpenStreetMap</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mapBtn}
                  onPress={() => setViewMode('map')}
                >
                  <Ionicons name="map-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.mapBtnText}>{t('mapView')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {!temples.length && <Text style={styles.subtitle}>{t('noTemples')}</Text>}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: spacing.md, paddingBottom: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  heading: { color: colors.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  toggle: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: 10, padding: 2, borderWidth: 1, borderColor: colors.border,
  },
  toggleBtn: { padding: 7, borderRadius: 8 },
  toggleActive: { backgroundColor: colors.primary },
  locateBtn: {
    flexDirection: 'row', gap: 5, alignItems: 'center',
    backgroundColor: colors.primary, borderRadius: 18,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  locateText: { color: colors.background, fontWeight: '700', fontSize: 12 },
  filtersWrapper: { height: 52, minHeight: 52, flexShrink: 0, zIndex: 10, marginVertical: 4 },
  filters: { gap: 8, paddingHorizontal: spacing.md, alignItems: 'center' },
  filter: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: colors.border, borderRadius: 20,
  },
  active: { backgroundColor: '#F0B42920', borderColor: colors.primary },
  filterText: { color: colors.textMuted, fontSize: 12 },
  activeText: { color: colors.primary, fontWeight: '600' },
  // Map
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  // List
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 40 },
  card: {
    backgroundColor: colors.surface, borderWidth: 1,
    borderColor: colors.border, borderRadius: 14,
    padding: spacing.md, gap: 10,
  },
  cardTop: { flexDirection: 'row', gap: 12 },
  copy: { flex: 1 },
  title: { color: colors.text, fontWeight: '700', fontSize: 15 },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  verified: { color: colors.success, fontSize: 10, textTransform: 'capitalize', marginTop: 6 },
  cardActions: { flexDirection: 'row', gap: 10 },
  dirBtn: {
    flexDirection: 'row', gap: 5, alignItems: 'center',
    backgroundColor: '#F0B42915', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: '#F0B42940',
  },
  dirText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  mapBtn: {
    flexDirection: 'row', gap: 5, alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: colors.border,
  },
  mapBtnText: { color: colors.textMuted, fontSize: 13 },
  osmSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  osmSearchInput: { flex: 1, fontSize: 13, color: colors.text },
  osmDropdown: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  osmDropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
