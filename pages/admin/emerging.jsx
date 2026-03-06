/**
 * [설명] 이머징 트렌드 관리자 대시보드
 * [목적] Zero-Prior-Knowledge 방식으로 발굴된 신규 엔티티 리뷰 + VIP 승격 처리
 * /admin/emerging
 */

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import styles from '../../styles/Admin.module.css'

const STATUS_LABELS = {
  detected: { label: '탐지됨', color: '#2196F3', emoji: '🔍' },
  tracking: { label: '추적 중', color: '#FF9800', emoji: '👀' },
  promoted_to_vip: { label: 'VIP 승격', color: '#4CAF50', emoji: '⭐' },
  dismissed: { label: '무시됨', color: '#9E9E9E', emoji: '❌' },
}

const ALERT_LABELS = {
  info: { color: '#2196F3', emoji: 'ℹ️' },
  warning: { color: '#FF9800', emoji: '⚠️' },
  critical: { color: '#F44336', emoji: '🚨' },
}

export default function EmergingDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [trends, setTrends] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('trends') // trends | alerts
  const [filter, setFilter] = useState('all') // all | detected | tracking | ...
  const [selectedTrend, setSelectedTrend] = useState(null)
  const [toast, setToast] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // 관리자 인증 확인
  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user?.role !== 'admin') {
      router.replace('/admin')
    }
  }, [session, status, router])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [trendsRes, alertsRes] = await Promise.all([
        fetch(`/api/admin/emerging-trends?status=${filter === 'all' ? '' : filter}`),
        fetch('/api/admin/emerging-trends?type=alerts'),
      ])
      const trendsData = await trendsRes.json()
      const alertsData = await alertsRes.json()
      setTrends(trendsData.trends || [])
      setAlerts(alertsData.alerts || [])
    } catch (err) {
      showToast('❌ 데이터 로드 실패')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleAction(trendId, action, adminNote = '') {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/emerging-trends', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trendId, action, adminNote }),
      })
      const data = await res.json()
      if (data.success) {
        showToast(action === 'promote' ? '⭐ VIP 승격 완료!' : action === 'dismiss' ? '❌ 무시 처리됨' : '✅ 처리 완료')
        setSelectedTrend(null)
        fetchData()
      } else {
        showToast(`❌ 오류: ${data.message}`)
      }
    } catch {
      showToast('❌ 액션 처리 실패')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleAlertResolve(alertId) {
    try {
      const res = await fetch('/api/admin/emerging-trends', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, action: 'resolve_alert', resolvedBy: session?.user?.email }),
      })
      const data = await res.json()
      if (data.success) {
        showToast('✅ 알림 해결됨')
        fetchData()
      }
    } catch {
      showToast('❌ 처리 실패')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>로딩 중...</p>
      </div>
    )
  }

  const filteredTrends = filter === 'all' ? trends : trends.filter(t => t.status === filter)
  const unresolvedAlerts = alerts.filter(a => !a.resolved)

  return (
    <>
      <Head>
        <title>이머징 트렌드 관리 — Kulture Admin</title>
      </Head>

      <div className={styles.adminLayout}>
        {/* 사이드바 */}
        <aside className={styles.sidebar}>
          <h2 className={styles.sidebarTitle}>🎵 Kulture</h2>
          <nav>
            <Link href="/admin" className={styles.navLink}>📊 대시보드</Link>
            <Link href="/admin/monitoring" className={styles.navLink}>📡 모니터링</Link>
            <Link href="/admin/emerging" className={`${styles.navLink} ${styles.navLinkActive}`}>🔍 이머징 트렌드</Link>
            <Link href="/admin/settings" className={styles.navLink}>⚙️ 설정</Link>
          </nav>
        </aside>

        <main className={styles.mainContent}>
          <div style={{ padding: '24px' }}>
            {/* 헤더 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>🔍 이머징 트렌드</h1>
                <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>
                  관리자 미지정 엔티티 자동 발굴 결과 — Zero-Prior-Knowledge Detection
                </p>
              </div>
              <button
                onClick={fetchData}
                style={{ padding: '8px 16px', background: '#e91e8c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                🔄 새로고침
              </button>
            </div>

            {/* 통계 카드 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: '전체 엔티티', value: trends.length, color: '#e91e8c' },
                { label: '추적 중', value: trends.filter(t => t.status === 'tracking').length, color: '#FF9800' },
                { label: 'VIP 승격', value: trends.filter(t => t.status === 'promoted_to_vip').length, color: '#4CAF50' },
                { label: '미해결 알림', value: unresolvedAlerts.length, color: '#F44336' },
              ].map(card => (
                <div key={card.label} style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', borderLeft: `4px solid ${card.color}` }}>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: card.color }}>{card.value}</div>
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{card.label}</div>
                </div>
              ))}
            </div>

            {/* 탭 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '2px solid #eee' }}>
              {[
                { id: 'trends', label: `🔍 엔티티 목록 (${trends.length})` },
                { id: 'alerts', label: `🚨 알림 (${unresolvedAlerts.length} 미해결)` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '10px 20px',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? '2px solid #e91e8c' : '2px solid transparent',
                    color: activeTab === tab.id ? '#e91e8c' : '#666',
                    fontWeight: activeTab === tab.id ? 700 : 400,
                    cursor: 'pointer',
                    fontSize: '14px',
                    marginBottom: '-2px',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 엔티티 탭 */}
            {activeTab === 'trends' && (
              <>
                {/* 필터 */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {['all', 'detected', 'tracking', 'promoted_to_vip', 'dismissed'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: `1px solid ${filter === f ? '#e91e8c' : '#ddd'}`,
                        background: filter === f ? '#e91e8c' : 'white',
                        color: filter === f ? 'white' : '#333',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      {f === 'all' ? '전체' : (STATUS_LABELS[f]?.emoji + ' ' + STATUS_LABELS[f]?.label)}
                    </button>
                  ))}
                </div>

                {/* 엔티티 테이블 */}
                <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f5f5f5' }}>
                        {['엔티티', '타입', 'Velocity', '언급 수', '소스 다양성', '최초 탐지', '상태', '액션'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#555' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTrends.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                            탐지된 이머징 트렌드가 없습니다.
                          </td>
                        </tr>
                      ) : filteredTrends.map(trend => {
                        const statusInfo = STATUS_LABELS[trend.status] || STATUS_LABELS.detected
                        return (
                          <tr key={trend._id} style={{ borderTop: '1px solid #eee' }}>
                            <td style={{ padding: '12px 16px' }}>
                              <button
                                onClick={() => setSelectedTrend(trend)}
                                style={{ background: 'none', border: 'none', color: '#e91e8c', fontWeight: 700, fontSize: '15px', cursor: 'pointer', padding: 0 }}
                              >
                                {trend.entity}
                              </button>
                              {trend.isKpopRelated && <span style={{ marginLeft: '6px', fontSize: '11px', background: '#e91e8c22', color: '#e91e8c', padding: '2px 6px', borderRadius: '10px' }}>K-Pop</span>}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>{trend.entityType || '미분류'}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{
                                fontWeight: 700,
                                color: trend.velocityScore >= 100 ? '#F44336' : trend.velocityScore >= 50 ? '#FF9800' : '#2196F3',
                                fontSize: '16px',
                              }}>
                                {Math.round(trend.velocityScore || 0)}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>{trend.mentionCount || 0}</td>
                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>{trend.sourceDiversity || 0}개</td>
                            <td style={{ padding: '12px 16px', fontSize: '12px', color: '#888' }}>
                              {trend.firstDetected ? new Date(trend.firstDetected).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ background: `${statusInfo.color}22`, color: statusInfo.color, padding: '3px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 600 }}>
                                {statusInfo.emoji} {statusInfo.label}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {trend.status !== 'promoted_to_vip' && trend.status !== 'dismissed' && (
                                  <>
                                    <button
                                      onClick={() => handleAction(trend._id, 'promote')}
                                      disabled={actionLoading}
                                      title="VIP 승격"
                                      style={{ background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}
                                    >
                                      ⭐ VIP
                                    </button>
                                    <button
                                      onClick={() => handleAction(trend._id, 'dismiss')}
                                      disabled={actionLoading}
                                      title="무시"
                                      style={{ background: '#9E9E9E', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}
                                    >
                                      ❌
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* 알림 탭 */}
            {activeTab === 'alerts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {alerts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#999', background: 'white', borderRadius: '8px' }}>
                    미해결 알림이 없습니다. ✅
                  </div>
                ) : alerts.map(alert => {
                  const levelInfo = ALERT_LABELS[alert.alertLevel] || ALERT_LABELS.info
                  return (
                    <div key={alert._id} style={{
                      background: 'white',
                      borderRadius: '8px',
                      padding: '16px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                      borderLeft: `4px solid ${levelInfo.color}`,
                      opacity: alert.resolved ? 0.5 : 1,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontSize: '16px', fontWeight: 700 }}>
                            {levelInfo.emoji} {alert.entity}
                          </span>
                          <span style={{ marginLeft: '12px', color: '#888', fontSize: '12px' }}>
                            Velocity: {Math.round(alert.velocityScore || 0)}
                          </span>
                        </div>
                        {!alert.resolved && (
                          <button
                            onClick={() => handleAlertResolve(alert._id)}
                            style={{ background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px' }}
                          >
                            ✅ 해결
                          </button>
                        )}
                      </div>
                      {alert.message && (
                        <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#555' }}>{alert.message}</p>
                      )}
                      <div style={{ margin: '8px 0 0', fontSize: '12px', color: '#999' }}>
                        탐지: {alert.detectedAt ? new Date(alert.detectedAt).toLocaleString('ko-KR') : '-'}
                        {alert.resolved && alert.resolvedAt && ` • 해결: ${new Date(alert.resolvedAt).toLocaleString('ko-KR')}`}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 상세 모달 */}
            {selectedTrend && (
              <div
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => setSelectedTrend(null)}
              >
                <div
                  style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '520px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}
                  onClick={e => e.stopPropagation()}
                >
                  <h2 style={{ marginTop: 0, fontSize: '20px' }}>🔍 {selectedTrend.entity}</h2>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                    {[
                      ['상태', STATUS_LABELS[selectedTrend.status]?.label || selectedTrend.status],
                      ['타입', selectedTrend.entityType || '미분류'],
                      ['Velocity Score', Math.round(selectedTrend.velocityScore || 0)],
                      ['언급 횟수', selectedTrend.mentionCount || 0],
                      ['소스 다양성', `${selectedTrend.sourceDiversity || 0}개`],
                      ['K-Pop 관련', selectedTrend.isKpopRelated ? '✅ 예' : '❌ 아니오'],
                      ['최초 탐지', selectedTrend.firstDetected ? new Date(selectedTrend.firstDetected).toLocaleString('ko-KR') : '-'],
                      ['마지막 확인', selectedTrend.lastSeen ? new Date(selectedTrend.lastSeen).toLocaleString('ko-KR') : '-'],
                    ].map(([key, val]) => (
                      <tr key={key} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '8px 0', fontWeight: 600, color: '#555', width: '130px', fontSize: '13px' }}>{key}</td>
                        <td style={{ padding: '8px 0', fontSize: '14px' }}>{val}</td>
                      </tr>
                    ))}
                  </table>
                  {selectedTrend.sources?.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <strong style={{ fontSize: '13px' }}>탐지 소스:</strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                        {selectedTrend.sources.map(s => <span key={s} style={{ background: '#f0f0f0', padding: '3px 8px', borderRadius: '10px', fontSize: '12px' }}>{s}</span>)}
                      </div>
                    </div>
                  )}
                  {selectedTrend.sampleContent?.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <strong style={{ fontSize: '13px' }}>샘플 텍스트:</strong>
                      {selectedTrend.sampleContent.map((s, i) => (
                        <blockquote key={i} style={{ margin: '6px 0', padding: '8px 12px', background: '#f9f9f9', borderLeft: '3px solid #e91e8c', fontSize: '13px', color: '#555' }}>
                          {s}
                        </blockquote>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    {selectedTrend.status !== 'promoted_to_vip' && (
                      <button
                        onClick={() => handleAction(selectedTrend._id, 'promote')}
                        disabled={actionLoading}
                        style={{ background: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        ⭐ VIP 등록
                      </button>
                    )}
                    {selectedTrend.status !== 'dismissed' && (
                      <button
                        onClick={() => handleAction(selectedTrend._id, 'dismiss')}
                        disabled={actionLoading}
                        style={{ background: '#9E9E9E', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 20px', cursor: 'pointer' }}
                      >
                        ❌ 무시
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedTrend(null)}
                      style={{ border: '1px solid #ddd', background: 'white', borderRadius: '6px', padding: '10px 20px', cursor: 'pointer' }}
                    >
                      닫기
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 토스트 알림 */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px', background: '#333', color: 'white',
          padding: '12px 20px', borderRadius: '6px', fontSize: '14px', zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {toast}
        </div>
      )}
    </>
  )
}
