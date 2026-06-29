/**
 * Translation Management API - Statistics
 * GET /api/translation/stats
 */

import { logger } from '../../../lib/logger.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Migrate to Supabase — MongoDB dependency removed
    logger.info('[TranslationStats]', 'Stats requested');

    res.status(200).json({
      totalLanguages: 0,
      totalTranslations: 0,
      pendingTranslations: 0,
      approvedTranslations: 0,
      rejectedTranslations: 0,
      completionRate: 0,
      topContributors: [],
    });
  } catch (error) {
    logger.error('Stats API error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
}
