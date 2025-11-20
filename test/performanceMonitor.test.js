/**
 * [테스트] performanceMonitor.js 성능 모니터링 시스템 테스트
 */

import { PerformanceMonitor } from '../lib/performanceMonitor.js'

describe('Performance Monitor', () => {
  let monitor

  beforeEach(() => {
    monitor = new PerformanceMonitor()
  })

  describe('API Call Tracking', () => {
    test('API 호출 성공 기록', () => {
      const endCall = monitor.startApiCall('test-api')
      endCall(true)

      const stats = monitor.getApiStats('test-api')

      expect(stats).not.toBeNull()
      expect(stats.calls.total).toBe(1)
      expect(stats.calls.success).toBe(1)
      expect(stats.calls.failed).toBe(0)
      expect(stats.errorRate).toBe(0)
    })

    test('API 호출 실패 기록', () => {
      const endCall = monitor.startApiCall('test-api')
      endCall(false, new Error('Test error'))

      const stats = monitor.getApiStats('test-api')

      expect(stats).not.toBeNull()
      expect(stats.calls.total).toBe(1)
      expect(stats.calls.success).toBe(0)
      expect(stats.calls.failed).toBe(1)
      expect(stats.errorRate).toBe(100)
    })

    test('여러 API 호출 누적', () => {
      for (let i = 0; i < 10; i++) {
        const endCall = monitor.startApiCall('test-api')
        endCall(i < 8) // 8 success, 2 failed
      }

      const stats = monitor.getApiStats('test-api')

      expect(stats.calls.total).toBe(10)
      expect(stats.calls.success).toBe(8)
      expect(stats.calls.failed).toBe(2)
      expect(stats.errorRate).toBe(20)
    })

    test('응답 시간 기록', done => {
      const endCall = monitor.startApiCall('test-api')

      setTimeout(() => {
        endCall(true)

        const stats = monitor.getApiStats('test-api')
        expect(stats.responseTime.avg).toBeGreaterThan(0)
        done()
      }, 10)
    })
  })

  describe('Cache Hit Rate Tracking', () => {
    test('캐시 히트 기록', () => {
      monitor.recordCacheAccess('test-cache', true)

      const stats = monitor.getCacheStats('test-cache')

      expect(stats).not.toBeNull()
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(0)
      expect(stats.hitRate).toBe(100)
    })

    test('캐시 미스 기록', () => {
      monitor.recordCacheAccess('test-cache', false)

      const stats = monitor.getCacheStats('test-cache')

      expect(stats).not.toBeNull()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(1)
      expect(stats.hitRate).toBe(0)
    })

    test('캐시 히트율 계산', () => {
      // 7 hits, 3 misses = 70% hit rate
      for (let i = 0; i < 10; i++) {
        monitor.recordCacheAccess('test-cache', i < 7)
      }

      const stats = monitor.getCacheStats('test-cache')

      expect(stats.hits).toBe(7)
      expect(stats.misses).toBe(3)
      expect(stats.total).toBe(10)
      expect(stats.hitRate).toBe(70)
    })
  })

  describe('Error Tracking', () => {
    test('에러 기록', () => {
      monitor.recordError('test-source', new Error('Test error'))

      const report = monitor.generateReport()
      const errorStats = report.errors.find(e => e.source === 'test-source')

      expect(errorStats).toBeDefined()
      expect(errorStats.count).toBe(1)
      expect(errorStats.recentErrors.length).toBe(1)
      expect(errorStats.recentErrors[0].message).toBe('Test error')
    })

    test('최근 에러 10개만 유지', () => {
      for (let i = 0; i < 15; i++) {
        monitor.recordError('test-source', new Error(`Error ${i}`))
      }

      const report = monitor.generateReport()
      const errorStats = report.errors.find(e => e.source === 'test-source')

      expect(errorStats.count).toBe(15)
      expect(errorStats.recentErrors.length).toBeLessThanOrEqual(10)
    })
  })

  describe('Percentile Calculation', () => {
    test('p50 계산', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const p50 = monitor.calculatePercentile(values, 50)

      expect(p50).toBeGreaterThanOrEqual(5)
      expect(p50).toBeLessThanOrEqual(6)
    })

    test('p95 계산', () => {
      const values = Array.from({ length: 100 }, (_, i) => i + 1)
      const p95 = monitor.calculatePercentile(values, 95)

      expect(p95).toBeGreaterThanOrEqual(94)
      expect(p95).toBeLessThanOrEqual(96)
    })

    test('p99 계산', () => {
      const values = Array.from({ length: 100 }, (_, i) => i + 1)
      const p99 = monitor.calculatePercentile(values, 99)

      expect(p99).toBeGreaterThanOrEqual(98)
      expect(p99).toBeLessThanOrEqual(100)
    })

    test('빈 배열은 0 반환', () => {
      const p50 = monitor.calculatePercentile([], 50)
      expect(p50).toBe(0)
    })
  })

  describe('Report Generation', () => {
    test('전체 리포트 생성', () => {
      // API 호출 기록
      const endCall1 = monitor.startApiCall('api-1')
      endCall1(true)

      const endCall2 = monitor.startApiCall('api-2')
      endCall2(false, new Error('Failed'))

      // 캐시 기록
      monitor.recordCacheAccess('cache-1', true)
      monitor.recordCacheAccess('cache-1', false)

      const report = monitor.generateReport()

      expect(report).toHaveProperty('period')
      expect(report).toHaveProperty('apis')
      expect(report).toHaveProperty('caches')
      expect(report).toHaveProperty('errors')
      expect(report).toHaveProperty('summary')

      expect(report.apis.length).toBe(2)
      expect(report.caches.length).toBe(1)
      expect(report.summary.totalApiCalls).toBe(2)
      expect(report.summary.totalErrors).toBe(1)
    })

    test('평균 캐시 히트율 계산', () => {
      // cache-1: 80% hit rate (8/10)
      for (let i = 0; i < 10; i++) {
        monitor.recordCacheAccess('cache-1', i < 8)
      }

      // cache-2: 60% hit rate (6/10)
      for (let i = 0; i < 10; i++) {
        monitor.recordCacheAccess('cache-2', i < 6)
      }

      const report = monitor.generateReport()

      // 평균: (8+6) / (10+10) = 14/20 = 70%
      expect(report.summary.avgCacheHitRate).toBe(70)
    })
  })

  describe('Reset', () => {
    test('메트릭 초기화', () => {
      const endCall = monitor.startApiCall('test-api')
      endCall(true)

      monitor.recordCacheAccess('test-cache', true)
      monitor.recordError('test-source', new Error('Test'))

      monitor.reset()

      const report = monitor.generateReport()

      expect(report.apis.length).toBe(0)
      expect(report.caches.length).toBe(0)
      expect(report.errors.length).toBe(0)
      expect(report.summary.totalApiCalls).toBe(0)
    })
  })
})
