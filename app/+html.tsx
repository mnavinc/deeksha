import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

const SITE_URL = 'https://deeksha-sigma.vercel.app';
const SITE_TITLE = 'Deeksha Journey — Swamiye Saranam Ayyappa | 41-Day Vrutham, Pooja Vidhanam & Sabarimala Guide';
const SITE_DESC =
  'Bilingual (English & Telugu) spiritual companion for Ayyappa Deeksha: 41-day Vrutham tracker, interactive 108-bead Japamala, Pooja Vidhanam, Kanni Swamy guide, Sabarimala jungle trail map, and Sannidhanam group coordination.';
const OG_IMAGE = `${SITE_URL}/og-card.svg`;

const JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Deeksha Journey',
  url: SITE_URL,
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web, Android, iOS',
  inLanguage: ['en', 'te'],
  description: SITE_DESC,
  image: OG_IMAGE,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
  },
});

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>{SITE_TITLE}</title>
        <meta name="description" content={SITE_DESC} />
        <meta
          name="keywords"
          content="Ayyappa Deeksha, Sabarimala, 41 day vrutham, Kanni Swamy, Pooja Vidhanam, Harivarasanam, Sharanu Gosha, Telugu Ayyappa mantras, Sannidhanam, Irumudi, Virtual Q Sabarimala"
        />
        <meta name="theme-color" content="#1B4332" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={SITE_URL} />

        {/* OpenGraph for WhatsApp, Telegram, Instagram, Facebook, LinkedIn */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Deeksha Journey" />
        <meta property="og:title" content={SITE_TITLE} />
        <meta property="og:description" content={SITE_DESC} />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_IN" />
        <meta property="og:locale:alternate" content="te_IN" />

        {/* Twitter / X Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SITE_TITLE} />
        <meta name="twitter:description" content={SITE_DESC} />
        <meta name="twitter:image" content={OG_IMAGE} />

        {/* Structured Data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD }} />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}

