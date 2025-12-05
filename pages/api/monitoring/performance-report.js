/**
 * [설명] 성능 모니터링 리포트 API
 * [일시] 2025-11-26 (KST)
 * [목적] 실시간 성능 메트릭 및 최적화 제안 제공
 */

import performanceMonitor from '../../../lib/performanceMonitoringEnhanced'
import { withErrorHandler } from '../../../lib/apiErrorHandler'

async function handler(req, res) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    case 'DELETE':
      return handleDelete(req, res)
    default:
      return res.status(405).json({ error: 'Method not allowed' })
  }
}

/**
 * GET: 성능 리포트 조회
 */
async function handleGet(req, res) {
  const { format = 'json' } = req.query

  const report = performanceMonitor.generateReport()

  // 요약 통계 추가
  const summary = {
    totalApis: report.metrics.apis?.length || 0,
    totalQueries: report.metrics.database?.length || 0,
    totalCacheKeys: report.metrics.cache?.length || 0,
    totalAlerts: report.alerts.length,
    criticalAlerts: report.alerts.filter(a => a.severity === 'critical').length,
    warningAlerts: report.alerts.filter(a => a.severity === 'warning').length,
    totalRecommendations: report.recommendations.length,
  }

  // 평균 성능 지표
  const avgApiResponseTime =
    report.metrics.apis?.reduce((sum, api) => sum + api.avgDuration, 0) /
      (report.metrics.apis?.length || 1) || 0

  const avgQueryTime =
    report.metrics.database?.reduce((sum, q) => sum + q.avgDuration, 0) /
      (report.metrics.database?.length || 1) || 0

  const avgCacheHitRate = report.metrics.cache && report.metrics.cache.length > 0
    ? report.metrics.cache.reduce((sum, c) => sum + c.hitRate, 0) / report.metrics.cache.length
    : 0

  summary.avgApiResponseTime = Math.round(avgApiResponseTime)
  summary.avgQueryTime = Math.round(avgQueryTime)
  summary.avgCacheHitRate = Math.round(avgCacheHitRate)

  // 상태 결정
  let status = 'healthy'
  if (summary.criticalAlerts > 0) {
    status = 'critical'
  } else if (summary.warningAlerts > 5) {
    status = 'warning'
  } else if (summary.avgApiResponseTime > 1000) {
    status = 'degraded'
  }

  summary.status = status

  const fullReport = {
    ...report,
    summary,
  }

  // HTML 형식으로 응답
  if (format === 'html') {
    return res.status(200).send(generateHtmlReport(fullReport))
  }

  // JSON 형식으로 응답
  return res.status(200).json(fullReport)
}

/**
 * DELETE: 메트릭 초기화
 */
async function handleDelete(req, res) {
  // 관리자 권한 체크 (간단한 비밀번호 인증)
  const { password } = req.body
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'kulture2025'

  if (password !== adminPassword) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  performanceMonitor.reset()

  return res.status(200).json({
    message: 'Performance metrics reset successfully',
    timestamp: new Date().toISOString(),
  })
}

/**
 * HTML 리포트 생성
 */
function generateHtmlReport(report) {
  const { summary, metrics, alerts, recommendations } = report

  const statusColor = {
    healthy: '#10b981',
    degraded: '#f59e0b',
    warning: '#f59e0b',
    critical: '#ef4444',
  }

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Performance Report - Kulture</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3f4f6; padding: 2rem; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { background: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .status { display: inline-block; padding: 0.5rem 1rem; border-radius: 6px; color: white; font-weight: 600; background: ${statusColor[summary.status]}; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .card h3 { font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem; text-transform: uppercase; }
    .card .value { font-size: 2rem; font-weight: 700; color: #111827; }
    .card .unit { font-size: 1rem; color: #6b7280; }
    .section { background: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .section h2 { font-size: 1.5rem; margin-bottom: 1.5rem; color: #111827; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 0.75rem; background: #f9fafb; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; }
    td { padding: 0.75rem; border-bottom: 1px solid #e5e7eb; }
    .recommendation { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 1rem; margin-bottom: 1rem; border-radius: 6px; }
    .recommendation h4 { color: #92400e; margin-bottom: 0.5rem; }
    .recommendation p { color: #78350f; margin-bottom: 0.5rem; }
    .recommendation .suggestion { color: #92400e; font-style: italic; }
    .alert { padding: 1rem; margin-bottom: 0.5rem; border-radius: 6px; border-left: 4px solid; }
    .alert.critical { background: #fee2e2; border-color: #ef4444; }
    .alert.warning { background: #fef3c7; border-color: #f59e0b; }
    .alert.info { background: #dbeafe; border-color: #3b82f6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚡ Performance Report</h1>
      <p style="color: #6b7280; margin-bottom: 1rem;">Generated: ${report.timestamp}</p>
      <span class="status">${summary.status.toUpperCase()}</span>
    </div>

    <div class="grid">
      <div class="card">
        <h3>Avg API Response</h3>
        <div class="value">${summary.avgApiResponseTime}<span class="unit">ms</span></div>
      </div>
      <div class="card">
        <h3>Avg Query Time</h3>
        <div class="value">${summary.avgQueryTime}<span class="unit">ms</span></div>
      </div>
      <div class="card">
        <h3>Cache Hit Rate</h3>
        <div class="value">${summary.avgCacheHitRate}<span class="unit">%</span></div>
      </div>
      <div class="card">
        <h3>Total Alerts</h3>
        <div class="value">${summary.totalAlerts}</div>
      </div>
    </div>

    ${recommendations.length > 0 ? `
    <div class="section">
      <h2>🎯 Optimization Recommendations</h2>
      ${recommendations.map(rec => `
        <div class="recommendation">
          <h4>${rec.type.replace(/_/g, ' ').toUpperCase()}</h4>
          <p>${rec.message}</p>
          <p class="suggestion">💡 ${rec.suggestion}</p>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${alerts.length > 0 ? `
    <div class="section">
      <h2>🚨 Recent Alerts</h2>
      ${alerts.slice(-10).reverse().map(alert => `
        <div class="alert ${alert.severity}">
          <strong>${alert.type.replace(/_/g, ' ').toUpperCase()}</strong>
          <p>${JSON.stringify(alert.data)}</p>
          <small>${new Date(alert.timestamp).toLocaleString('ko-KR')}</small>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${metrics.apis && metrics.apis.length > 0 ? `
    <div class="section">
      <h2>📡 API Performance</h2>
      <table>
        <thead>
          <tr>
            <th>Endpoint</th>
            <th>Requests</th>
            <th>Avg Time</th>
            <th>Error Rate</th>
            <th>Slow Requests</th>
          </tr>
        </thead>
        <tbody>
          ${metrics.apis.map(api => `
            <tr>
              <td>${api.endpoint}</td>
              <td>${api.count}</td>
              <td>${Math.round(api.avgDuration)}ms</td>
              <td>${api.errorRate.toFixed(2)}%</td>
              <td>${api.slowRequests}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}
  </div>
</body>
</html>
  `
}

export default withErrorHandler(handler)
