/**
 * SEOHead — Phase 12 · 동적 JSON-LD 주입 + 다국어 hreflang 자동 생성
 *
 * Props:
 *   article — Sanity 기사 객체. 너기면 Article JSON-LD를 자동 생성합니다.
 *     { title, excerpt, mainImage, publishedAt, updatedAt, author, slug, category }
 *   type — 'website' | 'article' (article prop 있으면 자동으로 'article')
 */

import Head from 'next/head';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kulture.wiki';
const SITE_NAME = 'Kulture';
const TWITTER_HANDLE = '@kulturedotnet';

// ── Article JSON-LD 생성기 ────────────────────────────────────────────────
function buildArticleJsonLd({ article, canonical }) {
  if (!article) return null;

  const image = article.mainImage
    ? (article.mainImage.startsWith('http') ? article.mainImage : `${SITE_URL}${article.mainImage}`)
    : `${SITE_URL}/images/og-image.jpg`;

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt || '',
    image: [image],
    datePublished: article.publishedAt || new Date().toISOString(),
    dateModified: article.updatedAt || article.publishedAt || new Date().toISOString(),
    author: [
      {
        '@type': 'Person',
        name: article.author?.name || 'Kulture AI',
        url: article.author?.slug
          ? `${SITE_URL}/author/${article.author.slug}`
          : SITE_URL,
      },
    ],
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/images/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonical,
    },
    url: canonical,
    // Google이 선호하는 articleSection / keywords 필드
    articleSection: article.category || 'K-Culture',
    keywords: Array.isArray(article.tags)
      ? article.tags.join(', ')
      : (article.category || 'K-Culture'),
    inLanguage: article.language || 'en',
  };
}

// ── BreadcrumbList JSON-LD 생성기 ────────────────────────────────
function buildBreadcrumbJsonLd({ article, canonical }) {
  if (!article) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',              item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: article.category || 'K-Culture',
        item: `${SITE_URL}/categories/${(article.category || 'k-culture').toLowerCase().replace(/\s+/g, '-')}` },
      { '@type': 'ListItem', position: 3, name: article.title,      item: canonical },
    ],
  };
}

// ── SEOHead 컴포넌트 ───────────────────────────────────────────────
function SEOHead({
  title = 'Kulture - Global K-Culture Community',
  description = 'Discover and share K-Culture content in your language',
  image = '/images/og-image.jpg',
  noindex = false,
  article = null,   // Sanity 기사 객체 (있으면 Article JSON-LD 자동 생성)
  type,             // 'website' | 'article' — article prop 있으면 자동 'article'
}) {
  const router = useRouter();
  const { locale, locales, defaultLocale, asPath } = router;
  const pageType = type || (article ? 'article' : 'website');

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

  // ── 실제 이미지 URL 확정 ──
  const resolvedImage = (article?.mainImage || image).startsWith('http')
    ? (article?.mainImage || image)
    : `${SITE_URL}${article?.mainImage || image}`;

  // ── JSON-LD 객체 생성 ──
  const articleJsonLd   = buildArticleJsonLd({ article, canonical });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd({ article, canonical });

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:type"        content={pageType} />
      <meta property="og:site_name"   content={SITE_NAME} />
      <meta property="og:url"         content={canonical} />
      <meta property="og:title"       content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image"       content={resolvedImage} />
      <meta property="og:image:width"  content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale"      content={locale} />
      {/* 기사 전용 OG 태그 */}
      {article && (
        <>
          <meta property="article:published_time" content={article.publishedAt} />
          <meta property="article:modified_time"  content={article.updatedAt || article.publishedAt} />
          {article.author?.name && (
            <meta property="article:author" content={article.author.name} />
          )}
          {Array.isArray(article.tags) && article.tags.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:site"        content={TWITTER_HANDLE} />
      <meta name="twitter:url"         content={canonical} />
      <meta name="twitter:title"       content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={resolvedImage} />

      {/* ── Dynamic hreflang — Phase 12 전면 개편 ──
          next-i18next.config.js의 locales 배열을 기반으로 25개 언어 전체 삽입 */}
      {locales && locales.map((lang) => {
        const hrefLangUrl = lang === defaultLocale
          ? `${SITE_URL}${cleanPath}${queryString}`
          : `${SITE_URL}/${lang}${cleanPath}${queryString}`;
        return (
          <link key={lang} rel="alternate" hrefLang={lang} href={hrefLangUrl} />
        );
      })}
      {/* x-default: 언매치 언어 폴백 — 항상 디폴트 로켈 URL */}
      <link rel="alternate" hrefLang="x-default"
            href={`${SITE_URL}${cleanPath}${queryString}`} />

      {/* Open Graph Alternate Locales */}
      {locales && locales.filter(l => l !== locale).map((lang) => (
        <meta key={`og-lang-${lang}`} property="og:locale:alternate" content={lang} />
      ))}

      {/* ── Phase 12: Article JSON-LD — Google NewsArticle 스키마 ── */}
      {articleJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
      )}

      {/* ── Phase 12: BreadcrumbList JSON-LD ── */}
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}

      {/* ── WebSite JSON-LD (SearchAction — 사이트링크) ── */}
      {!article && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: SITE_NAME,
              url: SITE_URL,
              potentialAction: {
                '@type': 'SearchAction',
                target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
                'query-input': 'required name=search_term_string',
              },
            })
          }}
        />
      )}
    </Head>
  );
}

SEOHead.propTypes = {
  title:       PropTypes.string,
  description: PropTypes.string,
  image:       PropTypes.string,
  noindex:     PropTypes.bool,
  type:        PropTypes.oneOf(['website', 'article']),
  /** Sanity 기사 객체. 넓기면 NewsArticle JSON-LD를 자동 생성합니다. */
  article: PropTypes.shape({
    title:       PropTypes.string,
    excerpt:     PropTypes.string,
    mainImage:   PropTypes.string,
    publishedAt: PropTypes.string,
    updatedAt:   PropTypes.string,
    language:    PropTypes.string,
    category:    PropTypes.string,
    tags:        PropTypes.arrayOf(PropTypes.string),
    author: PropTypes.shape({
      name: PropTypes.string,
      slug: PropTypes.string,
    }),
  }),
};

export default SEOHead;
