export interface SwamiTier {
  pilgrimageNumber: number;
  traditionalName: string;
  alternateNames?: string[];
  symbol: string;
  classificationSource: 'traditional';
  officialTdbClassification: false;
}

export const SWAMI_TIERS: SwamiTier[] = [
  { pilgrimageNumber: 1, traditionalName: 'Kanni Swamy', alternateNames: ['Kanni Ayyappan'], symbol: '🌱', classificationSource: 'traditional', officialTdbClassification: false },
  { pilgrimageNumber: 2, traditionalName: 'Kathi Swamy', symbol: '⚔️', classificationSource: 'traditional', officialTdbClassification: false },
  { pilgrimageNumber: 3, traditionalName: 'Ganta Swamy', symbol: '🔔', classificationSource: 'traditional', officialTdbClassification: false },
  { pilgrimageNumber: 4, traditionalName: 'Gada Swamy', symbol: '🪓', classificationSource: 'traditional', officialTdbClassification: false },
  { pilgrimageNumber: 5, traditionalName: 'Peru Swamy', symbol: '🏔️', classificationSource: 'traditional', officialTdbClassification: false },
  { pilgrimageNumber: 6, traditionalName: 'Jyoti Swamy', symbol: '✨', classificationSource: 'traditional', officialTdbClassification: false },
  { pilgrimageNumber: 7, traditionalName: 'Surya Swamy', symbol: '☀️', classificationSource: 'traditional', officialTdbClassification: false },
  { pilgrimageNumber: 8, traditionalName: 'Chandra Swamy', symbol: '🌙', classificationSource: 'traditional', officialTdbClassification: false },
  { pilgrimageNumber: 9, traditionalName: 'Trishula Swamy', symbol: '🔱', classificationSource: 'traditional', officialTdbClassification: false },
  { pilgrimageNumber: 10, traditionalName: 'Vishnu Chakra Swamy', symbol: '☸️', classificationSource: 'traditional', officialTdbClassification: false },
  { pilgrimageNumber: 11, traditionalName: 'Shankadhara Swamy', symbol: '🐚', classificationSource: 'traditional', officialTdbClassification: false },
  { pilgrimageNumber: 12, traditionalName: 'Nagabharana Swamy', symbol: '🐍', classificationSource: 'traditional', officialTdbClassification: false },
  { pilgrimageNumber: 13, traditionalName: 'Srihari Swamy', symbol: '🪷', classificationSource: 'traditional', officialTdbClassification: false },
  { pilgrimageNumber: 14, traditionalName: 'Padma Swamy', symbol: '🌸', classificationSource: 'traditional', officialTdbClassification: false },
  { pilgrimageNumber: 15, traditionalName: 'Sri Swamy', symbol: '🙏', classificationSource: 'traditional', officialTdbClassification: false },
  { pilgrimageNumber: 16, traditionalName: 'Sri Sabari Swamy', alternateNames: ['Rathigiri Swamy'], symbol: '🌲', classificationSource: 'traditional', officialTdbClassification: false },
  { pilgrimageNumber: 17, traditionalName: 'Omkara Swamy', symbol: '🕉️', classificationSource: 'traditional', officialTdbClassification: false },
  { pilgrimageNumber: 18, traditionalName: 'Narikela Swamy', alternateNames: ['Guru Swamy'], symbol: '🥥', classificationSource: 'traditional', officialTdbClassification: false },
];

export function getSwamiTier(pilgrimageCount: number): SwamiTier {
  const clamped = Math.min(Math.max(pilgrimageCount, 1), 18);
  return SWAMI_TIERS[clamped - 1];
}

export function isGuruSwamyEligible(pilgrimageCount: number): boolean {
  return pilgrimageCount >= 18;
}
