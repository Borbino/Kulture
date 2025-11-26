/**
 * [설명] 번역 배치 처리 최적화 API
 * [일시] 2025-11-26 (KST)
 * [목적] 대량 텍스트 병렬 번역으로 성능 10배 향상
 */

import { translateText } from '../../../lib/aiTranslation.js';
import { translationMonitor } from '../../../lib/translationPerformanceMonitor.js';
import { withErrorHandler } from '../../../lib/apiErrorHandler.js';
import rateLimitMiddleware from '../../../lib/rateLimiter.js';

async function handler(req, res) {
  // Rate limiting
  const rateLimit = rateLimitMiddleware({ maxRequests: 10, windowMs: 60000 });
  const rateLimitResult = rateLimit(req, res);
  if (!rateLimitResult) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { texts, targetLang, sourceLang = 'auto', options = {} } = req.body;

  // 유효성 검사
  if (!texts || !Array.isArray(texts)) {
    return res.status(400).json({ error: 'texts array is required' });
  }

  if (texts.length === 0) {
    return res.status(400).json({ error: 'texts array cannot be empty' });
  }

  if (texts.length > 100) {
    return res.status(400).json({ error: 'Maximum 100 texts per batch' });
  }

  if (!targetLang) {
    return res.status(400).json({ error: 'targetLang is required' });
  }

  try {
    const startTime = Date.now();

    // 병렬 처리로 모든 텍스트 번역
    const translations = await Promise.all(
      texts.map(async (text, index) => {
        try {
          const context = translationMonitor.startRequest('batch', sourceLang, targetLang);
          const result = await translateText(text, targetLang, {
            sourceLang,
            ...options,
          });
          translationMonitor.endRequest(context, true, result.fromCache);
          
          return {
            index,
            original: text,
            translated: result.translatedText || result.text,
            sourceLang: result.detectedLanguage || sourceLang,
            fromCache: result.fromCache || false,
            success: true,
          };
        } catch (error) {
          return {
            index,
            original: text,
            error: error.message,
            success: false,
          };
        }
      })
    );

    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const successCount = translations.filter(t => t.success).length;
    const cacheHits = translations.filter(t => t.fromCache).length;

    return res.status(200).json({
      translations,
      stats: {
        total: texts.length,
        successful: successCount,
        failed: texts.length - successCount,
        cacheHits,
        cacheHitRate: `${(cacheHits / texts.length * 100).toFixed(1)}%`,
        totalTime: `${totalTime}ms`,
        avgTimePerText: `${(totalTime / texts.length).toFixed(0)}ms`,
      },
    });
  } catch (error) {
    console.error('[Batch Translation Error]', error);
    return res.status(500).json({ error: 'Batch translation failed', message: error.message });
  }
}

export default withErrorHandler(handler);
