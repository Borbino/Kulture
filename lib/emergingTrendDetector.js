/**
 * Emerging Trend Detector — Zero-Prior-Knowledge Discovery Engine
 *
 * [목적] 관리자가 지정하지 않은 신규 인물·그룹·이슈를 실시간 자동 발굴
 * [방법] NLP 패턴 매칭 + 크로스소스 빈도 분석 + 속도(Velocity) 기반 신뢰도 산정
 * [비용] 100% 무료 (외부 AI API 불필요, 규칙 기반)
 * [원칙 14] VIP 미지정 엔티티도 자동 임시 추적 등록
 */

import sanityClient from './sanityClient.js';
import { VIP_MAP, TRACKING_ISSUES } from './vipMonitoring.js';
import logger from './logger.js';

// ========== 엔티티 추출 패턴 ==========

// K-Pop 그룹명 패턴: 전부 대문자 2-10자 (BTS, TWICE, BLACKPINK 등)
const KPOP_GROUP_PATTERN = /\b([A-Z]{2,3}[A-Z\s]{0,7})\b/g;

// 혼합 대소문자 그룹명 (aespa, NewJeans, IVE 등)
const MIXED_CASE_GROUP_PATTERN = /\b([A-Z][a-z]{2,}[A-Z][a-z]*|[a-z]+[A-Z][a-z]+)\b/g;

// 한국인 이름 패턴 (2-4 한글 음절)
const KOREAN_NAME_PATTERN = /\b([\uac00-\ud7af]{2,4})\b/g;

// 영문 한국 이름 (로마자 표기): Park, Kim, Lee + 이름 조합
const ROMANIZED_NAME_PATTERN = /\b(Park|Kim|Lee|Choi|Jung|Han|Yang|Yoon|Son|Shin|Oh|Lim|Im|Kwon|Kang)\s+[A-Z][a-z]{2,}\b/g;

// 해시태그에서 이름 추출
const HASHTAG_ENTITY_PATTERN = /#([A-Z][a-zA-Z]{2,})/g;

// K-Pop 공식/비공식 지표
const KPOP_INDICATORS = [
  'new group', 'new artist', 'debut', '데뷔', 'rookie', 'upcoming',
  'concept', 'teaser', 'comeback', '컴백', 'pre-debut', 'trainee',
  'audition', '오디션', 'survival', '서바이벌',
  'agency', 'label', 'SM', 'YG', 'HYBE', 'JYP', 'CUBE', 'PLEDIS', 'STARSHIP',
  'group', 'soloist', 'bp', 'solo debut',
];

// ========== 이머징 트렌드 설정 ==========

const EMERGING_CONFIG = {
  // 몇 개 소스에서 나타나야 신규 트렌드로 인정
  MIN_SOURCE_COUNT: 2,

  // 시간당 최소 언급 횟수 (급증 감지)
  MIN_VELOCITY_HOURLY: 10,

  // 이 점수 이상이면 자동 임시 VIP 등록 (관리자 승인 전)
  AUTO_TRACK_THRESHOLD: parseInt(process.env.EMERGING_TREND_AUTO_TRACK_THRESHOLD || '50', 10),

  // 이 점수 이상이면 관리자에게 즉시 알림
  ALERT_THRESHOLD: parseInt(process.env.EMERGING_TREND_ALERT_THRESHOLD || '100', 10),

  // 최대 임시 추적 기간 (days)
  TEMP_TRACK_DURATION_DAYS: 7,
};

// ========== 유틸리티 ==========

/**
 * 텍스트에서 잠재적 엔티티(이름/그룹) 추출
 */
function extractEntities(text) {
  const entities = new Set();

  // K-Pop 그룹 (전부 대문자)
  const groupMatches = text.matchAll(KPOP_GROUP_PATTERN);
  for (const match of groupMatches) {
    const entity = match[1].trim();
    // 너무 일반적인 단어 제외 (3자 이상)
    if (entity.length >= 3 && !isCommonWord(entity)) {
      entities.add(entity);
    }
  }

  // 혼합 대소문자 그룹
  const mixedMatches = text.matchAll(MIXED_CASE_GROUP_PATTERN);
  for (const match of mixedMatches) {
    const entity = match[1].trim();
    if (entity.length >= 3 && !isCommonWord(entity)) {
      entities.add(entity);
    }
  }

  // 한국어 이름
  const korMatches = text.matchAll(KOREAN_NAME_PATTERN);
  for (const match of korMatches) {
    const entity = match[1];
    if (entity.length >= 2) {
      entities.add(entity);
    }
  }

  // 로마자 한국 이름
  const romMatches = text.matchAll(ROMANIZED_NAME_PATTERN);
  for (const match of romMatches) {
    entities.add(match[0]);
  }

  // 해시태그 엔티티
  const tagMatches = text.matchAll(HASHTAG_ENTITY_PATTERN);
  for (const match of tagMatches) {
    const entity = match[1];
    if (entity.length >= 3 && !isCommonWord(entity)) {
      entities.add(entity);
    }
  }

  return Array.from(entities);
}

