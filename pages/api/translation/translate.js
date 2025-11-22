/**
 * Translation API Endpoint
 * Provides real-time AI translation for all supported languages
 */

import aiTranslation from '../../../lib/aiTranslation';
import rateLimiter from '../../../lib/rateLimiter';
import logger from '../../../lib/logger';

export default async function handler(req, res) {
  // Rate limiting
  const rateLimitResult = await rateLimiter(req, res, {
    interval: 60 * 1000, // 1분
    uniqueTokenPerInterval: 500,
    maxRequests: 100, // 사용자당 분당 100회
  });

  if (!rateLimitResult.success) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: rateLimitResult.retryAfter,
    });
  }

  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      text,
      targetLang,
      sourceLang = 'auto',
      context,
      batch,
    } = req.body;

    // 입력 검증
    if (!text && !batch) {
      return res.status(400).json({
        error: 'Missing required field: text or batch',
      });
    }

    if (!targetLang) {
      return res.status(400).json({
        error: 'Missing required field: targetLang',
      });
    }

    // 언어 지원 확인
    if (!aiTranslation.SUPPORTED_LANGUAGES[targetLang]) {
      return res.status(400).json({
        error: `Unsupported target language: ${targetLang}`,
        supported: Object.keys(aiTranslation.SUPPORTED_LANGUAGES),
      });
    }

    let result;
    const startTime = Date.now();

    // 배치 번역
    if (batch && Array.isArray(batch)) {
      if (batch.length > 100) {
        return res.status(400).json({
          error: 'Batch size exceeds limit (max: 100)',
        });
      }

      result = {
        translations: await aiTranslation.translateBatch(
          batch,
          targetLang,
          sourceLang,
          { context }
        ),
        type: 'batch',
        count: batch.length,
      };
    }
    // 단일 번역
    else {
      if (text.length > 10000) {
        // 긴 텍스트는 청크 번역
        result = {
          translation: await aiTranslation.translateLongText(
            text,
            targetLang,
            sourceLang
          ),
          type: 'long-text',
        };
      } else {
        result = {
          translation: await aiTranslation.translate(
            text,
            targetLang,
            sourceLang,
            { context }
          ),
          type: 'single',
        };
      }
    }

    const responseTime = Date.now() - startTime;

    logger.info('Translation completed', {
      sourceLang,
      targetLang,
      type: result.type,
      responseTime,
    });

    return res.status(200).json({
      ...result,
      sourceLang,
      targetLang,
      responseTime,
      cached: responseTime < 100, // 추정
    });

  } catch (error) {
    logger.error('Translation API error:', error);

    return res.status(500).json({
      error: 'Translation failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
}
