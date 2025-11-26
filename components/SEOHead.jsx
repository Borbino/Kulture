/**
 * SEO Head Component with hreflang tags
 * Automatically generates language alternates for multilingual SEO
 */

import Head from 'next/head';
import { useRouter } from 'next/router';
import { SUPPORTED_LANGUAGES } from '../lib/aiTranslation';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kulture.com';

export default function SEOHead({
  title = 'Kulture - Global K-Culture Community',
  description = 'Discover and share K-Culture content in your language',
  image = '/images/og-image.jpg',
  noindex = false,
}) {
  const router = useRouter();
  const { locale, locales, asPath } = router;

  // 현재 페이지의 정규 URL
  const canonical = `${SITE_URL}/${locale}${asPath === '/' ? '' : asPath}`;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      
      {/* Robots */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${SITE_URL}${image}`} />
      <meta property="og:locale" content={locale} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${SITE_URL}${image}`} />

      {/* hreflang Tags for Multilingual SEO */}
      {locales && locales.map((lang) => {
        const langUrl = `${SITE_URL}/${lang}${asPath === '/' ? '' : asPath}`;
        return <link key={lang} rel="alternate" hrefLang={lang} href={langUrl} />;
      })}
      
      {/* x-default for language selection */}
      <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}${asPath === '/' ? '' : asPath}`} />

      {/* Language names for search engines */}
      {locales && locales.map((lang) => {
        const langName = SUPPORTED_LANGUAGES[lang] || lang;
        return (
          <meta key={`lang-${lang}`} property="og:locale:alternate" content={lang} />
        );
      })}
    </Head>
  );
}
