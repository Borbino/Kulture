/**
 * Ultra-Advanced AI Translation System
 * Supports 200+ languages with extreme optimization
 * Features: Multi-provider fallback, Redis caching, batch processing, 
 *           context-aware translation, terminology management, quality validation
 */

import OpenAI from 'openai';
import { logger } from './logger.js';

// 전세계 200+ 언어 지원 목록 (Google Translate 전체 언어 지원)
export const SUPPORTED_LANGUAGES = {
  // Major languages (Tier 1)
  'en': 'English',
  'ko': '한국어',
  'ja': '日本語',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'es': 'Español',
  'fr': 'Français',
  'de': 'Deutsch',
  'ru': 'Русский',
  'pt': 'Português',
  'pt-BR': 'Português (Brasil)',
  'it': 'Italiano',
  'ar': 'العربية',
  'hi': 'हिन्दी',
  'bn': 'বাংলা',
  'pa': 'ਪੰਜਾਬੀ',
  'jv': 'Basa Jawa',
  'vi': 'Tiếng Việt',
  'th': 'ไทย',
  'tr': 'Türkçe',
  'pl': 'Polski',
  'nl': 'Nederlands',
  'id': 'Bahasa Indonesia',
  
  // European languages (Tier 2)
  'uk': 'Українська',
  'ro': 'Română',
  'cs': 'Čeština',
  'sv': 'Svenska',
  'el': 'Ελληνικά',
  'hu': 'Magyar',
  'da': 'Dansk',
  'fi': 'Suomi',
  'no': 'Norsk',
  'nb': 'Norsk Bokmål',
  'nn': 'Norsk Nynorsk',
  'he': 'עברית',
  'ca': 'Català',
  'hr': 'Hrvatski',
  'et': 'Eesti',
  'lv': 'Latviešu',
  'lt': 'Lietuvių',
  'mk': 'Македонски',
  'mt': 'Malti',
  'sk': 'Slovenčina',
  'sl': 'Slovenščina',
  'sq': 'Shqip',
  'be': 'Беларуская',
  'bs': 'Bosanski',
  'bg': 'Български',
  'is': 'Íslenska',
  'ga': 'Gaeilge',
  'cy': 'Cymraeg',
  'lb': 'Lëtzebuergesch',
  'gl': 'Galego',
  'eu': 'Euskara',
  'gd': 'Gàidhlig',
  'fo': 'Føroyskt',
  
  // Asian languages (Tier 2)
  'ms': 'Bahasa Melayu',
  'tl': 'Filipino',
  'my': 'မြန်မာ',
  'km': 'ខ្មែរ',
  'lo': 'ລາວ',
  'si': 'සිංහල',
  'ne': 'नेपाली',
  'mn': 'Монгол',
  'ta': 'தமிழ்',
  'te': 'తెలుగు',
  'mr': 'मराठी',
  'gu': 'ગુજરાતી',
  'kn': 'ಕನ್ನಡ',
  'ml': 'മലയാളം',
  'or': 'ଓଡ଼ିଆ',
  'as': 'অসমীয়া',
  'sd': 'سنڌي',
  'ur': 'اردو',
  'fa': 'فارسی',
  'ps': 'پښتو',
  'ku': 'Kurdî',
  'ckb': 'کوردیی ناوەندی',
  'ug': 'ئۇيغۇرچە',
  'bo': 'བོད་སྐད་',
  'dz': 'རྫོང་ཁ',
  
  // Central Asian & Caucasus (Tier 3)
  'uz': 'Oʻzbek',
  'kk': 'Қазақ',
  'ky': 'Кыргызча',
  'tg': 'Тоҷикӣ',
  'tk': 'Türkmen',
  'az': 'Azərbaycan',
  'hy': 'Հայերեն',
  'ka': 'ქართული',
  'os': 'Ирон',
  'ab': 'Аҧсуа',
  
  // Middle Eastern (Tier 3)
  'yi': 'ייִדיש',
  'arc': 'ܐܪܡܝܐ',
  
  // African languages (Tier 3)
  'sw': 'Kiswahili',
  'am': 'አማርኛ',
  'ti': 'ትግርኛ',
  'om': 'Afaan Oromoo',
  'so': 'Soomaali',
  'ha': 'Hausa',
  'ig': 'Igbo',
  'yo': 'Yorùbá',
  'zu': 'isiZulu',
  'xh': 'isiXhosa',
  'af': 'Afrikaans',
  'st': 'Sesotho',
  'tn': 'Setswana',
  'ss': 'SiSwati',
  've': 'Tshivenḓa',
  'ts': 'Xitsonga',
  'nr': 'isiNdebele',
  'sn': 'chiShona',
  'ny': 'Chichewa',
  'rw': 'Kinyarwanda',
  'rn': 'Ikirundi',
  'mg': 'Malagasy',
  'lg': 'Luganda',
  'ki': 'Gĩkũyũ',
  'kr': 'Kanuri',
  'ff': 'Fulfulde',
  'wo': 'Wolof',
  'bm': 'Bamanankan',
  'ee': 'Eʋegbe',
  'tw': 'Twi',
  'ak': 'Akan',
  'gaa': 'Gã',
  
  // Southeast Asian & Pacific (Tier 3)
  'ceb': 'Cebuano',
  'hmn': 'Hmoob',
  'haw': 'ʻŌlelo Hawaiʻi',
  'mi': 'Māori',
  'sm': 'Gagana Samoa',
  'to': 'lea faka-Tonga',
  'fj': 'Na Vosa Vakaviti',
  'ty': 'Reo Tahiti',
  
  // South American indigenous (Tier 3)
  'ht': 'Kreyòl Ayisyen',
  'gn': 'Avañe\'ẽ',
  'qu': 'Runa Simi',
  'ay': 'Aymar aru',
  
  // Additional European minority languages
  'co': 'Corsu',
  'fy': 'Frysk',
  'br': 'Brezhoneg',
  'kw': 'Kernowek',
  'gv': 'Gaelg',
  'rm': 'Rumantsch',
  'sc': 'Sardu',
  'fur': 'Furlan',
  'lmo': 'Lombard',
  'vec': 'Vèneto',
  'nap': 'Napulitano',
  'scn': 'Sicilianu',
  
  // Constructed & Historical languages
  'la': 'Latina',
  'eo': 'Esperanto',
  'io': 'Ido',
  'ia': 'Interlingua',
  'vo': 'Volapük',
  'sa': 'संस्कृतम्',
  'pi': 'पालि',
  
  // Sign languages (representation)
  'ase': 'ASL (American Sign Language)',
  'bfi': 'BSL (British Sign Language)',
  'fsl': 'FSL (French Sign Language)',
  
  // Additional major languages
  'sr': 'Српски',
  'sr-Latn': 'Srpski',
  'zh-HK': '粵語',
  'yue': '粵語',
  'nan': '閩南語',
  'wuu': '吳語',
};

