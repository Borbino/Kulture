/**
 * Copyright Checker — Kulture Platform
 *
 * [목적] AI 생성 콘텐츠 및 수집 콘텐츠에 대한 저작권 안전성 검증
 *        DMCA 준수, 공정 이용 판단, 출처 표기 자동화
 *
 * [원칙]
 *  - 모든 수집 콘텐츠는 RSS공개 피드 또는 공개 API 기반 2차 창작에 한정
 *  - 원본을 대체하는 직접 복사(30% 이상 유사도)는 발행 금지
 *  - 출처 표기 없는 콘텐츠는 발행 전 자동 부착
 *  - DMCA 신고 접수 즉시 24h 내 처리 (docs/COPYRIGHT_POLICY.md 참조)
 */

import { logger } from './logger.js';

// ========== 저작권 안전 기준 ==========

const COPYRIGHT_THRESHOLDS = {
  maxDirectCopyRatio: 0.30,   // 원본 대비 30% 이상 직접 인용 시 위험 판정
  minTransformRatio: 0.50,    // 50% 이상 변환/창작 내용이어야 안전
  maxQuoteLength: 300,        // 단일 직접 인용 최대 글자 수
  minAttributionPresence: 1,  // 최소 출처 표기 횟수
};

// Fair Use 지시자 (비평·교육·뉴스 보도 목적 표현)
const FAIR_USE_INDICATORS = [
  '분석', '리뷰', '평가', '비평', '의견', '전망', '전문가',
  '살펴보면', '알아보자', '정리해봤다', '비교해보면', '해설',
  'review', 'analysis', 'opinion', 'commentary', 'breakdown',
  'explained', 'discussed', 'examined', 'perspective',
];

// 직접 복사 위험 패턴 (뉴스 기사에서 그대로 가져오는 표현)
const COPY_RISK_PATTERNS = [
  /\([\w\s]+통신\)\s/,         // 연합뉴스, AP 등 통신사 표기
  /©\s*\d{4}/,                  // 저작권 표시
  /All Rights Reserved/i,
  /무단\s*전재\s*[··]\s*재배포\s*금지/,
  /저작권자\s*[©ⓒ]/,
  /기자\s+=[··]/,               // "홍길동 기자 = ..." 패턴
];

// 플랫폼별 저작권 정책
const PLATFORM_POLICIES = {
  youtube: {
    embedAllowed: true,
    downloadForbidden: true,
    screenshotFairUse: true,
    note: 'YouTube 임베드는 허용. 다운로드/재업로드 금지.',
  },
  instagram: {
    embedAllowed: true,
    screenshotFairUse: false,
    note: '인스타그램 임베드는 허용. 스크린샷 재게시는 원작자 허락 필요.',
  },
  twitter: {
    embedAllowed: true,
    screenshotFairUse: true,
    note: '트위터/X 임베드 허용. 논평 목적 스크린샷은 Fair Use 인정.',
  },
  reddit: {
    ccLicense: true,
    attribution: 'CC BY-SA 4.0',
    note: '레딧 콘텐츠는 CC BY-SA 4.0 — 출처 명시 필수.',
  },
  rss: {
    summaryAllowed: true,
    fullTextForbidden: true,
    note: 'RSS 피드 요약 인용은 허용. 전문 복사 금지.',
  },
};

// ========== 핵심 함수 ==========

/**
 * 콘텐츠의 저작권 안전성 종합 검사
 * @param {object} content - { body: string, sources: Array, title: string }
 * @returns {object} { isSafe: boolean, score: number, issues: string[], recommendations: string[] }
 */
