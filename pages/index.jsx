/**
 * Home — Global K-Culture Magazine Feed
 * Phase 7 · Kulture Design System
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import MagazineCard from '../components/MagazineCard';
import TrendSpotlight from '../components/TrendSpotlight';
import styles from '../styles/Home.module.css';
import { logger } from '../lib/logger.js';

// ── Mock data (replaced by real Sanity fetch once CMS is connected) ──
const MOCK_ARTICLES = [
  {
    _id: 'mock-1',
    title: 'BLACKPINK Announces Global "BORN PINK" World Tour 2026 — All Dates Confirmed',
    excerpt: 'BLACKPINK has officially confirmed their highly anticipated return with a record-breaking 52-city world tour spanning North America, Europe, and Asia.',
    thumbnail: null,
    category: 'K-Pop',
    views: 128400,
    votes: 9420,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    slug: { current: 'blackpink-born-pink-2026' },
    trending: true,
  },
  {
    _id: 'mock-2',
    title: 'Song Hye-Kyo's Upcoming Netflix Drama Already Breaking Pre-Release Records',
    excerpt: 'The globally beloved actress returns with a psychological thriller that has already sold streaming rights to 38 countries before its official premiere.',
    thumbnail: null,
    category: 'K-Drama',
    views: 95200,
    votes: 7810,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    slug: { current: 'song-hyekyo-netflix-2026' },
    trending: true,
  },
  {
    _id: 'mock-3',
    title: 'K-Beauty's Glass Skin Trend Dominates TikTok with 4.2 Billion Views in March',
    excerpt: '\'Glass skin\' has become the defining beauty trend of 2026. Korean skincare brands like COSRX and Laneige report 300% sales surges in Western markets.',
    thumbnail: null,
    category: 'K-Beauty',
    views: 74100,
    votes: 5640,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    slug: { current: 'glass-skin-tiktok-2026' },
  },
  {
    _id: 'mock-4',
    title: 'Stray Kids "MIROH 2" Debuts at #1 on Billboard Hot 100 — A Historic First',
    excerpt: 'For the first time in history, a fully Korean-language track has debuted at number one on the Billboard Hot 100, signaling a seismic shift in global music.',
    thumbnail: null,
    category: 'K-Pop',
    views: 112000,
    votes: 8930,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    slug: { current: 'stray-kids-billboard-1' },
  },
  {
    _id: 'mock-5',
    title: 'Michelin Awards 3 Stars to Seoul\'s Jungsik — Global Foodies Flock to Korea',
    excerpt: 'Chef Yim Jung-sik's signature modern Korean cuisine earns the highest culinary honour, cementing Seoul as one of the world's top gastronomic destinations.',
    thumbnail: null,
    category: 'K-Food',
    views: 43800,
    votes: 3120,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    slug: { current: 'jungsik-michelin-3star' },
  },
  {
    _id: 'mock-6',
    title: 'T1 Faker Leads Team Korea to Unprecedented 5th World Championship Title',
    excerpt: '"The Unkillable Demon King" defies age expectations at 30, delivering a legendary performance in League of Legends Worlds 2026.',
    thumbnail: null,
    category: 'K-Games',
    views: 67500,
    votes: 6210,
    createdAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
    slug: { current: 'faker-worlds-2026' },
  },
  {
    _id: 'mock-7',
    title: 'Parasite Director Bong Joon-ho's New Sci-Fi Epic Gets Standing Ovation at Cannes',
    excerpt: 'Bong Joon-ho's long-awaited sci-fi thriller "Okja 2046" premiered to a 12-minute standing ovation at the Cannes Film Festival.',
    thumbnail: null,
    category: 'K-Drama',
    views: 58300,
    votes: 4780,
    createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    slug: { current: 'bong-joon-ho-cannes-2026' },
  },
  {
    _id: 'mock-8',
    title: 'aespa Drops Surprise Album "Supernova Deluxe" — Streams 200M in 24 Hours',
    excerpt: 'SM Entertainment\'s virtual-reality K-pop group continues to blur the line between the digital and real world with their most ambitious release yet.',
    thumbnail: null,
    category: 'K-Pop',
    views: 91700,
    votes: 7640,
    createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    slug: { current: 'aespa-supernova-deluxe' },
  },
];

const CATEGORIES = ['All', 'K-Pop', 'K-Drama', 'K-Beauty', 'K-Food', 'K-Games'];

function SkeletonGrid() {
  return (
    <div className={styles.loadingGrid}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={styles.skeletonCard}>
          <div className={styles.skeletonThumb} />
          <div className={styles.skeletonBody}>
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
            <div className={`${styles.skeletonLine} ${styles.short}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const { t } = useTranslation('common');
  const [articles, setArticles]       = useState([]);
  const [activeCategory, setCategory] = useState('All');
  const [loading, setLoading]         = useState(true);

  // Fetch real articles from Sanity; fall back to mock data
  useEffect(() => {
    async function fetchArticles() {
      try {
        const res = await fetch('/api/trending');
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        const items = data.trends || data.posts || data.articles || [];
        setArticles(items.length > 0 ? items : MOCK_ARTICLES);
      } catch (err) {
        logger.warn('Home: falling back to mock articles', err.message);
        setArticles(MOCK_ARTICLES);
      } finally {
        setLoading(false);
      }
    }
    fetchArticles();
  }, []);

  const filtered = activeCategory === 'All'
    ? articles
    : articles.filter(a => a.category === activeCategory);

  const [hero1, hero2, ...rest] = filtered;

  return (
    <>
      <Head>
        <title>Kulture — Global K-Culture Magazine</title>
        <meta name="description" content="Your premier destination for K-Pop, K-Drama, K-Beauty and all things Korean culture — live trends, deep dives, and global community." />
        <meta name="keywords" content="K-Culture, K-Pop, K-Drama, K-Beauty, Korean trends, Hallyu" />
        <meta property="og:title"       content="Kulture — Global K-Culture Magazine" />
        <meta property="og:description" content="Your premier destination for K-Pop, K-Drama, K-Beauty and all things Korean culture." />
        <meta property="og:type"        content="website" />
        <link rel="canonical" href="https://kulture.net/" />
      </Head>

      <div className={styles.page}>

        {/* ══════════════════════ HERO ══════════════════════ */}
        <section className={styles.hero} aria-label="Featured stories">
          <div className={styles.heroBg}>
            {hero1?.thumbnail && (
              <img src={hero1.thumbnail} alt="" aria-hidden="true" />
            )}
            <div className={styles.heroBgGradient} />
          </div>
          <div className={styles.heroOrb} aria-hidden="true" />

          <div className={styles.heroContent}>
            <span className={styles.heroEyebrow}>🔥 Hot Trends</span>

            <h1 className={styles.heroTitle}>
              THE WORLD<br />
              SPEAKS <span className={styles.highlight}>K-CULTURE</span>
            </h1>

            <p className={styles.heroDescription}>
              Live trends, exclusive scoops, and in-depth analysis — covering every corner of Korean culture for the global generation.
            </p>

            <div className={styles.heroActions}>
              <Link href="/trending" className={`${styles.heroCta} ${styles.heroCtaPrimary}`}>
                ⚡ Trending Now
              </Link>
              <Link href="/community" className={`${styles.heroCta} ${styles.heroCtaSecondary}`}>
                Join Community →
              </Link>
            </div>

            {/* Featured cards strip inside hero */}
            {(hero1 || hero2) && (
              <div className={styles.heroFeatured}>
                {hero1 && <MagazineCard article={hero1} trending={hero1.trending} glowColor="pink" />}
                {hero2 && <MagazineCard article={hero2} trending={hero2.trending} glowColor="cyan" />}
              </div>
            )}
          </div>
        </section>

        {/* ══════════════════════ TREND STRIP ══════════════════════ */}
        <div className={styles.trendStrip}>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px' }}>
            <TrendSpotlight />
          </div>
        </div>

        {/* ══════════════════════ GRID FEED ══════════════════════ */}
        <section className={styles.section} aria-label="Magazine feed">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionTitleAccent}>▌</span>
              Latest Stories
            </h2>
            <div className={styles.sectionDivider} aria-hidden="true" />
            <Link href="/trending" className={styles.viewAllLink}>
              View all →
            </Link>
          </div>

          {/* Category filter */}
          <div className={styles.filterTabs} role="tablist" aria-label="Filter by category">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                role="tab"
                aria-selected={activeCategory === cat}
                className={`${styles.filterTab} ${activeCategory === cat ? styles.active : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <SkeletonGrid />
          ) : rest.length === 0 ? (
            <div className={styles.emptyState}>
              No articles found in this category yet.
            </div>
          ) : (
            <div className={styles.grid}>
              {rest.map((article, i) => (
                <MagazineCard
                  key={article._id || i}
                  article={article}
                  trending={article.trending}
                  glowColor={i % 3 === 0 ? 'cyan' : 'pink'}
                />
              ))}
            </div>
          )}
        </section>

      </div>
    </>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'ko', ['common'])),
    },
  };
}
