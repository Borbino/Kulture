/**
 * SEO Head Component with hreflang tags
 * Automatically generates language alternates for multilingual SEO
 */

import Head from 'next/head';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kulture.wiki';

function SEOHead({
  title = 'Kulture - Global K-Culture Community',
  description = 'Discover and share K-Culture content in your language',
  image = '/images/og-image.jpg',
  noindex = false,
}) {
  const router = useRouter();
  // defaultLocale added to destructuring
  const { locale, locales, defaultLocale, asPath } = router;

  // Clean path to avoid double slashes
  const cleanPath = asPath.split('?')[0];
  const queryString = asPath.split('?')[1] ? `?${asPath.split('?')[1]}` : '';

  // Canonical URL construction (Current Page)
  // If current locale is default, do not append locale to URL if strategy is prefix-except-default (Next.js default)
  // But for explicit canonicals, it's often safer to be consistent. 
  // Let's assume standard Next.js routing: / (default), /ko, /ja
  const canonical = locale === defaultLocale
    ? `${SITE_URL}${cleanPath}${queryString}`
    : `${SITE_URL}/${locale}${cleanPath}${queryString}`;

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
      <meta property="og:image" content={image.startsWith('http') ? image : `${SITE_URL}${image}`} />
      <meta property="og:locale" content={locale} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image.startsWith('http') ? image : `${SITE_URL}${image}`} />

      {/* Dynamic hreflang Tags for Multilingual SEO */}
      {locales && locales.map((lang) => {
        // Construct URL for each locale
        // If lang is defaultLocale, URL is just SITE_URL + path (usually)
        // Adjust logic based on Next.js i18n config. Assuming subpath routing.
        let hrefLangUrl;
        if (lang === defaultLocale) {
            hrefLangUrl = `${SITE_URL}${cleanPath}${queryString}`;
        } else {
            hrefLangUrl = `${SITE_URL}/${lang}${cleanPath}${queryString}`;
        }
        
        return (
            <link 
                key={lang} 
                rel="alternate" 
                hrefLang={lang} 
                href={hrefLangUrl} 
            />
        );
      })}
      
      {/* x-default: Fallback for unmatched languages. Usually points to the default locale page */}
      <link 
        rel="alternate" 
        hrefLang="x-default" 
        href={`${SITE_URL}${cleanPath}${queryString}`} 
      />

      {/* Open Graph Alternate Locales */}
      {locales && locales.filter(l => l !== locale).map((lang) => (
        <meta key={`og-lang-${lang}`} property="og:locale:alternate" content={lang} />
      ))}
    </Head>
  );
}

SEOHead.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  image: PropTypes.string,
  noindex: PropTypes.bool,
};

export default SEOHead;
