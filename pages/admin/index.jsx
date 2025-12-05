import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import Toast from '../components/Toast'
import styles from '../styles/Admin.module.css'

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [toastMessage, setToastMessage] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }

    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchStats()
    }
  }, [session])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  if (session?.user?.role !== 'admin') {
    return null
  }

  return (
    <>
      <Head>
        <title>관리자 대시보드 - Kulture</title>
      </Head>

      {toastMessage && <Toast message={toastMessage} />}

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1>⚙️ 관리자 대시보드</h1>
          <Link href="/">
            <button className={styles.backBtn}>홈으로 돌아가기</button>
          </Link>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          <button
            className={`${styles.navItem} ${activeTab === 'dashboard' ? styles.active : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 대시보드
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'users' ? styles.active : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 사용자 관리
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'posts' ? styles.active : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            📝 게시글 관리
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'reports' ? styles.active : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            🚨 신고 관리
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'settings' ? styles.active : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ 설정
          </button>
        </nav>

        {/* Content */}
        <div className={styles.content}>
          {activeTab === 'dashboard' && (
            <div className={styles.dashboard}>
              <h2>📊 대시보드</h2>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <h3>전체 사용자</h3>
                  <p className={styles.statValue}>{stats?.totalUsers || 0}</p>
                </div>
                <div className={styles.statCard}>
                  <h3>전체 게시글</h3>
                  <p className={styles.statValue}>{stats?.totalPosts || 0}</p>
                </div>
                <div className={styles.statCard}>
                  <h3>전체 댓글</h3>
                  <p className={styles.statValue}>{stats?.totalComments || 0}</p>
                </div>
                <div className={styles.statCard}>
                  <h3>오늘 가입</h3>
                  <p className={styles.statValue}>{stats?.newUsersToday || 0}</p>
                </div>
                <div className={styles.statCard}>
                  <h3>대기 중인 신고</h3>
                  <p className={styles.statValue}>{stats?.pendingReports || 0}</p>
                </div>
                <div className={styles.statCard}>
                  <h3>승인 대기 게시글</h3>
                  <p className={styles.statValue}>{stats?.pendingPosts || 0}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className={styles.section}>
              <h2>👥 사용자 관리</h2>
              <p style={{ color: '#9ca3af', padding: '20px', textAlign: 'center' }}>
                사용자 관리 기능이 준비 중입니다.
              </p>
            </div>
          )}

          {activeTab === 'posts' && (
            <div className={styles.section}>
              <h2>📝 게시글 관리</h2>
              <p style={{ color: '#9ca3af', padding: '20px', textAlign: 'center' }}>
                게시글 승인/거부 기능이 준비 중입니다.
              </p>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className={styles.section}>
              <h2>🚨 신고 관리</h2>
              <p style={{ color: '#9ca3af', padding: '20px', textAlign: 'center' }}>
                신고 처리 기능이 준비 중입니다.
              </p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className={styles.section}>
              <h2>⚙️ 설정</h2>
              <p style={{ color: '#9ca3af', padding: '20px', textAlign: 'center' }}>
                시스템 설정 기능이 준비 중입니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