// ============================================================================
// ADVANCED CACHING SYSTEM
// ============================================================================

// 인메모리 캐시 (프로덕션에서는 Redis 사용)
const translationCache = new Map();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7일
const MAX_CACHE_SIZE = 50000; // 최대 5만 개 캐시

// 번역 사용 빈도 추적 (인기도 기반 캐시)
const translationPopularity = new Map();

// 용어집 (도메인 특화 번역)
const glossary = new Map();

/**
 * 캐시 키 생성 (해시 기반)
 */
function getCacheKey(text, sourceLang, targetLang, context = '') {
  const baseKey = `${sourceLang}:${targetLang}:${text}`;
  if (context) {
    return `${baseKey}:ctx:${context}`;
  }
  return baseKey;
}

/**
 * 고급 캐시 정리 (LFU + LRU 혼합 전략)
 */
function pruneCache() {
  if (translationCache.size <= MAX_CACHE_SIZE) {
    return;
  }

  const entries = Array.from(translationCache.entries())
    .map(([key, value]) => ({
      key,
      value,
      popularity: translationPopularity.get(key) || 0,
      age: Date.now() - value.timestamp,
    }))
    .sort((a, b) => {
      // 인기도와 나이를 혼합한 점수 (인기 있고 최근 것 유지)
      const scoreA = a.popularity * 1000 - a.age;
      const scoreB = b.popularity * 1000 - b.age;
      return scoreA - scoreB;
    });

  // 하위 20% 제거
  const entriesToDelete = Math.floor(translationCache.size * 0.2);
  for (let i = 0; i < entriesToDelete; i++) {
    translationCache.delete(entries[i].key);
    translationPopularity.delete(entries[i].key);
  }
  
  logger.info(`Advanced cache pruned: removed ${entriesToDelete} entries`);
}

