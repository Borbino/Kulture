/**
 * Translation Management API - List Translations
 * GET /api/translation/list?lang=ko&filter=all
 */

import { logger } from '../../../lib/logger.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Migrate to Supabase — MongoDB dependency removed
    logger.info('[TranslationList]', 'List requested');
    res.status(200).json({
      translations: [],
      total: 0,
      page: 1,
      pages: 0,
    });
  } catch (error) {
    logger.error('[TranslationList]', `API error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch translations' });
  }
}
