/**
 * Translation API Endpoint
 * Provides real-time AI translation for all supported languages
 */

import aiTranslation from '../../../lib/aiTranslation';
import rateLimiter from '../../../lib/rateLimiter';
import { logger } from '../../../lib/logger.js';
import { trackTranslationEvent } from '../../../lib/analytics.js';

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

      const translations = await aiTranslation.translateBatch(
          batch,
          targetLang,
          sourceLang,
          { context }
        );
      result = { translations, type: 'batch', count: batch.length };
    }
    // 단일 번역
    else {
      if (text.length > 10000) {
        // 긴 텍스트는 청크 번역
        const translationLong = await aiTranslation.translateLongText(
            text,
            targetLang,
            sourceLang
          );
        result = { translation: translationLong, type: 'long-text' };
      } else {
        const translationSingle = await aiTranslation.translate(
            text,
            targetLang,
            sourceLang,
            { context }
          );
        result = { translation: translationSingle, type: 'single' };
      }
    }

    const responseTime = Date.now() - startTime;

    logger.info('translation', 'completed', {
      sourceLang,
      targetLang,
      type: result.type,
      responseTime,
    });

    // 이벤트 추적
    if (result.type === 'batch') {
      trackTranslationEvent({ type: 'success', provider: result.translations?.provider, sourceLang, targetLang, durationMs: responseTime, cached: result.translations?.cached })
    } else {
      const t = result.translation
      const evType = t?.cached ? 'cache-hit' : 'success'
      trackTranslationEvent({ type: evType, provider: t?.provider, sourceLang, targetLang, durationMs: responseTime, cached: t?.cached })
    }

    return res.status(200).json({
      ...result,
      sourceLang,
      targetLang,
      responseTime,
      cached: responseTime < 100, // 추정
    });

  } catch (error) {
    const src = (req.body && req.body.sourceLang) || 'auto'
    const tgt = (req.body && req.body.targetLang) || 'unknown'
    logger.error('translation', 'api_error', { error: String(error), sourceLang: src, targetLang: tgt });
    trackTranslationEvent({ type: 'error', provider: error?.provider, sourceLang: src, targetLang: tgt, durationMs: 0, error })

    return res.status(500).json({
      error: 'Translation failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
}
