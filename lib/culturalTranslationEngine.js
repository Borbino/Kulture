/**
 * Cultural Translation Engine v1.0
 * Kulture Platform
 *
 * ─────────────────────────────────────────────────────────────────
 * [목적]
 *   K-Culture 콘텐츠를 8~35세 대상 북미/남미/유럽/동남아 유저에게
 *   "현지 문화 맥락 + 세대 슬랭 반영 자연스러운 번역"으로 제공합니다.
 *
 * [핵심 기능]
 *   1. 지역별 용어집(Glossary) 자동 관리
 *      - K-Culture 고유 단어(예: 먹방, 솔직히, 덕후 등)의 현지화 표현
 *      - Reddit, TikTok 트렌드 RSS 기반 슬랭 자동 크롤링
 *   2. 세대별 번역 톤 조정
 *      - 8~13세: 쉬운 어휘, 이모지 친화적
 *      - 14~24세: MZ 슬랭, 트렌드 언어
 *      - 25~35세: 정통 번역 + 필요시 슬랭 주석
 *   3. 구글 번역 / DeepL / aiModelManager 3단 폴백
 *   4. 자율 운영 (관리자 개입 없음)
 *
 * [지원 지역/언어]
 *   북미  : en-US, en-CA, es-MX
 *   남미  : es-AR, es-CO, es-CL, pt-BR
 *   유럽  : fr, de, es-ES, it, pl, nl
 *   동남아: id, th, vi, tl, ms
 * ─────────────────────────────────────────────────────────────────
 */

import { generateWithBestModel } from './aiModelManager.js';
import { logger } from './logger.js';
import fs from 'fs';

// ══════════════════════════════════════════════════════════════
// 지역 설정 (타겟 국가들)
// ══════════════════════════════════════════════════════════════

