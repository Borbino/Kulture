import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { suggestTags, suggestCategories } from '../../../lib/aiRecommendation.js';
import { withErrorHandler } from '../../../lib/apiErrorHandler.js';
import rateLimitMiddleware from '../../../lib/rateLimiter.js';
import { logger } from '../../../lib/logger.js';

/**
 * AI 자동 태그/카테고리 추천 API
 * - POST: 태그와 카테고리 추천
 */

async function handler(req, res) {
  rateLimitMiddleware('api')(req, res, () => {});
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // AI 태그 추천
    const suggestedTags = await suggestTags(title, content);

    // AI 카테고리 추천
    const suggestedCategories = await suggestCategories(title, content, suggestedTags);

    return res.status(200).json({
      tags: suggestedTags,
      categories: suggestedCategories,
    });
  } catch (error) {
    logger.error('Error suggesting tags/categories', { error: error.message });
    return res.status(500).json({ error: 'Failed to suggest tags/categories' });
  }
}

export default withErrorHandler(handler);
