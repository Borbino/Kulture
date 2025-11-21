import { useState, useEffect } from 'react'
import styles from './monitoring.module.css'

export default function MonitoringPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  useEffect(() => {
    fetchStats()
    // 30초마다 자동 갱신
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchStats() {
    try {
      setLoading(true)
      const response = await fetch('/api/monitoring/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data)
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !stats) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>로딩 중...</div>
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>에러: {error}</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>시스템 모니터링</h1>
        <div className={styles.headerActions}>
          <span className={styles.lastUpdate}>
            마지막 업데이트: {lastUpdate?.toLocaleTimeString('ko-KR')}
          </span>
          <button onClick={fetchStats} className={styles.refreshButton}>
            새로고침
          </button>
        </div>
      </header>

      <div className={styles.grid}>
        {/* API 성능 */}
        <section className={styles.card}>
          <h2>API 성능</h2>
          <div className={styles.metrics}>
            {stats?.performance?.apis?.map(api => (
              <div key={api.api} className={styles.metric}>
                <div className={styles.metricHeader}>
                  <span className={styles.metricName}>{api.api}</span>
                  <span
                    className={`${styles.badge} ${
                      api.latency?.p95 > 5000
                        ? styles.badgeCritical
                        : api.latency?.p95 > 3000
                          ? styles.badgeWarning
                          : styles.badgeSuccess
                    }`}
                  >
                    {api.latency?.p95 ? `${api.latency.p95}ms` : 'N/A'}
                  </span>
                </div>
                <div className={styles.metricDetails}>
                  <span>호출: {api.calls?.total || 0}</span>
                  <span>
                    에러율:{' '}
                    {api.calls?.total
                      ? ((api.calls.failed / api.calls.total) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* API Quota */}
        <section className={styles.card}>
          <h2>API Quota 사용량</h2>
          <div className={styles.metrics}>
            {stats?.quota &&
              Object.entries(stats.quota).map(([service, data]) => (
                <div key={service} className={styles.metric}>
                  <div className={styles.metricHeader}>
                    <span className={styles.metricName}>{service}</span>
                    <span
                      className={`${styles.badge} ${
                        data.percent >= 90
                          ? styles.badgeCritical
                          : data.percent >= 70
                            ? styles.badgeWarning
                            : styles.badgeSuccess
                      }`}
                    >
                      {data.percent}%
                    </span>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${data.percent}%` }}
                    />
                  </div>
                  <div className={styles.metricDetails}>
                    <span>
                      {data.used.toLocaleString()} / {data.limit.toLocaleString()}
                    </span>
                    <span>남은 Quota: {data.remaining.toLocaleString()}</span>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* 에러 로그 */}
        <section className={styles.card}>
          <h2>에러 로그</h2>
          <div className={styles.metrics}>
            <div className={styles.metric}>
              <div className={styles.metricHeader}>
                <span className={styles.metricName}>총 에러</span>
                <span
                  className={`${styles.badge} ${
                    stats?.logs?.totalErrors > 10
                      ? styles.badgeCritical
                      : stats?.logs?.totalErrors > 5
                        ? styles.badgeWarning
                        : styles.badgeSuccess
                  }`}
                >
                  {stats?.logs?.totalErrors || 0}
                </span>
              </div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricHeader}>
                <span className={styles.metricName}>경고</span>
                <span className={styles.badge}>{stats?.logs?.totalWarnings || 0}</span>
              </div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricHeader}>
                <span className={styles.metricName}>영향받은 모듈</span>
                <span className={styles.badge}>{stats?.logs?.uniqueModules || 0}</span>
              </div>
            </div>
          </div>

          {stats?.logs?.recentErrors?.length > 0 && (
            <div className={styles.errorList}>
              <h3>최근 에러</h3>
              {stats.logs.recentErrors.slice(0, 5).map((err, idx) => (
                <div key={idx} className={styles.errorItem}>
                  <div className={styles.errorHeader}>
                    <span className={styles.errorModule}>{err.module}</span>
                    <span className={styles.errorTime}>
                      {new Date(err.timestamp).toLocaleTimeString('ko-KR')}
                    </span>
                  </div>
                  <div className={styles.errorMessage}>{err.message}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 시스템 리소스 */}
        <section className={styles.card}>
          <h2>시스템 리소스</h2>
          <div className={styles.metrics}>
            <div className={styles.metric}>
              <div className={styles.metricHeader}>
                <span className={styles.metricName}>메모리 사용률</span>
                <span
                  className={`${styles.badge} ${
                    stats?.system?.memory?.usagePercent > 80
                      ? styles.badgeCritical
                      : stats?.system?.memory?.usagePercent > 60
                        ? styles.badgeWarning
                        : styles.badgeSuccess
                  }`}
                >
                  {stats?.system?.memory?.usagePercent || 0}%
                </span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${stats?.system?.memory?.usagePercent || 0}%` }}
                />
              </div>
            </div>

            <div className={styles.metric}>
              <div className={styles.metricHeader}>
                <span className={styles.metricName}>CPU 사용률</span>
                <span
                  className={`${styles.badge} ${
                    stats?.system?.cpu?.usagePercent > 70
                      ? styles.badgeCritical
                      : stats?.system?.cpu?.usagePercent > 50
                        ? styles.badgeWarning
                        : styles.badgeSuccess
                  }`}
                >
                  {stats?.system?.cpu?.usagePercent || 0}%
                </span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${stats?.system?.cpu?.usagePercent || 0}%` }}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
