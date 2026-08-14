import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
import { useThemeColors, spacing } from '@/theme/colors';
import { getClayStyle } from '@/theme/claymorphism';
import { useI18n } from '@/i18n';
import { HeaderNav } from '@/components/HeaderNav';

export default function AboutScreen() {
  const { t, language } = useI18n();
  const colors = useThemeColors();
  const theme = useAppStore((s) => s.theme);
  const activeTheme = theme === 'system' ? 'dark' : theme;

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <HeaderNav />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.heading, { color: colors.text }]}>{t('aboutUs')}</Text>
          <Text style={[styles.subtitle, { color: colors.primary }]}>DeekshaOrg — Spiritual & Health Technology Initiative</Text>
        </View>

        <View style={[styles.card, getClayStyle(activeTheme, 'medium'), { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {language === 'te' ? 'మా లక్ష్యం (Our Mission)' : 'Our Spiritual Mission'}
          </Text>
          <Text style={[styles.cardBody, { color: colors.textMuted }]}>
            {language === 'te'
              ? 'దీక్షా జర్నీ (DeekshaOrg) అనేది శబరిమల శ్రీ అయ్యప్ప స్వామి మండల వ్రతం, భవాని, గోవింద మరియు శివ దీక్షా పరుల కోసం రూపొందించబడిన డిజిటల్ సహచరుడు. సాంకేతికత మరియు ఆధ్యాత్మిక క్రమశిక్షణను జోడించి ప్రతి భక్తుడి యాత్రను సులభతరం చేయడమే మా ప్రధాన ధ్యేయం.'
              : 'DeekshaOrg is a spiritual technology platform designed to support Ayyappa, Bhavani, Govinda, and Shiva devotees. We combine ancient Vedic discipline with modern digital tools for daily checklist tracking, devotional store, and temple discovery.'}
          </Text>
        </View>

        <View style={[styles.card, getClayStyle(activeTheme, 'medium'), { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {language === 'te' ? 'ఆరోగ్యం & ఆధ్యాత్మిక సంప్రదాయం' : 'Health & Vedic Discipline'}
          </Text>
          <Text style={[styles.cardBody, { color: colors.textMuted }]}>
            {language === 'te'
              ? '41 రోజుల మండల వ్రతం ఆధ్యాత్మిక సాధన మాత్రమే కాదు — ఇది శరీరానికి, మనస్సుకు మరియు ఆరోగ్యానికి ఒక గొప్ప నిష్ఠ. రోజూ నడక, సాత్విక ఆహారం, వేకువజామున స్నానం మరియు జపం ద్వారా భౌతిక మరియు మానసిక ఆరోగ్యానికి నూతన ఉత్తేజం లభిస్తుంది.'
              : 'The 41-day Mandala Vrutham is both a spiritual journey and a holistic health detox. Daily 3-5km walking, pure Sattvic nutrition, early morning prayers, and mental self-control rejuvenate cardiovascular health and mental wellbeing.'}
          </Text>
        </View>

        <View style={[styles.card, getClayStyle(activeTheme, 'medium'), { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Corporate & Legal Compliance</Text>
          <Text style={[styles.cardBody, { color: colors.textMuted }]}>
            DeekshaOrg operates under the legal framework of the Republic of India, fully compliant with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023 (DPDP Act).
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
  subtitle: { fontSize: 13, fontWeight: '700' },
  card: { padding: spacing.md, borderRadius: 20, borderWidth: 1, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardBody: { fontSize: 13, lineHeight: 20 },
});
