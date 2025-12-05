/**
 * [설명] 향상된 성능 모니터링 시스템
 * [일시] 2025-11-26 (KST)
 * [목적] 실시간 성능 추적 및 자동 최적화 제안
 */

import { logger } from './logger'

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.thresholds = {
      responseTime: 1000, // 1초
      memoryUsage: 80, // 80%
      cpuUsage: 70, // 70%
      errorRate: 5, // 5%
    }
    this.alerts = []
  }

  /**
   * API 응답 시간 추적
   */
  trackApiResponse(endpoint, duration, statusCode) {
    const key = `api:${endpoint}`
    const metric = this.metrics.get(key) || {
      count: 0,
      totalDuration: 0,
      errors: 0,
      slowRequests: 0,
    }

    metric.count++
    metric.totalDuration += duration

    if (statusCode >= 400) {
      metric.errors++
    }

    if (duration > this.thresholds.responseTime) {
      metric.slowRequests++
      this.createAlert('slow_response', {
        endpoint,
        duration,
        threshold: this.thresholds.responseTime,
      })
    }

    metric.avgDuration = metric.totalDuration / metric.count
    metric.errorRate = (metric.errors / metric.count) * 100

    this.metrics.set(key, metric)

    // 에러율이 임계값 초과 시 알림
    if (metric.errorRate > this.thresholds.errorRate) {
      this.createAlert('high_error_rate', {
        endpoint,
        errorRate: metric.errorRate,
        threshold: this.thresholds.errorRate,
      })
    }

    return metric
  }

  /**
   * 데이터베이스 쿼리 성능 추적
   */
  trackDatabaseQuery(queryName, duration, recordCount) {
    const key = `db:${queryName}`
    const metric = this.metrics.get(key) || {
      count: 0,
      totalDuration: 0,
      totalRecords: 0,
    }

    metric.count++
    metric.totalDuration += duration
    metric.totalRecords += recordCount
    metric.avgDuration = metric.totalDuration / metric.count
    metric.avgRecords = metric.totalRecords / metric.count

    this.metrics.set(key, metric)

    // 느린 쿼리 감지 (1초 이상)
    if (duration > 1000) {
      this.createAlert('slow_query', {
        query: queryName,
        duration,
        recordCount,
      })
    }

    return metric
  }

  /**
   * 캐시 효율성 추적
   */
  trackCachePerformance(cacheKey, hit) {
    const key = `cache:${cacheKey}`
    const metric = this.metrics.get(key) || {
      hits: 0,
      misses: 0,
    }

    if (hit) {
      metric.hits++
    } else {
      metric.misses++
    }

    metric.hitRate = (metric.hits / (metric.hits + metric.misses)) * 100

    this.metrics.set(key, metric)

    return metric
  }

  /**
   * 알림 생성
   */
  createAlert(type, data) {
    const alert = {
      type,
      data,
      timestamp: new Date().toISOString(),
      severity: this.getAlertSeverity(type, data),
    }

    this.alerts.push(alert)

    // 최근 100개만 유지
    if (this.alerts.length > 100) {
      this.alerts.shift()
    }

    // 심각도가 높으면 로그
    if (alert.severity === 'critical') {
      logger.error('[Performance Alert]', alert)
    } else if (alert.severity === 'warning') {
      logger.warn('[Performance Alert]', alert)
    }

    return alert
  }

  /**
   * 알림 심각도 결정
   */
  getAlertSeverity(type, data) {
    switch (type) {
      case 'slow_response':
        return data.duration > 3000 ? 'critical' : 'warning'
      case 'high_error_rate':
        return data.errorRate > 10 ? 'critical' : 'warning'
      case 'slow_query':
        return data.duration > 5000 ? 'critical' : 'warning'
      default:
        return 'info'
    }
  }

  /**
   * 성능 리포트 생성
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: {},
      alerts: this.alerts,
      recommendations: [],
    }

    // API 성능 요약
    const apiMetrics = Array.from(this.metrics.entries())
      .filter(([key]) => key.startsWith('api:'))
      .map(([key, value]) => ({
        endpoint: key.replace('api:', ''),
        ...value,
      }))

    report.metrics.apis = apiMetrics

    // 느린 API 추천
    const slowApis = apiMetrics.filter(m => m.avgDuration > 500)
    if (slowApis.length > 0) {
      report.recommendations.push({
        type: 'optimize_api',
        message: `${slowApis.length}개의 API가 평균 응답 시간 500ms를 초과합니다.`,
        endpoints: slowApis.map(a => a.endpoint),
        suggestion: '캐싱 추가, 쿼리 최적화, 또는 페이지네이션 구현을 고려하세요.',
      })
    }

    // 데이터베이스 성능 요약
    const dbMetrics = Array.from(this.metrics.entries())
      .filter(([key]) => key.startsWith('db:'))
      .map(([key, value]) => ({
        query: key.replace('db:', ''),
        ...value,
      }))

    report.metrics.database = dbMetrics

    // 느린 쿼리 추천
    const slowQueries = dbMetrics.filter(m => m.avgDuration > 500)
    if (slowQueries.length > 0) {
      report.recommendations.push({
        type: 'optimize_queries',
        message: `${slowQueries.length}개의 쿼리가 평균 실행 시간 500ms를 초과합니다.`,
        queries: slowQueries.map(q => q.query),
        suggestion: '인덱스 추가, 쿼리 리팩토링, 또는 데이터 정규화를 고려하세요.',
      })
    }

    // 캐시 성능 요약
    const cacheMetrics = Array.from(this.metrics.entries())
      .filter(([key]) => key.startsWith('cache:'))
      .map(([key, value]) => ({
        key: key.replace('cache:', ''),
        ...value,
      }))

    report.metrics.cache = cacheMetrics

    // 낮은 캐시 히트율 추천
    const lowHitRate = cacheMetrics.filter(m => m.hitRate < 50)
    if (lowHitRate.length > 0) {
      report.recommendations.push({
        type: 'improve_caching',
        message: `${lowHitRate.length}개의 캐시 키가 히트율 50% 미만입니다.`,
        keys: lowHitRate.map(c => c.key),
        suggestion: 'TTL 증가, 캐시 워밍, 또는 캐시 키 전략 재검토를 고려하세요.',
      })
    }

    return report
  }

  /**
   * 메트릭 초기화
   */
  reset() {
    this.metrics.clear()
    this.alerts = []
  }

  /**
   * 특정 메트릭 조회
   */
  getMetric(key) {
    return this.metrics.get(key)
  }

  /**
   * 모든 메트릭 조회
   */
  getAllMetrics() {
    return Object.fromEntries(this.metrics)
  }
}

// 싱글톤 인스턴스
const performanceMonitor = new PerformanceMonitor()

export default performanceMonitor
export { PerformanceMonitor }