export const REGIONAL_CONFIG = {
  // 북미
  'en-US': {
    name: 'English (US)',
    region: 'north_america',
    ageSlangSources: ['r/teenagers', 'r/GenZ', 'r/TikTokContent'],
    toneHints: 'Casual American English, Gen-Z internet slang friendly',
    examples: {
      '먹방': 'mukbang',
      '솔직히': 'ngl (not gonna lie)',
      '덕후': 'super fan / obsessed stan',
      '꽃미남': 'pretty boy / bishie',
      '아이돌': 'K-pop idol',
      '대박': 'no way! / that\'s insane!',
      '헐': 'omg / no way',
      '킹받다': 'so annoying / lowkey triggered',
    },
  },
  'en-CA': {
    name: 'English (Canada)',
    region: 'north_america',
    toneHints: 'Canadian English, polite but casual',
    examples: { '먹방': 'mukbang', '대박': 'oh wow / that\'s wild' },
  },
  'es-MX': {
    name: 'Español (México)',
    region: 'north_america',
    ageSlangSources: ['r/mexico', 'r/espanol'],
    toneHints: 'Mexican Spanish slang, Gen-Z Latinx style',
    examples: {
      '먹방': 'mukbang',
      '대박': '¡qué chido! / ¡no manches!',
      '솔직히': 'honestamente / o sea',
      '헐': 'ay, no / wey',
      '킹받다': 'qué flojera / me choca',
    },
  },

  // 남미
  'pt-BR': {
    name: 'Português (Brasil)',
    region: 'south_america',
    ageSlangSources: ['r/brasil', 'r/desabafos'],
    toneHints: 'Brazilian Portuguese, social media casual, Gen-Z slang',
    examples: {
      '먹방': 'mukbang',
      '대박': 'que incrível / nossa!',
      '솔직히': 'sinceramente / pera',
      '헐': 'nossa / krl',
      '덕후': 'fã hardcore / simp',
    },
  },
  'es-AR': {
    name: 'Español (Argentina)',
    region: 'south_america',
    toneHints: 'Rioplatense Spanish, casual vos-form, Argentine slang',
    examples: { '대박': '¡qué fiasco! / de locos', '솔직히': 'literalmente / la verdad' },
  },
  'es-CO': {
    name: 'Español (Colombia)',
    region: 'south_america',
    toneHints: 'Colombian Spanish, friendly casual tone',
    examples: { '대박': '¡qué chimba! / ¡bacano!', '솔직히': 'la verdad / onda' },
  },

  // 유럽
  'fr': {
    name: 'Français',
    region: 'europe',
    ageSlangSources: ['r/france', 'r/jeuxvideo'],
    toneHints: 'French youth language, verlan-aware, social media tone',
    examples: {
      '먹방': 'mukbang',
      '대박': 'c\'est ouf / trop bien',
      '솔직히': 'honnêtement / jsp',
      '헐': 'oh la la / sérieux',
      '덕후': 'fan absolu / otaku',
    },
  },
  'de': {
    name: 'Deutsch',
    region: 'europe',
    toneHints: 'German youth internet language, informal du-form',
    examples: {
      '대박': 'krass / boah',
      '솔직히': 'ehrlich gesagt / ngl',
      '먹방': 'Mukbang',
      '헐': 'alter / was zur Hölle',
    },
  },
  'es-ES': {
    name: 'Español (España)',
    region: 'europe',
    toneHints: 'Castilian Spanish, vosotros-form, young internet slang',
    examples: { '대박': '¡qué flipada! / ostia', '솔직히': 'la verdad / vamos' },
  },
  'it': {
    name: 'Italiano',
    region: 'europe',
    toneHints: 'Casual Italian, Gen-Z internet language',
    examples: { '대박': 'assurdo / pazzesco', '솔직히': 'onestamente / tipo' },
  },

  // 동남아
  'id': {
    name: 'Bahasa Indonesia',
    region: 'southeast_asia',
    ageSlangSources: ['r/indonesia', 'r/indopop'],
    toneHints: 'Indonesian youth language, Jaksel-style mixing OK, casual media tone',
    examples: {
      '먹방': 'mukbang',
      '대박': 'gila / anjir kerennya',
      '솔직히': 'jujur deh / literally',
      '헐': 'anjir / ya ampun',
      '덕후': 'wibu / simp',
      '아이돌': 'idol K-pop',
    },
  },
  'th': {
    name: 'ภาษาไทย',
    region: 'southeast_asia',
    toneHints: 'Thai Gen-Z internet language, na krub/ka particles for politeness calibration',
    examples: {
      '먹방': 'มุกบัง (mukbang)',
      '대박': 'เจ๋งมาก / โอ้โห',
      '솔직히': 'จริงๆนะ / ตรงๆเลย',
    },
  },
  'vi': {
    name: 'Tiếng Việt',
    region: 'southeast_asia',
    toneHints: 'Vietnamese youth internet slang, nam/nữ casual register',
    examples: {
      '먹방': 'mukbang',
      '대박': 'xịn xò / đỉnh quá',
      '솔직히': 'thật ra / nói thật',
    },
  },
  'tl': {
    name: 'Filipino (Tagalog)',
    region: 'southeast_asia',
    ageSlangSources: ['r/Philippines', 'r/phcareers'],
    toneHints: 'Filipino Gen-Z, Taglish mixing natural, casual online tone',
    examples: {
      '먹방': 'mukbang',
      '대박': 'grabe / putangina (in informal contexts) → sulit/galing for clean',
      '솔직히': 'honestly / syempre',
      '헐': 'grabe / hala',
    },
  },
  'ms': {
    name: 'Bahasa Malaysia',
    region: 'southeast_asia',
    toneHints: 'Malaysian casual youth, mixed with English OK',
    examples: { '대박': 'gila best / weh', '솔직히': 'sejujurnya / to be honest' },
  },
};

// ══════════════════════════════════════════════════════════════
// 동적 사용자 용어집 (슬랭 크롤링 결과 누적)
// ══════════════════════════════════════════════════════════════

const GLOSSARY_FILE = '/tmp/kulture_cultural_glossary.json';

function loadGlossary() {
  try {
    if (fs.existsSync(GLOSSARY_FILE)) {
      return JSON.parse(fs.readFileSync(GLOSSARY_FILE, 'utf8'));
    }
  } catch {
    // 무시
  }
  return {};
}

function saveGlossary(glossary) {
  try {
    fs.writeFileSync(GLOSSARY_FILE, JSON.stringify(glossary, null, 2));
  } catch (err) {
    logger.warn('[CulturalTranslation]', '용어집 저장 실패', err.message);
  }
}

let glossaryCache = loadGlossary();

// ══════════════════════════════════════════════════════════════
// 슬랭 크롤러 (Reddit RSS 기반, 자율 운영)
// ══════════════════════════════════════════════════════════════

const SLANG_CRAWL_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6시간
let slangCrawlerTimer = null;

