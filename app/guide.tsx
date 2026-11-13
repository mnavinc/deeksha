import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { useThemeColors, spacing } from '@/theme/colors';
import { getClayStyle, getClayButtonStyle } from '@/theme/claymorphism';
import { useI18n } from '@/i18n';
import { HeaderNav } from '@/components/HeaderNav';
import { AuthModal } from '@/components/AuthModal';
import { SacredIcon } from '@/components/SacredIcons';

export default function GuideScreen() {
  const { language } = useI18n();
  const colors = useThemeColors();
  const theme = useAppStore((s) => s.theme);
  const activeTheme = theme === 'system' ? 'dark' : theme;
  const profile = useAppStore((s) => s.profile);

  const [activeTab, setActiveTab] = useState<'kanni' | 'benefits' | 'tutorial' | 'traditions'>('kanni');
  const [authVisible, setAuthVisible] = useState(false);

  const isTelugu = language === 'te';

  const kanniSchedule = [
    {
      time: isTelugu ? 'ఉదయం 4:30 - 5:30' : '4:30 AM - 5:30 AM',
      title: isTelugu ? 'బ్రహ్మముహూర్తం & చన్నీటి స్నానం' : 'Brahma Muhurtam & Cold Bath',
      desc: isTelugu
        ? 'సూర్యోదయానికి ముందే లేచి చన్నీటి స్నానం చేసి, నల్ల/నీలి వస్త్రాలు ధరించి, విభూతి-చందనం పెట్టుకోవాలి.'
        : 'Wake before sunrise, take a cold-water bath, wear black/blue attire, and apply Vibhuti & Chandanam.',
    },
    {
      time: isTelugu ? 'ఉదయం 5:30 - 6:30' : '5:30 AM - 6:30 AM',
      title: isTelugu ? 'ఉదయకాల పూజ & 108 శరణు ఘోష' : 'Morning Pooja & 108 Sharanu Ghosha',
      desc: isTelugu
        ? 'దీపారాధన చేసి గణపతి పూజ, గురు వందనం, 108 శరణు ఘోష మరియు నైవేద్యం సమర్పించాలి.'
        : 'Light the sacred lamp, perform Ganesha Pooja, Guru Vandana, 108 Sharanu Ghosha, and offer Naivedyam.',
    },
    {
      time: isTelugu ? 'ఉదయం 7:30 - 8:30' : '7:30 AM - 8:30 AM',
      title: isTelugu ? 'సాత్విక అల్పాహారం (బ్రహ్మార్పణం)' : 'Sattvic Alpaharam (With Food Mantra)',
      desc: isTelugu
        ? 'పూజ తర్వాత మాత్రమే బ్రహ్మార్పణ మంత్రం పఠించి పండ్లు, పాలు లేదా ఉల్లి-వెల్లుల్లి లేని అల్పాహారం తీసుకోవాలి.'
        : 'Only after puja, chant Brahmarpanam and eat light sattvic breakfast without onion or garlic.',
    },
    {
      time: isTelugu ? 'మధ్యాహ్నం 12:30 - 1:30' : '12:30 PM - 1:30 PM',
      title: isTelugu ? 'భిక్ష (పవిత్ర మధ్యాహ్న భోజనం)' : 'Biksha (Sacred Midday Meal)',
      desc: isTelugu
        ? 'భగవంతుని ప్రసాదంగా భావించి మౌనంగా భోజనం స్వీకరించాలి. కడుపులో 3 వంతులు ఆహారం, 1 వంతు ఖాళీగా ఉంచాలి.'
        : 'Eat silently viewing food as Prasad. Chanting Annapoorna Sloka before eating brings gratitude.',
    },
    {
      time: isTelugu ? 'సాయంత్రం 6:00 - 7:30' : '6:00 PM - 7:30 PM',
      title: isTelugu ? 'సంధ్యా స్నానం, భజన & హరివరాసనం' : 'Evening Bath, Bhajan & Harivarasanam',
      desc: isTelugu
        ? 'మరోసారి స్నానం చేసి దీపారాధన, భజనలు మరియు పడుకునే ముందు హరివరాసనం పాడాలి. నేలపై చాపపై నిద్రించాలి.'
        : 'Take an evening bath, perform Deeparadhana, sing bhajans/Harivarasanam, and sleep on a floor mat.',
    },
  ];

  const irumudiChecklist = isTelugu
    ? [
        '🥥 ముద్ర కొబ్బరికాయ (ఆవు నెయ్యితో నింపినది) — అభిషేకం కోసం',
        '🍚 శుద్ధమైన బియ్యం (ముడి బియ్యం), పసుపు, కుంకుమ, కర్పూరం, అగరబత్తీలు',
        '🌿 తమలపాకులు, వక్కలు, దక్షిణ & సన్నిధానం కానుకలు',
        '🕯️ 2 కొబ్బరికాయలు (కన్నిమూల గణపతి & 18 మెట్ల వద్ద కొట్టడానికి)',
        '🎒 వెనుక అరలో: యాత్రా వస్త్రాలు, టవల్, త్రాగునీరు & వ్యక్తిగత సామగ్రి',
      ]
    : [
        '🥥 Mudra Coconut filled with pure cow ghee (Neyy Thenga) for Abhishekam',
        '🍚 Raw rice, turmeric, kumkum, camphor (Karpooram), and agarbatti',
        '🌿 Betel leaves, areca nuts, and offerings for Malikappuram & Vavar',
        '🕯️ 2 breaking coconuts (for Kannimoola Ganapathi & Pathinettam Padi)',
        '🎒 Back compartment: Extra black/blue dhoti, towel, flask & travel essentials',
      ];

  const kanniRules = [
    {
      doText: isTelugu ? 'అందరినీ "స్వామి" లేదా "మాతా" అని పిలవండి' : 'Address everyone respectfully as "Swami" or "Maata"',
      dontText: isTelugu ? 'కోపం, అబద్ధం, అపశబ్దాలు పలకవద్దు' : 'Avoid anger, lies, harsh words, or ego',
    },
    {
      doText: isTelugu ? 'రోజూ 3–5 కి.మీ నడక వ్యాయామం చేయండి (కొండ ఎక్కేందుకు)' : 'Walk 3–5 km daily to build Neelimala & Karimala trekking stamina',
      dontText: isTelugu ? 'క్షవరం (షేవింగ్), జుట్టు, గోర్లు కత్తిరించవద్దు' : 'Do not cut hair, shave, or trim nails during Deeksha',
    },
    {
      doText: isTelugu ? 'సాత్విక శాకాహారం (ఉల్లి, వెల్లుల్లి లేకుండా) తినండి' : 'Eat fresh home-cooked sattvic vegetarian food (no onion/garlic)',
      dontText: isTelugu ? 'మాంసాహారం, మద్యం, పొగాకు, బయటి జంక్ ఫుడ్ వద్దు' : 'Strictly no meat, alcohol, tobacco, or outside junk food',
    },
    {
      doText: isTelugu ? 'ఎరుమేలిలో పేట్ట తుళ్ళల్ & శరంకుత్తిలో శరం సమర్పించండి' : 'Kanni Swamies perform Erumeli Petta Thullal & Saramkuthi arrow ritual',
      dontText: isTelugu ? 'చర్మపు బెల్టులు, చెప్పులు (నియమం మేరకు) ధరించవద్దు' : 'Avoid footwear & leather items; walk barefoot with mindfulness',
    },
  ];

  const benefitsData = [
    {
      icon: '🌿',
      title: isTelugu ? 'శారీరక శుద్ధి & ఆరోగ్యం' : 'Physical Detoxification & Health',
      desc: isTelugu
        ? 'ఉదయం మరియు సాయంత్రం చన్నీటి స్నానం, సాత్విక అల్పాహారం మరియు భిక్ష స్వీకరణ ద్వారా శరీరం సమతుల్యత మరియు నూతన ఉత్తేజాన్ని పొందుతుంది.'
        : 'Early morning cold baths, pure sattvic meals (Alpaharam & Biksha), and disciplined walking rejuvenate the body and cleanse toxins naturally.',
    },
    {
      icon: '🧘',
      title: isTelugu ? 'మానసిక ప్రశాంతత & ఏకాగ్రత' : 'Mental Peace & Focus',
      desc: isTelugu
        ? 'నిత్యం శరణు ఘోష, ధ్యానం మరియు బ్రహ్మచర్యం పాటించడం వల్ల మనస్సులోని ఒత్తిడి తొలగి అద్భుతమైన ఏకాగ్రత లభిస్తుంది.'
        : 'Continuous chanting of "Swamiye Saranam Ayyappa" combined with Brahmacharyam calms anxiety, reduces mental clutter, and builds immense willpower.',
    },
    {
      icon: '👥',
      title: isTelugu ? 'సమానత్వ భావన (సర్వం స్వామిమయం)' : 'Universal Equality & Brotherhood',
      desc: isTelugu
        ? 'దీక్షలో ప్రతి ఒక్కరినీ "స్వామి" అని పిలవడం ద్వారా అహంకారం, కులమత భేదాలు తొలగి భక్తి భావం వెల్లివిరుస్తుంది.'
        : 'Every devotee is addressed as "Swami", shedding ego, social status, and differences to cultivate true humility and spiritual brotherhood.',
    },
    {
      icon: '⏳',
      title: isTelugu ? '41 రోజుల మండల వ్రత విశిష్టత' : '41-Day Mandala Transformation',
      desc: isTelugu
        ? 'శాస్త్రీయంగా ఒక అలవాటు లేదా జీవనశైలి మార్పు సాధించడానికి 41 రోజుల మండల కాలం అత్యంత ప్రభావవంతమైన సమయం.'
        : 'According to yogic science, 41 continuous days of disciplined practice permanently rewires mental neural patterns and spiritual consciousness.',
    },
  ];

  const tutorialSteps = [
    {
      step: '1',
      icon: '📿',
      title: isTelugu ? 'మాల ధారణం & ప్రొఫైల్ నమోదు' : 'Mala Dharanam & Profile Setup',
      desc: isTelugu
        ? 'మీ గురు స్వామి సమక్షంలో మాల ధరించిన తేదీ, మీ యాత్రా అనుభవం (కన్ని స్వామి నుండి మణికంఠ స్వామి వరకు) నమోదు చేసుకోండి.'
        : 'Select your deeksha type (Ayyappa, Bhavani, Govinda, Shiva, Hanuman) and track your pilgrimage tier (Kanni Swami to Manikanta Swami).',
    },
    {
      step: '2',
      icon: '✅',
      title: isTelugu ? 'రోజువారీ తపశ్చర్య (Daily Checkpoints)' : 'Daily Discipline Checkpoints',
      desc: isTelugu
        ? 'ఉదయం పూజ, శరణు ఘోష కౌంటర్, సాత్విక అల్పాహారం, భిక్ష, నడక వ్యాయామం మరియు సాయంత్రం దీపారాధనను ప్రతిరోజూ నమోదు చేయండి.'
        : 'Track morning puja, digital Saranam chanting counter (108 chants), Alpaharam, Biksha, walking distance, and evening prayer daily.',
    },
    {
      step: '3',
      icon: '🏆',
      title: isTelugu ? 'క్రమశిక్షణ పాయింట్లు & అవతార్' : 'Discipline Points & Spiritual Stages',
      desc: isTelugu
        ? 'రోజువారీ పనులు పూర్తి చేయడం ద్వారా పాయింట్లు సంపాదించండి. దీక్ష పూర్తయిన తర్వాత ఈ పాయింట్లు శాశ్వతంగా మీ ఖాతాలో జమవుతాయి.'
        : 'Earn points for consistency. Points stay as "Active Deeksha Points" and are permanently credited to your lifetime score upon Deeksha Completion.',
    },
    {
      step: '4',
      icon: '👥',
      title: isTelugu ? 'సన్నిధానం (Sannidhanam - గ్రూపులు)' : 'Sannidhanam (Pilgrim Groups)',
      desc: isTelugu
        ? 'మీ గురు స్వామి సన్నిధానంలో చేరండి. ప్రయాణ ప్రణాళికలు, ఖర్చులు (Expense Splitting) మరియు సందేశాలను సులభంగా పంచుకోండి.'
        : 'Create or join a Sannidhanam group with fellow pilgrims. Manage shared travel expenses, nominate Guru Swamies, and share announcements.',
    },
    {
      step: '5',
      icon: '📖',
      title: isTelugu ? 'పూజ విధానం & ఉచిత ఈబుక్' : 'Pooja Vidhanam & Free eBook',
      desc: isTelugu
        ? '108 శరణు ఘోష, నిత్య పూజా మంత్రాలు, భజన పాటలు, హరివరాసనం మరియు ఉచిత తెలుగు PDF ఈబుక్ డౌన్‌లోడ్ చేసుకోండి.'
        : 'Access full Sanskrit/Telugu puja rituals, 108 Sharanu Gosha, audio bhajans, Harivarasanam, and download a free PDF pooja book.',
    },
    {
      step: '6',
      icon: '🗺️',
      title: isTelugu ? 'యాత్రా మార్గం & ఆలయాల అన్వేషణ' : 'Dynamic Trail Map & Temples',
      desc: isTelugu
        ? 'మీ దీక్షకు అనుగుణంగా ప్రత్యక్ష యాత్రా మైలురాళ్ళు, పంపా నది, ఎరుమేలి, 18 మెట్లు మరియు సమీప దేవాలయాల మ్యాప్ చూడండి.'
        : 'Explore dynamic gamified milestones (Erumeli, Pamba River, 18 Sacred Steps, Sannidhanam) and discover offline-enabled temple routes.',
    },
  ];

  const traditionsData = [
    {
      term: isTelugu ? 'అల్పాహారం (Alpaharam)' : 'Alpaharam (Breakfast)',
      desc: isTelugu
        ? 'ఉదయం పూజ మరియు స్నానం తర్వాత భుజించే తేలికపాటి సాత్విక ఆహారం (పండ్లు, పాలు లేదా ఉడికించిన సాత్విక పదార్థాలు).'
        : 'Light sattvic breakfast consumed only after completing morning cold bath and prayer.',
    },
    {
      term: isTelugu ? 'భిక్ష (Biksha)' : 'Biksha (Lunch Offering)',
      desc: isTelugu
        ? 'మధ్యాహ్న సమయాన గురు స్వాములు లేదా భక్తుల సమక్షంలో భక్తితో సమర్పించబడే పవిత్ర ప్రసాదం / భోజనం.'
        : 'Sacred midday meal accepted as divine prasad offered by devotees and Guru Swamies.',
    },
    {
      term: isTelugu ? 'సన్నిధానం (Sannidhanam)' : 'Sannidhanam (Group)',
      desc: isTelugu
        ? 'గురు స్వామి మార్గదర్శకత్వంలో కలిసి నడిచే భక్తుల పవిత్ర సమూహం.'
        : 'The sacred congregation and fellowship of pilgrims walking the deeksha path together.',
    },
    {
      term: isTelugu ? 'ఇరుముడి కట్టు (Irumudi Kattu)' : 'Irumudi Kattu (Sacred Offering)',
      desc: isTelugu
        ? 'శబరిమల యాత్రలో భక్తుడు తలపై మోసే రెండు అరల సంచి (ముందర నేతి కొబ్బరికాయ, వెనుక బియ్యం & సామగ్రి).'
        : 'The two-compartment sacred travel kit carrying the Ghee-filled coconut for Lord Ayyappa and travel provisions.',
    },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <HeaderNav />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View
          style={[
            styles.heroCard,
            getClayStyle(activeTheme, 'high', colors.surface),
            { borderColor: colors.border },
          ]}
        >
          <View style={styles.heroBadge}>
            <Text style={[styles.heroBadgeText, { color: colors.primary }]}>
              {isTelugu ? '📿 ఆధ్యాత్మిక మార్గదర్శి' : '📿 Spiritual Handbook'}
            </Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            {isTelugu ? 'దీక్ష విశిష్టత & యాప్ పూర్తి మార్గదర్శి' : 'Divine Benefits of Deeksha & App Guide'}
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
            {isTelugu
              ? 'మండల వ్రతం యొక్క పవిత్ర నియమాలు, మానసిక-శారీరక ప్రయోజనాలు మరియు యాప్‌ను సమర్థవంతంగా ఉపయోగించే విధానం.'
              : 'Discover the profound wisdom of Mandala Vrutham discipline and master every feature of your spiritual journey companion.'}
          </Text>

          {/* Tab Controls */}
          <View style={[styles.tabBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'kanni' && [
                  styles.activeTabBtn,
                  { backgroundColor: colors.primary },
                ],
              ]}
              onPress={() => setActiveTab('kanni')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'kanni' ? '#0D1117' : colors.textMuted },
                ]}
              >
                {isTelugu ? '🙏 కన్ని స్వామి గైడ్' : '🙏 First-Time Guide'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'benefits' && [
                  styles.activeTabBtn,
                  { backgroundColor: colors.primary },
                ],
              ]}
              onPress={() => setActiveTab('benefits')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'benefits' ? '#0D1117' : colors.textMuted },
                ]}
              >
                {isTelugu ? '🌟 దీక్ష ప్రాముఖ్యత' : '🌟 Divine Benefits'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'tutorial' && [
                  styles.activeTabBtn,
                  { backgroundColor: colors.primary },
                ],
              ]}
              onPress={() => setActiveTab('tutorial')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'tutorial' ? '#0D1117' : colors.textMuted },
                ]}
              >
                {isTelugu ? '📱 యాప్ వినియోగం' : '📱 App Tutorial'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'traditions' && [
                  styles.activeTabBtn,
                  { backgroundColor: colors.primary },
                ],
              ]}
              onPress={() => setActiveTab('traditions')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'traditions' ? '#0D1117' : colors.textMuted },
                ]}
              >
                {isTelugu ? '🪔 సాంప్రదాయాలు' : '🪔 Traditions'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab 0: First-Time Kanni Swamy Guide */}
        {activeTab === 'kanni' && (
          <View style={styles.sectionContainer}>
            {/* Intro Banner */}
            <View
              style={[
                styles.card,
                getClayStyle(activeTheme, 'medium', colors.surface),
                { borderColor: colors.primary },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <SacredIcon name="mala" size={34} withBadge />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.primary }]}>
                    {isTelugu ? 'మొదటిసారి దీక్ష (కన్ని స్వామి) పూర్తి సమాచారం' : 'Complete First-Time (Kanni Swamy) Handbook'}
                  </Text>
                  <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                    {isTelugu
                      ? 'గురు స్వామి మార్గదర్శకత్వంలో మాల ధారణ నుండి శబరిమల దర్శనం వరకు తెలుసుకోవాల్సిన ముఖ్య విషయాలు.'
                      : 'Everything a first-time devotee needs to know from Mala Dharanam under a Guru Swamy to climbing the 18 Holy Steps.'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Daily Dinacharya */}
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              {isTelugu ? '⏰ నిత్య దినచర్య (Daily Routine)' : '⏰ Daily Routine (Dinacharya)'}
            </Text>
            <View style={styles.stepsList}>
              {kanniSchedule.map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.stepCard,
                    getClayStyle(activeTheme, 'low', colors.surface),
                    { borderColor: colors.border },
                  ]}
                >
                  <View style={[styles.stepNumberBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.stepNumberText}>{idx + 1}</Text>
                  </View>
                  <View style={styles.stepBody}>
                    <Text style={[styles.traditionTagText, { color: colors.primary }]}>{item.time}</Text>
                    <Text style={[styles.stepTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.stepDesc, { color: colors.textMuted }]}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Do's and Don'ts */}
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              {isTelugu ? '⚖️ పాటించాల్సినవి & నిషేధాలు (Do\'s & Don\'ts)' : '⚖️ Essential Do\'s & Don\'ts'}
            </Text>
            <View style={styles.grid}>
              {kanniRules.map((rule, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.card,
                    getClayStyle(activeTheme, 'low', colors.surface),
                    { borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.cardDesc, { color: '#34D399', fontWeight: '700' }]}>✓ {rule.doText}</Text>
                  <Text style={[styles.cardDesc, { color: '#F87171', marginTop: 4 }]}>✕ {rule.dontText}</Text>
                </View>
              ))}
            </View>

            {/* Irumudi Kattu Checklist */}
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              {isTelugu ? '🎒 ఇరుముడి కట్టు (కెట్టునిరక్కల్) సామగ్రి' : '🎒 Irumudi Kattu Packing Checklist'}
            </Text>
            <View
              style={[
                styles.card,
                getClayStyle(activeTheme, 'low', colors.surface),
                { borderColor: colors.border },
              ]}
            >
              {irumudiChecklist.map((line, idx) => (
                <Text key={idx} style={[styles.cardDesc, { color: colors.textMuted, lineHeight: 22 }]}>
                  {line}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Tab 1: Benefits */}
        {activeTab === 'benefits' && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              {isTelugu ? 'దీక్ష వల్ల కలిగే దివ్య ప్రయోజనాలు' : 'Why Undertake a Deeksha Vrutham?'}
            </Text>
            <View style={styles.grid}>
              {benefitsData.map((b, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.card,
                    getClayStyle(activeTheme, 'low', colors.surface),
                    { borderColor: colors.border },
                  ]}
                >
                  <Text style={styles.cardEmoji}>{b.icon}</Text>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{b.title}</Text>
                  <Text style={[styles.cardDesc, { color: colors.textMuted }]}>{b.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tab 2: Tutorial */}
        {activeTab === 'tutorial' && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              {isTelugu ? 'యాప్‌ను ఉపయోగించే 6 సులభ దశలు' : 'How to Use Deeksha Journey App'}
            </Text>
            <View style={styles.stepsList}>
              {tutorialSteps.map((step, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.stepCard,
                    getClayStyle(activeTheme, 'low', colors.surface),
                    { borderColor: colors.border },
                  ]}
                >
                  <View style={[styles.stepNumberBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.stepNumberText}>{step.step}</Text>
                  </View>
                  <View style={styles.stepBody}>
                    <View style={styles.stepHeaderRow}>
                      <Text style={styles.stepIcon}>{step.icon}</Text>
                      <Text style={[styles.stepTitle, { color: colors.text }]}>{step.title}</Text>
                    </View>
                    <Text style={[styles.stepDesc, { color: colors.textMuted }]}>{step.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tab 3: Traditions & Terms */}
        {activeTab === 'traditions' && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              {isTelugu ? 'పవిత్ర పదాలు & నిత్య నియమాలు' : 'Sacred Terminology & Disciplines'}
            </Text>
            <View style={styles.grid}>
              {traditionsData.map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.card,
                    getClayStyle(activeTheme, 'low', colors.surface),
                    { borderColor: colors.border },
                  ]}
                >
                  <View style={styles.traditionTag}>
                    <Text style={[styles.traditionTagText, { color: colors.primary }]}>
                      {isTelugu ? 'శాస్త్రోక్తం' : 'Sacred Term'}
                    </Text>
                  </View>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{item.term}</Text>
                  <Text style={[styles.cardDesc, { color: colors.textMuted }]}>{item.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Call to action card for unsigned users */}
        {!profile && (
          <View
            style={[
              styles.ctaCard,
              getClayStyle(activeTheme, 'high', colors.surface),
              { borderColor: colors.border },
            ]}
          >
            <Text style={styles.ctaEmoji}>🛕</Text>
            <Text style={[styles.ctaTitle, { color: colors.text }]}>
              {isTelugu ? 'మీ మండల వ్రత యాత్రను ప్రారంభించండి' : 'Begin Your Spiritual Journey Today'}
            </Text>
            <Text style={[styles.ctaDesc, { color: colors.textMuted }]}>
              {isTelugu
                ? 'ఉచితంగా సైన్ ఇన్ చేసి రోజువారీ క్రమశిక్షణ, శరణు ఘోష కౌంటర్ మరియు పూజా విధానాన్ని పొందండి.'
                : 'Sign in to track daily discipline, earn points, join Sannidhanam groups, and access full puja mantras.'}
            </Text>
            <View style={styles.ctaBtnsRow}>
              <TouchableOpacity
                style={[styles.ctaPrimaryBtn, getClayButtonStyle(activeTheme, 'primary')]}
                onPress={() => setAuthVisible(true)}
              >
                <Text style={styles.ctaPrimaryBtnText}>
                  {isTelugu ? 'సైన్ ఇన్ / ఖాతా తెరవండి' : 'Sign In / Register'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.ctaSecondaryBtn,
                  getClayStyle(activeTheme, 'low', colors.surface),
                  { borderColor: colors.border },
                ]}
                onPress={() => router.push('/(tabs)' as any)}
              >
                <Text style={[styles.ctaSecondaryBtnText, { color: colors.primary }]}>
                  {isTelugu ? 'హోమ్‌కు వెళ్ళండి' : 'Go to Home'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.footerSpace} />
      </ScrollView>

      {/* Auth Modal for unregistered users */}
      <AuthModal
        visible={authVisible}
        onClose={() => setAuthVisible(false)}
        onSuccess={() => {
          setAuthVisible(false);
          router.replace('/(tabs)' as any);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },
  heroCard: {
    padding: spacing.lg,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 160, 23, 0.15)',
    marginBottom: spacing.xs,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.md,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabBtn: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionContainer: {
    marginBottom: spacing.xl,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  grid: {
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
  },
  cardEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  traditionTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(212, 160, 23, 0.15)',
    marginBottom: 6,
  },
  traditionTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  stepsList: {
    gap: spacing.md,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    gap: spacing.md,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: '#0D1117',
    fontSize: 14,
    fontWeight: '800',
  },
  stepBody: {
    flex: 1,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  stepIcon: {
    fontSize: 18,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  stepDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  ctaCard: {
    padding: spacing.xl,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  ctaEmoji: {
    fontSize: 36,
    marginBottom: spacing.xs,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  ctaDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 480,
    marginBottom: spacing.lg,
  },
  ctaBtnsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
    width: '100%',
  },
  ctaPrimaryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    minWidth: 180,
  },
  ctaPrimaryBtnText: {
    color: '#0D1117',
    fontSize: 14,
    fontWeight: '800',
  },
  ctaSecondaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 140,
  },
  ctaSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  footerSpace: {
    height: 40,
  },
});
