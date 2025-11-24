/**
 * High-Quality Translation Service
 * Uses DeepL (highest quality) with OpenAI GPT-4 fallback
 */

const deepl = require('deepl-node');
const OpenAI = require('openai');

// DeepL 초기화 (최고 품질 번역)
let deeplTranslator = null;
if (process.env.DEEPL_API_KEY) {
  deeplTranslator = new deepl.Translator(process.env.DEEPL_API_KEY);
}

// OpenAI 초기화 (문맥 기반 번역)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
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
      console.warn('DeepL translation failed, falling back to OpenAI:', error.message);
    }
  }

  // 2순위: OpenAI GPT-4 Turbo (문맥 이해가 뛰어남)
  if (openai) {
    try {
      const systemPrompt = `You are a professional translator. Translate the following text to ${getLanguageName(targetLang)} naturally and accurately. ${context ? `Context: ${context}` : ''} ${glossary ? `Use these terms: ${JSON.stringify(glossary)}` : ''} Maintain the original tone and style.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3, // 낮은 온도로 일관성 유지
        max_tokens: 2000,
      });

      return {
        text: response.choices[0].message.content.trim(),
        provider: 'openai',
        quality: 'high',
      };
    } catch (error) {
      console.warn('OpenAI translation failed:', error.message);
    }
  }

  // 3순위: Google Translate API (v2)
  if (process.env.GOOGLE_TRANSLATE_API_KEY) {
    try {
      const { Translate } = require('@google-cloud/translate').v2;
      const translate = new Translate({ key: process.env.GOOGLE_TRANSLATE_API_KEY });

      const [translation] = await translate.translate(text, {
        from: sourceLang === 'auto' ? undefined : sourceLang,
        to: targetLang,
      });

      return {
        text: translation,
        provider: 'google',
        quality: 'medium',
      };
    } catch (error) {
      console.warn('Google Translate failed:', error.message);
    }
  }

  throw new Error('No translation service available. Please configure DEEPL_API_KEY, OPENAI_API_KEY, or GOOGLE_TRANSLATE_API_KEY.');
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

  // DeepL은 번역 시 자동으로 언어를 감지하므로, 더미 번역으로 감지
  if (deeplTranslator) {
    try {
      const result = await deeplTranslator.translateText(text, null, 'EN');
      return {
        language: result.detectedSourceLang?.toLowerCase() || 'unknown',
        confidence: 1,
        provider: 'deepl',
      };
    } catch (error) {
      console.warn('DeepL language detection failed:', error.message);
    }
  }

  // OpenAI로 언어 감지
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Detect the language of the following text and respond with only the ISO 639-1 language code (e.g., "en", "ko", "ja").' },
          { role: 'user', content: text.substring(0, 200) }
        ],
        temperature: 0,
        max_tokens: 10,
      });

      return {
        language: response.choices[0].message.content.trim().toLowerCase(),
        confidence: 0.9,
        provider: 'openai',
      };
    } catch (error) {
      console.warn('OpenAI language detection failed:', error.message);
    }
  }

  // 간단한 휴리스틱 감지
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
 * 번역 품질 평가
 */
async function evaluateTranslationQuality(original, translated, targetLang) {
  if (!openai) {
    return { score: null, feedback: 'Quality evaluation not available' };
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a translation quality evaluator. Rate the translation quality from 1-10 and provide brief feedback. Original language: auto-detect. Target language: ${getLanguageName(targetLang)}.`
        },
        {
          role: 'user',
          content: `Original: "${original}"\n\nTranslation: "${translated}"\n\nProvide a JSON response with "score" (1-10) and "feedback" (brief comment).`
        }
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.warn('Quality evaluation failed:', error.message);
    return { score: null, feedback: 'Evaluation failed' };
  }
}

module.exports = {
  translateHighQuality,
  translateBatch,
  detectLanguage,
  evaluateTranslationQuality,
  DEEPL_LANGUAGES,
};
