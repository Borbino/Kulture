import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Head from 'next/head'
import Link from 'next/link'
import { useSiteSettings } from '../lib/settings.js'
import styles from '../styles/Badges.module.css'
import { logger } from '../lib/logger.js';

export default function Badges() {
  const { data: session } = useSession()
  const { settings } = useSiteSettings()
  const [badges, setBadges] = useState([])
  const [userBadges, setUserBadges] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, earned, locked

  // 게이미피케이션이 비활성화된 경우
  if (settings?.gamification?.enabled === false || settings?.gamification?.badgesEnabled === false) {
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
    fetchBadges()
  }, [session])

  const fetchBadges = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/gamification/badges')
      const data = await res.json()
      
      if (data.data?.badges) {
        setBadges(data.data.badges)
        if (session) {
          setUserBadges(data.data.userBadges || [])
        }
      }
    } catch (error) {
      logger.error('Failed to fetch badges:', error)
    } finally {
      setLoading(false)
    }
  }

  const hasBadge = (badgeId) => {
    return userBadges.some(b => b._id === badgeId)
  }

  const getFilteredBadges = () => {
    if (!session) return badges
    
    if (filter === 'earned') {
      return badges.filter(badge => hasBadge(badge._id))
    } else if (filter === 'locked') {
      return badges.filter(badge => !hasBadge(badge._id))
    }
    return badges
  }

  const filteredBadges = getFilteredBadges()
  const earnedCount = session ? badges.filter(b => hasBadge(b._id)).length : 0

  return (
    <>
      <Head>
        <title>배지 - Kulture</title>
        <meta name="description" content="Kulture 배지 시스템 - 활동을 통해 다양한 배지를 획득하세요" />
      </Head>

      <div className={styles.container}>
        <div className={styles.header}>
          <h1>🏅 배지</h1>
          <p>커뮤니티 활동을 통해 특별한 배지를 획득하세요</p>
        </div>

        {session && (
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{earnedCount}</div>
              <div className={styles.statLabel}>획득한 배지</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{badges.length - earnedCount}</div>
              <div className={styles.statLabel}>남은 배지</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {Math.round((earnedCount / badges.length) * 100)}%
              </div>
              <div className={styles.statLabel}>완성도</div>
            </div>
          </div>
        )}

        {/* Filters */}
        {session && (
          <div className={styles.filters}>
            <button
              className={filter === 'all' ? styles.active : ''}
              onClick={() => setFilter('all')}
            >
              전체 ({badges.length})
            </button>
            <button
              className={filter === 'earned' ? styles.active : ''}
              onClick={() => setFilter('earned')}
            >
              획득 ({earnedCount})
            </button>
            <button
              className={filter === 'locked' ? styles.active : ''}
              onClick={() => setFilter('locked')}
            >
              미획득 ({badges.length - earnedCount})
            </button>
          </div>
        )}

        {/* Badge Grid */}
        {loading ? (
          <div className={styles.loading}>로딩 중...</div>
        ) : (
          <div className={styles.badgeGrid}>
            {filteredBadges.map((badge) => {
              const earned = session && hasBadge(badge._id)
              
              return (
                <div
                  key={badge._id}
                  className={`${styles.badgeCard} ${earned ? styles.earned : styles.locked}`}
                >
                  <div className={styles.badgeIcon}>
                    {earned ? badge.icon : '🔒'}
                  </div>
                  <div className={styles.badgeName}>{badge.name}</div>
                  <div className={styles.badgeDescription}>
                    {badge.description}
                  </div>
                  <div className={styles.badgeRequirement}>
                    {badge.requirement}
                  </div>
                  {earned ? (
                    <div className={styles.badgeStatus}>
                      <span className={styles.earnedBadge}>✓ 획득</span>
                    </div>
                  ) : (
                    <div className={styles.badgeProgress}>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${badge.progress || 0}%` }}
                        />
                      </div>
                      <div className={styles.progressText}>
                        {badge.progress || 0}% 완료
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {filteredBadges.length === 0 && !loading && (
          <div className={styles.empty}>
            <p>
              {filter === 'earned'
                ? '아직 획득한 배지가 없습니다.'
                : filter === 'locked'
                ? '모든 배지를 획득했습니다! 🎉'
                : '배지가 없습니다.'}
            </p>
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')} className={styles.resetBtn}>
                전체 배지 보기
              </button>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className={styles.infoSection}>
          <h2>💡 배지를 획득하는 방법</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>📝</div>
              <h3>콘텐츠 작성</h3>
              <p>게시글과 댓글을 작성하여 커뮤니티에 기여하세요</p>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>❤️</div>
              <h3>적극적인 참여</h3>
              <p>좋아요, 공유, 팔로우로 커뮤니티를 활성화하세요</p>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>🎯</div>
              <h3>미션 완료</h3>
              <p>일일 미션과 특별 이벤트를 완료하세요</p>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>⭐</div>
              <h3>레벨 업</h3>
              <p>활동 포인트를 쌓아 레벨을 올리세요</p>
            </div>
          </div>
        </div>

        {!session && (
          <div className={styles.loginPrompt}>
            <p>배지를 획득하고 진행 상황을 확인하려면 로그인하세요</p>
            <Link href="/auth/login">
              <button className={styles.loginBtn}>로그인</button>
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
