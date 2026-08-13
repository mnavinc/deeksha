import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Linking } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { DeityFilter, SAMPLE_TEMPLES, getNearbyTemples } from '@/data/temples';
import { useAppStore } from '@/store/useAppStore';
import { colors, spacing } from '@/theme/colors';
import { useI18n } from '@/i18n';

const filters: Array<DeityFilter | 'All'> = ['All', 'Ayyappa', 'Durga', 'Venkateswara', 'Shiva', 'Hanuman', 'Nookambika'];

type ViewMode = 'list' | 'map';

export default function MapScreen() {
  const { t } = useI18n();
  const [filter, setFilter] = useState<DeityFilter | 'All'>('All');
  const [nearby, setNearby] = useState<ReturnType<typeof getNearbyTemples> | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const saved = useAppStore((s) => s.savedTempleIds);
  const save = useAppStore((s) => s.saveTemple);

  const temples = useMemo(
    () => (nearby ?? SAMPLE_TEMPLES).filter((t) => filter === 'All' || t.deity === filter),
    [nearby, filter]
  );

  const locate = async () => {
    const result = await Location.requestForegroundPermissionsAsync();
    if (result.status !== 'granted') return;
    const p = await Location.getCurrentPositionAsync({});
    setUserLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude });
    setNearby(getNearbyTemples(p.coords.latitude, p.coords.longitude, 500, filter === 'All' ? undefined : filter));
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

      {/* Filters */}
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
                    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${temple.latitude},${temple.longitude}`)
                  }
                >
                  <Ionicons name="navigate" size={14} color={colors.primary} />
                  <Text style={styles.dirText}>{t('getDirections')}</Text>
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
  filters: { gap: 8, paddingHorizontal: spacing.md, paddingVertical: 10 },
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
});
