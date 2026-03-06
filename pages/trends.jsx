import Head from 'next/head'
import Link from 'next/link'
import Script from 'next/script'
import { useSiteSettings } from '../lib/settings.js'
import TrendSpotlight from '../components/TrendSpotlight'
import styles from '../styles/Trends.module.css'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kulture.app'

// JSON-LD 구조화 데이터 — ItemList + WebPage
const trendsJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: '글로벌 K-Culture 트렌드 허브 — Kulture',
  description: 'K-POP, 드라마, 뷰티, 패션, 스포츠까지 실시간 이슈와 VIP 급상승 현황.',
  url: `${SITE_URL}/trends`,
  inLanguage: ['ko', 'en', 'ja', 'zh'],
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: '트렌드', item: `${SITE_URL}/trends` },
    ],
  },
}

export default function TrendsPage() {
  const { settings } = useSiteSettings()

  // 트렌드 허브가 비활성화된 경우
  if (settings?.trends?.enabled === false || settings?.trends?.trendHubEnabled === false) {
    return (
      <>
        <Head>
          <title>페이지를 찾을 수 없습니다 - Kulture</title>
        </Head>
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <h1>🔒 현재 이 페이지는 이용할 수 없습니다</h1>
          <p>관리자에게 문의해주세요.</p>
          <Link href="/">홈으로 돌아가기</Link>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>트렌드 - Kulture | 글로벌 K-Culture 실시간 허브</title>
        <meta
          name="description"
          content="글로벌 K-Culture 실시간 트렌드, 핫이슈, VIP 알림을 한눈에 확인하세요. K-POP, 드라마, 뷰티, 패션, 스포츠 최신 이슈."
        />
        <meta property="og:title" content="트렌드 - Kulture | 글로벌 K-Culture 실시간 허브" />
        <meta property="og:description" content="K-POP, 드라마, 뷰티, 패션, 스포츠까지 실시간 이슈와 VIP 급상승 현황." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/trends`} />
        <meta property="og:image" content={`${SITE_URL}/api/og?title=${encodeURIComponent('K-Culture 트렌드 허브')}&subtitle=${encodeURIComponent('실시간 이슈 · VIP 알림 · 글로벌 팬덤')}`} />
        <link rel="canonical" href={`${SITE_URL}/trends`} />
        <link rel="alternate" hrefLang="ko" href={`${SITE_URL}/ko/trends`} />
        <link rel="alternate" hrefLang="en" href={`${SITE_URL}/en/trends`} />
        <link rel="alternate" hrefLang="ja" href={`${SITE_URL}/ja/trends`} />
        <link rel="alternate" hrefLang="zh" href={`${SITE_URL}/zh/trends`} />
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/trends`} />
      </Head>
      <Script
        id="trends-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(trendsJsonLd) }}
      />

      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>LIVE INSIGHTS</p>
            <h1>글로벌 K-Culture 트렌드 허브</h1>
            <p className={styles.subtitle}>
              K-POP, 드라마, 뷰티, 패션, 스포츠까지 — 실시간 이슈와 VIP 급상승 현황을 확인하세요.
            </p>
          </div>
          <div className={styles.actions}>
            <Link href="/leaderboard" className={styles.actionBtn}>
              🏆 리더보드 보기
            </Link>
            <Link href="/missions" className={styles.actionGhost}>
              🎯 미션 참여
            </Link>
          </div>
        </header>

        <section className={styles.panel}>
          <TrendSpotlight />
        </section>

        <section className={styles.categoriesSection}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>K-CULTURE MAP</p>
              <h2>관심 있는 분야를 탐색하세요</h2>
              <p className={styles.subtitle}>
                카테고리를 선택하면 관련 커뮤니티, 이벤트, 콘텐츠를 빠르게 찾을 수 있습니다.
              </p>
            </div>
            <Link href="/communities" className={styles.actionGhost}>
              커뮤니티 둘러보기 →
            </Link>
          </div>
          <div className={styles.grid}>
            {[
              { slug: 'kpop', label: 'K-POP', emoji: '🎤' },
              { slug: 'kdrama', label: 'K-드라마', emoji: '🎬' },
              { slug: 'kbeauty', label: 'K-뷰티', emoji: '💄' },
              { slug: 'kfashion', label: 'K-패션', emoji: '👗' },
              { slug: 'kfood', label: 'K-푸드', emoji: '🍜' },
              { slug: 'kgame', label: 'K-게임/e스포츠', emoji: '🎮' },
              { slug: 'kwebtoon', label: 'K-웹툰', emoji: '📚' },
              { slug: 'ktourism', label: 'K-여행', emoji: '🗺️' },
            ].map(cat => (
              <Link key={cat.slug} href={`/category/${cat.slug}`} className={styles.card}>
                <div className={styles.cardEmoji}>{cat.emoji}</div>
                <div className={styles.cardBody}>
                  <div className={styles.cardTitle}>{cat.label}</div>
                  <div className={styles.cardSubtitle}>새로운 소식과 커뮤니티를 확인하세요</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.cta}> 
          <div className={styles.ctaText}>
            <h3>지금 Kulture에 참여하고 트렌드를 주도하세요</h3>
            <p>트렌드에 의견을 남기고, 번역을 기여하며, 미션으로 보상을 받으세요.</p>
          </div>
          <div className={styles.ctaActions}>
            <Link href="/auth/login" className={styles.ctaPrimary}>
              로그인 / 가입
            </Link>
            <Link href="/badges" className={styles.ctaSecondary}>
              배지 모아보기
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
