/**
 * High-Quality Translation Service v2.0
 * DeepL (최고 품질) → AI Model Manager (최적 모델 자동 선택) → Google Translate
 * ESM으로 통일, OpenAI 직접 의존성 제거
 */

import { generateWithBestModel } from './aiModelManager.js';
import { logger } from './logger.js';

// DeepL 초기화 (번역 전용 최고 품질 엔진)
let deeplTranslator = null;
if (process.env.DEEPL_API_KEY) {
  try {
    const { Translator } = await import('deepl-node');
    deeplTranslator = new Translator(process.env.DEEPL_API_KEY);
  } catch {
    logger.warn('[HighQualityTranslation]', 'deepl-node 로드 실패 — DeepL 비활성화');
  }
}

/**
 * DeepL 지원 언어 매핑
 */
const DEEPL_LANGUAGES = {
  'en': 'EN',
  'ja': 'JA',
  'zh-CN': 'ZH',
  'zh-TW': 'ZH',
  'es': 'ES',
  'fr': 'FR',
  'de': 'DE',
  'ru': 'RU',
  'pt': 'PT-PT',
  'pt-BR': 'PT-BR',
  'it': 'IT',
  'pl': 'PL',
  'nl': 'NL',
  'uk': 'UK',
  'cs': 'CS',
  'sv': 'SV',
  'da': 'DA',
  'fi': 'FI',
  'el': 'EL',
  'hu': 'HU',
  'ro': 'RO',
  'sk': 'SK',
  'sl': 'SL',
  'bg': 'BG',
  'et': 'ET',
  'lv': 'LV',
  'lt': 'LT',
  'id': 'ID',
  'tr': 'TR',
  'ko': 'KO',
  'nb': 'NB',
  'no': 'NB',
};

/**
 * 고품질 번역 (DeepL 우선, OpenAI 보조)
 * @param {string} text - 번역할 텍스트
 * @param {string} targetLang - 목표 언어
 * @param {string} sourceLang - 원본 언어 (자동 감지 시 'auto')
 * @param {object} options - 추가 옵션
 * @returns {Promise<object>} 번역 결과
 */
async function translateHighQuality(text, targetLang, sourceLang = 'auto', options = {}) {
  if (!text || text.trim() === '') {
    return { text: '', provider: 'none', quality: 'n/a' };
  }

  const {
    context = null,      // 문맥 정보
    formality = 'default', // 'formal' | 'informal' | 'default'
    preserveFormatting = true,
    glossary = null,     // 용어집
  } = options;

  // 1순위: DeepL (가장 자연스러운 번역)
  if (deeplTranslator && DEEPL_LANGUAGES[targetLang]) {
    try {
      const deeplOptions = {
        targetLang: DEEPL_LANGUAGES[targetLang],
        preserveFormatting,
      };

      if (sourceLang !== 'auto' && DEEPL_LANGUAGES[sourceLang]) {
        deeplOptions.sourceLang = DEEPL_LANGUAGES[sourceLang];
      }

      // formality 설정 (독일어, 프랑스어, 이탈리아어, 스페인어, 네덜란드어, 폴란드어, 포르투갈어, 러시아어 지원)
      if (formality !== 'default' && ['de', 'fr', 'it', 'es', 'nl', 'pl', 'pt', 'ru'].includes(targetLang)) {
        deeplOptions.formality = formality;
      }

      const result = await deeplTranslator.translateText(text, null, deeplOptions.targetLang, deeplOptions);
      
      return {
        text: result.text,
        provider: 'deepl',
        quality: 'highest',
        detectedSourceLang: result.detectedSourceLang?.toLowerCase(),
      };
    } catch (error) {
      logger.warn('[HighQualityTranslation]', `DeepL 실패 → AI 폴백: ${error.message}`);
    }
  }

  // 2순위: AI Model Manager (최신·최적 무료 모델 자동 선택)
  try {
    const glossaryHint = glossary ? `\nUSE THESE TERMS: ${JSON.stringify(glossary)}` : '';
    const contextHint = context ? `\nCONTEXT: ${context}` : '';
    const prompt = `You are a professional translator. Translate to ${getLanguageName(targetLang)} naturally and accurately.${contextHint}${glossaryHint}\nMaintain the original tone and style.\nProvide ONLY the translation, no commentary.\n\nTEXT:\n${text}`;

    const result = await generateWithBestModel(prompt, {
      maxTokens: Math.min(text.length * 3, 2000),
      preferFree: true,
    });
    return { text: result.text.trim(), provider: result.providerName, quality: 'high' };
  } catch (error) {
    logger.warn('[HighQualityTranslation]', `AI 번역 실패 → Google 폴백: ${error.message}`);
  }

  // 3순위: Google Translate REST API
  if (process.env.GOOGLE_TRANSLATE_API_KEY) {
    try {
      const params = new URLSearchParams({
        q: text, target: targetLang, format: 'text',
        key: process.env.GOOGLE_TRANSLATE_API_KEY,
      });
      if (sourceLang !== 'auto') params.set('source', sourceLang);
      const resp = await fetch(`https://translation.googleapis.com/language/translate/v2?${params}`,
        { signal: AbortSignal.timeout(15000) });
      if (!resp.ok) throw new Error(`Google Translate ${resp.status}`);
      const data = await resp.json();
      return { text: data.data.translations[0].translatedText, provider: 'google', quality: 'medium' };
    } catch (error) {
      logger.warn('[HighQualityTranslation]', `Google Translate 실패: ${error.message}`);
    }
  }

  throw new Error('No translation service available. Configure DEEPL_API_KEY, GOOGLE_GEMINI_API_KEY, or GOOGLE_TRANSLATE_API_KEY.');
}

