/**
 * Performance Analyzer
 * 성능 보고서 자동 분석 및 이슈 감지
 */

// 성능 임계값
const THRESHOLDS = {
  API_P95_MS: 5000, // 5초
  ERROR_RATE_PERCENT: 10, // 10%
  CACHE_HIT_RATE_PERCENT: 50, // 50%
  MEMORY_USAGE_PERCENT: 80, // 80%
  CPU_USAGE_PERCENT: 70, // 70%
}

/**
 * 성능 보고서 분석
 */
export function analyzePerformanceReport(report) {
  const issues = []

  // API 응답 시간 체크
  if (report.apis && Array.isArray(report.apis)) {
    report.apis.forEach(api => {
      if (api.latency?.p95 > THRESHOLDS.API_P95_MS) {
        issues.push({
          severity: 'critical',
          type: 'slow_api',
          api: api.api,
          p95: api.latency.p95,
          message: `${api.api} P95 latency is ${api.latency.p95}ms (>${THRESHOLDS.API_P95_MS}ms)`,
        })
      }
    })
  }

  // 에러율 체크
  if (report.apis && Array.isArray(report.apis)) {
    report.apis.forEach(api => {
      if (api.calls?.total > 0) {
        const errorRate = (api.calls.failed / api.calls.total) * 100
        if (errorRate > THRESHOLDS.ERROR_RATE_PERCENT) {
          issues.push({
            severity: 'high',
            type: 'high_error_rate',
            api: api.api,
            errorRate: errorRate.toFixed(2),
            message: `${api.api} error rate is ${errorRate.toFixed(2)}% (>${THRESHOLDS.ERROR_RATE_PERCENT}%)`,
          })
        }
      }
    })
  }

  // 캐시 히트율 체크
  if (report.caches && Array.isArray(report.caches)) {
    report.caches.forEach(cache => {
      if (cache.hitRate < THRESHOLDS.CACHE_HIT_RATE_PERCENT) {
        issues.push({
          severity: 'medium',
          type: 'low_cache_hit_rate',
          cache: cache.cache,
          hitRate: cache.hitRate,
          message: `${cache.cache} hit rate is ${cache.hitRate}% (<${THRESHOLDS.CACHE_HIT_RATE_PERCENT}%)`,
        })
      }
    })
  }

  // 메모리 사용률 체크
  if (report.system?.memory?.usagePercent > THRESHOLDS.MEMORY_USAGE_PERCENT) {
    issues.push({
      severity: 'high',
      type: 'high_memory_usage',
      usagePercent: report.system.memory.usagePercent,
      message: `Memory usage is ${report.system.memory.usagePercent}% (>${THRESHOLDS.MEMORY_USAGE_PERCENT}%)`,
    })
  }

  // CPU 사용률 체크
  if (report.system?.cpu?.usagePercent > THRESHOLDS.CPU_USAGE_PERCENT) {
    issues.push({
      severity: 'high',
      type: 'high_cpu_usage',
      usagePercent: report.system.cpu.usagePercent,
      message: `CPU usage is ${report.system.cpu.usagePercent}% (>${THRESHOLDS.CPU_USAGE_PERCENT}%)`,
    })
  }

  return {
    totalIssues: issues.length,
    criticalIssues: issues.filter(i => i.severity === 'critical').length,
    highIssues: issues.filter(i => i.severity === 'high').length,
    mediumIssues: issues.filter(i => i.severity === 'medium').length,
    issues,
  }
}

/**
 * 성능 트렌드 분석 (시계열)
 */
export function analyzeTrend(reports) {
  if (!Array.isArray(reports) || reports.length < 2) {
    return { trend: 'insufficient_data' }
  }

  const latencies = reports
    .map(r => r.apis?.[0]?.latency?.p95)
    .filter(l => l !== undefined && l !== null)

  if (latencies.length < 4) {
    return { trend: 'insufficient_data' }
  }

  const recent = latencies.slice(-3).reduce((a, b) => a + b, 0) / 3
  const previousLatencies = latencies.slice(0, -3)
  const previous = previousLatencies.reduce((a, b) => a + b, 0) / previousLatencies.length

  const change = ((recent - previous) / previous) * 100

  if (change > 20) {
    return { trend: 'degrading', change: change.toFixed(2) }
  } else if (change < -20) {
    return { trend: 'improving', change: Math.abs(change).toFixed(2) }
  } else {
    return { trend: 'stable', change: change.toFixed(2) }
  }
}

/**
 * 알림 우선순위 결정
 */
export function getPriority(issues) {
  if (issues.criticalIssues > 0) return 'urgent'
  if (issues.highIssues > 2) return 'high'
  if (issues.highIssues > 0 || issues.mediumIssues > 5) return 'medium'
  return 'low'
}
