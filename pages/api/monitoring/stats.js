import { getAPIKeyManager } from '../../../lib/apiKeyManager'
import { getLogAggregator } from '../../../lib/logAggregator'

/**
 * 모니터링 통계 API
 * 실시간 시스템 상태 및 성능 지표 제공
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // API Quota 정보
    const apiKeyManager = getAPIKeyManager()
    const quotaStats = apiKeyManager.getAllUsage()

    // 로그 집계 정보
    const logAggregator = getLogAggregator()
    const logStats = logAggregator.getStats()
    const errorReport = logAggregator.generateErrorReport()

    // 성능 정보 (시뮬레이션 - 실제로는 Performance Analyzer에서 가져옴)
    const performanceStats = {
      apis: [
        {
          api: '/api/cron/vip-monitoring',
          latency: { p50: 500, p95: 1200, p99: 2000 },
          calls: { total: 48, failed: 0, success: 48 },
        },
        {
          api: '/api/cron/trend-detection',
          latency: { p50: 800, p95: 2500, p99: 3500 },
          calls: { total: 12, failed: 1, success: 11 },
        },
        {
          api: '/api/cron/content-generation',
          latency: { p50: 3000, p95: 7000, p99: 9000 },
          calls: { total: 4, failed: 0, success: 4 },
        },
      ],
      caches: [
        {
          cache: 'sanity-query',
          hitRate: 75,
          hits: 300,
          misses: 100,
        },
      ],
    }

    // 시스템 리소스 (시뮬레이션 - 실제로는 서버 메트릭에서 가져옴)
    const systemStats = {
      memory: {
        total: 512, // MB
        used: 256,
        free: 256,
        usagePercent: 50,
      },
      cpu: {
        cores: 1,
        usagePercent: 35,
      },
    }

    const response = {
      timestamp: new Date().toISOString(),
      quota: quotaStats,
      logs: {
        ...logStats,
        ...errorReport,
      },
      performance: performanceStats,
      system: systemStats,
      health: {
        status: 'healthy',
        uptime: process.uptime(),
        version: process.version,
      },
    }

    res.status(200).json(response)
  } catch (error) {
    console.error('[Monitoring Stats] Error:', error)
    res.status(500).json({
      error: 'Failed to fetch monitoring stats',
      message: error.message,
    })
  }
}
