/**
 * Translation Cache Management API (Admin Only)
 */

import aiTranslation from '../../../lib/aiTranslation';
import { verifyAuth, isAdmin } from '../../../lib/auth';
import logger from '../../../lib/logger';

export default async function handler(req, res) {
  try {
    // 관리자 권한 확인
    const user = await verifyAuth(req);
    if (!user || !isAdmin(user)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // GET: 캐시 통계
    if (req.method === 'GET') {
      const stats = await aiTranslation.getCacheStats();
      return res.status(200).json(stats);
    }

    // DELETE: 캐시 초기화
    if (req.method === 'DELETE') {
      const result = await aiTranslation.clearCache();
      logger.info('Translation cache cleared by admin', { user: user.email });
      return res.status(200).json({
        message: 'Cache cleared successfully',
        ...result,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    logger.error('Cache management error:', error);
    return res.status(500).json({ error: 'Operation failed' });
  }
}
