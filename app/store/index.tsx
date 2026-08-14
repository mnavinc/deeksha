import { useState } from 'react';
import {
  Alert,
  Image,
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

export interface StoreItem {
  id: string;
  name: string;
  category: 'redeem' | 'donate';
  pointsCost?: number;
  itemType: string;
  imageEmoji: string;
  description: string;
}

const SAMPLE_STORE_ITEMS: StoreItem[] = [
  {
    id: 'tulsi_mala',
    name: 'Authentic Tulsi Mala (108 Beads)',
    category: 'redeem',
    pointsCost: 200,
    itemType: 'Mala',
    imageEmoji: '📿',
    description: 'Natural Tulsi wooden beads purified for daily Deeksha chanting.',
  },
  {
    id: 'brass_diya',
    name: 'Panchamukha Brass Puja Lamp',
    category: 'redeem',
    pointsCost: 450,
    itemType: 'Puja Item',
    imageEmoji: '🪔',
    description: 'Handcrafted traditional brass oil lamp for morning & evening prayers.',
  },
  {
    id: 'irumudi_kit',
    name: 'Complete Irumudi Preparation Set',
    category: 'redeem',
    pointsCost: 600,
    itemType: 'Pilgrimage Essential',
    imageEmoji: '🎒',
    description: 'Sacred twin-bag set, ghee coconut container, & puja camphor items.',
  },
  {
    id: 'vibhuti_pack',
    name: 'Pure Sacred Bhasmam Pack',
    category: 'redeem',
    pointsCost: 100,
    itemType: 'Sacred Ashes',
    imageEmoji: '⚪',
    description: 'Consecrated Vibhuti prepared following traditional Vedic practices.',
  },
  {
    id: 'donate_kanni_kit',
    name: 'Sponsor Kanni Swamy Kit for Pilgrim',
    category: 'donate',
    itemType: 'Pilgrim Support',
    imageEmoji: '🎁',
    description: 'Gift a complete Mala & Irumudi set to a underprivileged first-time pilgrim.',
  },
  {
    id: 'donate_annadhanam',
    name: 'Sponsor Annadhanam Meals for 5 Pilgrims',
    category: 'donate',
    itemType: 'Meal Donation',
    imageEmoji: '🍲',
    description: 'Provide 5 hot, hygienic vegetarian meals during mountain trek.',
  },
];

export default function StoreScreen() {
  const { t } = useI18n();
  const colors = useThemeColors();
  const theme = useAppStore((s) => s.theme);
  const activeTheme = theme === 'system' ? 'dark' : theme;

  const points = useAppStore((s) => s.totalPoints);
  const [tab, setTab] = useState<'redeem' | 'donate'>('redeem');

  const items = SAMPLE_STORE_ITEMS.filter((i) => i.category === tab);

  const handleRedeem = (item: StoreItem) => {
    if (tab === 'redeem' && item.pointsCost && points < item.pointsCost) {
      Alert.alert('Insufficient Points', `You need ${item.pointsCost} points. Keep completing daily discipline to earn points!`);
      return;
    }
    Alert.alert(
      tab === 'redeem' ? 'Redeem Item' : 'Donate Item',
      `Would you like to ${tab === 'redeem' ? 'redeem' : 'donate'} ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            Alert.alert('Success 🙏', `${item.name} has been processed successfully.`);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <HeaderNav />

      {/* Hero Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerText}>
          <Text style={[styles.heading, { color: colors.text }]}>{t('poojaStore')}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('poojaStoreSubtitle')}</Text>
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

      {/* Mode Switcher Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'redeem' && { backgroundColor: colors.primary }]}
          onPress={() => setTab('redeem')}
        >
          <Ionicons name="bag-handle" size={16} color={tab === 'redeem' ? '#0D1117' : colors.textMuted} />
          <Text style={[styles.tabBtnText, { color: tab === 'redeem' ? '#0D1117' : colors.textMuted }, tab === 'redeem' && { fontWeight: '800' }]}>
            {t('buyWithPoints')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, tab === 'donate' && { backgroundColor: colors.primary }]}
          onPress={() => setTab('donate')}
        >
          <Ionicons name="heart" size={16} color={tab === 'donate' ? '#0D1117' : colors.textMuted} />
          <Text style={[styles.tabBtnText, { color: tab === 'donate' ? '#0D1117' : colors.textMuted }, tab === 'donate' && { fontWeight: '800' }]}>
            {t('donateItems')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Store Items Grid */}
      <ScrollView contentContainerStyle={styles.content}>
        {items.map((item) => (
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
              <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.cardDesc, { color: colors.textMuted }]}>{item.description}</Text>

              <View style={styles.cardFooter}>
                {item.pointsCost ? (
                  <Text style={[styles.costText, { color: colors.primary }]}>{item.pointsCost} Points</Text>
                ) : (
                  <Text style={[styles.costText, { color: colors.success }]}>Pilgrim Gift</Text>
                )}

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleRedeem(item)}
                >
                  <Text style={styles.actionBtnText}>
                    {tab === 'redeem' ? t('redeem') : t('donate')}
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
  tabContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363D40',
  },
  tabBtnText: { fontSize: 13, fontWeight: '600' },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 60 },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 20,
    alignItems: 'center',
  },
  cardEmoji: { fontSize: 44 },
  cardInfo: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardDesc: { fontSize: 12, lineHeight: 16 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  costText: { fontSize: 14, fontWeight: '800' },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  actionBtnText: { color: '#0D1117', fontWeight: '800', fontSize: 12 },
});
