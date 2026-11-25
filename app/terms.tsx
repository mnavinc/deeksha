import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import { useThemeColors, spacing } from '@/theme/colors';
import { getClayStyle } from '@/theme/claymorphism';
import { HeaderNav } from '@/components/HeaderNav';

export default function TermsScreen() {
  const colors = useThemeColors();
  const theme = useAppStore((s) => s.theme);
  const activeTheme = theme === 'system' ? 'dark' : theme;

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <HeaderNav />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.heading, { color: colors.text }]}>Terms &amp; Conditions</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Swamiseva · Deeksha Journey (DeekshaOrg, India) · Effective November 2026
          </Text>
        </View>

        <View
          style={[
            styles.card,
            getClayStyle(activeTheme, 'medium'),
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionHeading, { color: colors.primary }]}>1. Acceptance of Terms</Text>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            By accessing or using Swamiseva (Deeksha Journey), including joining a Sannidhanam group via QR invite or signing in with a Passkey, Google, Apple, or Email OTP, you agree to these Terms &amp; Conditions and our Privacy Policy.
          </Text>

          <Text style={[styles.sectionHeading, { color: colors.primary }]}>2. Account Security, Passkeys &amp; OAuth</Text>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            Swamiseva supports phishing-resistant FIDO2/WebAuthn Passkeys synced via your Apple iCloud Keychain or Google Password Manager, alongside Google and Apple Social Sign-In. You are responsible for maintaining the security of your device biometrics and linked accounts. Mobile number and email are maintained strictly as profile and communication information.
          </Text>

          <Text style={[styles.sectionHeading, { color: colors.primary }]}>3. Spiritual &amp; Pilgrimage Guidance</Text>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            Pooja Vidhanam, Vrutham timelines, sunrise/sunset reminders, and temple metadata are provided for devotional convenience. Always follow official Travancore Devaswom Board (sabarimalaonline.org) advisories and your Guru Swamy&apos;s guidance for pilgrimage logistics and Virtual-Q darshan bookings.
          </Text>

          <Text style={[styles.sectionHeading, { color: colors.primary }]}>4. Sannidhanam Groups &amp; Expense Splitting</Text>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            Group chats, shared locations, and yatra expense ledgers are visible to members of that Sannidhanam group. DeekshaOrg is not a financial escrow provider and is not liable for private cash or UPI settlements between group members.
          </Text>

          <Text style={[styles.sectionHeading, { color: colors.primary }]}>5. Donations, Store &amp; Emails</Text>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            Payments for devotional items or charity donations are processed via authorized payment gateways (such as Razorpay). Transactional and optional newsletter emails are dispatched via Resend; you may opt out of newsletters anytime in your Profile settings.
          </Text>

          <Text style={[styles.sectionHeading, { color: colors.primary }]}>6. Governing Law</Text>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            These terms are governed by the laws of the Republic of India, including the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023.
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