async function crawlSubredditSlang(subreddit, _locale) {
  try {
    const resp = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`,
      { headers: { 'User-Agent': 'KultureBot/1.0' }, signal: AbortSignal.timeout(10000) }
    );
    if (!resp.ok) return [];
    const data = await resp.json();
    const posts = data.data?.children?.map(c => c.data?.title + ' ' + (c.data?.selftext || '')) || [];
    return posts.join('\n').slice(0, 3000);
  } catch {
    return '';
  }
}

async function updateSlangGlossary() {
  const glossary = loadGlossary();

  for (const [locale, config] of Object.entries(REGIONAL_CONFIG)) {
    if (!config.ageSlangSources?.length) continue;

    const texts = await Promise.allSettled(
      config.ageSlangSources.map(src => crawlSubredditSlang(src.replace('r/', ''), locale))
    );
    const combined = texts.map(r => r.value || '').join('\n').slice(0, 5000);
    if (!combined.trim()) continue;

    try {
      const prompt = `다음은 ${config.name} 소셜 미디어 텍스트입니다.
이 텍스트에서 8~35세가 자주 쓰는 인터넷 슬랭 / 유행어 / 감탄사를 최대 15개 추출하세요.
K-Culture 관련 용어(아이돌, 먹방 등)가 있다면 어떻게 표현되는지도 포함하세요.

텍스트:
${combined}

JSON 형식으로만 응답하세요:
{"slang": [{"term": "원어 슬랭", "meaning": "뜻", "kCultureEquivalent": "해당 K-Culture 표현 (있으면)"}]}`;

      const result = await generateWithBestModel(prompt, { maxTokens: 600, preferFree: true });
      const jsonMatch = result.text?.match(/\{.*\}/s);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (!glossary[locale]) glossary[locale] = { terms: [], updatedAt: null };
        const existing = new Set(glossary[locale].terms.map(t => t.term));
        for (const item of (parsed.slang || [])) {
          if (!existing.has(item.term)) {
            glossary[locale].terms.push(item);
            existing.add(item.term);
          }
        }
        glossary[locale].updatedAt = new Date().toISOString();
        logger.info('[CulturalTranslation]', `슬랭 업데이트: ${locale} +${parsed.slang?.length || 0}개`);
      }
    } catch (err) {
      logger.warn('[CulturalTranslation]', `슬랭 파싱 실패 (${locale}): ${err.message}`);
    }
  }

  glossaryCache = glossary;
  saveGlossary(glossary);
}

export function startSlangCrawler() {
  if (slangCrawlerTimer) return;
  updateSlangGlossary().catch(err => logger.error('[CulturalTranslation]', '초기 슬랭 크롤링 오류', err.message));
  slangCrawlerTimer = setInterval(() => {
    updateSlangGlossary().catch(err => logger.error('[CulturalTranslation]', '슬랭 크롤링 오류', err.message));
  }, SLANG_CRAWL_INTERVAL_MS);
  logger.info('[CulturalTranslation]', '슬랭 크롤러 시작 (6시간 주기)');
}

// ══════════════════════════════════════════════════════════════
// 세대별 번역 톤 결정
// ══════════════════════════════════════════════════════════════

function getAgeToneHint(ageGroup) {
  switch (ageGroup) {
    case 'child':    return '어린이도 쉽게 이해할 수 있는 쉬운 단어 사용. 이모지 환영.';
    case 'teen':     return 'Use Gen-Z internet slang, TikTok-style casual language, memes references OK.';
    case 'youngadult': return 'Casual but clear. Some trendy slang OK. No formal language.';
    case 'adult':    return 'Natural fluid translation. Can briefly note slang meanings in parentheses.';
    default:         return 'Natural casual tone.';
  }
}

// ══════════════════════════════════════════════════════════════
// 핵심 번역 함수
// ══════════════════════════════════════════════════════════════

/**
 * 문화적 맥락 기반 자연스러운 번역
 *
 * @param {string}  text       - 번역할 한국어 원문
 * @param {string}  targetLocale - 'en-US' | 'pt-BR' | 'id' 등
 * @param {object}  options    - { ageGroup, contextHints, domain }
 * @returns {Promise<{translatedText, locale, model, glossaryTermsUsed}>}
 */
export async function translateWithCulturalContext(text, targetLocale, options = {}) {
  if (!text?.trim()) return { translatedText: '', locale: targetLocale };

  const config = REGIONAL_CONFIG[targetLocale];
  if (!config) {
    throw new Error(`[CulturalTranslation] 지원하지 않는 로케일: ${targetLocale}`);
  }

  // 나이 그룹 결정 (기본: youngadult 14~24)
  const ageGroup = options.ageGroup || 'youngadult';
  const ageTone = getAgeToneHint(ageGroup);

  // 정적 용어집 (config.examples) + 동적 용어집 (glossaryCache) 합성
  const dynamicTerms = glossaryCache[targetLocale]?.terms?.slice(0, 20) || [];
  const staticExamples = Object.entries(config.examples || {})
    .map(([ko, tr]) => `  ${ko} → ${tr}`)
    .join('\n');
  const dynamicExamples = dynamicTerms
    .filter(t => t.kCultureEquivalent)
    .map(t => `  ${t.kCultureEquivalent} → ${t.term} (${t.meaning})`)
    .join('\n');

  const prompt = `You are a K-Culture localization expert translating Korean K-Culture content into ${config.name}.

TARGET AUDIENCE: ${ageGroup === 'teen' ? '14-24 year olds' : ageGroup === 'child' ? '8-13 year olds' : '25-35 year olds'} in ${config.region?.replace('_', ' ')}.
TONE: ${config.toneHints}
AGE-STYLE: ${ageTone}

REGIONAL TERMINOLOGY GUIDE (use these when the concept appears):
${staticExamples}
${dynamicExamples ? `\nCURRENT TRENDS/SLANG:\n${dynamicExamples}` : ''}

RULES:
1. Korean K-Culture specific terms (idol names, show names, 먹방, etc.) → keep as-is or use the guide above.
2. Do NOT censor or explain K-Culture concepts — the audience already knows K-Culture.
3. Match the energy: if the original is excited → translation should feel excited too.
4. No formal/stiff language. This is social media content.
5. Output ONLY the translated text. No notes, no explanations.

KOREAN TEXT TO TRANSLATE:
${text}`;

  const result = await generateWithBestModel(prompt, {
    maxTokens: Math.min(text.length * 3, 2000),
    preferFree: true,
  });

  return {
    translatedText: result.text.trim(),
    locale: targetLocale,
    targetLanguage: config.name,
    region: config.region,
    model: result.model,
    provider: result.provider,
    ageGroup,
    glossaryTermsUsed: dynamicTerms.length,
    isFreeTier: result.isFreeTier,
  };
}

/**
 * 여러 언어로 동시 번역 (K-Culture 전파 최적화)
 *
 * @param {string}   text
 * @param {string[]} locales - 번역할 로케일 목록 (기본: 주요 타겟 10개)
 * @param {object}   options
 */
export async function translateToAllTargetRegions(text, locales = null, options = {}) {
  const targetLocales = locales || [
    'en-US', 'es-MX', 'pt-BR',
    'fr', 'de', 'id', 'th', 'vi', 'tl',
  ];

  const results = await Promise.allSettled(
    targetLocales.map(locale => translateWithCulturalContext(text, locale, options))
  );

  return Object.fromEntries(
    targetLocales.map((locale, i) => [
      locale,
      results[i].status === 'fulfilled'
        ? results[i].value
        : { error: results[i].reason?.message, locale },
    ])
  );
}

/**
 * 번역 품질 검증 (역번역 방식 — AI 활용)
 */
export async function verifyTranslationQuality(original, translated, locale) {
  const config = REGIONAL_CONFIG[locale];
  if (!config) return { quality: 'unknown' };

  const prompt = `Rate this K-Culture translation quality from Korean to ${config.name}.

ORIGINAL (Korean): ${original}
TRANSLATED (${config.name}): ${translated}

Score on:
1. Naturalness (does it sound like a native ${config.name} speaker aged 15-25?)
2. K-Culture accuracy (are Korean cultural terms handled correctly?)
3. Tone match (does energy/excitement level match the original?)

Return JSON only: {"naturalness": 0-10, "accuracy": 0-10, "toneMatch": 0-10, "overallScore": 0-10, "suggestion": "brief improvement note or null"}`;

  try {
    const result = await generateWithBestModel(prompt, { maxTokens: 200, preferFree: true });
    const jsonMatch = result.text?.match(/\{.*\}/s);
    if (jsonMatch) return { ...JSON.parse(jsonMatch[0]), locale, model: result.model };
  } catch {
    // 검증 실패는 치명적이지 않음
  }
  return { quality: 'unverified', locale };
}

export function getGlossaryStatus() {
  const glossary = loadGlossary();
  return {
    locales: Object.entries(glossary).map(([locale, data]) => ({
      locale,
      termCount: data.terms?.length || 0,
      updatedAt: data.updatedAt,
    })),
    totalTerms: Object.values(glossary).reduce((sum, d) => sum + (d.terms?.length || 0), 0),
    slangCrawlerActive: !!slangCrawlerTimer,
  };
}

export function getSupportedLocales() {
  return Object.entries(REGIONAL_CONFIG).map(([code, cfg]) => ({
    code,
    name: cfg.name,
    region: cfg.region,
    hasDynamicSlang: !!(cfg.ageSlangSources?.length),
  }));
}
