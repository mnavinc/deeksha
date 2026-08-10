export type DeityFilter =
  | 'Ayyappa'
  | 'Durga'
  | 'Venkateswara'
  | 'Shiva'
  | 'Hanuman'
  | 'Nookambika'
  | 'Ganesha';

export interface Temple {
  id: string;
  name: string;
  localName?: string;
  deity: DeityFilter;
  address: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  deekshaSupported: DeityFilter[];
  malaDharanam: boolean;
  verificationStatus: 'UNVERIFIED' | 'COMMUNITY_VERIFIED' | 'PARTNER_VERIFIED' | 'OFFICIALLY_VERIFIED';
  phone?: string;
  website?: string;
}

export const SAMPLE_TEMPLES: Temple[] = [
  {
    id: 'sabarimala',
    name: 'Sabarimala Sree Ayyappa Temple',
    deity: 'Ayyappa',
    address: 'Sabarimala, Pathanamthitta',
    district: 'Pathanamthitta',
    state: 'Kerala',
    latitude: 9.435,
    longitude: 77.08,
    deekshaSupported: ['Ayyappa'],
    malaDharanam: true,
    verificationStatus: 'OFFICIALLY_VERIFIED',
    website: 'https://www.sabarimala.kerala.gov.in',
  },
  {
    id: 'kanaka-durga',
    name: 'Sri Kanaka Durga Temple',
    localName: 'Indrakeeladri',
    deity: 'Durga',
    address: 'Indrakeeladri, Vijayawada',
    district: 'Krishna',
    state: 'Andhra Pradesh',
    latitude: 16.519,
    longitude: 80.605,
    deekshaSupported: ['Durga'],
    malaDharanam: true,
    verificationStatus: 'OFFICIALLY_VERIFIED',
  },
  {
    id: 'tirumala',
    name: 'Sri Venkateswara Temple',
    deity: 'Venkateswara',
    address: 'Tirumala, Tirupati',
    district: 'Tirupati',
    state: 'Andhra Pradesh',
    latitude: 13.683,
    longitude: 79.347,
    deekshaSupported: ['Venkateswara'],
    malaDharanam: true,
    verificationStatus: 'OFFICIALLY_VERIFIED',
  },
  {
    id: 'srisailam',
    name: 'Sri Bhramaramba Mallikarjuna Swamy Temple',
    deity: 'Shiva',
    address: 'Srisailam',
    district: 'Nandyal',
    state: 'Andhra Pradesh',
    latitude: 16.074,
    longitude: 78.869,
    deekshaSupported: ['Shiva'],
    malaDharanam: true,
    verificationStatus: 'OFFICIALLY_VERIFIED',
  },
  {
    id: 'kondagattu',
    name: 'Kondagattu Anjaneya Swamy Temple',
    deity: 'Hanuman',
    address: 'Kondagattu, Jagtial',
    district: 'Jagtial',
    state: 'Telangana',
    latitude: 18.789,
    longitude: 78.863,
    deekshaSupported: ['Hanuman'],
    malaDharanam: true,
    verificationStatus: 'COMMUNITY_VERIFIED',
  },
  {
    id: 'nookambika',
    name: 'Sri Nookambika Temple',
    deity: 'Nookambika',
    address: 'Anakapalli',
    district: 'Anakapalli',
    state: 'Andhra Pradesh',
    latitude: 17.686,
    longitude: 83.002,
    deekshaSupported: ['Nookambika'],
    malaDharanam: true,
    verificationStatus: 'COMMUNITY_VERIFIED',
  },
];

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getNearbyTemples(
  lat: number,
  lng: number,
  maxKm = 50,
  deity?: DeityFilter
): (Temple & { distanceKm: number })[] {
  return SAMPLE_TEMPLES.filter((t) => !deity || t.deity === deity)
    .map((t) => ({ ...t, distanceKm: haversineKm(lat, lng, t.latitude, t.longitude) }))
    .filter((t) => t.distanceKm <= maxKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
