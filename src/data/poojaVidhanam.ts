export interface PoojaSection {
  id: string;
  title: string;
  titleTe: string;
  category: 'mangalacaranam' | 'ganapathi' | 'ayyappa_stotra' | 'sharanu_gosha' | 'bhajans' | 'harivarasanam';
  mantras: {
    telugu: string;
    english: string;
    meaning?: string;
  }[];
}

export const AYYAPPA_POOJA_VIDHANAM: PoojaSection[] = [
  {
    id: 'mangalacaranam',
    title: '1. Mangalacaranam & Sankalpam (మంగళాచరణము)',
    titleTe: '1. మంగళాచరణము మరియు సంకల్పము',
    category: 'mangalacaranam',
    mantras: [
      {
        telugu: 'శుక్లాంబరధరం విష్ణుం శశివర్ణం చతుర్భుజం । ప్రసన్నవదనం ధ్యాయేత్ సర్వవిఘ్నోపశాంతయే ॥',
        english: 'Shuklam Baradharam Vishnum Shashi Varnam Chatur Bhujam | Prasanna Vadanam Dhyayet Sarva Vighno Pashantaye ||',
        meaning: 'Dressed in white, omnipresent, moon-complexioned, four-armed, with a gracious face, we meditate for the removal of all obstacles.',
      },
      {
        telugu: 'గురుర్బ్రహ్మా గురుర్విష్ణుః గురుర్దేవో మహేశ్వరః । గురుః సాక్షాత్ పరబ్రహ్మ తస్మై శ్రీ గురవే నమః ॥',
        english: 'Gurur Brahma Gurur Vishnuh Gurur Devo Maheshwarah | Guruh Sakshat Para Brahma Tasmai Shri Gurave Namah ||',
        meaning: 'The Guru is Brahma, Vishnu, and Shiva. The Guru is Supreme Consciousness. Salutations to the Holy Guru.',
      },
    ],
  },
  {
    id: 'ganapathi_pooja',
    title: '2. Sri Ganesha Ashtottara Shatanamavali (శ్రీ గణేశ అష్టోత్తర శతనామావళి)',
    titleTe: '2. శ్రీ గణేశ అష్టోత్తర శతనామావళి',
    category: 'ganapathi',
    mantras: [
      { telugu: 'ఓం గజాననాయ నమః', english: 'Om Gajananaya Namah' },
      { telugu: 'ఓం గణాధ్యక్షాయ నమః', english: 'Om Ganadhyakshaya Namah' },
      { telugu: 'ఓం విఘ్నరాజాయ నమః', english: 'Om Vighnarajaya Namah' },
      { telugu: 'ఓం వినాయకాయ నమః', english: 'Om Vinayakaya Namah' },
      { telugu: 'ఓం సుముఖాయ నమః', english: 'Om Sumukhaya Namah' },
      { telugu: 'ఓం ఏకదంతాయ నమః', english: 'Om Ekadantaya Namah' },
      { telugu: 'ఓం కపిలాయ నమః', english: 'Om Kapilaya Namah' },
      { telugu: 'ఓం గజకర్ణకాయ నమః', english: 'Om Gajakarnakaya Namah' },
      { telugu: 'ఓం లంబోదరాయ నమః', english: 'Om Lambodaraya Namah' },
      { telugu: 'ఓం వికటాయ నమః', english: 'Om Vikataya Namah' },
      { telugu: 'ఓం విఘ్ననాశనాయ నమః', english: 'Om Vighnanashanaya Namah' },
      { telugu: 'ఓం వినాశకాయ నమః', english: 'Om Vinashakaya Namah' },
      { telugu: 'ఓం ధూమ్రకేతవే నమః', english: 'Om Dhumraketave Namah' },
      { telugu: 'ఓం గణాధ్యక్షాయ నమః', english: 'Om Ganadhyakshaya Namah' },
      { telugu: 'ఓం ఫాలచంద్రాయ నమః', english: 'Om Bhalachandraya Namah' },
      { telugu: 'ఓం గజాననాయ నమః', english: 'Om Gajananaya Namah' },
      { telugu: 'ఓం మహాగణపతయే నమః', english: 'Om Maha Ganapataye Namah' },
    ],
  },
  {
    id: 'sharanu_gosha',
    title: '3. Sri Ayyappa 108 Sharanu Gosha (శ్రీ అయ్యప్ప 108 శరణు ఘోష)',
    titleTe: '3. శ్రీ అయ్యప్ప 108 శరణు ఘోష',
    category: 'sharanu_gosha',
    mantras: [
      { telugu: '1. స్వామియే శరణం అయ్యప్ప', english: '1. Swamiye Saranam Ayyappa' },
      { telugu: '2. హరిహర సుతనే శరణం అయ్యప్ప', english: '2. Harihara Suthane Saranam Ayyappa' },
      { telugu: '3. కన్నిమూల గణపతి భగవానే శరణం అయ్యప్ప', english: '3. Kannimoola Ganapathi Bhagavane Saranam Ayyappa' },
      { telugu: '4. శక్తి రూపానే శరణం అయ్యప్ప', english: '4. Shakthi Roopane Saranam Ayyappa' },
      { telugu: '5. విల్లాళి వీరనే శరణం అయ్యప్ప', english: '5. Villali Veerane Saranam Ayyappa' },
      { telugu: '6. వీరమణికంటనే శరణం అయ్యప్ప', english: '6. Veera Manikantane Saranam Ayyappa' },
      { telugu: '7. ధర్మశాస్తావే శరణం అయ్యప్ప', english: '7. Dharma Shasthave Saranam Ayyappa' },
      { telugu: '8. పంబానది వాసనే శరణం అయ్యప్ప', english: '8. Pamba Nadi Vasane Saranam Ayyappa' },
      { telugu: '9. శబరిగిరీశనే శరణం అయ్యప్ప', english: '9. Sabarigireeshane Saranam Ayyappa' },
      { telugu: '10. పదునెట్టాం పడియాండే శరణం అయ్యప్ప', english: '10. Padinettam Padiyande Saranam Ayyappa' },
      { telugu: '11. నెయ్యిఅభిషేక ప్రియనే శరణం అయ్యప్ప', english: '11. Neyyabhisheka Priyane Saranam Ayyappa' },
      { telugu: '12. అనాథ రక్షకనే శరణం అయ్యప్ప', english: '12. Anadha Rakshakane Saranam Ayyappa' },
      { telugu: '13. భక్తవత్సలనే శరణం అయ్యప్ప', english: '13. Bhakthavatsalane Saranam Ayyappa' },
      { telugu: '14. సత్యస్వరూపనే శరణం అయ్యప్ప', english: '14. Sathya Sroopane Saranam Ayyappa' },
      { telugu: '15. ఓం శ్రీ స్వామియే శరణం అయ్యప్ప', english: '15. Om Sri Swamiye Saranam Ayyappa' },
    ],
  },
  {
    id: 'ayyappa_stotra',
    title: '4. Sri Ayyappa Pancharatnam & Gayatri (శ్రీ అయ్యప్ప పంచరత్నం)',
    titleTe: '4. శ్రీ అయ్యప్ప పంచరత్నం మరియు గాయత్రీ మంత్రం',
    category: 'ayyappa_stotra',
    mantras: [
      {
        telugu: 'ఓం భూతనాథాయ విద్మహే భవపుత్రాయ ధీమహి । తన్నో శాస్తా ప్రచోదయాత్ ॥',
        english: 'Om Bhootanathaya Vidmahe Bhavaputraya Dheemahi | Tanno Shastha Prachodayat ||',
        meaning: 'Ayyappa Gayatri Mantra for peace, protection, and spiritual enlightenment.',
      },
      {
        telugu: 'లోకవీరం మహాపూజ్యం సర్వరక్షాకరం విభుమ్ । పార్వతీహృదయానందం శాస్తారం ప్రణమామ్యహమ్ ॥',
        english: 'Loka Veeram Maha Poojyam Sarva Rakshakaram Vibhum | Parvathi Hrudayanandam Shastaram Pranamamyaham ||',
        meaning: 'I bow to Lord Shastha, the hero of the universe, worshipped by all, the protector of everyone.',
      },
      {
        telugu: 'విప్రపూజ్యం విశ్వవంద్యం విష్ణుశంభ్వోః ప్రియం సుతమ్ । క్షిప్రప్రసాదనిరతం శాస్తారం ప్రణమామ్యహమ్ ॥',
        english: 'Vipra Poojyam Vishwa Vandyam Vishnu Shambhvo Priyam Sutam | Kshipra Prasada Niratham Shastaram Pranamamyaham ||',
        meaning: 'I bow to Shastha, beloved son of Vishnu and Shiva, who bestows quick grace upon sincere devotees.',
      },
    ],
  },
  {
    id: 'bhajans',
    title: '5. Popular Ayyappa Songs & Bhajans (అయ్యప్ప స్వామి భజన పాటలు)',
    titleTe: '5. అయ్యప్ప స్వామి భజన పాటలు',
    category: 'bhajans',
    mantras: [
      {
        telugu: 'భగవాన్ శరణం భగవతి శరణం । శరణం శరణం అయ్యప్ప ॥\nదేవన్ శరణం దేవి శరణం । శరణం శరణం అయ్యప్ప ॥\nభగవానే భగవతియే । దేவனே దేవియే ॥',
        english: 'Bhagavan Saranam Bhagavathi Saranam | Saranam Saranam Ayyappa ||\nDevan Saranam Devi Saranam | Saranam Saranam Ayyappa ||\nBhagavane Bhagavathiye | Devane Deviye ||',
        meaning: 'Sacred chanting song acknowledging Bhagavan and Bhagavati with complete surrender.',
      },
      {
        telugu: 'ఇరుముడి కట్టు శబరిమలైకి । పడిపాట్టు పాడి శబరిమలైకి ॥\nస్వామియే అయ్యప్పో । అయ్యప్పో స్వామియే ॥',
        english: 'Irumudi Kattu Sabarimalaikki | Padi Paattu Paadi Sabarimalaikki ||\nSwamiye Ayyappo | Ayyappo Swamiye ||',
        meaning: 'Pilgrimage song chanted while tying the Irumudi and climbing the sacred 18 steps.',
      },
      {
        telugu: 'మల్లెపూల పల్లకీ బంగారు పల్లకీ । అయ్యప్ప స్వామికి రత్నాల పల్లకీ ॥',
        english: 'Mallepula Pallaki Bangaru Pallaki | Ayyappa Swamiki Ratnala Pallaki ||',
        meaning: 'Joyous palanquin devotional song honoring Lord Ayyappa.',
      },
    ],
  },
  {
    id: 'harivarasanam',
    title: '6. Harivarasanam — Sacred Bedtime Prayer (హరివరాసనం)',
    titleTe: '6. హరివరాసనం (సన్నిధాన సంధ్యా హారతి రాత్రి ప్రార్థన)',
    category: 'harivarasanam',
    mantras: [
      {
        telugu: 'హరివరాసనం విశ్వమోహనం । హరిధరాత్మజం దేవవందితమ్ ॥\nశరణకీర్తనం శక్తమానసమ్ । హరిహరాత్మజం దేవమాశ్రయే ॥\nశరణమయ్యప్ప స్వామి శరణమయ్యప్ప । శరణమయ్యప్ప స్వామి శరణమయ్యప్ప ॥',
        english: 'Harivarasanam Viswamohanam | Haridharatmajam Devavanditham ||\nSaranamkeerthanam Shakthamanasam | Hariharatmajam Devamashraye ||\nSaranam Ayyappa Swami Saranam Ayyappa | Saranam Ayyappa Swami Saranam Ayyappa ||',
        meaning: 'Universal song of peace recited every night at Sannidhanam during closing of the temple doors.',
      },
      {
        telugu: 'శరణకీర్తనమ్ శక్తమానసమ్ । భరణలోలుపం నర్తనప్రియమ్ ॥\nఅరుణభాసురం భూతనాయకమ్ । హరిహరాత్మజం దేవమాశ్రయే ॥\nశరణమయ్యప్ప స్వామి శరణమయ్యప్ప ॥',
        english: 'Saranamkeerthanam Shakthamanasam | Bharanalolupam Narthanapriyam ||\nArunabhasuram Bhootanayakam | Hariharatmajam Devamashraye ||\nSaranam Ayyappa Swami Saranam Ayyappa ||',
      },
    ],
  },
];
