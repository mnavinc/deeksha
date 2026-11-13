export interface DevotionalReel {
  id: string;
  category: 'Ayyappa' | 'Sabarimala' | 'Harivarasanam' | 'Shiva' | 'Hanuman';
  titleEn: string;
  titleTe: string;
  creator: string;
  duration: string;
  likesLabel: string;
  hashtags: string[];
  accentColor: string;
  instagramUrl: string;
  youtubeShortsUrl: string;
}

export const DEVOTIONAL_REELS: DevotionalReel[] = [
  {
    id: 'reel-sabarimala-18steps',
    category: 'Sabarimala',
    titleEn: 'Pathinettam Padi — 18 Sacred Steps Darshan',
    titleTe: 'పదునెట్టాంబడి — 18 పవిత్ర మెట్ల దర్శనం',
    creator: '@sabarimala.diaries',
    duration: '0:45',
    likesLabel: '48.2K',
    hashtags: ['#SwamiyeSaranamAyyappa', '#PathinettamPadi', '#Sabarimala'],
    accentColor: '#F0B429',
    instagramUrl: 'https://www.instagram.com/explore/tags/swamiyesaranamayyappa/',
    youtubeShortsUrl: 'https://www.youtube.com/results?search_query=sabarimala+18+steps+shorts',
  },
  {
    id: 'reel-harivarasanam',
    category: 'Harivarasanam',
    titleEn: 'Harivarasanam Night Lullaby at Sannidhanam',
    titleTe: 'సన్నిధానంలో హరివరాసనం పవళింపు సేవ',
    creator: '@ayyappa.bhakthi',
    duration: '0:58',
    likesLabel: '62.5K',
    hashtags: ['#Harivarasanam', '#AyyappaSwamy', '#Sannidhanam'],
    accentColor: '#34D399',
    instagramUrl: 'https://www.instagram.com/explore/tags/harivarasanam/',
    youtubeShortsUrl: 'https://www.youtube.com/results?search_query=harivarasanam+sannidhanam+shorts',
  },
  {
    id: 'reel-kanni-irumudi',
    category: 'Ayyappa',
    titleEn: 'Kanni Swamy Irumudi Kettu Preparation Guide',
    titleTe: 'కన్ని స్వామి ఇరుముడి కట్టు విధానం',
    creator: '@guruswamy.guide',
    duration: '0:52',
    likesLabel: '31.9K',
    hashtags: ['#KanniSwamy', '#Irumudi', '#AyyappaDeeksha'],
    accentColor: '#F97316',
    instagramUrl: 'https://www.instagram.com/explore/tags/ayyappadeeksha/',
    youtubeShortsUrl: 'https://www.youtube.com/results?search_query=ayyappa+irumudi+kettu+shorts',
  },
  {
    id: 'reel-erumeli-pettathullal',
    category: 'Sabarimala',
    titleEn: 'Erumeli Pettathullal & Periyapatha Forest Trek',
    titleTe: 'ఎరుమేలి పేటతుళ్ళల్ & పెద్దపాద అటవీ యాత్ర',
    creator: '@yatra.vibes',
    duration: '0:49',
    likesLabel: '27.4K',
    hashtags: ['#Erumeli', '#Pamba', '#SabarimalaYatra'],
    accentColor: '#A78BFA',
    instagramUrl: 'https://www.instagram.com/explore/tags/sabarimala/',
    youtubeShortsUrl: 'https://www.youtube.com/results?search_query=erumeli+pettathullal+sabarimala+shorts',
  },
  {
    id: 'reel-shiva-pradosham',
    category: 'Shiva',
    titleEn: 'Om Namah Shivaya — Pradosham Rudrabhishekam',
    titleTe: 'ఓం నమః శివాయ — ప్రదోష రుద్రాభిషేకం',
    creator: '@shaiva.mandali',
    duration: '0:40',
    likesLabel: '39.1K',
    hashtags: ['#OmNamahShivaya', '#ShivaDeeksha', '#Pradosham'],
    accentColor: '#38BDF8',
    instagramUrl: 'https://www.instagram.com/explore/tags/omnamahshivaya/',
    youtubeShortsUrl: 'https://www.youtube.com/results?search_query=om+namah+shivaya+abhishekam+shorts',
  },
  {
    id: 'reel-hanuman-chalisa',
    category: 'Hanuman',
    titleEn: 'Hanuman Chalisa Morning Sankalpam',
    titleTe: 'హనుమాన్ చాలీసా ప్రాతఃకాల సంకల్పం',
    creator: '@bajrang.bhakthi',
    duration: '0:55',
    likesLabel: '54.0K',
    hashtags: ['#HanumanDeeksha', '#JaiHanuman', '#DevotionalReels'],
    accentColor: '#FB923C',
    instagramUrl: 'https://www.instagram.com/explore/tags/jaihanuman/',
    youtubeShortsUrl: 'https://www.youtube.com/results?search_query=hanuman+chalisa+devotional+shorts',
  },
];

