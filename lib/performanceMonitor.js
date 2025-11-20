/**
 * [설명] 성능 모니터링 시스템
 * [목적] API 응답시간, 캐시 히트율, 에러율 추적
 * [일시] 2025-11-20 (KST)
 */

/**
 * 성능 메트릭 저장소
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      apiCalls: new Map(), // API별 호출 통계
      cacheHits: new Map(), // 캐시 히트율
      errors: new Map(), // 에러 통계
      responseTimes: new Map(), // 응답 시간 (배열)
    }
    this.startTime = Date.now()
  }

  /**
   * API 호출 추적 시작
   * @param {string} apiName - API 이름 (예: 'reddit', 'twitter', 'hf-api')
   * @returns {Function} 종료 함수
   */
  startApiCall(apiName) {
    const startTime = Date.now()

    return (success = true, error = null) => {
      const duration = Date.now() - startTime

      // API 호출 통계 업데이트
      if (!this.metrics.apiCalls.has(apiName)) {
        this.metrics.apiCalls.set(apiName, {
          total: 0,
          success: 0,
          failed: 0,
          totalDuration: 0,
        })
      }

      const stats = this.metrics.apiCalls.get(apiName)
      stats.total++
      stats.totalDuration += duration

      if (success) {
        stats.success++
      } else {
        stats.failed++
      }

      // 응답 시간 기록 (p50, p95, p99 계산용)
      if (!this.metrics.responseTimes.has(apiName)) {
        this.metrics.responseTimes.set(apiName, [])
      }
      this.metrics.responseTimes.get(apiName).push(duration)

      // 에러 기록
      if (error) {
        this.recordError(apiName, error)
      }
    }
  }

  /**
   * 캐시 히트/미스 기록
   * @param {string} cacheName - 캐시 이름 (예: 'reddit-token', 'twitter-token')
   * @param {boolean} isHit - 캐시 히트 여부
   */
  recordCacheAccess(cacheName, isHit) {
    if (!this.metrics.cacheHits.has(cacheName)) {
      this.metrics.cacheHits.set(cacheName, {
        hits: 0,
        misses: 0,
      })
    }

    const stats = this.metrics.cacheHits.get(cacheName)
    if (isHit) {
      stats.hits++
    } else {
      stats.misses++
    }
  }

  /**
   * 에러 기록
   * @param {string} source - 에러 발생 위치
   * @param {Error|string} error - 에러 객체 또는 메시지
   */
  recordError(source, error) {
    const errorMessage = error?.message || String(error)

    if (!this.metrics.errors.has(source)) {
      this.metrics.errors.set(source, {
        count: 0,
        recentErrors: [],
      })
    }

    const stats = this.metrics.errors.get(source)
    stats.count++
    stats.recentErrors.push({
      message: errorMessage,
      timestamp: new Date().toISOString(),
    })

    // 최근 10개만 유지
    if (stats.recentErrors.length > 10) {
      stats.recentErrors.shift()
    }
  }

  /**
   * 백분위수 계산 (p50, p95, p99)
   * @param {Array<number>} values - 값 배열
   * @param {number} percentile - 백분위수 (0-100)
   * @returns {number} 백분위수 값
   */
  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0

    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }

  /**
   * API별 통계 요약
   * @param {string} apiName - API 이름
   * @returns {Object} 통계 객체
   */
  getApiStats(apiName) {
    const callStats = this.metrics.apiCalls.get(apiName)
    const responseTimes = this.metrics.responseTimes.get(apiName) || []

    if (!callStats) {
      return null
    }

    const avgResponseTime = callStats.total > 0 ? callStats.totalDuration / callStats.total : 0
    const errorRate = callStats.total > 0 ? (callStats.failed / callStats.total) * 100 : 0

    return {
      api: apiName,
      calls: {
        total: callStats.total,
        success: callStats.success,
        failed: callStats.failed,
      },
      responseTime: {
        avg: Math.round(avgResponseTime),
        p50: Math.round(this.calculatePercentile(responseTimes, 50)),
        p95: Math.round(this.calculatePercentile(responseTimes, 95)),
        p99: Math.round(this.calculatePercentile(responseTimes, 99)),
      },
      errorRate: Math.round(errorRate * 100) / 100,
    }
  }

  /**
   * 캐시 통계 요약
   * @param {string} cacheName - 캐시 이름
   * @returns {Object} 통계 객체
   */
  getCacheStats(cacheName) {
    const stats = this.metrics.cacheHits.get(cacheName)

    if (!stats) {
      return null
    }

    const total = stats.hits + stats.misses
    const hitRate = total > 0 ? (stats.hits / total) * 100 : 0

    return {
      cache: cacheName,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      total,
    }
  }

  /**
   * 전체 리포트 생성
   * @returns {Object} 전체 통계 리포트
   */
  generateReport() {
    const report = {
      period: {
        start: new Date(this.startTime).toISOString(),
        end: new Date().toISOString(),
        durationMinutes: Math.round((Date.now() - this.startTime) / 60000),
      },
      apis: [],
      caches: [],
      errors: [],
      summary: {
        totalApiCalls: 0,
        totalErrors: 0,
        avgCacheHitRate: 0,
      },
    }

    // API 통계
    for (const [apiName] of this.metrics.apiCalls) {
      const stats = this.getApiStats(apiName)
      if (stats) {
        report.apis.push(stats)
        report.summary.totalApiCalls += stats.calls.total
        report.summary.totalErrors += stats.calls.failed
      }
    }

    // 캐시 통계
    let totalCacheAccess = 0
    let totalCacheHits = 0

    for (const [cacheName] of this.metrics.cacheHits) {
      const stats = this.getCacheStats(cacheName)
      if (stats) {
        report.caches.push(stats)
        totalCacheAccess += stats.total
        totalCacheHits += stats.hits
      }
    }

    report.summary.avgCacheHitRate =
      totalCacheAccess > 0 ? Math.round((totalCacheHits / totalCacheAccess) * 10000) / 100 : 0

    // 에러 통계
    for (const [source, stats] of this.metrics.errors) {
      report.errors.push({
        source,
        count: stats.count,
        recentErrors: stats.recentErrors.slice(-3), // 최근 3개
      })
    }

    // API별 정렬 (호출 횟수 기준)
    report.apis.sort((a, b) => b.calls.total - a.calls.total)

    // 캐시별 정렬 (히트율 기준)
    report.caches.sort((a, b) => b.hitRate - a.hitRate)

    return report
  }

  /**
   * 콘솔에 리포트 출력
   */
  printReport() {
    const report = this.generateReport()

    console.log('\n========== Performance Monitor Report ==========')
    console.log(`Period: ${report.period.start} ~ ${report.period.end}`)
    console.log(`Duration: ${report.period.durationMinutes} minutes`)
    console.log('\n[Summary]')
    console.log(`Total API Calls: ${report.summary.totalApiCalls}`)
    console.log(`Total Errors: ${report.summary.totalErrors}`)
    console.log(`Avg Cache Hit Rate: ${report.summary.avgCacheHitRate}%`)

    if (report.apis.length > 0) {
      console.log('\n[API Statistics]')
      report.apis.forEach(api => {
        console.log(`\n  ${api.api}:`)
        console.log(
          `    Calls: ${api.calls.total} (Success: ${api.calls.success}, Failed: ${api.calls.failed})`
        )
        console.log(
          `    Response Time: Avg ${api.responseTime.avg}ms, p50 ${api.responseTime.p50}ms, p95 ${api.responseTime.p95}ms, p99 ${api.responseTime.p99}ms`
        )
        console.log(`    Error Rate: ${api.errorRate}%`)
      })
    }

    if (report.caches.length > 0) {
      console.log('\n[Cache Statistics]')
      report.caches.forEach(cache => {
        console.log(
          `  ${cache.cache}: ${cache.hitRate}% hit rate (${cache.hits} hits / ${cache.total} total)`
        )
      })
    }

    if (report.errors.length > 0) {
      console.log('\n[Recent Errors]')
      report.errors.forEach(error => {
        console.log(`  ${error.source}: ${error.count} errors`)
        error.recentErrors.forEach(e => {
          console.log(`    - [${e.timestamp}] ${e.message}`)
        })
      })
    }

    console.log('\n================================================\n')
  }

  /**
   * 메트릭 초기화
   */
  reset() {
    this.metrics.apiCalls.clear()
    this.metrics.cacheHits.clear()
    this.metrics.errors.clear()
    this.metrics.responseTimes.clear()
    this.startTime = Date.now()
  }
}

// 전역 인스턴스
const globalMonitor = new PerformanceMonitor()

export default globalMonitor
export { PerformanceMonitor }
