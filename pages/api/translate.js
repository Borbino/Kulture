/**
 * Translation API Endpoint
 * Real-time translation service with caching
 */

import { translate, translateBatch, detectLanguage, SUPPORTED_LANGUAGES } from '../../lib/aiTranslation';
import { getCachedTranslation, setCachedTranslation, getCacheStatistics } from '../../lib/translationCache';
import { rateLimiter } from '../../lib/rateLimiter';
import logger from '../../lib/logger';

export default async function handler(req, res) {
  // Rate limiting
  const limiterResult = await rateLimiter(req, 'translation', { maxRequests: 100, windowMs: 60000 });
  if (!limiterResult.success) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: limiterResult.retryAfter
    });
  }

  if (req.method === 'POST') {
    return handleTranslate(req, res);
  } else if (req.method === 'GET') {
    return handleGetInfo(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * 번역 요청 처리
 */
async function handleTranslate(req, res) {
  try {
    const { text, texts, targetLang, sourceLang = 'auto', mode = 'single' } = req.body;

    // 유효성 검사
    if (!targetLang) {
      return res.status(400).json({ error: 'targetLang is required' });
    }

    if (!SUPPORTED_LANGUAGES[targetLang]) {
      return res.status(400).json({ 
        error: `Unsupported target language: ${targetLang}`,
        supportedLanguages: Object.keys(SUPPORTED_LANGUAGES)
      });
    }

    // 배치 모드
    if (mode === 'batch') {
      if (!texts || !Array.isArray(texts)) {
        return res.status(400).json({ error: 'texts array is required for batch mode' });
      }

      if (texts.length > 50) {
        return res.status(400).json({ error: 'Maximum 50 texts per batch request' });
      }

      const startTime = Date.now();
      const translations = await translateBatch(texts, targetLang, sourceLang);
      const duration = Date.now() - startTime;

      logger.info(`Batch translation completed: ${texts.length} texts in ${duration}ms`);

      return res.status(200).json({
        success: true,
        translations,
        count: translations.length,
        duration,
        targetLang,
        sourceLang
      });
    }

    // 단일 번역
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required for single mode' });
    }

    if (text.length > 5000) {
      return res.status(400).json({ error: 'Text too long (max 5000 characters)' });
    }

    const startTime = Date.now();

    // 캐시 확인
    let translation = await getCachedTranslation(text, sourceLang, targetLang);
    let fromCache = !!translation;

    // 캐시 미스 시 번역
    if (!translation) {
      translation = await translate(text, targetLang, sourceLang);
      await setCachedTranslation(text, sourceLang, targetLang, translation);
    }

    const duration = Date.now() - startTime;

    logger.info(`Translation completed: ${sourceLang} -> ${targetLang} (${duration}ms, cached: ${fromCache})`);

    return res.status(200).json({
      success: true,
      translation,
      originalText: text,
      targetLang,
      sourceLang,
      fromCache,
      duration
    });

  } catch (error) {
    logger.error('Translation API error:', error);
    return res.status(500).json({
      error: 'Translation failed',
      message: error.message
    });
  }
}

/**
 * 정보 조회 (지원 언어, 캐시 통계 등)
 */
async function handleGetInfo(req, res) {
  try {
    const { action } = req.query;

    // 지원 언어 목록
    if (action === 'languages') {
      return res.status(200).json({
        success: true,
        languages: SUPPORTED_LANGUAGES,
        count: Object.keys(SUPPORTED_LANGUAGES).length
      });
    }

    // 캐시 통계
    if (action === 'cache-stats') {
      const stats = await getCacheStatistics();
      return res.status(200).json({
        success: true,
        stats
      });
    }

    // 언어 감지
    if (action === 'detect') {
      const { text } = req.query;
      if (!text) {
        return res.status(400).json({ error: 'text parameter is required' });
      }

      const detectedLang = await detectLanguage(text);
      return res.status(200).json({
        success: true,
        detectedLanguage: detectedLang,
        languageName: SUPPORTED_LANGUAGES[detectedLang] || 'Unknown'
      });
    }

    // 기본 정보
    return res.status(200).json({
      success: true,
      service: 'Kulture Translation API',
      version: '1.0.0',
      supportedLanguages: Object.keys(SUPPORTED_LANGUAGES).length,
      endpoints: {
        translate: 'POST /api/translate',
        languages: 'GET /api/translate?action=languages',
        detect: 'GET /api/translate?action=detect&text=...',
        cacheStats: 'GET /api/translate?action=cache-stats'
      }
    });

  } catch (error) {
    logger.error('Translation API info error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve information',
      message: error.message
    });
  }
}
