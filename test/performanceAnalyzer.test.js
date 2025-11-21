/**
 * Performance Analyzer 테스트
 */

import {
  analyzePerformanceReport,
  analyzeTrend,
  getPriority,
} from '../lib/performanceAnalyzer.js'

describe('Performance Analyzer', () => {
  describe('analyzePerformanceReport', () => {
    test('API P95 지연시간이 5초 초과 시 critical 이슈', () => {
      const report = {
        apis: [
          {
            api: '/api/slow-endpoint',
            latency: { p50: 2000, p95: 6000, p99: 8000 },
            calls: { total: 100, failed: 5 },
          },
        ],
      }

      const result = analyzePerformanceReport(report)

      expect(result.criticalIssues).toBe(1)
      expect(result.issues[0].type).toBe('slow_api')
      expect(result.issues[0].api).toBe('/api/slow-endpoint')
      expect(result.issues[0].p95).toBe(6000)
    })

    test('에러율 10% 초과 시 high 이슈', () => {
      const report = {
        apis: [
          {
            api: '/api/error-prone',
            latency: { p95: 1000 },
            calls: { total: 100, failed: 15 },
          },
        ],
      }

      const result = analyzePerformanceReport(report)

      expect(result.highIssues).toBe(1)
      expect(result.issues[0].type).toBe('high_error_rate')
      expect(result.issues[0].errorRate).toBe('15.00')
    })

    test('캐시 히트율 50% 미만 시 medium 이슈', () => {
      const report = {
        caches: [
          {
            cache: 'redis-cache',
            hitRate: 30,
            hits: 300,
            misses: 700,
          },
        ],
      }

      const result = analyzePerformanceReport(report)

      expect(result.mediumIssues).toBe(1)
      expect(result.issues[0].type).toBe('low_cache_hit_rate')
      expect(result.issues[0].hitRate).toBe(30)
    })

    test('메모리 사용률 80% 초과 시 high 이슈', () => {
      const report = {
        system: {
          memory: {
            usagePercent: 85,
            used: 6800,
            total: 8000,
          },
        },
      }

      const result = analyzePerformanceReport(report)

      expect(result.highIssues).toBe(1)
      expect(result.issues[0].type).toBe('high_memory_usage')
      expect(result.issues[0].usagePercent).toBe(85)
    })

    test('CPU 사용률 70% 초과 시 high 이슈', () => {
      const report = {
        system: {
          cpu: {
            usagePercent: 85,
          },
        },
      }

      const result = analyzePerformanceReport(report)

      expect(result.highIssues).toBe(1)
      expect(result.issues[0].type).toBe('high_cpu_usage')
    })

    test('이슈 없는 정상 보고서', () => {
      const report = {
        apis: [
          {
            api: '/api/healthy',
            latency: { p95: 500 },
            calls: { total: 100, failed: 2 },
          },
        ],
        caches: [
          {
            cache: 'redis-cache',
            hitRate: 85,
          },
        ],
        system: {
          memory: { usagePercent: 50 },
          cpu: { usagePercent: 40 },
        },
      }

      const result = analyzePerformanceReport(report)

      expect(result.totalIssues).toBe(0)
      expect(result.criticalIssues).toBe(0)
      expect(result.highIssues).toBe(0)
      expect(result.mediumIssues).toBe(0)
    })

    test('여러 이슈가 동시에 발생', () => {
      const report = {
        apis: [
          {
            api: '/api/slow',
            latency: { p95: 7000 },
            calls: { total: 100, failed: 20 },
          },
        ],
        caches: [
          {
            cache: 'cache1',
            hitRate: 30,
          },
        ],
        system: {
          memory: { usagePercent: 85 },
          cpu: { usagePercent: 90 },
        },
      }

      const result = analyzePerformanceReport(report)

      expect(result.totalIssues).toBe(5)
      expect(result.criticalIssues).toBe(1) // slow API
      expect(result.highIssues).toBe(3) // error rate, memory, CPU
      expect(result.mediumIssues).toBe(1) // cache hit rate
    })
  })

  describe('analyzeTrend', () => {
    test('데이터 부족 시 insufficient_data', () => {
      const reports = [
        { apis: [{ latency: { p95: 1000 } }] },
        { apis: [{ latency: { p95: 1100 } }] },
        { apis: [{ latency: { p95: 1200 } }] },
      ]

      const result = analyzeTrend(reports)

      expect(result.trend).toBe('insufficient_data')
    })

    test('20% 이상 증가 시 degrading', () => {
      const reports = [
        { apis: [{ latency: { p95: 1000 } }] },
        { apis: [{ latency: { p95: 1100 } }] },
        { apis: [{ latency: { p95: 1200 } }] },
        { apis: [{ latency: { p95: 1300 } }] },
        { apis: [{ latency: { p95: 1500 } }] },
      ]

      const result = analyzeTrend(reports)

      expect(result.trend).toBe('degrading')
      expect(parseFloat(result.change)).toBeGreaterThan(20)
    })

    test('20% 이상 감소 시 improving', () => {
      const reports = [
        { apis: [{ latency: { p95: 1500 } }] },
        { apis: [{ latency: { p95: 1400 } }] },
        { apis: [{ latency: { p95: 1300 } }] },
        { apis: [{ latency: { p95: 1100 } }] },
        { apis: [{ latency: { p95: 900 } }] },
      ]

      const result = analyzeTrend(reports)

      expect(result.trend).toBe('improving')
    })

    test('변화 20% 미만 시 stable', () => {
      const reports = [
        { apis: [{ latency: { p95: 1000 } }] },
        { apis: [{ latency: { p95: 1050 } }] },
        { apis: [{ latency: { p95: 1000 } }] },
        { apis: [{ latency: { p95: 1100 } }] },
        { apis: [{ latency: { p95: 1050 } }] },
      ]

      const result = analyzeTrend(reports)

      expect(result.trend).toBe('stable')
    })
  })

  describe('getPriority', () => {
    test('critical 이슈 있으면 urgent', () => {
      const issues = {
        criticalIssues: 1,
        highIssues: 0,
        mediumIssues: 0,
      }

      expect(getPriority(issues)).toBe('urgent')
    })

    test('high 이슈 3개 이상이면 high', () => {
      const issues = {
        criticalIssues: 0,
        highIssues: 3,
        mediumIssues: 0,
      }

      expect(getPriority(issues)).toBe('high')
    })

    test('high 이슈 1-2개이면 medium', () => {
      const issues = {
        criticalIssues: 0,
        highIssues: 1,
        mediumIssues: 0,
      }

      expect(getPriority(issues)).toBe('medium')
    })

    test('medium 이슈 6개 이상이면 medium', () => {
      const issues = {
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 6,
      }

      expect(getPriority(issues)).toBe('medium')
    })

    test('이슈 없으면 low', () => {
      const issues = {
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
      }

      expect(getPriority(issues)).toBe('low')
    })
  })
})
