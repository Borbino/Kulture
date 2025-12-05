import { useEffect, useState } from 'react'
import { useSiteSettings } from '../lib/settings.js'
import styles from '../styles/TrendSpotlight.module.css'

export default function TrendSpotlight() {
  const { settings } = useSiteSettings()
  const [trends, setTrends] = useState([])
  const [snapshotTime, setSnapshotTime] = useState(null)
  const [hotIssues, setHotIssues] = useState([])
  const [vip, setVip] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 관리자 설정에서 disabled됐으면 표시하지 않음
  if (settings?.trends?.enabled === false || settings?.trends?.trendWidgetEnabled === false) {
    return null
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const [trendRes, vipRes] = await Promise.all([
          fetch('/api/trends'),
          fetch('/api/vip/top'),
        ])

        const trendData = await trendRes.json()
        const vipData = await vipRes.json()

        if (trendData?.success && trendData?.data) {
          setTrends(trendData.data.snapshot?.trends || [])
          setSnapshotTime(trendData.data.snapshot?.timestamp || null)
          setHotIssues(trendData.data.hotIssues || [])
        }

        if (vipData?.success && vipData?.data) {
          setVip(vipData.data.vip || [])
        }
      } catch (err) {
        setError('트렌드 데이터를 불러오지 못했습니다')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2>🌐 실시간 트렌드 & VIP 알림</h2>
          <p>글로벌 K-Culture 키워드와 VIP 급상승 현황을 한 눈에 확인하세요.</p>
        </div>
        {snapshotTime && (
          <span className={styles.timestamp}>
            업데이트: {new Date(snapshotTime).toLocaleString('ko-KR')}
          </span>
        )}
      </div>

      {loading && <div className={styles.loading}>불러오는 중...</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && (
        <div className={styles.grid}>
          {/* Trend list */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>📈 실시간 트렌드</h3>
              <span className={styles.badge}>{trends.length}개</span>
            </div>
            <ul className={styles.list}>
              {trends.slice(0, 10).map((trend, idx) => (
                <li key={`${trend.keyword}-${idx}`} className={styles.listItem}>
                  <div className={styles.rank}>{idx + 1}</div>
                  <div className={styles.itemBody}>
                    <div className={styles.keyword}>{trend.keyword}</div>
                    <div className={styles.meta}>
                      <span className={styles.mentions}>{(trend.mentions || 0).toLocaleString()} mentions</span>
                      {trend.sources && trend.sources.length > 0 && (
                        <span className={styles.sources}>{trend.sources.length} sources</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
              {trends.length === 0 && <div className={styles.empty}>트렌드 데이터가 없습니다.</div>}
            </ul>
          </div>

          {/* Hot issues */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>🔥 급상승 이슈</h3>
              <span className={styles.badge}>{hotIssues.length}개</span>
            </div>
            <ul className={styles.list}>
              {hotIssues.map((issue, idx) => (
                <li key={`${issue.keyword}-${idx}`} className={styles.listItem}>
                  <div className={styles.rank}>{idx + 1}</div>
                  <div className={styles.itemBody}>
                    <div className={styles.keyword}>{issue.keyword}</div>
                    <div className={styles.meta}>
                      <span className={styles.mentions}>{(issue.mentions || 0).toLocaleString()} mentions</span>
                      <span className={`${styles.priority} ${styles[issue.priority || 'medium']}`}>
                        {issue.priority || 'medium'}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
              {hotIssues.length === 0 && <div className={styles.empty}>핫이슈 데이터가 없습니다.</div>}
            </ul>
          </div>

          {/* VIP monitoring */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>⭐ VIP 알림</h3>
              <span className={styles.badge}>{vip.length}명</span>
            </div>
            <ul className={styles.list}>
              {vip.slice(0, 10).map((item, idx) => (
                <li key={`${item.vipId}-${idx}`} className={styles.listItem}>
                  <div className={styles.rank}>{idx + 1}</div>
                  <div className={styles.itemBody}>
                    <div className={styles.keyword}>{item.vipName}</div>
                    <div className={styles.meta}>
                      <span className={styles.mentions}>{(item.mentions || 0).toLocaleString()} mentions</span>
                      <span className={`${styles.priority} ${styles[item.alertLevel || 'normal']}`}>
                        {item.alertLevel || 'normal'}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
              {vip.length === 0 && <div className={styles.empty}>VIP 모니터링 데이터가 없습니다.</div>}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