export function checkCopyrightSafety(content) {
  const { body = '', sources = [] } = content;
  const issues = [];
  const recommendations = [];
  let score = 100; // 100점 만점, 감점 방식

  // 1. 직접 복사 위험 패턴 검사
  for (const pattern of COPY_RISK_PATTERNS) {
    if (pattern.test(body)) {
      issues.push(`직접 복사 위험 패턴 감지: ${pattern.toString().substring(0, 40)}`);
      score -= 25;
      recommendations.push('해당 표현을 삭제하거나 출처를 명확히 표기하고 요약 형식으로 변환하세요.');
    }
  }

  // 2. Fair Use 지시자 존재 확인
  const fairUseCount = FAIR_USE_INDICATORS.filter(indicator =>
    body.toLowerCase().includes(indicator.toLowerCase())
  ).length;
  if (fairUseCount < 2) {
    score -= 10;
    recommendations.push('비평·분석·해설적 표현을 추가하여 Fair Use 요건을 강화하세요.');
  }

  // 3. 출처 표기 확인
  if (sources.length > 0 && !hasSourceAttribution(body, sources)) {
    issues.push('출처 표기 누락');
    score -= 15;
    recommendations.push('본문 하단에 출처 표기 섹션을 추가하세요.');
  }

  // 4. 인용 길이 검사
  const longQuotes = extractLongQuotes(body);
  if (longQuotes.length > 0) {
    issues.push(`과도한 직접 인용 ${longQuotes.length}건 (각 ${COPYRIGHT_THRESHOLDS.maxQuoteLength}자 초과)`);
    score -= 20 * longQuotes.length;
    recommendations.push('긴 직접 인용을 요약하거나 핵심 문장만 인용하고 나머지는 자체 표현으로 전환하세요.');
  }

  // 5. 원본 변환 비율 추정 (AI 생성 콘텐츠는 기본적으로 변환됨)
  const isAIGenerated = body.includes('[AI 생성]') || body.includes('[Kulture 자체 제작]') || sources.some(s => s.isAIGenerated);
  if (isAIGenerated) {
    score = Math.min(score + 10, 100); // AI 생성 콘텐츠는 보너스
  }

  score = Math.max(0, score);

  return {
    isSafe: score >= 70 && issues.length === 0,
    score,
    issues,
    recommendations,
    fairUseCount,
    isAIGenerated,
  };
}

/**
 * 출처 표기 텍스트 자동 생성
 * @param {Array} sources - [{ name: string, url: string, publishedAt: string, platform: string }]
 * @returns {string} 출처 표기 마크다운 텍스트
 */
export function generateSourceAttribution(sources) {
  if (!sources || sources.length === 0) return '';

  const lines = sources.map((src, idx) => {
    const platform = src.platform || 'unknown';
    const policy = PLATFORM_POLICIES[platform] || PLATFORM_POLICIES.rss;
    const date = src.publishedAt ? new Date(src.publishedAt).toLocaleDateString('ko-KR') : '';
    const dateStr = date ? ` (${date})` : '';

    return `${idx + 1}. **${src.name || '출처 미상'}**${dateStr}${src.url ? ` — [원문 보기](${src.url})` : ''} *(${policy.note || '참고 자료'})*`;
  });

  return `\n\n---\n**참고 출처**\n${lines.join('\n')}\n\n*본 콘텐츠는 위 출처들을 참고하여 Kulture 편집팀이 독자적으로 작성한 2차 창작물입니다.*`;
}

/**
 * 텍스트가 원본 소스와 직접 복사 수준인지 판별
 * @param {string} generatedText - AI 생성/편집 텍스트
 * @param {Array} originalTexts - 원본 소스 텍스트 배열
 * @returns {object} { isDirect: boolean, similarityRatio: number, matchedSegments: string[] }
 */
export function detectDirectCopy(generatedText, originalTexts) {
  if (!generatedText || !originalTexts || originalTexts.length === 0) {
    return { isDirect: false, similarityRatio: 0, matchedSegments: [] };
  }

  const genWords = tokenize(generatedText);
  const matchedSegments = [];
  let totalMatched = 0;

  for (const original of originalTexts) {
    const origWords = tokenize(original);
    const segments = findMatchingSegments(genWords, origWords, 8); // 8단어 이상 연속 일치
    for (const seg of segments) {
      matchedSegments.push(seg);
      totalMatched += seg.split(' ').length;
    }
  }

  const similarityRatio = genWords.length > 0 ? totalMatched / genWords.length : 0;
  const isDirect = similarityRatio > COPYRIGHT_THRESHOLDS.maxDirectCopyRatio;

  return { isDirect, similarityRatio, matchedSegments: [...new Set(matchedSegments)] };
}

