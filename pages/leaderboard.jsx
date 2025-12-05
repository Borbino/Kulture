import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Head from 'next/head'
import Link from 'next/link'
import { useSiteSettings } from '../lib/settings.js'
import styles from '../styles/Leaderboard.module.css'

export default function Leaderboard() {
  const { data: session } = useSession()
  const { settings } = useSiteSettings()
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('all') // all, month, week
  const [category, setCategory] = useState('points') // points, posts, engagement

  // 게이미피케이션이 비활성화된 경우
  if (settings?.gamification?.enabled === false || settings?.gamification?.leaderboardEnabled === false) {
    return (
      <>
        <Head><title>페이지를 찾을 수 없습니다 - Kulture</title></Head>
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <h1>🔒 현재 이 페이지는 이용할 수 없습니다</h1>
          <Link href="/">홈으로 돌아가기</Link>
        </div>
      </>
    )
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [timeframe, category])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/gamification/leaderboard?timeframe=${timeframe}&category=${category}`)
      const data = await res.json()
      if (data.data?.leaderboard) {
        setLeaderboard(data.data.leaderboard)
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'points': return '포인트'
      case 'posts': return '게시글'
      case 'engagement': return '참여도'
      default: return '포인트'
    }
  }

  const getCategoryValue = (user) => {
    switch (category) {
      case 'points': return `${user.points || 0}P`
      case 'posts': return `${user.postCount || 0}개`
      case 'engagement': return `${user.engagementScore || 0}점`
      default: return `${user.points || 0}P`
    }
  }

  return (
    <>
      <Head>
        <title>리더보드 - Kulture</title>
        <meta name="description" content="Kulture 커뮤니티 리더보드 - 최고의 기여자들을 만나보세요" />
      </Head>

      <div className={styles.container}>
        <div className={styles.header}>
          <h1>🏆 리더보드</h1>
          <p>커뮤니티에서 가장 활발한 멤버들을 확인하세요</p>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label>기간</label>
            <div className={styles.filterButtons}>
              <button
                className={timeframe === 'all' ? styles.active : ''}
                onClick={() => setTimeframe('all')}
              >
                전체
              </button>
              <button
                className={timeframe === 'month' ? styles.active : ''}
                onClick={() => setTimeframe('month')}
              >
                이번 달
              </button>
              <button
                className={timeframe === 'week' ? styles.active : ''}
                onClick={() => setTimeframe('week')}
              >
                이번 주
              </button>
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label>카테고리</label>
            <div className={styles.filterButtons}>
              <button
                className={category === 'points' ? styles.active : ''}
                onClick={() => setCategory('points')}
              >
                포인트
              </button>
              <button
                className={category === 'posts' ? styles.active : ''}
                onClick={() => setCategory('posts')}
              >
                게시글
              </button>
              <button
                className={category === 'engagement' ? styles.active : ''}
                onClick={() => setCategory('engagement')}
              >
                참여도
              </button>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        {loading ? (
          <div className={styles.loading}>로딩 중...</div>
        ) : (
          <div className={styles.leaderboard}>
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <div className={styles.podium}>
                {/* 2nd Place */}
                <div className={`${styles.podiumItem} ${styles.second}`}>
                  <div className={styles.podiumRank}>🥈</div>
                  <Link href={`/profile/${leaderboard[1]._id}`}>
                    <img
                      src={leaderboard[1].image || '/default-avatar.png'}
                      alt={leaderboard[1].name}
                      className={styles.podiumAvatar}
                    />
                  </Link>
                  <div className={styles.podiumName}>{leaderboard[1].name}</div>
                  <div className={styles.podiumValue}>{getCategoryValue(leaderboard[1])}</div>
                  <div className={styles.podiumLevel}>Lv.{leaderboard[1].level || 1}</div>
                </div>

                {/* 1st Place */}
                <div className={`${styles.podiumItem} ${styles.first}`}>
                  <div className={styles.podiumRank}>🥇</div>
                  <Link href={`/profile/${leaderboard[0]._id}`}>
                    <img
                      src={leaderboard[0].image || '/default-avatar.png'}
                      alt={leaderboard[0].name}
                      className={styles.podiumAvatar}
                    />
                  </Link>
                  <div className={styles.podiumName}>{leaderboard[0].name}</div>
                  <div className={styles.podiumValue}>{getCategoryValue(leaderboard[0])}</div>
                  <div className={styles.podiumLevel}>Lv.{leaderboard[0].level || 1}</div>
                  <div className={styles.crown}>👑</div>
                </div>

                {/* 3rd Place */}
                <div className={`${styles.podiumItem} ${styles.third}`}>
                  <div className={styles.podiumRank}>🥉</div>
                  <Link href={`/profile/${leaderboard[2]._id}`}>
                    <img
                      src={leaderboard[2].image || '/default-avatar.png'}
                      alt={leaderboard[2].name}
                      className={styles.podiumAvatar}
                    />
                  </Link>
                  <div className={styles.podiumName}>{leaderboard[2].name}</div>
                  <div className={styles.podiumValue}>{getCategoryValue(leaderboard[2])}</div>
                  <div className={styles.podiumLevel}>Lv.{leaderboard[2].level || 1}</div>
                </div>
              </div>
            )}

            {/* Remaining ranks */}
            <div className={styles.list}>
              {leaderboard.slice(3).map((user, index) => {
                const rank = index + 4
                const isCurrentUser = session?.user?.email === user.email

                return (
                  <div
                    key={user._id}
                    className={`${styles.listItem} ${isCurrentUser ? styles.currentUser : ''}`}
                  >
                    <div className={styles.rankNumber}>{getRankIcon(rank)}</div>
                    <Link href={`/profile/${user._id}`}>
                      <img
                        src={user.image || '/default-avatar.png'}
                        alt={user.name}
                        className={styles.avatar}
                      />
                    </Link>
                    <div className={styles.userInfo}>
                      <div className={styles.userName}>
                        {user.name}
                        {isCurrentUser && <span className={styles.youBadge}>YOU</span>}
                      </div>
                      <div className={styles.userLevel}>Lv.{user.level || 1}</div>
                    </div>
                    <div className={styles.badges}>
                      {user.badges?.slice(0, 3).map((badge, i) => (
                        <span key={i} className={styles.badge} title={badge.name}>
                          {badge.icon}
                        </span>
                      ))}
                      {user.badges?.length > 3 && (
                        <span className={styles.moreBadges}>+{user.badges.length - 3}</span>
                      )}
                    </div>
                    <div className={styles.value}>{getCategoryValue(user)}</div>
                  </div>
                )
              })}
            </div>

            {leaderboard.length === 0 && (
              <div className={styles.empty}>
                <p>아직 리더보드 데이터가 없습니다.</p>
                <Link href="/">
                  <button className={styles.exploreBtn}>커뮤니티 둘러보기</button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* User's Current Rank */}
        {session && !loading && leaderboard.length > 0 && (
          <div className={styles.currentRank}>
            {(() => {
              const userIndex = leaderboard.findIndex(u => u.email === session.user.email)
              if (userIndex === -1) {
                return (
                  <p>
                    활동을 시작하고 리더보드에 등록하세요! 🚀
                  </p>
                )
              }
              return (
                <p>
                  현재 순위: <strong>{getRankIcon(userIndex + 1)}</strong> ({getCategoryLabel(category)}: {getCategoryValue(leaderboard[userIndex])})
                </p>
              )
            })()}
          </div>
        )}
      </div>
    </>
  )
}
