export type ContentCategory =
  | 'OFFICIAL'
  | 'TRADITIONAL'
  | 'REGIONAL_CUSTOM'
  | 'GURU_SWAMY_GUIDANCE'
  | 'TEMPORARY_OPERATIONAL';

export type DeekshaId =
  | 'ayyappa'
  | 'bhavani'
  | 'govinda'
  | 'shiva'
  | 'hanuman'
  | 'nookambika';

export interface DeekshaRuleset {
  deekshaId: DeekshaId;
  durationOptions: number[];
  clothing: { recommended: string[]; required: boolean };
  food: { vegetarian: boolean; alcohol: boolean; tobacco: boolean };
  brahmacharyam: boolean;
  haircutRestriction: boolean;
  shavingRestriction: boolean;
  nailCuttingRestriction: boolean;
  irumudi: boolean;
  eighteenSteps: boolean;
  specialDestination?: string;
  commonMantra?: string;
  commonSaranam?: string;
  requiresLocalConfirmation?: boolean;
}

export interface DeekshaType {
  id: DeekshaId;
  name: string;
  alternateNames: string[];
  deity: string;
  traditionScope: 'official' | 'regional' | 'temple_specific';
  rules: DeekshaRuleset;
  pilgrimageCenters: string[];
}

export const DEEKSHA_TYPES: DeekshaType[] = [
  {
    id: 'ayyappa',
    name: 'Ayyappa Deeksha',
    alternateNames: ['Ayyappa Mala', 'Mandala Vrutham'],
    deity: 'Sri Ayyappa / Dharma Sastha',
    traditionScope: 'official',
    pilgrimageCenters: ['Sabarimala'],
    rules: {
      deekshaId: 'ayyappa',
      durationOptions: [41],
      clothing: { recommended: ['black', 'dark_blue'], required: false },
      food: { vegetarian: true, alcohol: false, tobacco: false },
      brahmacharyam: true,
      haircutRestriction: true,
      shavingRestriction: true,
      nailCuttingRestriction: true,
      irumudi: true,
      eighteenSteps: true,
      specialDestination: 'Sabarimala',
      commonSaranam: 'Swamiye Saranam Ayyappa',
    },
  },
  {
    id: 'bhavani',
    name: 'Bhavani Deeksha',
    alternateNames: ['Kanaka Durga Mala', 'Bhavani Mala'],
    deity: 'Sri Kanaka Durga',
    traditionScope: 'regional',
    pilgrimageCenters: ['Vijayawada Kanaka Durga Temple'],
    rules: {
      deekshaId: 'bhavani',
      durationOptions: [41, 21],
      clothing: { recommended: ['red', 'crimson'], required: false },
      food: { vegetarian: true, alcohol: false, tobacco: false },
      brahmacharyam: true,
      haircutRestriction: false,
      shavingRestriction: false,
      nailCuttingRestriction: false,
      irumudi: true,
      eighteenSteps: false,
      specialDestination: 'Vijayawada',
      commonSaranam: 'Jai Bhavani',
    },
  },
  {
    id: 'govinda',
    name: 'Govinda Mala',
    alternateNames: ['Venkateswara Mala', 'Govinda Deeksha'],
    deity: 'Sri Venkateswara',
    traditionScope: 'regional',
    pilgrimageCenters: ['Tirumala', 'Tirupati', 'Dwaraka Tirumala'],
    rules: {
      deekshaId: 'govinda',
      durationOptions: [41, 21],
      clothing: { recommended: ['yellow', 'saffron'], required: false },
      food: { vegetarian: true, alcohol: false, tobacco: false },
      brahmacharyam: true,
      haircutRestriction: false,
      shavingRestriction: false,
      nailCuttingRestriction: false,
      irumudi: true,
      eighteenSteps: false,
      commonMantra: 'Om Namo Venkatesaya',
      commonSaranam: 'Govinda Govinda',
    },
  },
  {
    id: 'shiva',
    name: 'Shiva Deeksha',
    alternateNames: ['Shiva Mala'],
    deity: 'Lord Shiva',
    traditionScope: 'regional',
    pilgrimageCenters: ['Srisailam', 'Vemulawada'],
    rules: {
      deekshaId: 'shiva',
      durationOptions: [11, 21, 41],
      clothing: { recommended: ['white', 'saffron'], required: false },
      food: { vegetarian: true, alcohol: false, tobacco: false },
      brahmacharyam: true,
      haircutRestriction: false,
      shavingRestriction: false,
      nailCuttingRestriction: false,
      irumudi: true,
      eighteenSteps: false,
      commonMantra: 'Om Namah Shivaya',
    },
  },
  {
    id: 'hanuman',
    name: 'Hanuman Deeksha',
    alternateNames: ['Anjaneya Mala', 'Hanuman Mala'],
    deity: 'Lord Hanuman',
    traditionScope: 'regional',
    pilgrimageCenters: ['Kondagattu', 'Kasapuram', 'Maddi'],
    rules: {
      deekshaId: 'hanuman',
      durationOptions: [11, 21, 41],
      clothing: { recommended: ['saffron', 'red'], required: false },
      food: { vegetarian: true, alcohol: false, tobacco: false },
      brahmacharyam: true,
      haircutRestriction: false,
      shavingRestriction: false,
      nailCuttingRestriction: false,
      irumudi: true,
      eighteenSteps: false,
      commonMantra: 'Jai Hanuman',
    },
  },
  {
    id: 'nookambika',
    name: 'Nookambika Mala',
    alternateNames: ['Nookambika Deeksha', 'Nookalamma Mala'],
    deity: 'Sri Nookambika Ammavaru',
    traditionScope: 'temple_specific',
    pilgrimageCenters: ['Nookambika Temple, Anakapalli'],
    rules: {
      deekshaId: 'nookambika',
      durationOptions: [],
      clothing: { recommended: [], required: false },
      food: { vegetarian: true, alcohol: false, tobacco: false },
      brahmacharyam: true,
      haircutRestriction: false,
      shavingRestriction: false,
      nailCuttingRestriction: false,
      irumudi: false,
      eighteenSteps: false,
      requiresLocalConfirmation: true,
    },
  },
];

export function getDeekshaType(id: DeekshaId): DeekshaType | undefined {
  return DEEKSHA_TYPES.find((d) => d.id === id);
}