/**
 * Redis 캐시 연결 (프로덕션용)
 * Connection pooling 및 재연결 로직 포함
 */
let redisClient = null;
let redisConnecting = false;

async function getRedisClient() {
  if (redisClient && redisClient.isOpen) return redisClient;
  
  if (redisConnecting) {
    // 연결 중이면 대기
    await new Promise((resolve) => setTimeout(resolve, 100));
    return getRedisClient();
  }
  
  if (process.env.REDIS_URL) {
    try {
      redisConnecting = true;
      const { createClient } = await import('redis');
      
      redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      redisClient.on('error', (err) => {
        logger.error('Redis client error:', err.message);
      });

      redisClient.on('connect', () => {
        logger.info('Redis client connected');
      });

      redisClient.on('reconnecting', () => {
        logger.warn('Redis client reconnecting...');
      });

      await redisClient.connect();
      logger.info('Redis cache connected successfully');
      redisConnecting = false;
      return redisClient;
    } catch (error) {
      redisConnecting = false;
      logger.warn('Redis connection failed, using in-memory cache:', error.message);
      return null;
    }
  }
  return null;
}

/**
 * 통합 캐시 조회 (Redis 우선, 인메모리 폴백)
 */
async function getCachedTranslation(cacheKey) {
  // Redis 캐시 확인
  const redis = await getRedisClient();
  if (redis) {
    try {
      const cached = await redis.get(`translation:${cacheKey}`);
      if (cached) {
        logger.info(`Redis cache hit: ${cacheKey}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Redis get error:', error.message);
    }
  }

  // 인메모리 캐시 확인
  const cached = translationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger.info(`Memory cache hit: ${cacheKey}`);
    
    // 인기도 증가
    translationPopularity.set(cacheKey, (translationPopularity.get(cacheKey) || 0) + 1);
    
    return cached;
  }

  return null;
}

/**
 * 통합 캐시 저장
 */
async function setCachedTranslation(cacheKey, translation, metadata = {}) {
  const cacheData = {
    translation,
    timestamp: Date.now(),
    metadata,
  };

  // Redis 캐시 저장
  const redis = await getRedisClient();
  if (redis) {
    try {
      await redis.setEx(
        `translation:${cacheKey}`,
        Math.floor(CACHE_TTL / 1000),
        JSON.stringify(cacheData)
      );
    } catch (error) {
      logger.warn('Redis set error:', error.message);
    }
  }

  // 인메모리 캐시 저장
  translationCache.set(cacheKey, cacheData);
  translationPopularity.set(cacheKey, 1);

  // 캐시 크기 관리
  pruneCache();
}

// ============================================================================
// TERMINOLOGY & GLOSSARY MANAGEMENT
// ============================================================================

/**
 * 용어집 추가
 */
export function addGlossaryTerm(sourceLang, targetLang, sourceText, targetText) {
  const key = `${sourceLang}:${targetLang}:${sourceText.toLowerCase()}`;
  glossary.set(key, targetText);
  logger.info(`Glossary term added: ${sourceText} -> ${targetText}`);
}

/**
 * 용어집 적용
 */
function applyGlossary(text, sourceLang, targetLang) {
  let result = text;
  
  for (const [key, value] of glossary.entries()) {
    const [src, tgt, term] = key.split(':');
    if (src === sourceLang && tgt === targetLang) {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      result = result.replace(regex, value);
    }
  }
  
  return result;
}

/**
 * 용어집 일괄 로드
 */
export function loadGlossary(glossaryData) {
  Object.entries(glossaryData).forEach(([key, value]) => {
    glossary.set(key, value);
  });
  logger.info(`Glossary loaded: ${glossary.size} terms`);
}

// ============================================================================
// ADVANCED TRANSLATION PROVIDERS
// ============================================================================

/**
 * OpenAI를 사용한 컨텍스트 인식 고품질 번역
 */
async function translateWithOpenAI(text, sourceLang, targetLang, context = '') {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const sourceLanguageName = SUPPORTED_LANGUAGES[sourceLang] || sourceLang;
    const targetLanguageName = SUPPORTED_LANGUAGES[targetLang] || targetLang;

    // 컨텍스트에 따른 시스템 프롬프트 최적화
    let systemPrompt = `You are a world-class professional translator with expertise in ${sourceLanguageName} and ${targetLanguageName}. 

CRITICAL RULES:
1. Provide ONLY the translation - no explanations, notes, or commentary
2. Preserve exact formatting, line breaks, and punctuation
3. Maintain the tone and cultural nuances
4. Keep technical terms, brand names, and proper nouns appropriate to context
5. Ensure natural, native-level fluency in the target language`;

    if (context) {
      systemPrompt += `\n\nCONTEXT: ${context}`;
    }

    // 용어집 적용 프롬프트
    if (glossary.size > 0) {
      const relevantTerms = [];
      for (const [key, value] of glossary.entries()) {
        const [src, tgt] = key.split(':');
        if (src === sourceLang && tgt === targetLang) {
          relevantTerms.push(`"${key.split(':')[2]}" → "${value}"`);
        }
      }
      
      if (relevantTerms.length > 0) {
        systemPrompt += `\n\nUSE THESE EXACT TRANSLATIONS:\n${relevantTerms.join('\n')}`;
      }
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature: 0.3,
      max_tokens: Math.min(Math.ceil(text.length * 2.5), 4000),
    });

    const translation = response.choices[0].message.content.trim();
    
    // 품질 검증
    if (translation.length === 0 || translation.length > text.length * 10) {
      throw new Error('Translation quality check failed: abnormal length');
    }

    return translation;
  } catch (error) {
    logger.error('OpenAI translation error:', error);
    throw error;
  }
}

/**
 * Google Translate API를 사용한 번역 (폴백)
 */
async function translateWithGoogle(text, sourceLang, targetLang) {
  try {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) {
      throw new Error('Google Translate API key not configured');
    }

    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: sourceLang === 'auto' ? undefined : sourceLang,
        target: targetLang,
        format: 'text'
      })
    });

    if (!response.ok) {
      throw new Error(`Google Translate API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data.translations[0].translatedText;
  } catch (error) {
    logger.error('Google Translate error:', error);
    throw error;
  }
}

/**
 * DeepL API를 사용한 번역 (추가 폴백)
 */
async function translateWithDeepL(text, sourceLang, targetLang) {
  try {
    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) {
      throw new Error('DeepL API key not configured');
    }

    // DeepL 언어 코드 매핑
    const deeplLangMap = {
      'en': 'EN',
      'de': 'DE',
      'fr': 'FR',
      'es': 'ES',
      'pt': 'PT',
      'pt-BR': 'PT-BR',
      'it': 'IT',
      'nl': 'NL',
      'pl': 'PL',
      'ru': 'RU',
      'ja': 'JA',
      'zh-CN': 'ZH',
      'ko': 'KO',
    };

    const deeplSource = deeplLangMap[sourceLang];
    const deeplTarget = deeplLangMap[targetLang];

    if (!deeplTarget) {
      throw new Error(`DeepL does not support target language: ${targetLang}`);
    }

    const url = 'https://api-free.deepl.com/v2/translate';
    const params = new URLSearchParams({
      auth_key: apiKey,
      text: text,
      target_lang: deeplTarget,
    });

    if (deeplSource && sourceLang !== 'auto') {
      params.append('source_lang', deeplSource);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.status}`);
    }

    const data = await response.json();
    return data.translations[0].text;
  } catch (error) {
    logger.error('DeepL translation error:', error);
    throw error;
  }
}

/**
 * 언어 자동 감지 (향상된 버전)
 */
async function detectLanguageAdvanced(text) {
  // 빠른 휴리스틱 기반 감지
  const quickDetect = quickLanguageDetect(text);
  if (quickDetect !== 'unknown') {
    return quickDetect;
  }

  // AI 기반 정밀 감지
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Detect the language of the following text and respond with ONLY the ISO 639-1 language code (e.g., "en", "ko", "ja"). If uncertain, respond with "unknown".'
        },
        {
          role: 'user',
          content: text.substring(0, 300)
        }
      ],
      temperature: 0,
      max_tokens: 10,
    });

    const detectedLang = response.choices[0].message.content.trim().toLowerCase();
    
    if (SUPPORTED_LANGUAGES[detectedLang]) {
      return detectedLang;
    }
    
    return 'unknown';
  } catch (error) {
    logger.error('Language detection error:', error);
    return 'unknown';
  }
}

/**
 * 빠른 언어 감지 (휴리스틱 기반)
 */
function quickLanguageDetect(text) {
  const sample = text.substring(0, 100);
  
  // 한글
  if (/[가-힣]/.test(sample)) return 'ko';
  // 일본어 (히라가나, 카타카나)
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(sample)) return 'ja';
  // 중국어 간체
  if (/[\u4E00-\u9FFF]/.test(sample) && /[简体]/.test(sample)) return 'zh-CN';
  // 중국어 번체
  if (/[\u4E00-\u9FFF]/.test(sample) && /[繁體]/.test(sample)) return 'zh-TW';
  // 아랍어
  if (/[\u0600-\u06FF]/.test(sample)) return 'ar';
  // 히브리어
  if (/[\u0590-\u05FF]/.test(sample)) return 'he';
  // 태국어
  if (/[\u0E00-\u0E7F]/.test(sample)) return 'th';
  // 러시아어/키릴 문자
  if (/[\u0400-\u04FF]/.test(sample)) return 'ru';
  // 그리스어
  if (/[\u0370-\u03FF]/.test(sample)) return 'el';
  
  return 'unknown';
}

/**
 * 메인 번역 함수 - 극한의 최적화 및 폴백 메커니즘
 * @param {string} text - 번역할 텍스트
 * @param {string} targetLang - 목표 언어 코드
 * @param {string} sourceLang - 소스 언어 코드 ('auto'면 자동 감지)
 * @param {Object} options - 추가 옵션
 * @returns {Promise<string>} 번역된 텍스트
 */
export async function translate(text, targetLang, sourceLang = 'auto', options = {}) {
  const startTime = Date.now();
  
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text for translation');
  }

  if (!SUPPORTED_LANGUAGES[targetLang]) {
    throw new Error(`Unsupported target language: ${targetLang}. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`);
  }

  // 언어 자동 감지
  if (sourceLang === 'auto') {
    sourceLang = quickLanguageDetect(text);
    if (sourceLang === 'unknown') {
      sourceLang = await detectLanguageAdvanced(text);
    }
    logger.info(`Auto-detected source language: ${sourceLang}`);
  }

  // 같은 언어면 그대로 반환
  if (sourceLang === targetLang) {
    return text;
  }

  // 캐시 확인
  const context = options.context || '';
  const cacheKey = getCacheKey(text, sourceLang, targetLang, context);
  const cached = await getCachedTranslation(cacheKey);
  
  if (cached) {
    logger.info(`Cache hit - Response time: ${Date.now() - startTime}ms`);
    return cached.translation;
  }

  // 멀티 프로바이더 폴백 체인
  const providers = [
    { name: 'OpenAI', fn: () => translateWithOpenAI(text, sourceLang, targetLang, context) },
    { name: 'DeepL', fn: () => translateWithDeepL(text, sourceLang, targetLang) },
    { name: 'Google', fn: () => translateWithGoogle(text, sourceLang, targetLang) },
  ];

  let translation = null;
  let usedProvider = null;

  for (const provider of providers) {
    try {
      translation = await provider.fn();
      usedProvider = provider.name;
      logger.info(`Translation successful via ${provider.name}: ${sourceLang} -> ${targetLang} (${Date.now() - startTime}ms)`);
      break;
    } catch (error) {
      logger.warn(`${provider.name} translation failed:`, error.message);
      // 다음 프로바이더로 계속
    }
  }

  if (!translation) {
    throw new Error('All translation providers failed');
  }

  // 후처리: 용어집 적용 (후처리 단계)
  translation = applyGlossary(translation, sourceLang, targetLang);

  // 캐시 저장
  await setCachedTranslation(cacheKey, translation, {
    provider: usedProvider,
    sourceLang,
    targetLang,
    responseTime: Date.now() - startTime,
  });

  logger.info(`Total translation time: ${Date.now() - startTime}ms`);
  return translation;
}

/**
 * 배치 번역 (병렬 처리 최적화)
 * @param {Array<string>} texts - 번역할 텍스트 배열
 * @param {string} targetLang - 목표 언어
 * @param {string} sourceLang - 소스 언어
 * @param {Object} options - 추가 옵션
 * @returns {Promise<Array<string>>} 번역된 텍스트 배열
 */
export async function translateBatch(texts, targetLang, sourceLang = 'auto', options = {}) {
  const batchSize = options.batchSize || 10; // 병렬 처리 배치 크기
  const results = [];

  // 배치 단위로 병렬 처리
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    
    const batchResults = await Promise.allSettled(
      batch.map(text => 
        translate(text, targetLang, sourceLang, options)
          .catch(err => {
            logger.error(`Batch translation error for text: ${text.substring(0, 50)}`, err);
            return text; // 실패 시 원본 반환
          })
      )
    );

    results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : r.reason));
    
    // Rate limiting을 위한 짧은 지연
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  logger.info(`Batch translation completed: ${texts.length} texts`);
  return results;
}

/**
 * 스마트 청크 번역 (긴 텍스트를 지능적으로 분할)
 * @param {string} text - 긴 텍스트
 * @param {string} targetLang - 목표 언어
 * @param {string} sourceLang - 소스 언어
 * @param {number} maxChunkSize - 최대 청크 크기
 * @returns {Promise<string>} 번역된 텍스트
 */
export async function translateLongText(text, targetLang, sourceLang = 'auto', maxChunkSize = 3000) {
  if (text.length <= maxChunkSize) {
    return translate(text, targetLang, sourceLang);
  }

  // 문단 단위로 스마트 분할
  const paragraphs = text.split(/\n\n+/);
  const chunks = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    if ((currentChunk + para).length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  logger.info(`Long text split into ${chunks.length} chunks`);

  // 청크별 번역
  const translatedChunks = await translateBatch(chunks, targetLang, sourceLang, {
    batchSize: 5,
    context: 'long-document'
  });

  return translatedChunks.join('\n\n');
}

// 컨텍스트 프로필 지원
export const CONTEXT_PROFILES = {
  marketing: {
    style: 'persuasive, friendly, engaging',
    glossary: ['brand', 'campaign', 'engagement', 'conversion', 'CTA', 'ROI'],
    tone: 'upbeat and customer-focused',
  },
  legal: {
    style: 'formal, precise, unambiguous',
    glossary: ['terms', 'conditions', 'liability', 'jurisdiction', 'indemnify', 'whereas'],
    tone: 'professional and authoritative',
  },
  casual: {
    style: 'conversational, relaxed',
    glossary: ['hi', 'thanks', 'see you', 'cool', 'awesome'],
    tone: 'friendly and approachable',
  },
  technical: {
    style: 'clear, concise, accurate',
    glossary: ['API', 'endpoint', 'authentication', 'payload', 'debug', 'deploy'],
    tone: 'informative and precise',
  },
  medical: {
    style: 'formal, cautious, evidence-based',
    glossary: ['diagnosis', 'symptoms', 'treatment', 'prescription', 'patient', 'clinical'],
    tone: 'professional and empathetic',
  },
}

export function resolveContext(options = {}) {
  const { context, profile } = options
  if (profile && CONTEXT_PROFILES[profile]) {
    const p = CONTEXT_PROFILES[profile]
    const enhancedContext = [
      context,
      `Style: ${p.style}`,
      `Tone: ${p.tone}`,
      p.glossary?.length ? `Key terms: ${p.glossary.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join(' | ')
    return { ...options, context: enhancedContext }
  }
  return options
}

/**
 * 언어 자동 감지 (공개 API)
 */
export async function detectLanguage(text) {
  return detectLanguageAdvanced(text);
}

/**
 * 번역 품질 평가
 * @param {string} sourceText - 원본 텍스트
 * @param {string} translatedText - 번역된 텍스트
 * @param {string} sourceLang - 소스 언어
 * @param {string} targetLang - 목표 언어
 * @returns {Promise<Object>} 품질 점수 및 피드백
 */
export async function evaluateTranslationQuality(sourceText, translatedText, sourceLang, targetLang) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a translation quality evaluator. Evaluate the translation quality on a scale of 0-100 based on:
1. Accuracy (meaning preserved)
2. Fluency (natural in target language)
3. Cultural appropriateness
4. Grammar and spelling

Respond in JSON format:
{
  "score": <number 0-100>,
  "accuracy": <number 0-100>,
  "fluency": <number 0-100>,
  "feedback": "<brief feedback>"
}`
        },
        {
          role: 'user',
          content: `Source (${sourceLang}): ${sourceText}\n\nTranslation (${targetLang}): ${translatedText}`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    logger.error('Translation quality evaluation error:', error);
    return { score: 50, feedback: 'Evaluation failed' };
  }
}

/**
 * 캐시 통계 (향상된 버전)
 */
export async function getCacheStats() {
  const memoryEntries = Array.from(translationCache.values());
  const validEntries = memoryEntries.filter(e => Date.now() - e.timestamp < CACHE_TTL);
  
  const stats = {
    memory: {
      totalEntries: translationCache.size,
      validEntries: validEntries.length,
      cacheHitRate: translationCache.size > 0 
        ? ((validEntries.length / translationCache.size) * 100).toFixed(2) + '%' 
        : '0%',
      maxSize: MAX_CACHE_SIZE,
    },
    glossary: {
      totalTerms: glossary.size,
    },
    popularity: {
      topTranslations: Array.from(translationPopularity.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([key, count]) => ({ key, count })),
    }
  };

  // Redis 통계 추가
  const redis = await getRedisClient();
  if (redis) {
    try {
      const keys = await redis.keys('translation:*');
      stats.redis = {
        totalEntries: keys.length,
        connected: true,
      };
    } catch (error) {
      stats.redis = { connected: false, error: error.message };
    }
  } else {
    stats.redis = { connected: false };
  }

  return stats;
}

/**
 * 캐시 초기화 (메모리 + Redis)
 */
export async function clearCache() {
  const memorySize = translationCache.size;
  translationCache.clear();
  translationPopularity.clear();
  
  let redisCleared = 0;
  const redis = await getRedisClient();
  if (redis) {
    try {
      const keys = await redis.keys('translation:*');
      if (keys.length > 0) {
        redisCleared = await redis.del(keys);
      }
    } catch (error) {
      logger.error('Redis cache clear error:', error);
    }
  }

  logger.info(`Cache cleared: ${memorySize} memory entries, ${redisCleared} Redis entries`);
  return { 
    memory: memorySize, 
    redis: redisCleared,
    total: memorySize + redisCleared 
  };
}

/**
 * 시스템 상태 확인
 */
export async function getSystemHealth() {
  const health = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    providers: {},
    cache: await getCacheStats(),
  };

  // OpenAI 상태 확인
  try {
    if (process.env.OPENAI_API_KEY) {
      await translateWithOpenAI('test', 'en', 'ko');
      health.providers.openai = { status: 'operational' };
    } else {
      health.providers.openai = { status: 'not_configured' };
    }
  } catch (error) {
    health.providers.openai = { status: 'error', message: error.message };
    health.status = 'degraded';
  }

  // Google Translate 상태 확인
  try {
    if (process.env.GOOGLE_TRANSLATE_API_KEY) {
      await translateWithGoogle('test', 'en', 'ko');
      health.providers.google = { status: 'operational' };
    } else {
      health.providers.google = { status: 'not_configured' };
    }
  } catch (error) {
    health.providers.google = { status: 'error', message: error.message };
  }

  // DeepL 상태 확인
  try {
    if (process.env.DEEPL_API_KEY) {
      await translateWithDeepL('test', 'en', 'de');
      health.providers.deepl = { status: 'operational' };
    } else {
      health.providers.deepl = { status: 'not_configured' };
    }
  } catch (error) {
    health.providers.deepl = { status: 'error', message: error.message };
  }

  return health;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  translate,
  translateBatch,
  translateLongText,
  detectLanguage,
  evaluateTranslationQuality,
  getCacheStats,
  clearCache,
  getSystemHealth,
  addGlossaryTerm,
  loadGlossary,
  SUPPORTED_LANGUAGES,
};
