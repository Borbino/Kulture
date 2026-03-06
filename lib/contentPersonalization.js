/**
 * Content Personalization Engine — Kulture Platform v2.0
 *
 * ──────────────────────────────────────────────────────────────
 * [역할]
 *   전 세계 방문자에게 그 지역에서 가장 관심 있는
 *   K-Culture 콘텐츠를 우선 표시합니다.
 *
 * [작동 원리]
 *   1. 방문자의 언어/타임존/Accept-Language 감지
 *   2. 해당 지역의 K-Culture 관심 카테고리 매핑
 *   3. 콘텐츠 우선순위 조정 (점수 보정)
 *
 * [예시]
 *   브라질 방문자 → K-Pop / 드라마 / 언어학습 우선
 *   유럽 방문자  → K-뷰티 / 드라마 / K-패션 우선
 *   일본 방문자  → K-Pop / K-뷰티 / K-음식 우선
 * ──────────────────────────────────────────────────────────────
 */

import { REGION_INTERESTS, K_CULTURE_CATEGORIES } from './kCultureSignals.js';

// ── 타임존 → 지역 매핑 ──────────────────────────────────────────
const TIMEZONE_TO_REGION = {
  // 동아시아
  'Asia/Tokyo':           'japan',
  'Asia/Seoul':           'korea',
  'Asia/Shanghai':        'china',
  'Asia/Hong_Kong':       'china',
  'Asia/Taipei':          'china',
  // 동남아
  'Asia/Jakarta':         'southeast_asia',
  'Asia/Bangkok':         'southeast_asia',
  'Asia/Singapore':       'southeast_asia',
  'Asia/Manila':          'southeast_asia',
  'Asia/Ho_Chi_Minh':     'southeast_asia',
  'Asia/Kuala_Lumpur':    'southeast_asia',
  // 남아시아
  'Asia/Kolkata':         'southeast_asia',
  // 북미
  'America/New_York':     'northAmerica',
  'America/Chicago':      'northAmerica',
  'America/Denver':       'northAmerica',
  'America/Los_Angeles':  'northAmerica',
  'America/Toronto':      'northAmerica',
  'America/Vancouver':    'northAmerica',
  // 남미
  'America/Sao_Paulo':    'southAmerica',
  'America/Buenos_Aires': 'southAmerica',
  'America/Bogota':       'southAmerica',
  'America/Lima':         'southAmerica',
  'America/Santiago':     'southAmerica',
  'America/Mexico_City':  'southAmerica',
  // 유럽
  'Europe/London':        'europe',
  'Europe/Paris':         'europe',
  'Europe/Berlin':        'europe',
  'Europe/Madrid':        'europe',
  'Europe/Rome':          'europe',
  'Europe/Amsterdam':     'europe',
  'Europe/Warsaw':        'europe',
  // 오세아니아
  'Australia/Sydney':     'oceania',
  'Australia/Melbourne':  'oceania',
  'Pacific/Auckland':     'oceania',
  // 중동
  'Asia/Dubai':           'middleEast',
  'Asia/Riyadh':          'middleEast',
  'Asia/Istanbul':        'middleEast',
};

// ── 언어 코드 → 지역 매핑 (타임존 감지 실패 시 폴백) ──────────────
const LANG_TO_REGION = {
  ko: 'korea',
  ja: 'japan',
  zh: 'china',
  id: 'southeast_asia',
  th: 'southeast_asia',
  vi: 'southeast_asia',
  ms: 'southeast_asia',
  pt: 'southAmerica',
  es: 'southAmerica',
  fr: 'europe',
  de: 'europe',
  it: 'europe',
  nl: 'europe',
  ar: 'middleEast',
  en: 'northAmerica',  // 기본값
};

/**
 * 방문자 요청에서 지역을 추론합니다.
 *
 * @param {Object} req - Next.js Request 객체
 * @returns {string} 지역 키 (예: 'northAmerica', 'europe', ...)
 */
export function detectRegion(req) {
  // 1. Vercel/Cloudflare 지오 헤더 우선
  const cfCountry = req?.headers?.['cf-ipcountry'];
  if (cfCountry) return countryCodeToRegion(cfCountry);

  const vercelGeo = req?.headers?.['x-vercel-ip-country'];
  if (vercelGeo) return countryCodeToRegion(vercelGeo);

  // 2. Accept-Language 헤더
  const acceptLang = req?.headers?.['accept-language'] || '';
  const primaryLang = acceptLang.split(',')[0]?.split('-')[0]?.toLowerCase();
  if (primaryLang && LANG_TO_REGION[primaryLang]) {
    return LANG_TO_REGION[primaryLang];
  }

  return 'northAmerica';  // 기본값
}

/**
 * ISO 국가 코드 → 지역 변환
 */
