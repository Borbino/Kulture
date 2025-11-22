/**
 * Language Detection API Endpoint
 */

import aiTranslation from '../../../lib/aiTranslation';
import rateLimiter from '../../../lib/rateLimiter';
import logger from '../../../lib/logger';

export default async function handler(req, res) {
  const rateLimitResult = await rateLimiter(req, res, {
    interval: 60 * 1000,
    uniqueTokenPerInterval: 500,
    maxRequests: 200,
  });

  if (!rateLimitResult.success) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: rateLimitResult.retryAfter,
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Missing required field: text' });
    }

    const detectedLang = await aiTranslation.detectLanguage(text);

    return res.status(200).json({
      language: detectedLang,
      languageName: aiTranslation.SUPPORTED_LANGUAGES[detectedLang] || 'Unknown',
      confidence: detectedLang !== 'unknown' ? 0.95 : 0.1,
    });

  } catch (error) {
    logger.error('Language detection error:', error);
    return res.status(500).json({ error: 'Detection failed' });
  }
}