/**
 * 콘텐츠가 Fair Use 요건을 충족하는지 확인
 * @param {string} text - 검사할 텍스트
 * @returns {object} { qualifies: boolean, indicators: string[], reason: string }
 */
export function isFairUse(text) {
  const foundIndicators = FAIR_USE_INDICATORS.filter(ind =>
    text.toLowerCase().includes(ind.toLowerCase())
  );

  const qualifies = foundIndicators.length >= 3;
  const reason = qualifies
    ? '비평·분석·해설 표현이 충분히 포함되어 Fair Use 요건 충족'
    : `Fair Use 지시자 부족 (${foundIndicators.length}/3). 더 많은 분석/비평 내용 추가 필요`;

  return { qualifies, indicators: foundIndicators, reason };
}

/**
 * 최종 저작권 고지문 생성
 * @param {object} params - { title, authors, publishedAt, isAIGenerated, sources }
 * @returns {string} 저작권 고지 텍스트
 */
export function generateCopyrightNotice({ title: _title, authors = ['Kulture 편집팀'], publishedAt, isAIGenerated = false, sources = [] }) {
  const year = publishedAt ? new Date(publishedAt).getFullYear() : new Date().getFullYear();
  const authorStr = authors.join(', ');
  const aiNote = isAIGenerated ? ' (AI 보조 작성)' : '';
  const sourceNote = sources.length > 0 ? ` 참고 출처 ${sources.length}건.` : '';

  return `© ${year} Kulture / ${authorStr}${aiNote}. CC BY-SA 4.0 라이선스 적용.${sourceNote} 원본 저작권은 각 출처에 귀속됩니다.`;
}

/**
 * 특정 플랫폼의 저작권 정책 조회
 * @param {string} platform - 'youtube' | 'instagram' | 'twitter' | 'reddit' | 'rss'
 * @returns {object} 해당 플랫폼 저작권 정책
 */
export function getPlatformPolicy(platform) {
  return PLATFORM_POLICIES[platform] || {
    note: '출처 표기 필수. 원문을 대체하지 않는 범위에서 인용.',
    attribution: 'Required',
  };
}

// ========== 내부 헬퍼 함수 ==========

function hasSourceAttribution(body, sources) {
  if (!sources || sources.length === 0) return true;
  return body.includes('출처') || body.includes('참고') || body.includes('Source') ||
    sources.some(src => src.url && body.includes(src.url)) ||
    sources.some(src => src.name && body.includes(src.name));
}

function extractLongQuotes(text) {
  // 큰따옴표/인용 블록에서 과도하게 긴 인용 추출
  const quotePatterns = [
    /"([^"]{300,})"/g,
    /「([^」]{300,})」/g,
    /『([^』]{300,})』/g,
    /^\s*>[^\n]{300,}/gm, // 마크다운 인용 블록
  ];
  const longQuotes = [];
  for (const pattern of quotePatterns) {
    let match = pattern.exec(text);
    while (match !== null) {
      longQuotes.push(match[1] || match[0]);
      match = pattern.exec(text);
    }
  }
  return longQuotes;
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);
}

function findMatchingSegments(words1, words2, minLength) {
  const segments = [];
  const set2 = new Set();
  // sliding window: find sequences in words1 that appear in words2
  for (let start = 0; start <= words2.length - minLength; start++) {
    const chunk = words2.slice(start, start + minLength).join(' ');
    set2.add(chunk);
  }
  for (let start = 0; start <= words1.length - minLength; start++) {
    const chunk = words1.slice(start, start + minLength).join(' ');
    if (set2.has(chunk)) {
      segments.push(chunk);
    }
  }
  return segments;
}

logger.info('[copyrightChecker]', 'Copyright checker initialized', {
  thresholds: COPYRIGHT_THRESHOLDS,
  platformsSupported: Object.keys(PLATFORM_POLICIES),
});
