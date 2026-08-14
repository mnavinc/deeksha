export interface PoojaSection {
  id: string;
  title: string;
  titleTe: string;
  category: 'instructions' | 'mangalacaranam' | 'ganapathi' | 'ayyappa_stotra' | 'sharanu_gosha' | 'ashtottaram' | 'pancharatnam' | 'bhajans' | 'ninadalu' | 'harivarasanam';
  mantras: {
    telugu: string;
    english: string;
    meaning?: string;
  }[];
}

export interface DevotionalSongLink {
  id: string;
  titleTe: string;
  titleEn: string;
  artist: string;
  youtubeUrl: string;
  iconEmoji: string;
}

export const DEVOTIONAL_PLAYLISTS: DevotionalSongLink[] = [
  {
    id: 'harivarasanam_yesudas',
    titleTe: 'హరివరాసనం — కె.జె. ఏసుదాస్ (అధికారిక సన్నిధాన గీతం)',
    titleEn: 'Harivarasanam — K.J. Yesudas (Official Sannidhanam Prayer)',
    artist: 'G. Devarajan / K.J. Yesudas',
    youtubeUrl: 'https://www.youtube.com/results?search_query=Harivarasanam+KJ+Yesudas+original',
    iconEmoji: '🎵',
  },
  {
    id: '108_sharanu_gosha_audio',
    titleTe: 'అయ్యప్ప 108 శరణు ఘోష ఆడియో జపం',
    titleEn: 'Ayyappa 108 Sharanu Ghosha Complete Audio Chanting',
    artist: 'Devotional Chants',
    youtubeUrl: 'https://www.youtube.com/results?search_query=Ayyappa+108+Sharanu+Ghosha+Telugu',
    iconEmoji: '🕉️',
  },
  {
    id: 'spb_ayyappa_telugu',
    titleTe: 'ఎస్.పి. బాలసుబ్రహ్మణ్యం అయ్యప్ప తెలుగు పాటలు',
    titleEn: 'S.P. Balasubrahmanyam Telugu Ayyappa Devotional Songs',
    artist: 'S.P. Balasubrahmanyam',
    youtubeUrl: 'https://www.youtube.com/results?search_query=SP+Balasubrahmanyam+Telugu+Ayyappa+Songs',
    iconEmoji: '🎶',
  },
  {
    id: 'veeramani_kanthana',
    titleTe: 'కె. వీరమణి అయ్యప్ప భజన పాటలు',
    titleEn: 'K. Veeramani Classic Ayyappa Songs & Padi Pattu',
    artist: 'K. Veeramani',
    youtubeUrl: 'https://www.youtube.com/results?search_query=K+Veeramani+Ayyappa+Songs',
    iconEmoji: '📿',
  },
  {
    id: 'pallikattu_sabarimalakku',
    titleTe: 'పల్లికట్టు శబరిమలక్కు యాత్రా పాటలు',
    titleEn: 'Pallikkattu Sabarimalakku Pilgrimage March Songs',
    artist: 'Various Devotional Artists',
    youtubeUrl: 'https://www.youtube.com/results?search_query=Pallikattu+Sabarimalakku+Telugu+song',
    iconEmoji: '🚩',
  },
];

