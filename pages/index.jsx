import { useState } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'

export default function Home({ hotIssues, trendingTopics, vipContent, recentPosts }) {
  const [activeTab, setActiveTab] = useState('all')

  return (
    <>
      <Head>
        <title>Kulture - K-POP 트렌드 & VIP 소식</title>
        <meta
          name="description"
          content="실시간 K-POP 트렌드 분석과 VIP 아티스트 소식을 한 곳에서"
        />
        <meta name="keywords" content="K-POP, 트렌드, VIP, 아이돌, 뉴스, 엔터테인먼트" />
        <meta property="og:title" content="Kulture - K-POP 트렌드 & VIP 소식" />
        <meta
          property="og:description"
          content="실시간 K-POP 트렌드 분석과 VIP 아티스트 소식"
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://yoursite.com/" />
      </Head>

      <div className={styles.container}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>
            K-POP 트렌드를
            <br />
            <span className={styles.highlight}>실시간</span>으로
          </h1>
          <p className={styles.heroSubtitle}>
            AI가 분석하는 VIP 아티스트 소식과 최신 트렌드
          </p>
        </section>

        {/* Hot Issues */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            🔥 Hot Issues
            <span className={styles.badge}>실시간</span>
          </h2>
          <div className={styles.hotIssuesGrid}>
            {hotIssues?.map((issue, idx) => (
              <div key={idx} className={styles.hotIssueCard}>
                <div className={styles.hotIssueRank}>#{idx + 1}</div>
                <h3 className={styles.hotIssueTitle}>{issue.issue}</h3>
                <div className={styles.hotIssueMeta}>
                  <span className={styles.mentions}>🔥 {issue.mentions} mentions</span>
                  <span className={styles.platform}>{issue.platform}</span>
                </div>
                {issue.relatedVIP && (
                  <div className={styles.relatedVIP}>관련: {issue.relatedVIP}</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Trending Topics */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>📈 실시간 트렌드</h2>
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'all' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('all')}
              >
                전체
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'rising' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('rising')}
              >
                급상승
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'vip' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('vip')}
              >
                VIP Only
              </button>
            </div>
          </div>
          <div className={styles.trendGrid}>
            {trendingTopics
              ?.filter(trend => activeTab === 'all' || trend.category === activeTab)
              .map((trend, idx) => (
                <div key={idx} className={styles.trendCard}>
                  <div className={styles.trendHeader}>
                    <h3 className={styles.trendKeyword}>{trend.keyword}</h3>
                    {trend.trend === 'rising' && (
                      <span className={styles.trendBadge}>🔺 급상승</span>
                    )}
                  </div>
                  <div className={styles.trendSources}>
                    {trend.sources?.map((source, i) => (
                      <span key={i} className={styles.source}>
                        {source}
                      </span>
                    ))}
                  </div>
                  <div className={styles.trendMentions}>{trend.mentions} mentions</div>
                </div>
              ))}
          </div>
        </section>

        {/* VIP Content */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>⭐ VIP Spotlight</h2>
          <div className={styles.vipGrid}>
            {vipContent?.map((vip, idx) => (
              <div key={idx} className={styles.vipCard}>
                <div className={styles.vipHeader}>
                  <div className={styles.vipAvatar}>{vip.name[0]}</div>
                  <div>
                    <h3 className={styles.vipName}>{vip.name}</h3>
                    <p className={styles.vipPlatform}>{vip.platform}</p>
                  </div>
                </div>
                <p className={styles.vipActivity}>{vip.latestActivity}</p>
                <div className={styles.vipMeta}>
                  <span>{vip.activityCount} activities</span>
                  <span className={styles.vipTime}>{formatTime(vip.lastChecked)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Posts */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>📝 최근 포스트</h2>
          <div className={styles.postsGrid}>
            {recentPosts?.map((post, idx) => (
              <article key={idx} className={styles.postCard}>
                {post.mainImage && (
                  <div className={styles.postImage}>
                    <img src={post.mainImage} alt={post.title} />
                  </div>
                )}
                <div className={styles.postContent}>
                  <div className={styles.postCategory}>{post.category}</div>
                  <h3 className={styles.postTitle}>{post.title}</h3>
                  <p className={styles.postExcerpt}>{post.excerpt}</p>
                  <div className={styles.postMeta}>
                    <span>{post.author}</span>
                    <span>{formatDate(post.publishedAt)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}

// 서버 사이드 데이터 페칭
export async function getServerSideProps() {
  try {
    // Hot Issues
    const hotIssues = [
      {
        issue: 'G-DRAGON 컴백 소식',
        mentions: 15420,
        platform: 'Twitter',
        relatedVIP: 'G-DRAGON',
      },
      {
        issue: 'BTS 지민 솔로 앨범',
        mentions: 12350,
        platform: 'Instagram',
        relatedVIP: 'BTS',
      },
      {
        issue: 'BLACKPINK 월드투어',
        mentions: 9840,
        platform: 'YouTube',
        relatedVIP: 'BLACKPINK',
      },
    ]

    // Trending Topics
    const trendingTopics = [
      {
        keyword: 'K-POP 패션',
        mentions: 5420,
        trend: 'rising',
        sources: ['Twitter', 'Instagram'],
        category: 'all',
      },
      {
        keyword: '아이돌 챌린지',
        mentions: 4320,
        trend: 'stable',
        sources: ['TikTok', 'YouTube'],
        category: 'all',
      },
      {
        keyword: '신곡 발매',
        mentions: 3890,
        trend: 'rising',
        sources: ['YouTube', 'Spotify'],
        category: 'rising',
      },
    ]

    // VIP Content
    const vipContent = [
      {
        name: 'G-DRAGON',
        platform: 'Instagram',
        latestActivity: '새로운 앨범 티저 공개',
        activityCount: 5,
        lastChecked: new Date().toISOString(),
      },
      {
        name: 'IU',
        platform: 'Twitter',
        latestActivity: '콘서트 일정 발표',
        activityCount: 3,
        lastChecked: new Date().toISOString(),
      },
    ]

    // Recent Posts (실제로는 Sanity에서 가져옴)
    const recentPosts = [
      {
        title: 'K-POP 트렌드 분석: 2025년 상반기',
        excerpt: 'AI가 분석한 올해 가장 핫한 K-POP 트렌드를 살펴봅니다.',
        category: 'Analysis',
        author: 'Kulture AI',
        publishedAt: new Date().toISOString(),
        mainImage: null,
      },
    ]

    return {
      props: {
        hotIssues,
        trendingTopics,
        vipContent,
        recentPosts,
      },
    }
  } catch (error) {
    console.error('[Home SSR] Error:', error)
    return {
      props: {
        hotIssues: [],
        trendingTopics: [],
        vipContent: [],
        recentPosts: [],
      },
    }
  }
}

// Utility functions
function formatTime(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 60) return `${diffMins}분 전`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}시간 전`
  return `${Math.floor(diffMins / 1440)}일 전`
}

function formatDate(isoString) {
  const date = new Date(isoString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
