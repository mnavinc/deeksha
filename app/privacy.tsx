import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import { useThemeColors, spacing } from '@/theme/colors';
import { getClayStyle } from '@/theme/claymorphism';
import { useI18n } from '@/i18n';
import { HeaderNav } from '@/components/HeaderNav';

export default function PrivacyScreen() {
  const { t } = useI18n();
  const colors = useThemeColors();
  const theme = useAppStore((s) => s.theme);
  const activeTheme = theme === 'system' ? 'dark' : theme;

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <HeaderNav />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.heading, { color: colors.text }]}>{t('privacyPolicy')}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Compliant with IT Act 2000 & Digital Personal Data Protection Act (DPDP Act, 2023) — Republic of India
          </Text>
        </View>

        <View style={[styles.card, getClayStyle(activeTheme, 'medium'), { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionHeading, { color: colors.primary }]}>1. Collection of Personal Data</Text>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            DeekshaOrg collects minimal personal information required to facilitate Ayyappa Deeksha tracking, group expense settlements, and devotional store redemptions (e.g. name, email, phone number, and optional group names).
          </Text>

          <Text style={[styles.sectionHeading, { color: colors.primary }]}>2. Security & Encryption</Text>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            In accordance with Rule 8 of the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, all user credentials and PII are stored using AES-256-GCM encryption at rest and TLS 1.3 in transit.
          </Text>

          <Text style={[styles.sectionHeading, { color: colors.primary }]}>3. Payment Gateway & Financial Data</Text>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            Financial payments (donations & e-commerce orders) are securely processed by Razorpay. DeekshaOrg does not store credit card numbers, debit card PINs, or UPI credentials on our servers.
          </Text>

          <Text style={[styles.sectionHeading, { color: colors.primary }]}>4. Grievance Officer & Contact</Text>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            Under the Digital Personal Data Protection Act, 2023, you may contact our designated Grievance Officer at grievance@deekshaorg.in for data access, correction, or deletion requests.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 60 },
  header: { gap: 4 },
  heading: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 12, lineHeight: 17 },
  card: { padding: spacing.md, borderRadius: 20, borderWidth: 1, gap: 10 },
  sectionHeading: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  paragraph: { fontSize: 13, lineHeight: 20 },
});
