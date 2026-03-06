/**
 * Content Review System — Kulture Platform
 *
 * [목적] AI 생성 기사/게시물의 발행 전 자동 품질 검토
 *        - 품질 점수 산출 (가독성, 정보성, 참여도)
 *        - 팩트 체크 지시자 검사 (날짜, 출처, 수치 근거)
 *        - 저작권 안전성 통합 (copyrightChecker 연동)
 *        - 관리자 검토 큐 생성
 *
 * [연동] lib/copyrightChecker.js, lib/advancedContentGeneration.js
 */

import { checkCopyrightSafety, generateSourceAttribution } from './copyrightChecker.js';
import { logger } from './logger.js';

// ========== 품질 기준 ==========

const QUALITY_THRESHOLDS = {
  minWordCount: 200,       // 최소 200단어
  maxWordCount: 5000,      // 최대 5000단어
  minSentenceCount: 5,     // 최소 5문장
  minHeadingCount: 1,      // 최소 소제목 1개
  factCheckMinScore: 60,   // 팩트체크 최소 60점
  overallMinScore: 65,     // 발행 허용 최소 점수
  autoApproveScore: 85,    // 이 점수 이상은 자동 승인
};

// 팩트 지시자 — 근거 표현
const FACT_INDICATORS = {
  datePatterns: [
    /\d{4}년\s*\d{1,2}월/,
    /\d{1,2}월\s*\d{1,2}일/,
    /지난\s*(주|달|해|년)/,
    /\d{4}-\d{2}-\d{2}/,
    /최근\s*\d+\s*(시간|일|주|개월)/,
  ],
  numberPatterns: [
    /\d+[만억천]\s*명/,
    /\d+[만억천]?\s*원/,
    /\d+[천만억]?\s*(달러|USD|\$)/,
    /\d+\s*%/,
    /\d+위/,
    /\d+\s*(조회|스트리밍|뷰|view)/i,
  ],
  sourcePatterns: [
    /에\s*따르면/,
    /에\s*의하면/,
    /발표에\s*의하면/,
    /관계자에\s*따르면/,
    /언론\s*보도에/,
    /공식\s*(발표|확인|보도)/,
    /according to/i,
    /reported by/i,
    /confirmed by/i,
    /sources say/i,
  ],
};

// 금지어 / 선정성 지시자
const PROHIBITED_PATTERNS = [
  /불법[다운로드|복제|공유]/,
  /무단\s*전재/,
  /저작권\s*침해/,
  /허위\s*사실/,
  /개인정보\s*유출/,
  /(가짜|fake)\s*(뉴스|news)/i,
];

// 고품질 콘텐츠 지시자
const QUALITY_BOOSTERS = [
  /\*\*[^*]+\*\*/,              // 볼드 강조 (정보 구조화)
  /^#+\s+.+$/m,                 // 소제목 (마크다운 헤딩)
  /!\[.+\]\(.+\)/,              // 이미지 삽입
  /\[.+\]\(https?:\/\/.+\)/,   // 링크 삽입
  /^\s*[-*]\s+/m,               // 목록 사용
  /^\s*\d+\.\s+/m,              // 번호 목록
  /```[\s\S]+```/,              // 코드 블록 (인터뷰 인용 등)
];

// ========== 핵심 함수 ==========

/**
 * 콘텐츠 품질 종합 점수 산출 (0~100)
 * @param {object} content - { title, body, sources, metadata }
 * @returns {object} 품질 평가 리포트
 */