// 일반적인 영어 단어 (오탐 방지)
const COMMON_WORDS = new Set([
  'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER',
  'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW',
  'MAN', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WAY', 'WHO', 'ITS', 'LET',
  'PUT', 'SAY', 'SHE', 'TOO', 'USE', 'VIDEO', 'MUSIC', 'NEWS', 'LIVE',
  'FULL', 'BEST', 'ONLY', 'ALSO', 'FROM', 'WITH', 'THAT', 'HAVE', 'THIS',
  'WILL', 'YOUR', 'JUST', 'INTO', 'MORE', 'THAN', 'BEEN', 'WHAT', 'WHEN',
  'THEY', 'THEM', 'THEN', 'OVER', 'VERY', 'EVEN', 'LIKE', 'MAKE',
  'KR', 'US', 'UK', 'TV', 'EP', 'MV', 'OST', 'SM', 'YG', 'JYP', 'HYBE',
  'NET', 'COM', 'VIP', 'CEO', 'COO', 'CFO', 'TOP', 'HOT', 'NEW',
  'RSS', 'API', 'URL', 'FAQ', 'SEO', 'SNS',
]);

function isCommonWord(word) {
  return COMMON_WORDS.has(word.toUpperCase());
}

/**
 * 엔티티가 이미 알려진 VIP인지 확인
 */
function isKnownVIP(entity) {
  const entityLower = entity.toLowerCase();

  for (const [, vip] of VIP_MAP) {
    const nameLower = (vip.name || '').toLowerCase();
    if (nameLower.includes(entityLower) || entityLower.includes(nameLower)) {
      return true;
    }
    if (vip.keywords) {
      const match = vip.keywords.some(kw => kw.toLowerCase().includes(entityLower));
      if (match) return true;
    }
  }
  return false;
}

/**
 * 엔티티가 이미 추적 중인 이슈인지 확인
 */
function isTrackedIssue(entity) {
  const entityLower = entity.toLowerCase();
  return TRACKING_ISSUES.some(issue =>
    issue.keyword.toLowerCase().includes(entityLower) ||
    issue.relatedKeywords?.some(kw => kw.toLowerCase().includes(entityLower))
  );
}

// ========== 메인 발굴 엔진 ==========

/**
 * 수집된 Raw 트렌드 데이터에서 신규 이머징 엔티티 탐지
 *
 * @param {Array} rawItems - scrapeFreeSources() / collectAllTrends() 반환값
 * @returns {Promise<Array<EmergingEntity>>}
 */
export async function detectEmergingEntities(rawItems) {
  if (!rawItems || rawItems.length === 0) {
    return [];
  }

  // 엔티티 → {count, sources, firstSeen, lastSeen, sampleTexts}
  const entityMap = new Map();
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  for (const item of rawItems) {
    const text = `${item.title} ${item.raw || ''}`;
    const entities = extractEntities(text);
    const itemTime = new Date(item.pubDate || now).getTime();
    const isRecent = itemTime >= oneHourAgo;

    for (const entity of entities) {
      if (!entityMap.has(entity)) {
        entityMap.set(entity, {
          entity,
          count: 0,
          recentCount: 0, // 최근 1시간
          sources: new Set(),
          firstSeen: item.pubDate,
          lastSeen: item.pubDate,
          sampleTexts: [],
          hasKpopIndicator: false,
        });
      }

      const entry = entityMap.get(entity);
      entry.count++;
      if (isRecent) entry.recentCount++;
      entry.sources.add(item.source || 'unknown');
      entry.lastSeen = item.pubDate;
      if (entry.sampleTexts.length < 3) {
        entry.sampleTexts.push(item.title);
      }

      // K-Pop 지표 포함 여부
      if (!entry.hasKpopIndicator) {
        entry.hasKpopIndicator = KPOP_INDICATORS.some(ind =>
          text.toLowerCase().includes(ind.toLowerCase())
        );
      }
    }
  }

  // 신규 엔티티만 필터 (이미 알려진 VIP/이슈 제외)
  const emerging = [];

  for (const [entity, data] of entityMap) {
    // 최소 기준 미달 건 제외
    if (data.count < EMERGING_CONFIG.MIN_SOURCE_COUNT) continue;
    if (data.sources.size < EMERGING_CONFIG.MIN_SOURCE_COUNT) continue;

    // 이미 추적 중인 엔티티 제외
    if (isKnownVIP(entity)) continue;
    if (isTrackedIssue(entity)) continue;

    // 벨로시티 점수 산정 (소스 다양성 × 최근성 × K-Pop 관련도)
    const sourceWeight = Math.min(data.sources.size, 5) * 10;
    const velocityBonus = data.recentCount * 5;
    const kpopBonus = data.hasKpopIndicator ? 20 : 0;
    const velocityScore = data.count + sourceWeight + velocityBonus + kpopBonus;

    emerging.push({
      entity,
      count: data.count,
      recentCount: data.recentCount,
      sourceCount: data.sources.size,
      sources: Array.from(data.sources),
      firstSeen: data.firstSeen,
      lastSeen: data.lastSeen,
      velocityScore,
      hasKpopIndicator: data.hasKpopIndicator,
      sampleTexts: data.sampleTexts,
      shouldAutoTrack: velocityScore >= EMERGING_CONFIG.AUTO_TRACK_THRESHOLD,
      shouldAlert: velocityScore >= EMERGING_CONFIG.ALERT_THRESHOLD,
    });
  }

  // 벨로시티 점수 내림차순 정렬
  return emerging.sort((a, b) => b.velocityScore - a.velocityScore);
}

