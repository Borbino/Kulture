/**
 * Translation System Status and Health Check
 */

import aiTranslation from '../../../lib/aiTranslation';
import logger from '../../../lib/logger';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const health = await aiTranslation.getSystemHealth();
    const cacheStats = await aiTranslation.getCacheStats();

    return res.status(200).json({
      status: health.status,
      timestamp: health.timestamp,
      providers: health.providers,
      cache: cacheStats,
      languages: {
        total: Object.keys(aiTranslation.SUPPORTED_LANGUAGES).length,
        list: Object.keys(aiTranslation.SUPPORTED_LANGUAGES),
      },
    });

  } catch (error) {
    logger.error('Health check error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
}
