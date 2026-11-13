import type { DeityFilter, Temple } from '@/data/temples';
import { getNearbyTemples } from '@/data/temples';

export interface OsmTemple extends Temple {
  distanceKm: number;
  source: 'osm' | 'curated';
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function inferDeity(name: string): DeityFilter {
  const lower = name.toLowerCase();
  if (lower.includes('ayyappa') || lower.includes('sastha') || lower.includes('sabarimala')) return 'Ayyappa';
  if (lower.includes('venkates') || lower.includes('balaji') || lower.includes('narayana')) return 'Venkateswara';
  if (lower.includes('shiva') || lower.includes('siva') || lower.includes('mahadev')) return 'Shiva';
  if (lower.includes('durga') || lower.includes('devi') || lower.includes('amman')) return 'Durga';
  if (lower.includes('hanuman') || lower.includes('anjaney')) return 'Hanuman';
  if (lower.includes('nookambika')) return 'Nookambika';
  return 'Ayyappa';
}

export function getOpenStreetMapUrl(latitude: number, longitude: number): string {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
}

/**
 * Query OpenStreetMap Overpass API for nearby Hindu / Ayyappa temples within `radiusMeters`,
 * with automatic fallback to curated regional temples if offline or rate-limited.
 */
export async function fetchNearbyTemplesOSM(
  latitude: number,
  longitude: number,
  radiusMeters = 25000,
  deityFilter?: DeityFilter
): Promise<OsmTemple[]> {
  const curatedFallback: OsmTemple[] = getNearbyTemples(latitude, longitude, 500, deityFilter).map((t) => ({
    ...t,
    distanceKm: haversineKm(latitude, longitude, t.latitude, t.longitude),
    source: 'curated',
  }));

  const query = `[out:json][timeout:10];(node["amenity"="place_of_worship"]["religion"="hindu"](around:${radiusMeters},${latitude},${longitude});way["amenity"="place_of_worship"]["religion"="hindu"](around:${radiusMeters},${latitude},${longitude}););out center 30;`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return curatedFallback;
    const json = (await res.json()) as {
      elements?: Array<{
        id: number;
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
        tags?: Record<string, string>;
      }>;
    };

    const osmResults: OsmTemple[] = [];
    for (const el of json.elements ?? []) {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      const name = el.tags?.name || el.tags?.['name:en'] || el.tags?.['name:te'];
      if (lat === undefined || lon === undefined || !name) continue;

      const deity = inferDeity(name);
      if (deityFilter && deity !== deityFilter) continue;

      const addrParts = [el.tags?.['addr:street'], el.tags?.['addr:city'] || el.tags?.['addr:town']].filter(Boolean);
      osmResults.push({
        id: `osm-${el.id}`,
        name,
        deity,
        address: addrParts.length > 0 ? addrParts.join(', ') : 'OpenStreetMap Temple',
        district: el.tags?.['addr:district'] || el.tags?.['addr:city'] || el.tags?.['addr:town'] || '',
        state: el.tags?.['addr:state'] || 'India',
        latitude: lat,
        longitude: lon,
        deekshaSupported: [deity],
        malaDharanam: deity === 'Ayyappa',
        verificationStatus: 'COMMUNITY_VERIFIED',
        distanceKm: haversineKm(latitude, longitude, lat, lon),
        source: 'osm',
      });
    }

    const merged = [...osmResults, ...curatedFallback].sort((a, b) => a.distanceKm - b.distanceKm);
    return merged.slice(0, 35);
  } catch {
    return curatedFallback;
  }
}