export function scoreContentQuality(content) {
  const { title = '', body = '', sources = [] } = content;
  const fullText = `${title}\n${body}`;
  const scoreBreakdown = {};
  let totalScore = 0;

  // 1. 분량 점수 (20점)
  const wordCount = countWords(body);
  if (wordCount < QUALITY_THRESHOLDS.minWordCount) {
    scoreBreakdown.length = Math.floor((wordCount / QUALITY_THRESHOLDS.minWordCount) * 20);
  } else if (wordCount > QUALITY_THRESHOLDS.maxWordCount) {
    scoreBreakdown.length = 15; // 너무 길면 약간 감점
  } else {
    scoreBreakdown.length = 20;
  }
  totalScore += scoreBreakdown.length;

  // 2. 구조화 점수 (20점)
  const headingCount = (body.match(/^#+\s+/gm) || []).length;
  const listCount = (body.match(/^[\s]*[-*]\s+/gm) || []).length;
  const qualityBoosterCount = QUALITY_BOOSTERS.filter(p => p.test(body)).length;
  scoreBreakdown.structure = Math.min(20, (headingCount * 5) + (listCount > 0 ? 5 : 0) + qualityBoosterCount * 2);
  totalScore += scoreBreakdown.structure;

  // 3. 팩트체크 점수 (20점)
  const factScore = checkFactualIndicators(fullText);
  scoreBreakdown.factCheck = Math.round(factScore.score * 0.20);
  totalScore += scoreBreakdown.factCheck;

  // 4. 출처 표기 점수 (20점)
  const hasMultipleSources = sources.length >= 2;
  const hasAttributionInBody = sources.length > 0 && (body.includes('출처') || body.includes('참고') || body.includes('Source'));
  scoreBreakdown.attribution = sources.length === 0 ? 10
    : hasMultipleSources && hasAttributionInBody ? 20
    : hasAttributionInBody ? 15
    : hasMultipleSources ? 12 : 8;
  totalScore += scoreBreakdown.attribution;

  // 5. 저작권 안전성 점수 (20점)
  const copyrightCheck = checkCopyrightSafety(content);
  scoreBreakdown.copyright = Math.round(copyrightCheck.score * 0.20);
  totalScore += scoreBreakdown.copyright;

  // 제목 존재 여부 보너스
  if (title && title.length > 10) totalScore = Math.min(100, totalScore + 5);

  // 금지 패턴 페널티
  const hasProhibited = PROHIBITED_PATTERNS.some(p => p.test(fullText));
  if (hasProhibited) totalScore = Math.max(0, totalScore - 30);

  totalScore = Math.min(100, Math.max(0, totalScore));

  return {
    score: totalScore,
    breakdown: scoreBreakdown,
    wordCount,
    headingCount,
    qualityBoosterCount,
    copyrightCheck,
    isPublishable: totalScore >= QUALITY_THRESHOLDS.overallMinScore,
    autoApprove: totalScore >= QUALITY_THRESHOLDS.autoApproveScore,
    requiresManualReview: totalScore < QUALITY_THRESHOLDS.autoApproveScore,
  };
}

/**
 * 팩트체크 지시자 검사
 * @param {string} text - 검사할 텍스트
 * @returns {object} { score: 0-100, indicators: {...}, missing: string[] }
 */
export function checkFactualIndicators(text) {
  const score = { dates: 0, numbers: 0, sources: 0 };
  const found = { dates: [], numbers: [], sources: [] };
  const missing = [];

  // 날짜 표현 확인
  for (const pattern of FACT_INDICATORS.datePatterns) {
    if (pattern.test(text)) {
      score.dates = Math.min(40, score.dates + 13);
      const match = text.match(pattern);
      if (match) found.dates.push(match[0]);
    }
  }
  if (score.dates === 0) missing.push('날짜/시간 정보');

  // 수치 근거 확인
  for (const pattern of FACT_INDICATORS.numberPatterns) {
    if (pattern.test(text)) {
      score.numbers = Math.min(30, score.numbers + 10);
      const match = text.match(pattern);
      if (match) found.numbers.push(match[0]);
    }
  }
  if (score.numbers === 0) missing.push('수치 근거 (통계, 순위, 조회수 등)');

  // 출처 인용 표현 확인
  for (const pattern of FACT_INDICATORS.sourcePatterns) {
    if (pattern.test(text)) {
      score.sources = Math.min(30, score.sources + 10);
      const match = text.match(pattern);
      if (match) found.sources.push(match[0]);
    }
  }
  if (score.sources === 0) missing.push('출처 인용 표현 (예: ~에 따르면)');

  const totalScore = score.dates + score.numbers + score.sources;

  return {
    score: totalScore,
    breakdown: score,
    found,
    missing,
    hasSufficientFacts: totalScore >= QUALITY_THRESHOLDS.factCheckMinScore,
  };
}

/**
 * 중복/표절 감지 (발행된 콘텐츠와 비교)
 * @param {string} text - 신규 콘텐츠
 * @param {Array} existingContents - [{ title, body }] 기존 발행 콘텐츠
 * @returns {object} { isDuplicate: boolean, similarity: number, matchedWith: string | null }
 */
export function checkPlagiarism(text, existingContents = []) {
  if (!existingContents || existingContents.length === 0) {
    return { isDuplicate: false, similarity: 0, matchedWith: null };
  }

  let maxSimilarity = 0;
  let matchedTitle = null;

  const textWords = new Set(tokenizeSimple(text));

  for (const existing of existingContents) {
    const existingWords = new Set(tokenizeSimple(existing.body || ''));
    const intersection = [...textWords].filter(w => existingWords.has(w)).length;
    const union = new Set([...textWords, ...existingWords]).size;
    const similarity = union > 0 ? intersection / union : 0; // Jaccard similarity

    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      matchedTitle = existing.title;
    }
  }

  return {
    isDuplicate: maxSimilarity > 0.70, // 70% 이상 유사 시 중복 판정
    similarity: Math.round(maxSimilarity * 100),
    matchedWith: maxSimilarity > 0.70 ? matchedTitle : null,
  };
}

/**
 * 관리자 검토용 전체 리포트 생성
 * @param {object} content - { title, body, sources, metadata }
 * @param {Array} existingContents - 기존 발행 콘텐츠 (중복 검사용)
 * @returns {object} 전체 검토 리포트
 */
export async function generateReviewReport(content, existingContents = []) {
  const { title = '', body = '', sources = [], metadata = {} } = content;

  logger.info('[contentReview]', `Reviewing: "${title.substring(0, 50)}"`);

  const qualityReport = scoreContentQuality(content);
  const factReport = checkFactualIndicators(`${title}\n${body}`);
  const plagiarismReport = checkPlagiarism(body, existingContents);
  const attributionText = generateSourceAttribution(sources);

  const status = determineStatus(qualityReport, plagiarismReport);

  const report = {
    status,  // 'auto_approve' | 'review_required' | 'rejected'
    timestamp: new Date().toISOString(),
    content: {
      title: title.substring(0, 100),
      wordCount: qualityReport.wordCount,
      sourceCount: sources.length,
    },
    quality: {
      score: qualityReport.score,
      breakdown: qualityReport.breakdown,
      isPublishable: qualityReport.isPublishable,
    },
    factCheck: {
      score: factReport.score,
      hasSufficientFacts: factReport.hasSufficientFacts,
      missing: factReport.missing,
      found: {
        dateCount: factReport.found.dates.length,
        numberCount: factReport.found.numbers.length,
        sourceCount: factReport.found.sources.length,
      },
    },
    copyright: {
      isSafe: qualityReport.copyrightCheck.isSafe,
      score: qualityReport.copyrightCheck.score,
      issues: qualityReport.copyrightCheck.issues,
    },
    plagiarism: plagiarismReport,
    attribution: {
      text: attributionText,
      sourcesProvided: sources.length,
    },
    reviewNotes: generateReviewNotes(qualityReport, factReport, plagiarismReport),
    metadata: {
      ...metadata,
      reviewedAt: new Date().toISOString(),
      reviewVersion: '1.0',
    },
  };

  logger.info('[contentReview]', `Review complete: status=${status}, quality=${qualityReport.score}`, {
    title: title.substring(0, 50),
  });

  return report;
}

/**
 * 빠른 발행 가능 여부 확인
 * @param {object} content - { title, body, sources }
 * @returns {boolean}
 */
export function isPublishable(content) {
  const quality = scoreContentQuality(content);
  return quality.isPublishable && quality.copyrightCheck.isSafe;
}

// ========== 내부 헬퍼 ==========

function countWords(text) {
  return text
    .replace(/[^\w\s가-힣]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0).length;
}

function tokenizeSimple(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
}

function determineStatus(qualityReport, plagiarismReport) {
  if (plagiarismReport.isDuplicate) return 'rejected';
  if (!qualityReport.copyrightCheck.isSafe) return 'rejected';
  if (qualityReport.autoApprove) return 'auto_approve';
  if (qualityReport.isPublishable) return 'review_required';
  return 'rejected';
}

function generateReviewNotes(qualityReport, factReport, plagiarismReport) {
  const notes = [];

  if (plagiarismReport.isDuplicate) {
    notes.push(`❌ 중복 콘텐츠: "${plagiarismReport.matchedWith}"와 ${plagiarismReport.similarity}% 유사`);
  }
  if (!qualityReport.copyrightCheck.isSafe) {
    notes.push(`❌ 저작권 위험: ${qualityReport.copyrightCheck.issues.join('; ')}`);
  }
  if (qualityReport.wordCount < QUALITY_THRESHOLDS.minWordCount) {
    notes.push(`⚠️ 분량 부족: ${qualityReport.wordCount}단어 (최소 ${QUALITY_THRESHOLDS.minWordCount}단어)`);
  }
  if (!factReport.hasSufficientFacts) {
    notes.push(`⚠️ 팩트 부족: ${factReport.missing.join(', ')} 추가 필요`);
  }
  if (qualityReport.score >= QUALITY_THRESHOLDS.autoApproveScore) {
    notes.push(`✅ 자동 승인 가능 (품질 점수 ${qualityReport.score}점)`);
  } else if (qualityReport.isPublishable) {
    notes.push(`ℹ️ 관리자 검토 후 발행 가능 (품질 점수 ${qualityReport.score}점)`);
  }

  return notes;
}