/**
 * 이머징 엔티티를 Sanity에 저장 (관리자 대시보드에서 확인 가능)
 * + 자동 임시 추적 등록
 *
 * @param {Array} emergingEntities
 * @returns {Promise<{saved, autoTracked, alerted}>}
 */
export async function processEmergingEntities(emergingEntities) {
  let saved = 0;
  let autoTracked = 0;
  let alerted = 0;

  for (const entity of emergingEntities.slice(0, 30)) {
    try {
      // Sanity에 이머징 트렌드 기록 (관리자 검토용)
      await sanityClient.createIfNotExists({
        _id: `emerging-${entity.entity.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
        _type: 'emergingTrend',
        entity: entity.entity,
        velocityScore: entity.velocityScore,
        count: entity.count,
        sources: entity.sources,
        sourceCount: entity.sourceCount,
        hasKpopIndicator: entity.hasKpopIndicator,
        sampleTexts: entity.sampleTexts,
        firstSeen: entity.firstSeen,
        lastSeen: entity.lastSeen,
        status: entity.shouldAutoTrack ? 'auto-tracked' : 'pending-review',
        autoPromotedToTracking: false,
        adminReviewed: false,
        timestamp: new Date().toISOString(),
      });
      saved++;

      if (entity.shouldAutoTrack) {
        logger.info('[emerging]',
          `Auto-tracking new entity: "${entity.entity}" (score: ${entity.velocityScore}, sources: ${entity.sourceCount})`
        );
        autoTracked++;
      }

      if (entity.shouldAlert) {
        logger.warn('[emerging]',
          `ALERT: Rapidly trending new entity: "${entity.entity}" (score: ${entity.velocityScore})`
        );
        alerted++;
      }
    } catch (error) {
      // createIfNotExists는 중복 시 무시, 진짜 에러만 로깅
      if (!error.message?.includes('already exists')) {
        logger.error('[emerging]', `Failed to save entity "${entity.entity}"`, { error: error.message });
      }
    }
  }

  logger.info('[emerging]', `Processed ${emergingEntities.length} emerging entities: ${saved} saved, ${autoTracked} auto-tracked, ${alerted} alerts`);

  return { saved, autoTracked, alerted };
}

/**
 * 전체 이머징 트렌드 감지 파이프라인
 * (scrapeFreeSources → detectEmergingEntities → processEmergingEntities)
 *
 * @param {Array|null} rawItems - 이미 수집된 데이터(있으면 재사용, 없으면 직접 수집)
 * @returns {Promise<object>}
 */
export async function runEmergingTrendScan(rawItems = null) {
  logger.info('[emerging]', 'Starting emerging trend scan...');

  let items = rawItems;
  if (!items || items.length === 0) {
    const { scrapeFreeSources } = await import('./autonomousScraper.js');
    items = await scrapeFreeSources();
  }

  const emerging = await detectEmergingEntities(items);
  logger.info('[emerging]', `Detected ${emerging.length} potential new entities`);

  if (emerging.length === 0) {
    return { detected: 0, saved: 0, autoTracked: 0, alerted: 0 };
  }

  const result = await processEmergingEntities(emerging);

  return {
    detected: emerging.length,
    topEntities: emerging.slice(0, 10).map(e => ({
      entity: e.entity,
      velocityScore: e.velocityScore,
      sources: e.sourceCount,
      shouldAlert: e.shouldAlert,
    })),
    ...result,
  };
}