function countryCodeToRegion(code) {
  const MAP = {
    // 동아시아
    KR: 'korea', JP: 'japan', CN: 'china', TW: 'china', HK: 'china', MO: 'china',
    // 동남아
    ID: 'southeast_asia', TH: 'southeast_asia', VN: 'southeast_asia',
    SG: 'southeast_asia', MY: 'southeast_asia', PH: 'southeast_asia',
    MM: 'southeast_asia', KH: 'southeast_asia',
    // 남아시아
    IN: 'southeast_asia', PK: 'southeast_asia', BD: 'southeast_asia',
    // 북미
    US: 'northAmerica', CA: 'northAmerica',
    // 남미
    BR: 'southAmerica', MX: 'southAmerica', AR: 'southAmerica',
    CL: 'southAmerica', CO: 'southAmerica', PE: 'southAmerica',
    VE: 'southAmerica', EC: 'southAmerica', BO: 'southAmerica',
    // 유럽
    GB: 'europe', FR: 'europe', DE: 'europe', ES: 'europe', IT: 'europe',
    NL: 'europe', PL: 'europe', RU: 'europe', SE: 'europe', NO: 'europe',
    // 오세아니아
    AU: 'oceania', NZ: 'oceania',
    // 중동
    AE: 'middleEast', SA: 'middleEast', TR: 'middleEast', EG: 'middleEast',
  };
  return MAP[code?.toUpperCase()] || 'northAmerica';
}

/**
 * 지역별 콘텐츠 우선순위 점수 보정
 *
 * @param {Array<Object>} posts - 포스트 배열 (각각 tags 혹은 category 필드 가짐)
 * @param {string} region - 지역 키
 * @returns {Array<Object>} 우선순위 점수가 보정된 포스트 배열
 */
export function personalizeForRegion(posts, region) {
  const priorityCategories = REGION_INTERESTS[region] || REGION_INTERESTS.northAmerica;

  return posts
    .map(post => {
      const postTags = [
        ...(post.tags || []),
        post.category || '',
        post.title || '',
      ].join(' ').toLowerCase();

      // 지역 관심 카테고리와 일치하는 수 계산
      let bonus = 0;
      for (const catKey of priorityCategories) {
        const catSignals = K_CULTURE_CATEGORIES[catKey]?.signals || [];
        const hit = catSignals.some(signal => postTags.includes(signal));
        if (hit) bonus += 2;  // 카테고리 일치당 +2점
      }

      return {
        ...post,
        personalizedScore: (post.priorityScore || post.score || 5) + bonus,
        regionBonus: bonus,
        targetRegion: region,
      };
    })
    .sort((a, b) => b.personalizedScore - a.personalizedScore);
}

/**
 * 지역별 환영 메시지/언어 추천
 */
export function getRegionConfig(region) {
  const CONFIG = {
    korea: {
      displayName: '한국',
      language: 'ko',
      greeting: '안녕하세요! K-Culture의 본고장에서 오셨군요.',
      highlightCategories: ['hallyu', 'ksociety', 'ktech'],
    },
    japan: {
      displayName: 'Japan',
      language: 'ja',
      greeting: 'こんにちは！韓流コンテンツをお楽しみください。',
      highlightCategories: ['kpop', 'kbeauty', 'kfood'],
    },
    northAmerica: {
      displayName: 'North America',
      language: 'en',
      greeting: 'Welcome to the world of K-Culture!',
      highlightCategories: ['kpop', 'kdrama', 'kfood'],
    },
    southAmerica: {
      displayName: 'América Latina',
      language: 'es',
      greeting: '¡Bienvenido al mundo de la cultura coreana!',
      highlightCategories: ['kpop', 'kdrama', 'klanguage'],
    },
    europe: {
      displayName: 'Europe',
      language: 'en',
      greeting: 'Discover Korean culture from every angle.',
      highlightCategories: ['kdrama', 'kbeauty', 'kheritage'],
    },
    southeast_asia: {
      displayName: 'Southeast Asia',
      language: 'en',
      greeting: 'Selamat datang! Explore K-Culture near you.',
      highlightCategories: ['kdrama', 'kpop', 'kbeauty'],
    },
    china: {
      displayName: '中华地区',
      language: 'zh',
      greeting: '欢迎了解韩国文化！',
      highlightCategories: ['kdrama', 'kpop', 'kbeauty'],
    },
    oceania: {
      displayName: 'Oceania',
      language: 'en',
      greeting: 'G\'day! Dive into the K-Culture wave.',
      highlightCategories: ['kpop', 'kdrama', 'ktravel'],
    },
    middleEast: {
      displayName: 'Middle East',
      language: 'ar',
      greeting: 'مرحباً! اكتشف الثقافة الكورية.',
      highlightCategories: ['kdrama', 'kbeauty', 'kfood'],
    },
  };

  return CONFIG[region] || CONFIG.northAmerica;
}

export default { detectRegion, personalizeForRegion, getRegionConfig };
