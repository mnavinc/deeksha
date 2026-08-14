import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
import { useThemeColors, spacing } from '@/theme/colors';
import { getClayStyle } from '@/theme/claymorphism';
import { useI18n } from '@/i18n';
import { HeaderNav } from '@/components/HeaderNav';

interface FAQItem {
  qEn: string;
  qTe: string;
  aEn: string;
  aTe: string;
}

const FAQS_DATA: FAQItem[] = [
  {
    qEn: 'What are the main rules of Ayyappa Mandala Deeksha?',
    qTe: 'అయ్యప్ప మండల దీక్ష ప్రధాన నియమాలు ఏమిటి?',
    aEn: 'The 41-day Mandala Vrutham requires wearing the sacred Mala, observing strict Brahmacharyam, eating purely Sattvic vegetarian food, bathing twice daily, chanting Saranam 108 times, walking exercise, and avoiding alcohol, smoking, and footwear.',
    aTe: '41 రోజుల మండల వ్రతంలో మాల ధారణం, బ్రహ్మచర్యం, సాత్విక శాకాహార భోజనం, రోజుకు రెండు సార్లు స్నానం, 108 సార్లు శరణు జపం, నడక వ్యాయామం మరియు మద్యం, ధూమపానం, కాళ్లకు చెప్పులు లేకుండా ఉండటం ప్రధాన నియమాలు.',
  },
  {
    qEn: 'How does daily walking exercise help during Deeksha?',
    qTe: 'దీక్ష సమయంలో రోజువారీ నడక వ్యాయామం ఎలా ఉపయోగపడుతుంది?',
    aEn: 'Walking 3-5 km daily builds stamina, cardiovascular health, and leg muscle strength needed for trekking the steep Neelimala and Karimala mountain paths to Sabarimala Sannidhanam.',
    aTe: 'రోజూ 3-5 కి.మీ నడవడం వల్ల శబరిమల నీలిమల మరియు కరిమల కొండ మార్గాలను ఆరోహణ చేయడానికి కావలసిన శారీరక దృఢత్వం, గుండె ఆరోగ్యం మరియు కాళ్ల బలం పెరుగుతాయి.',
  },
  {
    qEn: 'Can I download the Ayyappa Pooja Vidhanam PDF in Telugu?',
    qTe: 'నేను తెలుగులో అయ్యప్ప పూజ విధానం PDF ڈاؤن‌లోడ్ చేయవచ్చా?',
    aEn: 'Yes! Go to the "Pooja Book" (పూజ విధానం) tab and click the "Download Free Telugu eBook (PDF)" button to save the complete prayer book offline.',
    aTe: 'అవును! "పూజ విధానం" ట్యాబ్‌కు వెళ్లి "ఉచిత తెలుగు ఈబుక్ (PDF) డౌన్‌లోడ్ చేయండి" బటన్‌ను నొక్కడం ద్వారా సంపూర్ణ పుస్తకాన్ని డౌన్‌లోడ్ చేసుకోవచ్చు.',
  },
  {
    qEn: 'How do Amazon, Swiggy Instamart, and Blinkit orders work in the Pooja Store?',
    qTe: 'పూజా స్టోర్‌లో అమెజాన్, ఇన్‌స్టామార్ట్ మరియు బ్లింకిట్ ఆర్డర్లు ఎలా పనిచేస్తాయి?',
    aEn: 'Our Pooja Store displays purified items (Tulsi Mala, Ghee, Karpuram, Vibhuti). Clicking "Buy" opens the product directly on Amazon, Instamart, or Blinkit for instant home delivery.',
    aTe: 'మా పూజా స్టోర్ పరిశుద్ధమైన వస్తువులను (తులసి మాల, నెయ్యి, కర్పూరం, విభూతి) చూపిస్తుంది. "Buy" నొక్కడం ద్వారా అమెజాన్ లేదా బ్లింకిట్‌లో నేరుగా ఆర్డర్ చేసుకోవచ్చు.',
  },
];

export default function FAQsScreen() {
  const { t, language } = useI18n();
  const colors = useThemeColors();
  const theme = useAppStore((s) => s.theme);
  const activeTheme = theme === 'system' ? 'dark' : theme;

  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <HeaderNav />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.heading, { color: colors.text }]}>{t('faqs')}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {language === 'te'
              ? 'అయ్యప్ప దీక్ష, నిష్ఠ, పూజ విధానం మరియు ఆరోగ్య నియమాలపై సందేహాలు.'
              : 'Common questions about Deeksha discipline, puja rituals, and health guidelines.'}
          </Text>
        </View>

        <View style={styles.faqList}>
          {FAQS_DATA.map((faq, idx) => {
            const isOpen = expanded === idx;
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.85}
                onPress={() => setExpanded(isOpen ? null : idx)}
                style={[
                  styles.card,
                  getClayStyle(activeTheme, 'medium'),
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.questionText, { color: colors.text }]}>
                    {language === 'te' ? faq.qTe : faq.qEn}
                  </Text>
                  <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.primary} />
                </View>

                {isOpen && (
                  <Text style={[styles.answerText, { color: colors.textMuted, borderTopColor: colors.border }]}>
                    {language === 'te' ? faq.aTe : faq.aEn}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
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
  subtitle: { fontSize: 13, lineHeight: 18 },
  faqList: { gap: spacing.md },
  card: { padding: spacing.md, borderRadius: 20, borderWidth: 1, gap: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  questionText: { flex: 1, fontSize: 15, fontWeight: '700', lineHeight: 22 },
  answerText: { fontSize: 13, lineHeight: 20, borderTopWidth: 1, paddingTop: 10, marginTop: 4 },
});
