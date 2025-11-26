/**
 * [설명] 실시간 성능 대시보드 페이지
 * [일시] 2025-11-26 (KST)
 * [목적] 성능 메트릭 시각화 및 자동 최적화 제어
 */

import { useState, useEffect } from 'react'
import Head from 'next/head'
import styles from '../../styles/PerformanceDashboard.module.css'

export default function PerformanceDashboard() {
  const [report, setReport] = useState(null)
  const [optimizations, setOptimizations] = useState(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [message, setMessage] = useState('')

  // 성능 리포트 가져오기
  const fetchReport = async () => {
    try {
      const res = await fetch('/api/monitoring/performance-report')
      const data = await res.json()
      setReport(data)
    } catch (error) {
      console.error('Failed to fetch performance report:', error)
    }
  }

  // 최적화 제안 가져오기
  const fetchOptimizations = async () => {
    try {
      const res = await fetch('/api/optimization/auto?action=analyze')
      const data = await res.json()
      setOptimizations(data)
    } catch (error) {
      console.error('Failed to fetch optimizations:', error)
    }
  }

  // 초기 데이터 로딩
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchReport(), fetchOptimizations()])
      setLoading(false)
    }
    loadData()
  }, [])

  // 자동 새로고침
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchReport()
      fetchOptimizations()
    }, 30000) // 30초마다 갱신

    return () => clearInterval(interval)
  }, [autoRefresh])

  // 자동 최적화 적용
  const handleApplyAutoOptimizations = async () => {
    const password = prompt('관리자 비밀번호를 입력하세요:')
    if (!password) return

    try {
      const res = await fetch('/api/optimization/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply_auto', password }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage('✅ ' + data.message + ' (적용: ' + data.appliedCount + ', 실패: ' + data.failedCount + ')')
        setTimeout(() => {
          fetchReport()
          fetchOptimizations()
        }, 2000)
      } else {
        setMessage('❌ ' + data.error)
      }
    } catch (error) {
      setMessage('❌ 최적화 적용 중 오류가 발생했습니다.')
    }

    setTimeout(() => setMessage(''), 5000)
  }

  // 메트릭 초기화
  const handleResetMetrics = async () => {
    if (!confirm('모든 성능 메트릭을 초기화하시겠습니까?')) return

    const password = prompt('관리자 비밀번호를 입력하세요:')
    if (!password) return

    try {
      const res = await fetch('/api/monitoring/performance-report', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage('✅ ' + data.message)
        setTimeout(() => fetchReport(), 1000)
      } else {
        setMessage('❌ ' + data.error)
      }
    } catch (error) {
      setMessage('❌ 초기화 중 오류가 발생했습니다.')
    }

    setTimeout(() => setMessage(''), 5000)
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <Head>
          <title>성능 대시보드 - Kulture</title>
        </Head>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>데이터 로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>성능 대시보드 - Kulture</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <header className={styles.header}>
        <h1>🚀 실시간 성능 대시보드</h1>
        <div className={styles.controls}>
          <label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>자동 새로고침 (30초)</span>
          </label>
          <button onClick={() => { fetchReport(); fetchOptimizations(); }} className={styles.btnRefresh}>
            🔄 새로고침
          </button>
          <button onClick={handleApplyAutoOptimizations} className={styles.btnOptimize}>
            ⚡ 자동 최적화
          </button>
          <button onClick={handleResetMetrics} className={styles.btnReset}>
            🗑️ 메트릭 초기화
          </button>
        </div>
      </header>

      {message && (
        <div className={styles.message}>
          {message}
        </div>
      )}

      {/* 성능 요약 */}
      {report && (
        <section className={styles.summary}>
          <div className={styles.card}>
            <h3>⚡ 평균 API 응답 시간</h3>
            <p className={styles.metric}>{report.summary.avgApiResponseTime.toFixed(0)}ms</p>
            <span className={report.summary.avgApiResponseTime < 500 ? styles.statusGood : styles.statusWarning}>
              {report.summary.avgApiResponseTime < 500 ? '양호' : '주의'}
            </span>
          </div>
          <div className={styles.card}>
            <h3>💾 평균 DB 쿼리 시간</h3>
            <p className={styles.metric}>{report.summary.avgDatabaseQueryTime.toFixed(0)}ms</p>
            <span className={report.summary.avgDatabaseQueryTime < 300 ? styles.statusGood : styles.statusWarning}>
              {report.summary.avgDatabaseQueryTime < 300 ? '양호' : '주의'}
            </span>
          </div>
          <div className={styles.card}>
            <h3>📦 캐시 히트율</h3>
            <p className={styles.metric}>{report.summary.cacheHitRate.toFixed(1)}%</p>
            <span className={report.summary.cacheHitRate > 60 ? styles.statusGood : styles.statusWarning}>
              {report.summary.cacheHitRate > 60 ? '양호' : '개선 필요'}
            </span>
          </div>
          <div className={styles.card}>
            <h3>🏥 전체 상태</h3>
            <p className={styles.metric}>{report.summary.status}</p>
            <span className={styles['status' + report.summary.status.charAt(0).toUpperCase() + report.summary.status.slice(1)]}>
              {report.summary.status === 'healthy' ? '✅ 정상' : '⚠️ 점검 필요'}
            </span>
          </div>
        </section>
      )}

      {/* 최적화 제안 */}
      {optimizations && optimizations.totalOptimizations > 0 && (
        <section className={styles.optimizations}>
          <h2>🎯 최적화 제안 ({optimizations.totalOptimizations}개)</h2>
          <div className={styles.stats}>
            <span className={styles.critical}>위험: {optimizations.byPriority.critical}</span>
            <span className={styles.high}>높음: {optimizations.byPriority.high}</span>
            <span className={styles.medium}>중간: {optimizations.byPriority.medium}</span>
            <span className={styles.low}>낮음: {optimizations.byPriority.low}</span>
            <span className={styles.auto}>자동 적용 가능: {optimizations.autoApplicable}</span>
          </div>

          <div className={styles.optimizationList}>
            {optimizations.optimizations.slice(0, 10).map((opt, idx) => (
              <div key={idx} className={styles.optimization}>
                <div className={styles.optimizationHeader}>
                  <span className={styles['priority-' + opt.priority]}>
                    {opt.priority.toUpperCase()}
                  </span>
                  <span className={styles.type}>{opt.type}</span>
                  {opt.autoApplicable && <span className={styles.autoBadge}>자동 적용 가능</span>}
                </div>
                <p className={styles.issue}><strong>문제:</strong> {opt.issue}</p>
                <p className={styles.improvement}><strong>예상 효과:</strong> {opt.estimatedImprovement}</p>
                <details>
                  <summary>해결 방법 보기</summary>
                  <ul className={styles.suggestions}>
                    {opt.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </details>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 최근 알림 */}
      {report && report.alerts && report.alerts.length > 0 && (
        <section className={styles.alerts}>
          <h2>🚨 최근 알림 (최대 10개)</h2>
          <div className={styles.alertList}>
            {report.alerts.slice(0, 10).map((alert, idx) => (
              <div key={idx} className={styles.alert + ' ' + styles['alert-' + alert.severity]}>
                <span className={styles.severity}>{alert.severity.toUpperCase()}</span>
                <span className={styles.alertMessage}>{alert.message}</span>
                <span className={styles.timestamp}>{new Date(alert.timestamp).toLocaleString('ko-KR')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 권장 사항 */}
      {report && report.recommendations && report.recommendations.length > 0 && (
        <section className={styles.recommendations}>
          <h2>💡 권장 사항</h2>
          <ul>
            {report.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