/**
 * 배치 번역 (여러 텍스트를 한번에)
 */
async function translateBatch(texts, targetLang, sourceLang = 'auto', options = {}) {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }

  // DeepL 배치 번역 (최대 50개)
  if (deeplTranslator && DEEPL_LANGUAGES[targetLang] && texts.length <= 50) {
    try {
      const results = await deeplTranslator.translateText(
        texts,
        null,
        DEEPL_LANGUAGES[targetLang],
        { preserveFormatting: options.preserveFormatting !== false }
      );

      return results.map(r => ({
        text: r.text,
        provider: 'deepl',
        quality: 'highest',
      }));
    } catch (error) {
      console.warn('DeepL batch translation failed:', error.message);
    }
  }

  // 개별 번역 병렬 처리
  return await Promise.all(
    texts.map(text => translateHighQuality(text, targetLang, sourceLang, options))
  );
}

/**
 * 언어 감지 (DeepL 우선)
 */
async function detectLanguage(text) {
  if (!text || text.trim() === '') {
    return { language: 'unknown', confidence: 0 };
  }

  if (deeplTranslator) {
    try {
      const result = await deeplTranslator.translateText(text.substring(0, 100), null, 'EN');
      return {
        language: result.detectedSourceLang?.toLowerCase() || 'unknown',
        confidence: 1,
        provider: 'deepl',
      };
    } catch {
      // 폴백
    }
  }

  // AI Model Manager로 언어 감지
  try {
    const result = await generateWithBestModel(
      `Detect the language of this text. Respond ONLY with the ISO 639-1 code (e.g. "en","ko","ja"). If uncertain: "unknown".\n\n${text.substring(0, 200)}`,
      { maxTokens: 10, preferFree: true }
    );
    return {
      language: result.text.trim().toLowerCase(),
      confidence: 0.9,
      provider: result.providerName,
    };
  } catch {
    // 휴리스틱 폴백
  }

  return heuristicLanguageDetection(text);
}

/**
 * 휴리스틱 언어 감지 (백업)
 */
function heuristicLanguageDetection(text) {
  const sample = text.substring(0, 200);

  // 한글
  if (/[\uAC00-\uD7AF]/.test(sample)) {
    return { language: 'ko', confidence: 0.95, provider: 'heuristic' };
  }

  // 일본어
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(sample)) {
    return { language: 'ja', confidence: 0.95, provider: 'heuristic' };
  }

  // 중국어
  if (/[\u4E00-\u9FFF]/.test(sample)) {
    return { language: 'zh', confidence: 0.85, provider: 'heuristic' };
  }

  // 아랍어
  if (/[\u0600-\u06FF]/.test(sample)) {
    return { language: 'ar', confidence: 0.95, provider: 'heuristic' };
  }

  // 러시아어
  if (/[\u0400-\u04FF]/.test(sample)) {
    return { language: 'ru', confidence: 0.95, provider: 'heuristic' };
  }

  // 영어 (기본값)
  return { language: 'en', confidence: 0.5, provider: 'heuristic' };
}

/**
 * 언어 이름 가져오기
 */
function getLanguageName(code) {
  const names = {
    'ko': 'Korean',
    'en': 'English',
    'ja': 'Japanese',
    'zh-CN': 'Chinese (Simplified)',
    'zh-TW': 'Chinese (Traditional)',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'ru': 'Russian',
    'pt': 'Portuguese',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'bn': 'Bengali',
    'id': 'Indonesian',
    'vi': 'Vietnamese',
    'th': 'Thai',
    'tr': 'Turkish',
    'it': 'Italian',
    'pl': 'Polish',
    'nl': 'Dutch',
  };
  return names[code] || code;
}

/**
 * 번역 품질 평가 (AI Model Manager 활용)
 */
async function evaluateTranslationQuality(original, translated, targetLang) {
  try {
    const result = await generateWithBestModel(
      `Rate this translation quality 1-10 and give brief feedback.\nOriginal: "${original}"\nTranslation to ${getLanguageName(targetLang)}: "${translated}"\nRespond ONLY in JSON: {"score": <1-10>, "feedback": "<comment>"}`,
      { maxTokens: 150, preferFree: true }
    );
    const jsonMatch = result.text.match(/\{.*\}/s);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {
    // 무시
  }
  return { score: null, feedback: 'Evaluation failed' };
}

export {
  translateHighQuality,
  translateBatch,
  detectLanguage,
  evaluateTranslationQuality,
  DEEPL_LANGUAGES,
};
