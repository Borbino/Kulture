import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Head from 'next/head'
import Link from 'next/link'
import { useSiteSettings } from '../lib/settings.js'
import styles from '../styles/Missions.module.css'
import { logger } from '../lib/logger.js';

export default function Missions() {
  const { status } = useSession()
  const { settings } = useSiteSettings()
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCompleted: 0,
    todayCompleted: 0,
    streak: 0,
    totalRewards: 0
  })

  // 게이미피케이션이 비활성화된 경우
  if (settings?.gamification?.enabled === false || settings?.gamification?.dailyMissionsEnabled === false) {
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
    if (status === 'authenticated') {
      fetchMissions()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status])

  const fetchMissions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/gamification/missions')
      const data = await res.json()

      if (data.data?.missions) {
        setMissions(data.data.missions)
        setStats({
          totalCompleted: 0,
          todayCompleted: data.data.missions.filter(m => m.isCompleted).length,
          streak: data.data.streak || 0,
          totalRewards: 0
        })
      }
    } catch (error) {
      logger.error('Failed to fetch missions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProgressPercentage = (current, target) => {
    return Math.min(Math.round((current / target) * 100), 100)
  }

  const getMissionIcon = (type) => {
    const icons = {
      post: '📝',
      comment: '💬',
      like: '❤️',
      follow: '👥',
      read: '📖',
      share: '📤',
      login: '🔐',
      complete_profile: '👤'
    }
    return icons[type] || '🎯'
  }

  const handleClaimReward = async (missionId) => {
    try {
      const res = await fetch('/api/gamification/claim-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId })
      })

      if (res.ok) {
        // Refresh missions
        await fetchMissions()
      }
    } catch (error) {
      logger.error('Failed to claim reward:', error)
    }
  }

  if (status === 'unauthenticated') {
    return (
      <>
        <Head>
          <title>미션 - Kulture</title>
        </Head>
        <div className={styles.container}>
          <div className={styles.loginPrompt}>
            <h1>🎯 일일 미션</h1>
            <p>로그인하고 미션을 완료하여 보상을 받으세요!</p>
            <Link href="/auth/login">
              <button className={styles.loginBtn}>로그인</button>
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>미션 - Kulture</title>
        <meta name="description" content="일일 미션을 완료하고 보상을 받으세요" />
      </Head>

      <div className={styles.container}>
        <div className={styles.header}>
          <h1>🎯 일일 미션</h1>
          <p>매일 새로운 미션에 도전하고 포인트를 획득하세요</p>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🔥</div>
            <div className={styles.statValue}>{stats.streak}일</div>
            <div className={styles.statLabel}>연속 출석</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statValue}>{stats.todayCompleted}</div>
            <div className={styles.statLabel}>오늘 완료</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏆</div>
            <div className={styles.statValue}>{stats.totalCompleted}</div>
            <div className={styles.statLabel}>총 완료</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💎</div>
            <div className={styles.statValue}>{stats.totalRewards}</div>
            <div className={styles.statLabel}>총 보상</div>
          </div>
        </div>

        {/* Missions */}
        {loading ? (
          <div className={styles.loading}>로딩 중...</div>
        ) : (
          <div className={styles.missions}>
            <h2>오늘의 미션</h2>
            <div className={styles.missionGrid}>
              {missions.map((mission) => {
                const percentage = getProgressPercentage(mission.progress || 0, mission.target)
                const isCompleted = percentage >= 100
                const isClaimed = mission.claimed

                return (
                  <div
                    key={mission._id}
                    className={`${styles.missionCard} ${isCompleted ? styles.completed : ''} ${isClaimed ? styles.claimed : ''}`}
                  >
                    <div className={styles.missionIcon}>
                      {getMissionIcon(mission.type)}
                    </div>
                    <div className={styles.missionContent}>
                      <div className={styles.missionHeader}>
                        <h3>{mission.title}</h3>
                        {isClaimed && <span className={styles.claimedBadge}>✓ 완료</span>}
                      </div>
                      <p className={styles.missionDescription}>{mission.description}</p>
                      
                      <div className={styles.progressSection}>
                        <div className={styles.progressBar}>
                          <div
                            className={styles.progressFill}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className={styles.progressText}>
                          {mission.progress || 0} / {mission.target}
                        </div>
                      </div>

                      <div className={styles.missionFooter}>
                        <div className={styles.reward}>
                          <span className={styles.rewardIcon}>💰</span>
                          <span className={styles.rewardValue}>{mission.reward} 포인트</span>
                        </div>
                        {isCompleted && !isClaimed && (
                          <button
                            onClick={() => handleClaimReward(mission._id)}
                            className={styles.claimBtn}
                          >
                            보상 받기
                          </button>
                        )}
                        {!isCompleted && (
                          <span className={styles.inProgress}>진행 중</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {missions.length === 0 && (
              <div className={styles.empty}>
                <p>오늘의 미션이 아직 준비되지 않았습니다.</p>
                <p>잠시 후 다시 확인해주세요!</p>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className={styles.infoSection}>
          <h2>💡 미션 가이드</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <h3>🕐 미션 갱신</h3>
              <p>매일 자정(KST)에 새로운 미션이 제공됩니다</p>
            </div>
            <div className={styles.infoCard}>
              <h3>🎁 보상</h3>
              <p>미션을 완료하면 포인트와 경험치를 획득합니다</p>
            </div>
            <div className={styles.infoCard}>
              <h3>🔥 연속 출석</h3>
              <p>매일 접속하면 추가 보너스를 받을 수 있습니다</p>
            </div>
            <div className={styles.infoCard}>
              <h3>⭐ 특별 미션</h3>
              <p>주말과 이벤트 기간에는 특별 미션이 제공됩니다</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
