import { AYYAPPA_POOJA_VIDHANAM } from '@/data/poojaVidhanam';
import { AYYAPPA_JOURNEY } from '@/data/journeyCheckpoints';

export interface ChatAction {
  label: string;
  route: string;
}

export interface ChatReply {
  text: string;
  actions?: ChatAction[];
  suggestions?: string[];
}

export interface ChatContext {
  language: 'en' | 'te' | 'ml';
  userName?: string;
  deekshaId?: string;
  currentDay?: number;
  durationDays?: number;
  totalPoints?: number;
}

interface IntentRule {
  id: string;
  keywords: string[];
  respond: (ctx: ChatContext) => ChatReply;
}

function isTe(ctx: ChatContext): boolean {
  return ctx.language === 'te';
}

const INTENT_RULES: IntentRule[] = [
  {
    id: 'greeting',
    keywords: ['hi', 'hello', 'hey', 'namaste', 'swami', 'saranam', 'నమస్కారం', 'హలో', 'స్వామి'],
    respond: (ctx) => {
      const te = isTe(ctx);
      const name = ctx.userName ? `Swami ${ctx.userName}` : te ? 'స్వామి' : 'Swami';
      const dayInfo =
        ctx.currentDay !== undefined && ctx.durationDays
          ? te
            ? `\nమీరు ప్రస్తుతం ${ctx.durationDays} రోజుల దీక్షలో **రోజు ${ctx.currentDay}** వద్ద ఉన్నారు.`
            : `\nYou are currently on **Day ${ctx.currentDay} of ${ctx.durationDays}** in your Deeksha.`
          : '';
      return {
        text: te
          ? `స్వామియే శరణం అయ్యప్ప 🙏 ${name}!${dayInfo}\nనేను మీ దీక్షా సహాయకుడిని. పూజ, భోజన మంత్రాలు, కన్ని స్వామి నియమాలు, యాప్ ఫీచర్లు లేదా సెట్టింగ్‌ల గురించి ఏదైనా అడగండి.`
          : `Swamiye Saranam Ayyappa 🙏 ${name}!${dayInfo}\nI am your Deeksha Assistant. Ask me anything about Ayyappa Deeksha rules, eating/pooja mantras, Irumudi, app features, or settings.`,
        suggestions: te
          ? ['భోజన మంత్రం ఏమిటి?', 'కన్ని స్వామి నియమాలు', 'భాష / థీమ్ మార్చడం ఎలా?', 'ఇరుముడి సామగ్రి']
          : ['Eating mantra?', 'First-time rules?', 'Change language or theme?', 'Irumudi checklist'],
      };
    },
  },
  {
    id: 'my_progress',
    keywords: ['my day', 'progress', 'status', 'points', 'streak', 'how many days', 'రోజు', 'పాయింట్లు', 'పురోగతి'],
    respond: (ctx) => {
      const te = isTe(ctx);
      if (ctx.currentDay !== undefined && ctx.durationDays) {
        const remaining = Math.max(0, ctx.durationDays - ctx.currentDay);
        const nextCp = AYYAPPA_JOURNEY.find((c) => (c.dayUnlock ?? Infinity) > (ctx.currentDay ?? 0));
        const nextLabel = nextCp ? (te ? nextCp.titleTe : nextCp.name) : te ? 'శబరిమల దర్శనం' : 'Sabarimala Darshan';
        return {
          text: te
            ? `మీరు ప్రస్తుతం **రోజు ${ctx.currentDay} / ${ctx.durationDays}** లో ఉన్నారు (${remaining} రోజులు మిగిలి ఉన్నాయి).\nమొత్తం పాయింట్లు: **${ctx.totalPoints ?? 0} pts**.\nతదుపరి మైలురాయి: **${nextLabel}**.`
            : `You are on **Day ${ctx.currentDay} of ${ctx.durationDays}** (${remaining} days remaining).\nTotal Points: **${ctx.totalPoints ?? 0} pts**.\nNext milestone: **${nextLabel}**.`,
          actions: [{ label: te ? 'యాత్రా మార్గం చూడండి' : 'View Journey Map', route: '/(tabs)/journey' }],
        };
      }
      return {
        text: te
          ? 'మీరు ఇంకా దీక్షను ప్రారంభించలేదు. హోమ్ స్క్రీన్ లేదా ఆన్‌బోర్డింగ్ ద్వారా మీ 41 రోజుల మండల దీక్షను ప్రారంభించవచ్చు.'
          : 'You have not started an active Deeksha yet. Start your 41-day Mandala Vrutham from onboarding to track daily progress and milestones.',
        actions: [{ label: te ? 'దీక్ష ప్రారంభించండి' : 'Start Deeksha', route: '/onboarding/deeksha-select' }],
      };
    },
  },
  {
    id: 'eating_mantra',
    keywords: ['eat', 'eating', 'food', 'meal', 'biksha', 'alpaharam', 'brahmarpanam', 'annapoorna', 'భోజనం', 'తినే', 'భిక్ష', 'అల్పాహారం', 'మంత్రం'],
    respond: (ctx) => {
      const te = isTe(ctx);
      const bhojana = AYYAPPA_POOJA_VIDHANAM.find((s) => s.category === 'bhojana_mantras');
      const first = bhojana?.mantras[0];
      return {
        text: te
          ? `🍽️ **భోజనం / భిక్షా మంత్రం (బ్రహ్మార్పణం):**\n\n${first?.telugu ?? ''}\n\n• ఉల్లి, వెల్లుల్లి, మాంసాహారం లేని సాత్విక ఆహారం మాత్రమే మౌనంగా స్వీకరించాలి.`
          : `🍽️ **Eating / Biksha Mantra (Brahmarpanam):**\n\n${first?.english ?? ''}\n\n• Eat pure sattvic vegetarian food (no onion, garlic, or meat) silently with gratitude.`,
        actions: [{ label: te ? 'పూర్తి భోజన మంత్రాలు' : 'Open Eating Mantras', route: '/(tabs)/vidhanam' }],
      };
    },
  },
  {
    id: 'pooja_sharanu',
    keywords: ['pooja', 'puja', 'mantra', 'sharanu', 'gosha', 'ghosha', 'harivarasanam', 'naivedyam', 'aarti', 'పూజ', 'శరణు', 'హరివరాసనం', 'నైవేద్యం'],
    respond: (ctx) => {
      const te = isTe(ctx);
      return {
        text: te
          ? '🕉️ **నిత్య పూజా విధానం:**\n1. స్నాన మంత్రం & దీపారాధన\n2. సంకల్పం & గణేశ పూజ\n3. అయ్యప్ప ధ్యాన శ్లోకం & 108 శరణు ఘోష\n4. నైవేద్యం, కర్పూర హారతి & రాత్రి 8 శ్లోకాల హరివరాసనం.\n\nమీరు **పూజా పుస్తకం (Pooja Book)** ట్యాబ్‌లో తెలుగు & ఇంగ్లీష్ రెండింటిలోనూ చదవవచ్చు.'
          : '🕉️ **Daily Pooja Procedure:**\n1. Snanam & Deeparadhana (Lighting Lamp)\n2. Sankalpam & Ganesha Pooja\n3. Ayyappa Dhyana Sloka & 108 Sharanu Ghosha\n4. Naivedyam, Karpoora Harathi & 8-verse Harivarasanam at night.\n\nOpen the **Pooja Book** tab to read in Telugu, English, or Both side-by-side.',
        actions: [{ label: te ? 'పూజా పుస్తకం తెరవండి' : 'Open Pooja Book', route: '/(tabs)/vidhanam' }],
      };
    },
  },
  {
    id: 'kanni_rules',
    keywords: ['first time', 'kanni', 'rule', 'rules', 'do', 'dont', 'brahmacharyam', 'shave', 'haircut', 'mala', 'నియమాలు', 'కన్ని', 'మాల', 'మొదటిసారి'],
    respond: (ctx) => {
      const te = isTe(ctx);
      return {
        text: te
          ? '📿 **కన్ని స్వామి (మొదటిసారి) ముఖ్య నియమాలు:**\n• గురు స్వామి చేతుల మీదుగా తులసి/రుద్రాక్ష మాల ధరించాలి.\n• రోజుకు రెండుసార్లు చన్నీటి స్నానం, ఉదయం & సాయంత్రం పూజ.\n• పూర్తి బ్రహ్మచర్యం, నేలపై నిద్ర, పాదరక్షలు లేకుండా నడక.\n• జుట్టు/గడ్డం/గోర్లు కత్తిరించకూడదు. అందరినీ "స్వామి" అని పిలవాలి.'
          : '📿 **First-Time (Kanni Swamy) Essential Rules:**\n• Receive the Tulsi/Rudraksha Mala from an experienced Guru Swamy.\n• Take cold baths twice daily, perform morning & evening puja, and chant 108 Sharanu.\n• Observe strict Brahmacharyam, sleep on a floor mat, walk barefoot, and avoid haircut/shaving/nail cutting.\n• Address everyone respectfully as "Swami" or "Maata".',
        actions: [
          { label: te ? 'కన్ని స్వామి గైడ్' : 'Open Kanni Guide', route: '/guide' },
          { label: te ? 'సందేహాలు (FAQs)' : 'View FAQs', route: '/faqs' },
        ],
      };
    },
  },
  {
    id: 'irumudi_journey',
    keywords: ['irumudi', 'kettunirakkal', 'erumeli', 'pampa', 'neelimala', 'saramkuthi', '18 steps', 'padi', 'sabarimala', 'ఇరుముడి', 'ఎరుమేలి', 'పంపా', 'శబరిమల', 'మెట్లు'],
    respond: (ctx) => {
      const te = isTe(ctx);
      return {
        text: te
          ? '🎒 **ఇరుముడి & శబరిమల యాత్రా దశలు:**\n• **ఇరుముడి (ముందు అర):** నెయ్యి నింపిన ముద్ర కొబ్బరికాయ, బియ్యం, పసుపు, కుంకుమ, కర్పూరం.\n• **యాత్రా క్రమం:** కెట్టునిరక్కల్ → ఎరుమేలి (పేట్ట తుళ్ళల్) → పంపా నది స్నానం → నీలిమల → శరంకుత్తి (కన్ని స్వాములు శరం గుచ్చుట) → 18 పవిత్ర మెట్లు → సన్నిధానం దర్శనం.'
          : '🎒 **Irumudi & Sabarimala Trail:**\n• **Front compartment:** Ghee-filled Mudra coconut (Neyy Thenga), raw rice, turmeric, kumkum, camphor.\n• **Trail order:** Kettunirakkal → Erumeli (Petta Thullal) → Pampa River bath → Neelimala trek → Saramkuthi (Kanni Swamy arrow) → 18 Holy Steps → Sannidhanam Darshan.',
        actions: [
          { label: te ? 'యాత్రా మ్యాప్' : 'Open Trail Map', route: '/(tabs)/journey' },
          { label: te ? 'ఇరుముడి చెక్‌లిస్ట్' : 'Irumudi Checklist', route: '/guide' },
        ],
      };
    },
  },
  {
    id: 'settings_account',
    keywords: ['setting', 'settings', 'language', 'telugu', 'english', 'theme', 'dark', 'light', 'notification', 'login', 'sign in', 'sign out', 'logout', 'otp', 'password', 'సెట్టింగ్', 'భాష', 'థీమ్', 'లాగిన్', 'నోటిఫికేషన్'],
    respond: (ctx) => {
      const te = isTe(ctx);
      return {
        text: te
          ? '⚙️ **సెట్టింగ్‌లు & ఖాతా సమాచారం:**\n• **భాష & థీమ్:** ప్రొఫైల్ (Profile) ట్యాబ్‌లో లేదా పైనున్న మెనూ (☰) లో English / తెలుగు మరియు Light / Dark థీమ్‌లను ఎప్పుడైనా మార్చుకోవచ్చు.\n• **లాగిన్ (OTP / Test):** ఈమెయిల్ OTP లేదా "Quick Test Login (test@deeksha.app)" ద్వారా సైన్ ఇన్ కావచ్చు.\n• **సైన్ అవుట్:** ప్రొఫైల్ ట్యాబ్ లేదా మెనూ చివర "Sign Out" నొక్కండి.'
          : '⚙️ **Settings & Account Help:**\n• **Language & Theme:** Switch between English / తెలుగు and Light / Dark / System anytime in the **Profile** tab or top navigation menu (☰).\n• **Notifications:** Toggle daily reminders in **Profile → Settings**.\n• **Login / Sign Out:** Sign in via Email OTP or **Quick Test Login (test@deeksha.app)**; sign out from **Profile** or the drawer menu.',
        actions: [{ label: te ? 'ప్రొఫైల్ & సెట్టింగ్‌లు' : 'Open Profile & Settings', route: '/(tabs)/profile' }],
      };
    },
  },
  {
    id: 'app_features',
    keywords: ['app', 'how to', 'use', 'group', 'groups', 'sannidhanam', 'expense', 'split', 'temple', 'map', 'store', 'donation', 'checkin', 'check-in', 'యాప్', 'గ్రూప్', 'ఖర్చు', 'ఆలయం', 'మ్యాప్'],
    respond: (ctx) => {
      const te = isTe(ctx);
      return {
        text: te
          ? '📱 **యాప్ ఫీచర్లు:**\n• **హోమ్:** ఒకే క్లిక్‌తో నేటి దీక్ష చెక్-ఇన్, శరణు కౌంటర్ & స్ట్రీక్ ట్రాకింగ్.\n• **యాత్ర (Journey):** ఇంటరాక్టివ్ శబరిమల ట్రైల్ మ్యాప్ & టైమ్‌లైన్.\n• **పూజా బుక్:** భోజన మంత్రాలు, నియమాలు, 108 శరణు ఘోష & హరివరాసనం.\n• **గ్రూపులు (Sannidhanam):** యాత్రా గ్రూప్ ఏర్పాటు & ఖర్చుల విభజన (Expense Splitting).'
          : '📱 **App Features Guide:**\n• **Home:** One-tap Daily Check-in, Saranam counter, and Lifestyle Streak.\n• **Journey:** Interactive Sabarimala Trail Map & Timeline.\n• **Pooja Book:** Eating & pooja mantras, 108 Sharanu Ghosha, and Harivarasanam.\n• **Groups (Sannidhanam):** Create pilgrim groups, chat, and split shared travel expenses.\n• **Menu (☰):** Temples Map, Pooja Store, Donations, and Kanni Guide.',
        actions: [
          { label: te ? 'గ్రూపులు' : 'Open Groups', route: '/(tabs)/groups' },
          { label: te ? 'ఆలయాల మ్యాప్' : 'Temples Map', route: '/(tabs)/map' },
        ],
      };
    },
  },
];

