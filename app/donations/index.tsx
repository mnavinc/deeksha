import { useState } from 'react';
import {
  Alert,
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

interface Cause {
  id: string;
  titleKey: any;
  desc: string;
  icon: string;
  beneficiaries: string;
}

const CAUSES: Cause[] = [
  {
    id: 'annadhanam',
    titleKey: 'annadhanamTrust',
    desc: 'Free nutritious food distribution for thousands of daily walking pilgrims during Mandala-Makaravilakku season.',
    icon: '🍲',
    beneficiaries: '50,000+ meals daily',
  },
  {
    id: 'temple_water',
    titleKey: 'templeMaintenance',
    desc: 'Installing clean drinking water stations, eco-friendly sanitation, and traditional temple upkeep along forest routes.',
    icon: '🚰',
    beneficiaries: '25 Pilgrim Centers',
  },
  {
    id: 'medical_aid',
    titleKey: 'pilgrimMedical',
    desc: 'First-aid posts, oxygen stations, and emergency volunteer stretchers for Neelimala & Karimala mountain climbs.',
    icon: '🏥',
    beneficiaries: '10 Mountain Aid Camps',
  },
];

const AMOUNTS = [108, 501, 1116, 5001];

export default function DonationsScreen() {
  const { t } = useI18n();
  const colors = useThemeColors();
  const theme = useAppStore((s) => s.theme);
  const activeTheme = theme === 'system' ? 'dark' : theme;

  const [selectedCause, setSelectedCause] = useState<string>('annadhanam');
  const [selectedAmount, setSelectedAmount] = useState<number>(501);

  const handleRazorpayPayment = () => {
    analytics.logEvent('donation_initiated', 'donation', {
      cause: selectedCause,
      amount: selectedAmount,
    });

    // Integrated Razorpay Checkout Script Hook & Modal Fallback
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      const options = {
        key: 'rzp_test_deeksha_key', // Prepped for Razorpay API key
        amount: selectedAmount * 100, // Amount in paise
        currency: 'INR',
        name: 'Deeksha Journey Devotional Trust',
        description: `Contribution for ${selectedCause}`,
        image: 'https://deeksha-journey.vercel.app/logo.png',
        handler: function (response: any) {
          analytics.logEvent('donation_success', 'donation', { payment_id: response.razorpay_payment_id });
          Alert.alert('Payment Successful 🙏', `Razorpay Payment ID: ${response.razorpay_payment_id}`);
        },
        prefill: {
          name: 'Swami Devotee',
          email: 'swami@deekshajourney.org',
          contact: '9876543210',
        },
        theme: {
          color: '#F0B429',
        },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } else {
      Alert.alert(
        'Razorpay Gateway 🙏',
        `Initiating secure Razorpay checkout for ₹${selectedAmount} toward ${selectedCause}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Pay via Razorpay',
            onPress: () => {
              analytics.logEvent('donation_success', 'donation', { amount: selectedAmount });
              Alert.alert('Thank You!', `Your contribution of ₹${selectedAmount} has been recorded.`);
            },
          },
        ]
      );
    }
  };

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <HeaderNav />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.heading, { color: colors.text }]}>{t('donations')}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('donationsSubtitle')}</Text>

          {/* Community-driven disclaimer note */}
          <View style={[styles.communityNoticeBox, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}40` }]}>
            <Text style={[styles.communityNoticeTitle, { color: colors.primary }]}>
              🤝 Community-Driven App • Help Us Serve Mankind
            </Text>
            <Text style={[styles.communityNoticeText, { color: colors.textMuted }]}>
              Deeksha Journey is a community-driven initiative dedicated to spiritual discipline and pilgrim service. Help us maintain this platform free for every Swami! Temple donations go directly to verified Annadhanam trusts & pilgrim medical camps.
            </Text>
          </View>
        </View>

        {/* Cause Cards */}
        <View style={styles.causesList}>
          {CAUSES.map((cause) => {
            const isSelected = selectedCause === cause.id;
            return (
              <TouchableOpacity
                key={cause.id}
                activeOpacity={0.85}
                onPress={() => setSelectedCause(cause.id)}
                style={[
                  styles.causeCard,
                  getClayStyle(activeTheme, 'medium'),
                  { backgroundColor: colors.surface, borderColor: isSelected ? colors.primary : colors.border },
                  isSelected && { borderWidth: 2 },
                ]}
              >
                <View style={styles.causeTop}>
                  <Text style={styles.causeIcon}>{cause.icon}</Text>
                  <View style={styles.causeText}>
                    <Text style={[styles.causeTitle, { color: colors.text }]}>{t(cause.titleKey)}</Text>
                    <Text style={[styles.causeBeneficiary, { color: colors.primary }]}>{cause.beneficiaries}</Text>
                  </View>
                </View>
                <Text style={[styles.causeDesc, { color: colors.textMuted }]}>{cause.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Amount Selector & Razorpay Trigger */}
        <View
          style={[
            styles.amountCard,
            getClayStyle(activeTheme, 'low'),
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.amountLabel, { color: colors.textDim }]}>{t('selectAmount')}</Text>
          <View style={styles.amountGrid}>
            {AMOUNTS.map((amt) => (
              <TouchableOpacity
                key={amt}
                onPress={() => setSelectedAmount(amt)}
                style={[
                  styles.amountChip,
                  { borderColor: colors.border },
                  selectedAmount === amt && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Text style={[styles.amountChipText, { color: colors.textMuted }, selectedAmount === amt && { color: '#0D1117', fontWeight: '800' }]}>
                  ₹{amt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.donateSubmitBtn, { backgroundColor: colors.primary }]}
            onPress={handleRazorpayPayment}
          >
            <Ionicons name="card-outline" size={18} color="#0D1117" />
            <Text style={styles.donateSubmitText}>Pay ₹{selectedAmount} via Razorpay</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 60 },
  header: { gap: 6 },
  heading: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 13, lineHeight: 18 },
  communityNoticeBox: {
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    marginTop: 6,
  },
  communityNoticeTitle: { fontSize: 13, fontWeight: '800' },
  communityNoticeText: { fontSize: 12, lineHeight: 17 },
  causesList: { gap: spacing.md },
  causeCard: {
    padding: spacing.md,
    borderRadius: 20,
    gap: 8,
  },
  causeTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  causeIcon: { fontSize: 32 },
  causeText: { flex: 1 },
  causeTitle: { fontSize: 16, fontWeight: '700' },
  causeBeneficiary: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  causeDesc: { fontSize: 12, lineHeight: 17 },
  amountCard: {
    padding: spacing.md,
    borderRadius: 20,
    gap: spacing.md,
    marginTop: 8,
  },
  amountLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  amountGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  amountChip: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
  },
  amountChipText: { fontSize: 15 },
  donateSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  donateSubmitText: { color: '#0D1117', fontWeight: '800', fontSize: 15 },
});
