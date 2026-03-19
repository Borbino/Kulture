import { getAPIKeyManager } from '../../../lib/apiKeyManager.js'
import { getLogAggregator } from '../../../lib/logAggregator.js'
import { withErrorHandler } from '../../../lib/apiErrorHandler.js'
import { verifyAdmin } from '../../../lib/auth.js'
import { logger } from '../../../lib/logger.js';

/**
 * 모니터링 통계 API (어드민 전용)
 * 실시간 시스템 상태 및 성능 지표 제공
 */
async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await verifyAdmin(req, res);

    // API Quota 정보
    const apiKeyManager = getAPIKeyManager()
    const quotaStats = apiKeyManager.getAllUsage()

    // 로그 집계 정보
    const logAggregator = getLogAggregator()
    const logStats = logAggregator.getStats()
    const errorReport = logAggregator.generateErrorReport()

    // 성능 정보 (logAggregator 실데이터 기반)
    const performanceStats = {
      errorRate: logStats.totalErrors > 0
        ? Math.round((logStats.totalErrors / Math.max(logStats.totalLogs || 1, 1)) * 100)
        : 0,
      recentErrors: errorReport?.recentErrors?.slice(0, 5) || [],
    }

    // 시스템 리소스 (Node.js 실데이터)
    const memUsage = process.memoryUsage()
    const totalMemMB = Math.round(memUsage.heapTotal / 1024 / 1024)
    const usedMemMB = Math.round(memUsage.heapUsed / 1024 / 1024)
    const systemStats = {
      memory: {
        heapTotalMB: totalMemMB,
        heapUsedMB: usedMemMB,
        externalMB: Math.round(memUsage.external / 1024 / 1024),
        rssMB: Math.round(memUsage.rss / 1024 / 1024),
        usagePercent: Math.round((usedMemMB / Math.max(totalMemMB, 1)) * 100),
      },
      process: {
        uptimeSeconds: Math.round(process.uptime()),
        nodeVersion: process.version,
        pid: process.pid,
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
    logger.error('[Monitoring Stats] Error:', error)
    res.status(500).json({
      error: 'Failed to fetch monitoring stats',
      message: error.message,
    })
  }
}

export default withErrorHandler(handler)
