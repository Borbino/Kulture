import { runAutonomousDiscovery } from '../../../lib/autonomousScraper'
import { withCronAuth } from '../../../lib/cronMiddleware'
import logger from '../../../lib/logger'

export default withCronAuth(async function autonomousDiscoveryHandler(req, res) {
  try {
    const result = await runAutonomousDiscovery()

    logger.info('[cron]', '[Autonomous Discovery] Cycle completed', {
      rawCount: result.rawCount,
      filteredCount: result.filteredCount,
      generatedCount: result.generatedCount,
      emergingEntities: result.emergingEntities?.length || 0,
    })

    return res.status(200).json({
      success: true,
      message: 'Autonomous discovery cycle completed',
      stats: result,
    })
  } catch (error) {
    logger.error('[cron]', '[Autonomous Discovery] Cron job failed', { error: error.message })
    return res.status(500).json({ success: false, error: error.message })
  }
})
