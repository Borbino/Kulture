import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import Toast from '../../components/Toast';
import styles from '../../styles/Admin.module.css';

function ModerationSection() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [selectedReport, setSelectedReport] = useState(null)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    fetchReports()
  }, [filter])

  const fetchReports = async () => {
    try {
      const res = await fetch(`/api/moderation/report?status=${filter}`)
      const data = await res.json()
      setReports(data.reports || [])
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (reportId, action) => {
    try {
      const res = await fetch('/api/moderation/report', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          status: 'resolved',
          resolution: `${action} completed`,
          action,
        }),
      })

      if (res.ok) {
        setToastMessage('✅ 신고 처리 완료')
        setTimeout(() => setToastMessage(''), 2000)
        fetchReports()
        setSelectedReport(null)
      }
    } catch (error) {
      console.error('Failed to resolve report:', error)
      setToastMessage('❌ 처리 실패')
    }
  }

  return (
    <div className={styles.section}>
      <h2>🚨 신고 관리</h2>

      <div className={styles.filterButtons}>
        <button
          className={`${styles.filterBtn} ${filter === 'pending' ? styles.active : ''}`}
          onClick={() => setFilter('pending')}
        >
          대기 중 ({reports.filter((r) => r.status === 'pending').length})
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'resolved' ? styles.active : ''}`}
          onClick={() => setFilter('resolved')}
        >
          완료
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'dismissed' ? styles.active : ''}`}
          onClick={() => setFilter('dismissed')}
        >
          기각
        </button>
      </div>

      {loading ? (
        <p>로딩 중...</p>
      ) : reports.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>신고가 없습니다.</p>
      ) : (
        <div className={styles.reportsList}>
          {reports.map((report) => (
            <div key={report._id} className={styles.reportCard}>
              <div className={styles.reportHeader}>
                <h4>
                  {report.type === 'post' && '📝 게시글 신고'}
                  {report.type === 'comment' && '💬 댓글 신고'}
                  {report.type === 'user' && '👤 사용자 신고'}
                </h4>
                <span className={`${styles.statusBadge} ${styles[report.status]}`}>
                  {report.status === 'pending' && '대기'}
                  {report.status === 'resolved' && '완료'}
                  {report.status === 'dismissed' && '기각'}
                </span>
              </div>

              <div className={styles.reportContent}>
                <p>
                  <strong>신고 사유:</strong> {report.reason}
                </p>
                {report.targetPost && (
                  <p>
                    <strong>대상 게시글:</strong> {report.targetPost.title}
                  </p>
                )}
                {report.targetComment && (
                  <p>
                    <strong>대상 댓글:</strong> {report.targetComment.content}
                  </p>
                )}
                {report.targetUser && (
                  <p>
                    <strong>대상 사용자:</strong> {report.targetUser.name} ({report.targetUser.email})
                  </p>
                )}
                <p>
                  <small>신고자: {report.reporter?.name}</small>
                </p>
              </div>

              {report.status === 'pending' && (
                <div className={styles.reportActions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleResolve(report._id, 'removePost')}
                  >
                    ✂️ 콘텐츠 삭제
                  </button>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleResolve(report._id, 'banUser')}
                  >
                    🚫 사용자 차단
                  </button>
                  <button
                    className={styles.dismissBtn}
                    onClick={() => handleResolve(report._id, 'dismiss')}
                  >
                    ✓ 기각
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {toastMessage && <Toast message={toastMessage} />}
    </div>
  )
}

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
            <ModerationSection />
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
