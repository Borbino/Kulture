import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Head from 'next/head'
import Link from 'next/link'
import FollowButton from '../../components/FollowButton'
import InfiniteScrollPosts from '../../components/InfiniteScrollPosts'
import Toast from '../../components/Toast'
import styles from '../../styles/Profile.module.css'
import { logger } from '../../lib/logger.js';

export default function Profile() {
  const router = useRouter()
  const { userId } = router.query
  const { data: session } = useSession()
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [activeTab, setActiveTab] = useState('posts')

  useEffect(() => {
    if (!userId) return

    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users?email=${userId}`)
        const data = await res.json()

        if (data.user) {
          setUser(data.user)
          setStats({
            posts: data.postCount || 0,
            followers: data.followers || 0,
            following: data.following || 0,
            level: data.level || 1,
            points: data.points || 0,
          })
        } else {
          setError('사용자를 찾을 수 없습니다')
        }
      } catch (err) {
        setError('사용자 정보 로드 실패')
        logger.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [userId])

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  if (error || !user) {
    return (
      <div className={styles.errorBox}>
        <h2>⚠️ {error || '사용자를 찾을 수 없습니다'}</h2>
        <Link href="/">
          <button className={styles.backBtn}>홈으로 돌아가기</button>
        </Link>
      </div>
    )
  }

  const isOwnProfile = session?.user?.email === userId

  return (
    <>
      <Head>
        <title>{user.name} - Kulture 프로필</title>
        <meta name="description" content={`${user.name}의 Kulture 프로필`} />
      </Head>

      {toastMessage && <Toast message={toastMessage} />}

      <div className={styles.container}>
        {/* Profile Header */}
        <div className={styles.profileHeader}>
          <div className={styles.headerContent}>
            <div className={styles.avatarSection}>
              {user.image ? (
                <img src={user.image} alt={user.name} className={styles.avatar} />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className={styles.userInfo}>
              <h1 className={styles.userName}>{user.name}</h1>
              <p className={styles.userEmail}>{user.email}</p>
              {user.bio && <p className={styles.userBio}>{user.bio}</p>}

              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>레벨</span>
                  <span className={styles.statValue}>{stats?.level}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>포인트</span>
                  <span className={styles.statValue}>{stats?.points}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>게시글</span>
                  <span className={styles.statValue}>{stats?.posts}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>팔로워</span>
                  <span className={styles.statValue}>{stats?.followers}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>팔로잉</span>
                  <span className={styles.statValue}>{stats?.following}</span>
                </div>
              </div>

              {session && !isOwnProfile && (
                <div className={styles.actions}>
                  <FollowButton
                    userId={userId}
                    onFollowChange={(isFollowing) => {
                      setToastMessage(isFollowing ? '✅ 팔로우했습니다!' : '✅ 팔로우 해제했습니다!')
                      setTimeout(() => setToastMessage(''), 2000)
                    }}
                  />
                  <button
                    className={styles.messageBtn}
                    onClick={() => router.push(`/chat?user=${userId}`)}
                  >
                    💬 메시지
                  </button>
                </div>
              )}

              {isOwnProfile && (
                <button
                  className={styles.editBtn}
                  onClick={() => router.push('/profile/edit')}
                >
                  ✏️ 프로필 수정
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'posts' ? styles.active : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            📝 게시글 ({stats?.posts || 0})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'activity' ? styles.active : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            📊 활동
          </button>
          {isOwnProfile && (
            <button
              className={`${styles.tab} ${activeTab === 'settings' ? styles.active : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              ⚙️ 설정
            </button>
          )}
        </div>

        {/* Content */}
        <div className={styles.content}>
          {activeTab === 'posts' && (
            <div className={styles.postsSection}>
              <h2>📝 사용자의 게시글</h2>
              <InfiniteScrollPosts author={userId} />
            </div>
          )}

          {activeTab === 'activity' && (
            <div className={styles.activitySection}>
              <h2>📊 사용자 활동</h2>
              <p style={{ color: '#9ca3af', padding: '20px', textAlign: 'center' }}>
                활동 데이터를 불러오는 중입니다...
              </p>
            </div>
          )}

          {activeTab === 'settings' && isOwnProfile && (
            <div className={styles.settingsSection}>
              <h2>⚙️ 프로필 설정</h2>
              <p style={{ color: '#9ca3af', padding: '20px', textAlign: 'center' }}>
                프로필 수정 페이지로 이동하세요.
              </p>
              <Link href="/profile/edit">
                <button className={styles.editBtn}>프로필 수정하기</button>
              </Link>
            </div>
          )}
        </div>

        {/* Advertisement */}
        <div className={styles.adSpace}>
          <div className={styles.adPlaceholder}>
            <h4>📢 광고</h4>
            <p>광고 공간</p>
          </div>
        </div>
      </div>
    </>
  )
}
