import { useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
import { useThemeColors, spacing } from '@/theme/colors';
import { getClayStyle } from '@/theme/claymorphism';
import { useI18n } from '@/i18n';
import { HeaderNav } from '@/components/HeaderNav';
import { analytics } from '@/utils/analytics';

export type StoreVendor = 'all' | 'amazon' | 'instamart' | 'blinkit' | 'points';

export interface StoreItem {
  id: string;
  name: string;
  category: 'buy' | 'points' | 'donate';
  priceINR?: number;
  pointsCost?: number;
  vendor: 'amazon' | 'instamart' | 'blinkit' | 'deeksha';
  vendorLabel: string;
  affiliateUrl: string;
  imageEmoji: string;
  description: string;
  healthTags: string[];
}

const STORE_INVENTORY: StoreItem[] = [
  {
    id: 'tulsi_mala_amazon',
    name: 'Authentic 108 Bead Tulsi Mala',
    category: 'buy',
    priceINR: 299,
    vendor: 'amazon',
    vendorLabel: 'Amazon',
    affiliateUrl: 'https://www.amazon.in/s?k=tulsi+mala+108+beads',
    imageEmoji: '📿',
    description: 'Natural purified wooden Tulsi mala for daily Ayyappa Deeksha chanting & mental peace.',
    healthTags: ['Mindfulness', 'Blood Circulation', 'Stress Relief'],
  },
  {
    id: 'ghee_instamart',
    name: 'Pure Cow Ghee (500g) for Neyyabhishekam',
    category: 'buy',
    priceINR: 380,
    vendor: 'instamart',
    vendorLabel: 'Swiggy Instamart',
    affiliateUrl: 'https://www.swiggy.com/instamart/search?custom_back=true&query=cow+ghee',
    imageEmoji: '🥥',
    description: 'Pure A2 Cow Ghee suitable for filling sacred Neyy Thenga for Sabarimala pilgrimage.',
    healthTags: ['Healthy Fats', 'Immunity Boost', 'Digestive Health'],
  },
  {
    id: 'camphor_blinkit',
    name: 'Pure Bhimseni Camphor (Karpuram 250g)',
    category: 'buy',
    priceINR: 220,
    vendor: 'blinkit',
    vendorLabel: 'Blinkit',
    affiliateUrl: 'https://blinkit.com/s/?q=bhimseni+camphor',
    imageEmoji: '🪔',
    description: 'Organic Bhimseni camphor for morning & evening Ayyappa Aarti and respiratory clarity.',
    healthTags: ['Air Purification', 'Respiratory Wellness'],
  },
  {
    id: 'black_dhoti_amazon',
    name: 'Cotton Black Deeksha Dhoti & Towel Set',
    category: 'buy',
    priceINR: 499,
    vendor: 'amazon',
    vendorLabel: 'Amazon',
    affiliateUrl: 'https://www.amazon.in/s?k=black+dhoti+ayyappa',
    imageEmoji: '🥋',
    description: 'Pure breathable cotton black dhoti set designed for 41-day Mandala Vrutham posture.',
    healthTags: ['Comfort Wear', 'Skin Friendly'],
  },
  {
    id: 'vibhuti_blinkit',
    name: 'Traditional Consecrated Vibhuti Bhasmam',
    category: 'buy',
    priceINR: 60,
    vendor: 'blinkit',
    vendorLabel: 'Blinkit',
    affiliateUrl: 'https://blinkit.com/s/?q=vibhuti',
    imageEmoji: '⚪',
    description: 'Pure holy ash for applying Tilakam during morning & evening prayers.',
    healthTags: ['Cooling Effect'],
  },
  {
    id: 'points_brass_lamp',
    name: 'Panchamukha Heavy Brass Puja Lamp',
    category: 'points',
    pointsCost: 450,
    vendor: 'deeksha',
    vendorLabel: 'Points Redemption',
    affiliateUrl: '',
    imageEmoji: '🪔',
    description: 'Handcrafted traditional oil lamp. Redeemable exclusively with discipline points.',
    healthTags: ['Spiritual Discipline'],
  },
  {
    id: 'donate_kanni_kit',
    name: 'Sponsor Kanni Swamy Deeksha Kit',
    category: 'donate',
    priceINR: 501,
    vendor: 'deeksha',
    vendorLabel: 'Devotee Donation',
    affiliateUrl: '',
    imageEmoji: '🎁',
    description: 'Gift a complete Mala, Dhoti & Irumudi set to an underprivileged first-time pilgrim.',
    healthTags: ['Community Service'],
  },
];

export default function StoreScreen() {
  const { t, language } = useI18n();
  const colors = useThemeColors();
  const theme = useAppStore((s) => s.theme);
  const activeTheme = theme === 'system' ? 'dark' : theme;

  const points = useAppStore((s) => s.totalPoints);
  const [selectedVendor, setSelectedVendor] = useState<StoreVendor>('all');

  const filteredItems = STORE_INVENTORY.filter((item) => {
    if (selectedVendor === 'all') return true;
    if (selectedVendor === 'points') return item.category === 'points';
    return item.vendor === selectedVendor;
  });

  const handlePurchase = (item: StoreItem) => {
    analytics.logEvent('store_item_click', 'store', { item_id: item.id, vendor: item.vendor });

    if (item.category === 'points') {
      if (points < (item.pointsCost ?? 0)) {
        Alert.alert('Insufficient Points', `You need ${item.pointsCost} points. Keep completing daily discipline tasks!`);
        return;
      }
      Alert.alert('Redeem with Points 🙏', `Redeem ${item.name} for ${item.pointsCost} points?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => Alert.alert('Order Confirmed!', `${item.name} redemption initiated.`) },
      ]);
      return;
    }

    if (item.affiliateUrl) {
      Linking.openURL(item.affiliateUrl);
    }
  };

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <HeaderNav />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerText}>
          <Text style={[styles.heading, { color: colors.text }]}>{t('poojaStore')}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {language === 'te'
              ? 'అయ్యప్ప దీక్ష, నిత్య పూజ మరియు ఆరోగ్యకరమైన జీవితం కోసం ఆధ్యాత్మిక వస్తువులు.'
              : 'Essential devotional items for Ayyappa Deeksha, daily puja, health & discipline.'}
          </Text>
        </View>

        {/* Points Banner */}
        <View style={[styles.pointsBanner, getClayStyle(activeTheme, 'low', colors.surface)]}>
          <Text style={styles.pointsIcon}>⭐</Text>
          <View>
            <Text style={[styles.pointsLabel, { color: colors.textDim }]}>{t('pointsBalance')}</Text>
            <Text style={[styles.pointsValue, { color: colors.primary }]}>{points} {t('points')}</Text>
          </View>
        </View>
      </View>

      {/* Quick Vendor Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {[
          { id: 'all', label: language === 'te' ? 'అన్నీ' : 'All Products' },
          { id: 'amazon', label: 'Amazon India' },
          { id: 'instamart', label: 'Swiggy Instamart' },
          { id: 'blinkit', label: 'Blinkit' },
          { id: 'points', label: language === 'te' ? 'పాయింట్లు' : 'Points Redeem' },
        ].map((v) => {
          const isSelected = selectedVendor === v.id;
          return (
            <TouchableOpacity
              key={v.id}
              onPress={() => setSelectedVendor(v.id as StoreVendor)}
              style={[
                styles.filterChip,
                { borderColor: colors.border },
                isSelected && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
              ]}
            >
              <Text style={[styles.filterChipText, { color: colors.textMuted }, isSelected && { color: colors.primary, fontWeight: '700' }]}>
                {v.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Items List */}
      <ScrollView contentContainerStyle={styles.content}>
        {filteredItems.map((item) => (
          <View
            key={item.id}
            style={[
              styles.card,
              getClayStyle(activeTheme, 'medium'),
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={styles.cardEmoji}>{item.imageEmoji}</Text>

            <View style={styles.cardInfo}>
              <View style={styles.vendorBadgeRow}>
                <Text style={[styles.vendorBadge, { color: colors.primary, borderColor: `${colors.primary}40` }]}>
                  {item.vendorLabel}
                </Text>
                {item.healthTags.map((tag, idx) => (
                  <Text key={idx} style={[styles.healthTag, { color: colors.success }]}>
                    • {tag}
                  </Text>
                ))}
              </View>

              <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.cardDesc, { color: colors.textMuted }]}>{item.description}</Text>

              <View style={styles.cardFooter}>
                {item.priceINR ? (
                  <Text style={[styles.costText, { color: colors.text }]}>₹{item.priceINR}</Text>
                ) : (
                  <Text style={[styles.costText, { color: colors.primary }]}>{item.pointsCost} Points</Text>
                )}

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handlePurchase(item)}
                >
                  <Text style={styles.actionBtnText}>
                    {item.vendor === 'deeksha' ? t('redeem') : `Buy on ${item.vendorLabel}`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: {
    padding: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
  },
  headerText: { gap: 2 },
  heading: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 12, lineHeight: 17 },
  pointsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.md,
    borderRadius: 16,
  },
  pointsIcon: { fontSize: 28 },
  pointsLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  pointsValue: { fontSize: 18, fontWeight: '800' },
  filterRow: {
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 60 },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 20,
    alignItems: 'flex-start',
  },
  cardEmoji: { fontSize: 40, marginTop: 4 },
  cardInfo: { flex: 1, gap: 4 },
  vendorBadgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  vendorBadge: { fontSize: 10, fontWeight: '700', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  healthTag: { fontSize: 10, fontWeight: '600' },
  cardTitle: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  cardDesc: { fontSize: 12, lineHeight: 16 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  costText: { fontSize: 16, fontWeight: '800' },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  actionBtnText: { color: '#0D1117', fontWeight: '800', fontSize: 12 },
});