export function getChatbotReply(query: string, ctx: ChatContext): ChatReply {
  const normalized = query.trim().toLowerCase();
  const te = isTe(ctx);

  if (!normalized) {
    return INTENT_RULES[0].respond(ctx);
  }

  let bestRule: IntentRule | null = null;
  let bestScore = 0;

  for (const rule of INTENT_RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (normalized.includes(kw)) {
        score += kw.length > 4 ? 2 : 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestRule = rule;
    }
  }

  if (bestRule && bestScore > 0) {
    return bestRule.respond(ctx);
  }

  return {
    text: te
      ? 'స్వామి, మీ ప్రశ్నకు సంబంధించిన సమాచారం కోసం ఈ క్రింది అంశాలలో ఒకదాన్ని ఎంచుకోండి లేదా "భోజన మంత్రం", "కన్ని నియమాలు", "ఇరుముడి", "సెట్టింగ్‌లు" అని అడగండి:'
      : 'Swami, I can help with Deeksha rules, eating & pooja mantras, Irumudi, journey milestones, app features, or settings. Try asking one of these:',
    suggestions: te
      ? ['భోజన మంత్రం', 'కన్ని స్వామి నియమాలు', 'నా దీక్ష పురోగతి', 'సెట్టింగ్‌లు & భాష']
      : ['Eating mantra', 'Kanni Swamy rules', 'My Deeksha progress', 'App & Settings help'],
    actions: [
      { label: te ? 'కన్ని గైడ్' : 'Kanni Guide', route: '/guide' },
      { label: te ? 'సందేహాలు (FAQs)' : 'FAQs', route: '/faqs' },
    ],
  };
}