export const AYYAPPA_POOJA_VIDHANAM: PoojaSection[] = [
  {
    id: 'instructions',
    title: '🔱 Deeksha Puja Instructions (పూజ సమయ నియమాలు)',
    titleTe: '🔱 దీక్షా పూజ నిష్ఠ నియమాలు',
    category: 'instructions',
    mantras: [
      {
        telugu: '📌 పూజకు పూర్వం తప్పనిసరిగా స్నానం చేయాలి.\n📌 నల్ల లేదా నీలి వస్త్రాలు ధరించాలి.\n📌 మాల ధరించి శరణు నాదాన్ని చేయాలి.\n📌 మనస్సును శాంతంగా, శుద్ధంగా ఉంచుకోవాలి.\n📌 నిత్యం ఉదయం & సాయంత్రం పూజ చేయాలి.',
        english: '📌 Must bathe before beginning puja.\n📌 Wear black or blue sacred clothing.\n📌 Wear the sacred Mala and chant Sharanu.\n📌 Keep the mind calm and pure throughout.\n📌 Perform puja every morning & evening.',
        meaning: 'Essential discipline rules for the 41-day Mandala Vrutham Deeksha period.',
      },
    ],
  },
  {
    id: 'mangalacaranam',
    title: '1. మంగళాచరణము & సంకల్పము',
    titleTe: '1. మంగళాచరణము & సంకల్పము',
    category: 'mangalacaranam',
    mantras: [
      {
        telugu: 'శుక్లాంబరధరం విష్ణుం శశివర్ణం చతుర్భుజం ।\nప్రసన్నవదనం ధ్యాయేత్ సర్వవిఘ్నోపశాంతయే ॥',
        english: 'Shuklam Baradharam Vishnum Shashi Varnam Chatur Bhujam |\nPrasanna Vadanam Dhyayet Sarva Vighno Pashantaye ||',
        meaning: 'We meditate on the white-clad, moon-complexioned, four-armed Lord Vishnu to remove all obstacles.',
      },
      {
        telugu: 'వక్రతుండ మహాకాయ సూర్యకోటి సమప్రభ ।\nనిర్విఘ్నం కురు మే దేవ సర్వకార్యేషు సర్వదా ॥',
        english: 'Vakratunda Mahakaya Suryakoti Samaprabha |\nNirvighnam Kuru Me Deva Sarvakaryeshu Sarvada ||',
        meaning: 'O Lord with curved trunk, massive body, and brilliance of a crore suns — remove all obstacles from all my endeavours always.',
      },
      {
        telugu: 'గురుర్బ్రహ్మా గురుర్విష్ణుః గురుర్దేవో మహేశ్వరః ।\nగురుః సాక్షాత్ పరబ్రహ్మ తస్మై శ్రీ గురవే నమః ॥',
        english: 'Gurur Brahma Gurur Vishnuh Gurur Devo Maheshwarah |\nGuruh Sakshat Para Brahma Tasmai Shri Gurave Namah ||',
        meaning: 'The Guru is Brahma, Vishnu, and Shiva — verily the Supreme Consciousness. Salutations to the Holy Guru.',
      },
      {
        telugu: '🙏 సంకల్పం:\nమమ ఉపాత్త దురితక్షయ ద్వారా శ్రీ పరమేశ్వర ప్రీత్యర్థం, ధర్మార్థ కామ మోక్ష చతుర్విధ ఫల పురుషార్థ సిద్ధ్యర్థం, శ్రీ అయ్యప్ప స్వామి పూజాం కరిష్యే ॥',
        english: '🙏 Sankalpam (Sacred Resolve):\nFor the removal of all accumulated sins, for pleasing the Supreme Lord, and for the attainment of righteousness, wealth, desire, and liberation — I perform this Ayyappa Swamy Puja.',
        meaning: 'The Sankalpam is the formal divine resolve made before beginning the puja.',
      },
    ],
  },
  {
    id: 'ganapathi_pooja',
    title: '2. శ్రీ గణేశ పూజ (కణిమూల గణపతి)',
    titleTe: '2. శ్రీ గణేశ పూజ (కణిమూల గణపతి)',
    category: 'ganapathi',
    mantras: [
      {
        telugu: 'ఓం గం గణపతయే నమః ।\nగణానాం త్వా గణపతిం హవామహే\nకవిం కవీనాముపమశ్రవస్తమం ।\nజ్యేష్ఠరాజం బ్రహ్మణాం బ్రహ్మణస్పత\nఆ నః శ్రృణ్వన్నూతిభిః సీద సాదనం ॥',
        english: 'Om Gam Ganapataye Namah |\nGananam Tva Ganapatim Havamaahe\nKavim Kaveenam Upamasravastamam |\nJyeshtharajam Brahmanam Brahmanaspata\nAa Nah Shrunvannootibhih Seeda Sadanam ||',
        meaning: 'We invoke Ganapathi, the Lord of all ganas, the wisest of the wise, the best among the praiseful.',
      },
      {
        telugu: 'ఓం ఏకదంతాయ నమః ।\nఓం వికటాయ నమః ।\nఓం విఘ్ననాశనాయ నమః ।\nఓం గణాధ్యక్షాయ నమః ।\nఓం ధూమ్రకేతవే నమః ।\nఓం ఫాలచంద్రాయ నమః ।\nఓం గజాననాయ నమః ।\nఓం విఘ్నరాజాయ నమః ।\nఓం లంబోదరాయ నమః ।\nఓం మహాగణపతయే నమః ॥',
        english: 'Om Ekadantaya Namah | Om Vikataya Namah | Om Vighnanashanaya Namah |\nOm Ganadhyakshaya Namah | Om Dhumraketave Namah | Om Bhalachandraya Namah |\nOm Gajananaya Namah | Om Vighnarajaya Namah | Om Lambodaraya Namah |\nOm Maha Ganapataye Namah ||',
        meaning: 'Salutations to Ganesha with ten key names.',
      },
    ],
  },
  {
    id: 'sharanu_gosha',
    title: '3. అయ్యప్ప శరణు ఘోష (108 శరణాలు)',
    titleTe: '3. అయ్యప్ప శరణు ఘోష (108 శరణాలు)',
    category: 'sharanu_gosha',
    mantras: [
      {
        telugu: 'ఓం శ్రీ స్వామినే శరణమయ్యప్ప\nహరి హర సుతనే శరణమయ్యప్ప\nఆపద్భాందవనే శరణమయ్యప్ప\nఅనాధరక్షకనే శరణమయ్యప్ప\nఅఖిలాండ కోటి బ్రహ్మాండనాయకనే శరణమయ్యప్ప\nఅన్నదాన ప్రభువే శరణమయ్యప్ప\nఅయ్యప్పనే శరణమయ్యప్ప\nఅరియాంగావు అయ్యావే శరణమయ్యప్ప\nఆర్చన్ కోవిల్ అరనే శరణమయ్యప్ప\nకుళత్తపులై బాలకనే శరణమయ్యప్ప ॥ 10 ॥',
        english: 'Om Sri Swamine Saranam Ayyappa\nHari Hara Suthane Saranam Ayyappa\nApadbandavane Saranam Ayyappa\nAnatha Rakshakane Saranam Ayyappa\nAkhilanda Koti Brahmanda Nayakane Saranam Ayyappa\nAnnadana Prabhuve Saranam Ayyappa\nAyyappane Saranam Ayyappa\nAriyangavu Ayyave Saranam Ayyappa\nArcchna Kovil Arane Saranam Ayyappa\nKulattupullai Balakane Saranam Ayyappa || 10 ||',
      },
      {
        telugu: 'ఎరుమేలి శాస్తనే శరణమయ్యప్ప\nకన్నిమూల మహా గణపతియే శరణమయ్యప్ప\nనాగరాజవే శరణమయ్యప్ప\nమాలికాపురత్త దులోకదేవి మాతాయే శరణమయ్యప్ప\nకురుప్ప స్వామియే శరణమయ్యప్ప\nసేవిప్ప వర్కానంద మూర్తియే శరణమయ్యప్ప\nకాశివాసియే శరణమయ్యప్ప\nహరిద్వార నివాసియే శరణమయ్యప్ప\nశ్రీరంగపట్టణ వాసియే శరణమయ్యప్ప ॥ 20 ॥',
        english: 'Erumeli Shastane Saranam Ayyappa\nKannimoola Maha Ganapatiye Saranam Ayyappa\nNagarajave Saranam Ayyappa\nMalikappurattu Dulokadevimataaye Saranam Ayyappa\nKuruppu Swamiye Saranam Ayyappa\nSevippa Varkanaanda Murtiye Saranam Ayyappa\nKasivasiye Saranam Ayyappa\nHaridwar Nivasiye Saranam Ayyappa\nSrirangapattana Vasiye Saranam Ayyappa || 20 ||',
      },
      {
        telugu: 'కరుప్పతూర్ వాసియే శరణమయ్యప్ప\nగొల్లపూడి ధర్మశాస్తావే శరణమయ్యప్ప\nసద్గురు నాధనే శరణమయ్యప్ప\nవిళాలి వీరనే శరణమయ్యప్ప\nవీరమణికంటనే శరణమయ్యప్ప\nధర్మశాస్త్రవే శరణమయ్యప్ప\nశరణుగోషప్రియవే శరణమయ్యప్ప\nకాంతిమలై వాసనే శరణమయ్యప్ప\nపొన్నంబలవాసియే శరణమయ్యప్ప\nపందళశిశువే శరణమయ్యప్ప ॥ 30 ॥',
        english: 'Karuppattur Vasiye Saranam Ayyappa\nGollapoodi Dharma Shashtave Saranam Ayyappa\nSadguru Nadhane Saranam Ayyappa\nVilali Veerane Saranam Ayyappa\nVeera Manikantane Saranam Ayyappa\nDharma Shastrave Saranam Ayyappa\nSaranugoshapriyave Saranam Ayyappa\nKantimalai Vasane Saranam Ayyappa\nPonnambalavasiye Saranam Ayyappa\nPandala Sisuve Saranam Ayyappa || 30 ||',
      },
      {
        telugu: 'వావరిన్ తోళనే శరణమయ్యప్ప\nమోహినీసుతవే శరణమయ్యప్ప\nకన్కండ దైవమే శరణమయ్యప్ప\nకలియుగవరదనే శరణమయ్యప్ప\nసర్వరోగ నివారణ ధన్వంతర మూర్తియే శరణమయ్యప్ప\nమహిషిమర్దననే శరణమయ్యప్ప\nపూర్ణ పుష్కళ నాధనే శరణమయ్యప్ప\nవన్-పులి వాహననే శరణమయ్యప్ప\nభక్తవత్సలనే శరణమయ్యప్ప ॥ 40 ॥',
        english: 'Vavarin Tozhane Saranam Ayyappa\nMohinisuthave Saranam Ayyappa\nKankanda Daivame Saranam Ayyappa\nKaliyuga Varadane Saranam Ayyappa\nSarva Roga Nivarana Dhanvantara Murtiye Saranam Ayyappa\nMahishimardanane Saranam Ayyappa\nPoorna Pushkala Nadhane Saranam Ayyappa\nVan-Puli Vahanane Saranam Ayyappa\nBhaktavatsalane Saranam Ayyappa || 40 ||',
      },
      {
        telugu: 'భూలోకనాధనే శరణమయ్యప్ప\nఅయిందుమలైవాసవే శరణమయ్యప్ప\nశబరి గిరీశనే శరణమయ్యప్ప\nఇరుముడి ప్రియనే శరణమయ్యప్ప\nనెయ్యభిషేకప్రియనే శరణమయ్యప్ప\nవేదప్పోరుళీనే శరణమయ్యప్ప\nనిత్య బ్రహ్మచారిణే శరణమయ్యప్ప\nసర్వ మంగళదాయకనే శరణమయ్యప్ప\nవీరాధివీరనే శరణమయ్యప్ప\nఓంకారప్పోరుళే శరణమయ్యప్ప ॥ 50 ॥',
        english: 'Bhooloka Nadhane Saranam Ayyappa\nAyindumalavasave Saranam Ayyappa\nSabari Gireeshane Saranam Ayyappa\nIrumudi Priyane Saranam Ayyappa\nNeyyabhisheka Priyane Saranam Ayyappa\nVedapporu Line Saranam Ayyappa\nNitya Brahmacharine Saranam Ayyappa\nSarva Mangala Dayakane Saranam Ayyappa\nVeera Dhiveerane Saranam Ayyappa\nOmkarapporu Le Saranam Ayyappa || 50 ||',
      },
      {
        telugu: 'ఆనందరూపనే శరణమయ్యప్ప\nభక్త చిత్తాదివాసనే శరణమయ్యప్ప\nఆశ్రిత-వత్సలనే శరణమయ్యప్ప\nభూత గణాదిపతయే శరణమయ్యప్ప\nశక్తి-రూపనే శరణమయ్యప్ప\nశాంతమూర్తయే శరణమయ్యప్ప\nపదునేల్బాబడిక్కి అధిపతియే శరణమయ్యప్ప\nఉత్తమపురుషానే శరణమయ్యప్ప\nఋషికుల రక్షకునే శరణమయ్యప్ప\nవేదప్రియనే శరణమయ్యప్ప ॥ 60 ॥',
        english: 'Ananda Roopane Saranam Ayyappa\nBhaktha Chittadi Vasane Saranam Ayyappa\nAsrita Vatsalane Saranam Ayyappa\nBhoota Ganaadhi Pataye Saranam Ayyappa\nShakthi Roopane Saranam Ayyappa\nShanta Murtaye Saranam Ayyappa\nPadinettam Padikki Adhipatiye Saranam Ayyappa\nUttama Purushane Saranam Ayyappa\nRishikula Rakshakune Saranam Ayyappa\nVeda Priyane Saranam Ayyappa || 60 ||',
      },
      {
        telugu: 'ఉత్తరానక్షత్ర జాతకనే శరణమయ్యప్ప\nతపోధననే శరణమయ్యప్ప\nజగన్మోహనే శరణమయ్యప్ప\nమోహనరూపనే శరణమయ్యప్ప\nమాధవసుతనే శరణమయ్యప్ప\nయదుకులవీరనే శరణమయ్యప్ప\nమామలై వాసనే శరణమయ్యప్ప\nషణ్ముఖ-సోదరనే శరణమయ్యప్ప\nవేదాంతరూపనే శరణమయ్యప్ప\nశంకర సుతనే శరణమయ్యప్ప ॥ 70 ॥',
        english: 'Uttara Nakshatra Jatakane Saranam Ayyappa\nTapodhanane Saranam Ayyappa\nJagan Mohane Saranam Ayyappa\nMohana Roopane Saranam Ayyappa\nMadhava Suthane Saranam Ayyappa\nYadhukula Veerane Saranam Ayyappa\nMamalai Vasane Saranam Ayyappa\nShanmukha Sodarane Saranam Ayyappa\nVedanta Roopane Saranam Ayyappa\nShankara Suthane Saranam Ayyappa || 70 ||',
      },
      {
        telugu: 'శత్రుసంహారినే శరణమయ్యప్ప\nసద్గుణమూర్తయే శరణమయ్యప్ప\nపరాశక్తియే శరణమయ్యప్ప\nపరాత్పరనే శరణమయ్యప్ప\nపరంజ్యోతియే శరణమయ్యప్ప\nహోమప్రియనే శరణమయ్యప్ప\nగణపతి సోదరనే శరణమయ్యప్ప\nధర్మ శాస్తావే శరణమయ్యప్ప\nవిష్ణుసుతనే శరణమయ్యప్ప\nసకల-కళా వల్లభనే శరణమయ్యప్ప ॥ 80 ॥',
        english: 'Shatru Samharine Saranam Ayyappa\nSadguna Murtaye Saranam Ayyappa\nParashaktiye Saranam Ayyappa\nParatparane Saranam Ayyappa\nParanjyotiye Saranam Ayyappa\nHoma Priyane Saranam Ayyappa\nGanapathi Sodarane Saranam Ayyappa\nDharma Shastave Saranam Ayyappa\nVishnu Suthane Saranam Ayyappa\nSakala Kala Vallabhane Saranam Ayyappa || 80 ||',
      },
      {
        telugu: 'లోక రక్షకనే శరణమయ్యప్ప\nఅమిత-గుణాకరనే శరణమయ్యప్ప\nకన్నిమారై-కప్పవనే శరణమయ్యప్ప\nభువనేశ్వరనే శరణమయ్యప్ప\nమాతాపితా గురుదైవమే శరణమయ్యప్ప\nపంబానదియే శరణమయ్యప్ప\nనీలిమలై యేట్రమే శరణమయ్యప్ప\nకరిమలై యేట్రమే శరణమయ్యప్ప\nపదునేట్టాం బడియే శరణమయ్యప్ప\nశబరిపీటమే శరణమయ్యప్ప ॥ 90 ॥',
        english: 'Loka Rakshakane Saranam Ayyappa\nAmitha Gunakarne Saranam Ayyappa\nKannimurai Kappavane Saranam Ayyappa\nBhuvaneshvarane Saranam Ayyappa\nMata Pita Guru Daivame Saranam Ayyappa\nPamba Nadiye Saranam Ayyappa\nNeelimalai Yetrame Saranam Ayyappa\nKarimalai Yetrame Saranam Ayyappa\nPadinetttam Padiye Saranam Ayyappa\nSabaripeetame Saranam Ayyappa || 90 ||',
      },
      {
        telugu: 'నెయ్యీభిషేకప్రియనే శరణమయ్యప్ప\nకర్పూర జ్యోతియే శరణమయ్యప్ప\nజ్యోతిస్వరూపనే శరణమయ్యప్ప\nమకర జ్యోతియే శరణమయ్యప్ప\nపందళ రాజకుమారనే శరణమయ్యప్ప\nభస్మకుళమే శరణమయ్యప్ప\nకళ్లిడ్రంకుండ్రే శరణమయ్యప్ప\nపంబయిళ్ వీళ్ళక్కే శరణమయ్యప్ప\nవాన్-పులివాహననే శరణమయ్యప్ప ॥ 99 ॥',
        english: 'Neyyabhisheka Priyane Saranam Ayyappa\nKarpoora Jyotiye Saranam Ayyappa\nJyoti Svarupane Saranam Ayyappa\nMakara Jyotiye Saranam Ayyappa\nPandala Rajakumarane Saranam Ayyappa\nBhasmakuLame Saranam Ayyappa\nKallidrankuNdre Saranam Ayyappa\nPambayil Villakke Saranam Ayyappa\nVan Puli Vahanane Saranam Ayyappa || 99 ||',
      },
      {
        telugu: 'ఓం హరిహర సుతనే ఆనందచిత్తన్\nశ్రీ అయ్యప్ప స్వామినే\nశరణమయ్యప్ప ॥ 108 ॥\n\n🙏 స్వామి శరణం — అయ్యప్ప శరణం\nభగవాన్ శరణం — భగవతి శరణం 🙏',
        english: 'Om Harihara Suthane Anandachittan\nSri Ayyappa Swamine\nSaranam Ayyappa || 108 ||\n\n🙏 Swami Saranam — Ayyappa Saranam\nBhagavan Saranam — Bhagavathi Saranam 🙏',
        meaning: 'Final and most sacred verse completing the 108 Sharanu salutations to Lord Ayyappa.',
      },
    ],
  },
  {
    id: 'ashtottaram',
    title: '4. శ్రీ అయ్యప్ప అష్టోత్తర శత నామావళి',
    titleTe: '4. శ్రీ అయ్యప్ప అష్టోత్తర శత నామావళి (108 నామాలు)',
    category: 'ashtottaram',
    mantras: [
      {
        telugu: 'ఓం అయ్యప్పాయ నమః\nఓం మహాదేవాయ నమః\nఓం శివాయ నమః\nఓం విష్ణుపుత్రాయ నమః\nఓం పరంబ్రహ్మణే నమః\nఓం నిత్యపుష్టాయ నమః\nఓం కలిఘ్నాయ నమః\nఓం పదినేట్టాం పడి స్వరూపాయ నమః\nఓం మహాశాస్త్రే నమః\nఓం మహాపురుషాయ నమః ॥ 10 ॥',
        english: 'Om Ayyappaya Namah\nOm Mahadevaya Namah\nOm Shivaya Namah\nOm Vishnu Putraya Namah\nOm Parambrahmanae Namah\nOm Nityapushtaya Namah\nOm Kalignaya Namah\nOm Padinettam Padi Svarupaya Namah\nOm Mahashastre Namah\nOm Mahapurushaya Namah || 10 ||',
      },
      {
        telugu: 'ఓం ధర్మశాస్తే నమః\nఓం భూతనాధాయ నమః\nఓం భవాయ నమః\nఓం బ్రహ్మచారిణే నమః\nఓం తీర్థాయ నమః\nఓం తపస్వినే నమః\nఓం వేదాంతవేద్యాయ నమః\nఓం హరివంశోద్భవాయ నమః\nఓం పాండ్యాన్విత శిఖరినే నమః\nఓం అమోఘాయ నమః ॥ 20 ॥',
        english: 'Om Dharma Shastre Namah\nOm Bhootanathaya Namah\nOm Bhavaya Namah\nOm Brahmacharine Namah\nOm Tirthaya Namah\nOm Tapasvin Namah\nOm Vedanta Vedyaya Namah\nOm Harivanshod Bhavaya Namah\nOm Pandyanvita Shikarine Namah\nOm Amoughaya Namah || 20 ||',
      },
    ],
  },
  {
    id: 'pancharatnam',
    title: '5. శ్రీ అయ్యప్ప పంచరత్నం',
    titleTe: '5. శ్రీ అయ్యప్ప పంచరత్నం',
    category: 'pancharatnam',
    mantras: [
      {
        telugu: 'లోకవీరం మహాపూజ్యం సర్వరక్షాకరం విభుమ్ ।\nపార్వతీహృదయానందం శాస్తారం ప్రణమామ్యహమ్ ॥ 1 ॥',
        english: 'Loka Veeram Maha Poojyam Sarva Rakshakaram Vibhum |\nParvathi Hrudayanandam Shastaram Pranamamyaham || 1 ||',
        meaning: 'I bow to Lord Shastha, the hero of the universe, worshipped by all, joy of Parvati\'s heart.',
      },
      {
        telugu: 'విప్రపూజ్యం విశ్వవంద్యం విష్ణుశంభ్వోః ప్రియం సుతమ్ ।\nక్షిప్రప్రసాదనిరతం శాస్తారం ప్రణమామ్యహమ్ ॥ 2 ॥',
        english: 'Vipra Poojyam Vishwa Vandyam Vishnu Shambhvo Priyam Sutam |\nKshipra Prasada Niratham Shastaram Pranamamyaham || 2 ||',
        meaning: 'Worshipped by the wise, reverenced by the universe, beloved son of Vishnu and Shiva, who quickly bestows grace.',
      },
      {
        telugu: 'మత్తమాతంగగమనం కారుణ్యామృత సాగరమ్ ।\nసర్వ విఘ్నహరం దేవం శాస్తారం ప్రణమామ్యహమ్ ॥ 3 ॥',
        english: 'Matta Matanga Gamanam Karunyamrita Sagaram |\nSarva Vighnaharam Devam Shastaram Pranamamyaham || 3 ||',
        meaning: 'He who moves like a proud elephant, an ocean of nectar of compassion, the remover of all obstacles.',
      },
      {
        telugu: 'జగత్పూజ్యం జగన్నాధం పద్మాసన విరాజితమ్ ।\nదేవదేవం పరం జ్యోతిః శాస్తారం ప్రణమామ్యహమ్ ॥ 4 ॥',
        english: 'Jagat Poojyam Jagannathm Padmasana Virajitam |\nDeva Devam Param Jyotih Shastaram Pranamamyaham || 4 ||',
        meaning: 'I bow to him who is worshipped by the cosmos, seated in lotus posture, the supreme light among all gods.',
      },
      {
        telugu: 'ఓం భూతనాధాయ విద్మహే భవపుత్రాయ ధీమహి ।\nతన్నో శాస్తా ప్రచోదయాత్ ॥',
        english: 'Om Bhootanathaya Vidmahe Bhavaputraya Dheemahi |\nTanno Shastha Prachodayat ||',
        meaning: 'Ayyappa Gayatri Mantra — May Lord Shastha, son of Bhava (Shiva), inspire and illuminate our minds.',
      },
    ],
  },
  {
    id: 'bhajans',
    title: '6. అయ్యప్ప స్వామి భజన పాటలు',
    titleTe: '6. అయ్యప్ప స్వామి భజన పాటలు',
    category: 'bhajans',
    mantras: [
      {
        telugu: '🎵 భగవాన్ శరణం — భగవతి శరణం\nశరణం శరణం అయ్యప్ప ।\nదేవన్ శరణం — దేవి శరణం\nశరణం శరణం అయ్యప్ప ।\nభగవానే — భగవతియే\nఈశ్వరనే — ఈశ్వరియే\nదేవనే — దేవియే\nస్వామియే — అయ్యప్పో ।',
        english: '🎵 Bhagavan Saranam — Bhagavathi Saranam\nSaranam Saranam Ayyappa |\nDevan Saranam — Devi Saranam\nSaranam Saranam Ayyappa |\nBhagavane — Bhagavathiye\nEeshvarane — Eeshvariye\nDevane — Deviye\nSwamiye — Ayyappo |',
        meaning: 'Sacred call-response chant acknowledging Bhagavan and Bhagavati with complete surrender.',
      },
      {
        telugu: '🎵 పల్లికట్టు శబరిమలక్కు\nఇరుముడికట్టు శబరిమలక్కు\nకత్తుంకట్టు శబరిమలక్కు\nకల్లుంముల్లుం కాలికిమెత్తై\nదేహబలందా పాదబలందా\nస్వామియైకండాల్ మోక్షంకిట్టుం\nస్వామి శరణం — అయ్యప్ప శరణం ।',
        english: '🎵 Pallikkattu Sabarimalakku\nIrumudikkattu Sabarimalakku\nKattumkattu Sabarimalakku\nKallum Mullum Kaaliki Mettai\nDeha Balainda Pada Balainda\nSwamiyai Kandal Moksham Kittum\nSwami Saranam — Ayyappa Saranam |',
        meaning: 'Pilgrimage march song celebrating the sacred journey to Sabarimala over rocks and thorns to attain moksha.',
      },
      {
        telugu: '🎵 మల్లెపూల పల్లకీ బంగారు పల్లకీ\nఅయ్యప్ప స్వామికి రత్నాల పల్లకీ ।\nతులసి పూల పల్లకీ చందన పల్లకీ\nశబరి స్వామికి నవరత్నాల పల్లకీ ।\nస్వామి శరణం శరణం అయ్యప్ప\nస్వామి శరణం శరణం అయ్యప్ప ।',
        english: '🎵 Mallepula Pallaki Bangaru Pallaki\nAyyappa Swamiki Ratnala Pallaki |\nTulasi Poola Pallaki Chandana Pallaki\nSabari Swamiki Navarathna Pallaki |\nSwami Saranam Saranam Ayyappa\nSwami Saranam Saranam Ayyappa |',
        meaning: 'Joyous palanquin devotional song celebrating Lord Ayyappa carried in a golden palanquin of jasmine.',
      },
      {
        telugu: '🎵 అయ్యప్పో — స్వామియే\nపంబావాసా — అయ్యప్పా\nకాననవాసా — అయ్యప్పా\nశబరిగిరీశా — అయ్యప్పా\nపందళరాజా — అయ్యప్పా\nవన్‍పులివాహన — అయ్యప్పా\nసుందరరూపా — అయ్యప్పా\nహరిహరతనయా — అయ్యప్పా\nమోహినితనయా — అయ్యప్పా ।',
        english: '🎵 Ayyappo — Swamiye\nPamba Vasa — Ayyappa\nKanana Vasa — Ayyappa\nSabari Girisha — Ayyappa\nPandala Raja — Ayyappa\nVan-Puli Vahana — Ayyappa\nSundara Roopa — Ayyappa\nHariharatanaya — Ayyappa\nMohinitanaya — Ayyappa |',
        meaning: 'Devotional call-prayer naming the glorious aspects and divine attributes of Lord Ayyappa.',
      },
      {
        telugu: '🎵 అభిషేకాలు — స్వామిక్కే\nనెయ్యాభిషేకం — స్వామిక్కే\nకర్పూరదీపం — స్వామిక్కే\nపాలాభిషేకం — స్వామిక్కే\nభస్మాభిషేకం — స్వామిక్కే\nతేనాభిషేకం — స్వామిక్కే\nచందనాభిషేకం — స్వామిక్కే\nపూలాభిషేకం — స్వామిక్కే\nపన్నీరాభిషేకం — స్వామిక్కే ।',
        english: '🎵 Abhishekam Songs for Swami\nNeyyabhishekam — Swamikke (Ghee)\nKarpoora Deepam — Swamikke (Camphor)\nPala Abhishekam — Swamikke (Milk)\nBhasma Abhishekam — Swamikke (Vibhuti)\nTena Abhishekam — Swamikke (Honey)\nChandana Abhishekam — Swamikke (Sandalwood)\nPoola Abhishekam — Swamikke (Flowers)\nPanneer Abhishekam — Swamikke (Rosewater) |',
        meaning: 'Devotional abhishekam anoint-song for each sacred offering made to Lord Ayyappa.',
      },
    ],
  },
  {
    id: 'ninadalu',
    title: '7. శ్రీ అయ్యప్ప స్వామి నినాదాలు (Slogans)',
    titleTe: '7. శ్రీ అయ్యప్ప స్వామి నినాదాలు',
    category: 'ninadalu',
    mantras: [
      {
        telugu: 'స్వామి శరణం – అయ్యప్ప శరణం\nభగవాన్ శరణం – భగవతి శరణం\nదేవన్ శరణం – దేవీ శరణం\nదేవన్ పాదం – దేవీ పాదం\nస్వామి పాదం – అయ్యప్ప పాదం\nభగవానే – భగవతియే\nఈశ్వరనే – ఈశ్వరియే\nశక్తనే – శక్తియే\nస్వామియే – అయ్యప్పో',
        english: 'Swami Saranam – Ayyappa Saranam\nBhagavan Saranam – Bhagavathi Saranam\nDevan Saranam – Devi Saranam\nDevan Padam – Devi Padam\nSwami Padam – Ayyappa Padam\nBhagavane – Bhagavathiye\nEeshvarane – Eeshvariye\nShaktane – Shaktiye\nSwamiye – Ayyappo',
        meaning: 'Call-and-response sacred slogans chanted by devotees throughout the pilgrimage.',
      },
    ],
  },
  {
    id: 'harivarasanam',
    title: '8. హరివరాసనం (రాత్రి సన్నిధాన సంధ్యా ప్రార్థన)',
    titleTe: '8. హరివరాసనం — సన్నిధాన సంధ్యా ప్రార్థన',
    category: 'harivarasanam',
    mantras: [
      {
        telugu: 'హరివరాసనం విశ్వమోహనం\nహరిదరాత్మజం దేవవందితమ్ ।\nపరిజనేశ్వరం పరమ పావనం\nహరిహరాత్మజం దేవమాశ్రయే ॥ 1 ॥\nశరణమయ్యప్ప స్వామి శరణమయ్యప్ప',
        english: 'Harivarasanam Viswamohanam\nHaridharatmajam Deva Vanditham |\nParijaneshvaram Parama Pavanam\nHariharatmajam Deva Mashraye || 1 ||\nSaranam Ayyappa Swami Saranam Ayyappa',
        meaning: 'Universal song of peace recited every night at Sannidhanam during the sacred closing of the temple doors.',
      },
      {
        telugu: 'శరణకీర్తనమ్ శక్తమానసమ్\nభరణలోలుపం నర్తనప్రియమ్ ।\nఅరుణభాసురం భూతనాయకమ్\nహరిహరాత్మజం దేవమాశ్రయే ॥ 2 ॥\nశరణమయ్యప్ప స్వామి శరణమయ్యప్ప',
        english: 'Saranam Keerthanam Shaktha Manasam\nBharana Lolupam Narthana Priyam |\nAruna Bhasuram Bhoota Nayakam\nHariharatmajam Deva Mashraye || 2 ||\nSaranam Ayyappa Swami Saranam Ayyappa',
      },
      {
        telugu: 'ప్రణయసత్యకం ప్రాణనాయకం\nప్రణతకల్పకం సుప్రభాంచితమ్ ।\nప్రణవమందిరం కీర్తనప్రియం\nహరిహరాత్మజం దేవమాశ్రయే ॥ 3 ॥\nశరణమయ్యప్ప స్వామి శరణమయ్యప్ప',
        english: 'Pranaya Satyakam Prana Nayakam\nPranatha Kalpakam Suprabham Chitam |\nPranava Mandiram Keertana Priyam\nHariharatmajam Deva Mashraye || 3 ||\nSaranam Ayyappa Swami Saranam Ayyappa',
      },
      {
        telugu: 'తురగవాహనం సుందరేశ్వరం\nవరగదావ్ రితం వేదవందితమ్ ।\nగురుకృపాకరం కీర్తనప్రియం\nహరిహరాత్మజం దేవమాశ్రయే ॥ 4 ॥\nశరణమయ్యప్ప స్వామి శరణమయ్యప్ప',
        english: 'Thuraga Vahanam Sundara Eshvaram\nVara Gadavritam Veda Vanditham |\nGuru Krupaakaram Keertana Priyam\nHariharatmajam Deva Mashraye || 4 ||\nSaranam Ayyappa Swami Saranam Ayyappa',
      },
      {
        telugu: 'జనసహాయకం జయ్యమంగళమ్\nజనసంహారం కీర్తనప్రియమ్ ।\nజలనిధిస్థలం సత్య విక్రమం\nహరిహరాత్మజం దేవమాశ్రయే ॥ 5 ॥\nశరణమయ్యప్ప స్వామి శరణమయ్యప్ప',
        english: 'Jana Sahayakam Jayya Mangalam\nJana Samharam Keertana Priyam |\nJala Nidhi Sthalam Satya Vikramam\nHariharatmajam Deva Mashraye || 5 ||\nSaranam Ayyappa Swami Saranam Ayyappa',
      },
      {
        telugu: '🕯️ హరివరాసనం ముగింపు\nఓం శ్రీ ధర్మశాస్తా భగవతే నమః ।\nఓం హరిహర పుత్ర స్వామినే నమః ।\nఓం అయ్యప్ప స్వామినే నమః ।\n\nస్వామి శరణం అయ్యప్ప ।\nతత్ సత్ బ్రహ్మార్పణమస్తు 🙏',
        english: '🕯️ Harivarasanam Closing Prayer\nOm Sri Dharma Shastha Bhagavate Namah |\nOm Harihara Putra Swamine Namah |\nOm Ayyappa Swamine Namah |\n\nSwami Saranam Ayyappa |\nTat Sat Brahmarpanam Astu 🙏',
        meaning: 'Final closing prayer at Sannidhanam — offering all actions to the Supreme.',
      },
    ],
  },
];
