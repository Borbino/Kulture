import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useSiteSettings } from '../lib/settings.js'
import InfiniteScrollPosts from '../components/InfiniteScrollPosts'
import PostEditor from '../components/PostEditor'
import ActivityFeed from '../components/ActivityFeed'
import NotificationBell from '../components/NotificationBell'
import LanguageSwitcher from '../components/LanguageSwitcher'
import Search from '../components/Search'
import RecommendationWidget from '../components/RecommendationWidget'
import DailyMissions from '../components/DailyMissions'
import TrendSpotlight from '../components/TrendSpotlight'
import ContributeTranslation from '../components/ContributeTranslation'
import Toast from '../components/Toast'
import styles from '../styles/CommunityFeed.module.css'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { settings } = useSiteSettings()
  const [activeTab, setActiveTab] = useState('feed')
  const [showPostEditor, setShowPostEditor] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handlePostSuccess = () => {
    setShowPostEditor(false)
    setToastMessage('✅ 게시글이 등록되었습니다!')
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  if (status === 'loading') {
    return (
      <div className={styles.container}>
        <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Kulture - K-Culture 글로벌 커뮤니티</title>
        <meta
          name="description"
          content="한국 문화를 사랑하는 글로벌 커뮤니티. K-POP, K-드라마, K-뷰티, K-음식 등 모든 K-Culture를 공유하세요."
        />
        <meta name="keywords" content="K-문화, K-POP, K-드라마, K-뷰티, K-음식, 커뮤니티" />
        <meta property="og:title" content="Kulture - K-Culture 글로벌 커뮤니티" />
        <meta property="og:description" content="한국 문화를 사랑하는 글로벌 커뮤니티" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://kulture.wiki/" />
      </Head>

      {toastMessage && <Toast message={toastMessage} />}

      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.logo}>
              <Link href="/">
                <h1>🌏 Kulture</h1>
              </Link>
            </div>
            <div className={styles.headerActions}>
              <Search onSearch={handleSearch} />
              {session && <NotificationBell />}
              <LanguageSwitcher />
              {session ? (
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '8px 16px',
                    background: '#00c7a8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  로그아웃
                </button>
              ) : (
                <Link href="/auth/login">
                  <button
                    style={{
                      padding: '8px 16px',
                      background: '#00c7a8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                  >
                    로그인
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className={styles.nav}>
            <button
              className={`${styles.navTab} ${activeTab === 'feed' ? styles.active : ''}`}
              onClick={() => setActiveTab('feed')}
            >
              🏠 피드
            </button>
            <button
              className={`${styles.navTab} ${activeTab === 'activity' ? styles.active : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              📊 활동
            </button>
            <button
              className={`${styles.navTab} ${activeTab === 'trends' ? styles.active : ''}`}
              onClick={() => setActiveTab('trends')}
            >
              📈 트렌드
            </button>
            <Link href="/communities" className={`${styles.navTab}`}>
              👥 커뮤니티
            </Link>
            <Link href="/events" className={`${styles.navTab}`}>
              📅 이벤트
            </Link>
            <Link href="/marketplace" className={`${styles.navTab}`}>
              🛍️ 마켓
            </Link>
            <Link href="/chat" className={`${styles.navTab}`}>
              💬 채팅
            </Link>
            {settings?.gamification?.enabled && (
              <>
                <Link href="/missions" className={`${styles.navTab}`}>
                  🎯 미션
                </Link>
                <Link href="/leaderboard" className={`${styles.navTab}`}>
                  🏆 랭킹
                </Link>
                <Link href="/badges" className={`${styles.navTab}`}>
                  🏅 배지
                </Link>
              </>
            )}
            {settings?.trends?.enabled && settings?.trends?.trendHubEnabled && (
              <Link href="/trends" className={`${styles.navTab}`}>
                📈 트렌드 허브
              </Link>
            )}
            {session?.user?.role === 'admin' && (
              <Link href="/admin" className={`${styles.navTab}`}>
                ⚙️ 관리
              </Link>
            )}
          </nav>
        </header>

        {/* Main Content */}
        <main className={styles.main}>
          {/* Sidebar - Left */}
          <aside className={styles.sidebarLeft}>
            {session ? (
              <>
                {/* User Profile Card */}
                <div className={styles.userCard}>
                  <div className={styles.userAvatar}>
                    {session.user?.image ? (
                      <img src={session.user.image} alt={session.user.name} />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        {session.user?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className={styles.userName}>{session.user?.name}</h3>
                  <p className={styles.userEmail}>{session.user?.email}</p>
                  <div className={styles.userStats}>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>팔로워</span>
                      <span className={styles.statValue}>0</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>팔로잉</span>
                      <span className={styles.statValue}>0</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>게시글</span>
                      <span className={styles.statValue}>0</span>
                    </div>
                  </div>
                  <Link href={`/profile/${session.user?.email}`}>
                    <button className={styles.editProfileBtn}>프로필 보기</button>
                  </Link>
                </div>

                {/* Daily Missions */}
                <DailyMissions />
              </>
            ) : (
              <div className={styles.loginCard}>
                <h3>Kulture에 참여하세요!</h3>
                <p>한국 문화를 사랑하는 글로벌 커뮤니티에 가입하세요.</p>
                <Link href="/auth/login">
                  <button className={styles.loginBtn}>로그인 / 회원가입</button>
                </Link>
              </div>
            )}

            {/* Quick Links */}
            <div className={styles.quickLinks}>
              <h4>🌟 카테고리</h4>
              <ul>
                <li>
                  <Link href="/category/kpop">🎤 K-POP</Link>
                </li>
                <li>
                  <Link href="/category/kdrama">🎬 K-드라마</Link>
                </li>
                <li>
                  <Link href="/category/kfood">🍜 K-음식</Link>
                </li>
                <li>
                  <Link href="/category/kbeauty">💄 K-뷰티</Link>
                </li>
                <li>
                  <Link href="/category/kfashion">👗 K-패션</Link>
                </li>
                <li>
                  <Link href="/category/ktourism">🗼 K-여행</Link>
                </li>
              </ul>
              <h4 style={{ marginTop: '20px' }}>✨ 더보기</h4>
              <ul>
                <li>
                  <Link href="/communities">👥 커뮤니티</Link>
                </li>
                <li>
                  <Link href="/events">📅 이벤트</Link>
                </li>
                <li>
                  <Link href="/marketplace">🛍️ 마켓플레이스</Link>
                </li>
                {settings?.trends?.enabled && settings?.trends?.trendHubEnabled && (
                  <li>
                    <Link href="/trends">🌐 트렌드 허브</Link>
                  </li>
                )}
                {settings?.gamification?.enabled && settings?.gamification?.dailyMissionsEnabled && (
                  <li>
                    <Link href="/missions">🎯 미션</Link>
                  </li>
                )}
                {settings?.gamification?.enabled && settings?.gamification?.leaderboardEnabled && (
                  <li>
                    <Link href="/leaderboard">🏆 리더보드</Link>
                  </li>
                )}
                {settings?.gamification?.enabled && settings?.gamification?.badgesEnabled && (
                  <li>
                    <Link href="/badges">🏅 배지</Link>
                  </li>
                )}
                <li>
                  <Link href="/admin/translation-dashboard">🌐 번역 대시보드</Link>
                </li>
              </ul>
            </div>
          </aside>

          {/* Center Feed */}
          <section className={styles.feed}>
            {/* Post Editor */}
            {session && (
              <div className={styles.postEditorWrapper}>
                <button
                  className={styles.openEditorBtn}
                  onClick={() => setShowPostEditor(true)}
                >
                  💭 무엇을 공유하고 싶으신가요?
                </button>
              </div>
            )}

            {showPostEditor && (
              <PostEditor
                onClose={() => setShowPostEditor(false)}
                onSuccess={handlePostSuccess}
              />
            )}

            {/* Tabs Content */}
            {activeTab === 'feed' && (
              <div className={styles.feedContent}>
                <h2 className={styles.contentTitle}>📱 최신 게시글</h2>
                {session ? <InfiniteScrollPosts /> : <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>로그인 후 게시글을 확인하세요.</div>}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className={styles.feedContent}>
                <h2 className={styles.contentTitle}>📊 활동 피드</h2>
                {session ? <ActivityFeed /> : <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>로그인 후 활동을 확인하세요.</div>}
              </div>
            )}

            {activeTab === 'trends' && (
              <div className={styles.feedContent}>
                <h2 className={styles.contentTitle}>📈 트렌드 분석</h2>
                <TrendSpotlight />
              </div>
            )}
          </section>

          {/* Sidebar - Right */}
          <aside className={styles.sidebarRight}>
            <RecommendationWidget />

            {/* Popular Categories */}
            <div className={styles.categoriesWidget}>
              <h4>🔥 인기 카테고리</h4>
              <div className={styles.categoryTags}>
                <Link href="/category/kpop">
                  <span className={styles.categoryTag}>#K-POP</span>
                </Link>
                <Link href="/category/kdrama">
                  <span className={styles.categoryTag}>#K-드라마</span>
                </Link>
                <Link href="/category/kbeauty">
                  <span className={styles.categoryTag}>#K-뷰티</span>
                </Link>
                <Link href="/category/kfood">
                  <span className={styles.categoryTag}>#K-음식</span>
                </Link>
              </div>
            </div>

            {/* Community Stats */}
            <div className={styles.statsWidget}>
              <h4>📊 커뮤니티 통계</h4>
              <div className={styles.widgetStat}>
                <span>전체 게시글</span>
                <strong>1,234</strong>
              </div>
              <div className={styles.widgetStat}>
                <span>활성 사용자</span>
                <strong>567</strong>
              </div>
              <div className={styles.widgetStat}>
                <span>총 댓글</span>
                <strong>5,678</strong>
              </div>
              <div className={styles.widgetStat}>
                <span>오늘 활동</span>
                <strong>89</strong>
              </div>
            </div>

            {/* Community Translation */}
            <ContributeTranslation
              translationKey="home.subtitle"
              originalText="한국 문화를 사랑하는 글로벌 커뮤니티. K-POP, K-드라마, K-뷰티, K-음식 등 모든 K-Culture를 공유하세요."
              currentTranslation="Share everything about K-Culture with the world."
            />
          </aside>
        </main>
      </div>
    </>
  )
}
