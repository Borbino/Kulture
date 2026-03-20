/**
 * abTestingEngine.js — Phase 10 · AI 자율 A/B 테스트 엔진
 *
 * 기능:
 *  1. 유저별 실험군(Variant A/B/C) 자동 배정
 *  2. 클릭·체류시간 이벤트 수집 및 in-memory 기록
 *  3. 충분한 데이터가 쌓이면 AI가 Winner를 자동 선정,
 *     전체 트래픽 90%를 Winner Variant로 자동 라우팅
 *
 * 설계 원칙:
 *  - Next.js Edge-safe: 순수 ESM, 파일 I/O 없음 (서버리스 최적화)
 *  - 프로덕션에서는 _store를 Redis / PlanetScale로 교환 가능
 */

// ─────────────────────────────────────────────
// Experiment Definitions
// ─────────────────────────────────────────────

/**
 * 각 Experiment의 Variant를 정의합니다.
 * weight: 배정 확률 (합산 100)
 * description: 실험 내용 설명
 */
export const EXPERIMENTS = {
  /** 광고 위치: 상단 / 하단 / 인라인 */
  ad_placement: {
    name: 'Ad Placement Position',
    variants: [
      { id: 'A', label: 'Top Banner',    weight: 34, description: '기사 상단 풀-위드 배너' },
      { id: 'B', label: 'Bottom Banner', weight: 33, description: '기사 하단 배너' },
      { id: 'C', label: 'Inline Card',   weight: 33, description: '피드 4번째 카드 사이 인라인' },
    ],
  },
  /** CTA 버튼 색상: 핑크 / 사이언 / 그라디언트 */
  cta_color: {
    name: 'CTA Button Color',
    variants: [
      { id: 'A', label: 'Pink',     weight: 34, description: '기존 --accent-pink (#FF2E93)' },
      { id: 'B', label: 'Cyan',     weight: 33, description: '--accent-cyan (#00E5FF)' },
      { id: 'C', label: 'Gradient', weight: 33, description: 'Pink→Cyan 그라디언트' },
    ],
  },
  /** 광고 테두리 글로우 강도 */
  ad_glow: {
    name: 'Ad Border Glow Intensity',
    variants: [
      { id: 'A', label: 'No Glow',     weight: 34, description: '테두리 글로우 없음' },
      { id: 'B', label: 'Soft Glow',   weight: 33, description: '부드러운 사이언 글로우' },
      { id: 'C', label: 'Strong Glow', weight: 33, description: '강렬한 핑크 글로우 펄스' },
    ],
  },
};

// ─────────────────────────────────────────────
// Mock In-Memory Store
// 프로덕션: Redis HSet / PlanetScale row 로 교환
// ─────────────────────────────────────────────

/**
 * _store 구조:
 * Map<experimentId, {
 *   assignments: Map<userId, variantId>,
 *   stats: Map<variantId, { impressions, clicks, totalDwellMs }>,
 *   winner: variantId | null,
 *   winnerLockedAt: ISO string | null,
 * }>
 */
const _store = new Map();

function _getExp(experimentId) {
  if (!_store.has(experimentId)) {
    const def = EXPERIMENTS[experimentId];
    if (!def) throw new Error(`Unknown experiment: ${experimentId}`);

    const stats = new Map();
    def.variants.forEach(v => stats.set(v.id, { impressions: 0, clicks: 0, totalDwellMs: 0 }));

    _store.set(experimentId, {
      assignments: new Map(),
      stats,
      winner: null,
      winnerLockedAt: null,
    });
  }
  return _store.get(experimentId);
}

// ─────────────────────────────────────────────
// Variant Assignment
// ─────────────────────────────────────────────

/**
 * 유저에게 실험군을 배정합니다.
 *
 * - Winner가 확정된 경우: 90% 확률로 Winner, 10%는 탐색(exploration) 유지
 * - Winner 미확정: weight 비율대로 랜덤 배정 (sticky: 동일 유저는 항상 같은 Variant)
 *
 * @param {string} userId      - 고유 유저 ID (세션 ID, 쿠키 등)
 * @param {string} experimentId - EXPERIMENTS의 키
 * @returns {{ variantId: string, variant: object, isExploration: boolean }}
 */
export function assignVariant(userId, experimentId) {
  const exp  = _getExp(experimentId);
  const def  = EXPERIMENTS[experimentId];

  // ── Winner 라우팅 (90/10 분배) ──
  if (exp.winner) {
    const isExploration = Math.random() < 0.10;
    if (!isExploration) {
      const winner = def.variants.find(v => v.id === exp.winner);
      return { variantId: exp.winner, variant: winner, isExploration: false };
    }
  }

  // ── Sticky assignment: 이미 배정된 유저는 동일 Variant 반환 ──
  if (exp.assignments.has(userId)) {
    const variantId = exp.assignments.get(userId);
    const variant   = def.variants.find(v => v.id === variantId);
    return { variantId, variant, isExploration: false };
  }

  // ── 신규 배정: weighted random ──
  const totalWeight = def.variants.reduce((s, v) => s + v.weight, 0);
  let rand = Math.random() * totalWeight;
  let chosen = def.variants[def.variants.length - 1];
  for (const v of def.variants) {
    if (rand < v.weight) { chosen = v; break; }
    rand -= v.weight;
  }

  exp.assignments.set(userId, chosen.id);
  return { variantId: chosen.id, variant: chosen, isExploration: false };
}

// ─────────────────────────────────────────────
// Event Tracking
// ─────────────────────────────────────────────

/**
 * 노출(impression) 이벤트를 기록합니다.
 * @param {string} userId
 * @param {string} experimentId
 * @param {string} variantId
 */
export function trackImpression(userId, experimentId, variantId) {
  const exp   = _getExp(experimentId);
  const stat  = exp.stats.get(variantId);
  if (!stat) return;
  stat.impressions += 1;
  _maybePickWinner(experimentId);
}

/**
 * 클릭(CTR) 이벤트를 기록합니다.
 * @param {string} userId
 * @param {string} experimentId
 * @param {string} variantId
 */
export function trackClick(userId, experimentId, variantId) {
  const exp  = _getExp(experimentId);
  const stat = exp.stats.get(variantId);
  if (!stat) return;
  stat.clicks += 1;
  _maybePickWinner(experimentId);
}

/**
 * 체류 시간(Dwell Time) 이벤트를 기록합니다.
 * @param {string} userId
 * @param {string} experimentId
 * @param {string} variantId
 * @param {number} dwellMs  - 페이지 체류 시간 (밀리초)
 */
export function trackDwell(userId, experimentId, variantId, dwellMs) {
  const exp  = _getExp(experimentId);
  const stat = exp.stats.get(variantId);
  if (!stat) return;
  stat.totalDwellMs += dwellMs;
  _maybePickWinner(experimentId);
}

// ─────────────────────────────────────────────
// AI Winner Selection Algorithm
// ─────────────────────────────────────────────

/** 최소 표본 수: 각 Variant에 이 이상의 노출이 쌓여야 Winner 판별 시작 */
const MIN_IMPRESSIONS_PER_VARIANT = 50;

/**
 * 데이터 충족 시 승자 Variant를 자동 선정합니다.
 *
 * 알고리즘:
 *  score = 0.6 × CTR  +  0.4 × normalizedDwellScore
 *  가장 높은 score의 Variant가 Winner로 확정됩니다.
 *
 * @param {string} experimentId
 */
function _maybePickWinner(experimentId) {
  const exp = _store.get(experimentId);
  if (!exp || exp.winner) return; // 이미 Winner 확정됨

  const def = EXPERIMENTS[experimentId];

  // 충분한 데이터가 쌓였는지 확인
  const allReady = def.variants.every(v => {
    const stat = exp.stats.get(v.id);
    return stat && stat.impressions >= MIN_IMPRESSIONS_PER_VARIANT;
  });
  if (!allReady) return;

  // 각 Variant 점수 계산
  const scored = def.variants.map(v => {
    const stat = exp.stats.get(v.id);
    const ctr  = stat.impressions > 0 ? stat.clicks / stat.impressions : 0;
    const avgDwell = stat.impressions > 0 ? stat.totalDwellMs / stat.impressions : 0;
    return { id: v.id, ctr, avgDwell };
  });

  // Dwell 정규화 (0~1)
  const maxDwell = Math.max(...scored.map(s => s.avgDwell), 1);
  const withScore = scored.map(s => ({
    ...s,
    score: 0.6 * s.ctr + 0.4 * (s.avgDwell / maxDwell),
  }));

  // Winner 확정
  withScore.sort((a, b) => b.score - a.score);
  const winner = withScore[0];

  exp.winner        = winner.id;
  exp.winnerLockedAt = new Date().toISOString();
}

// ─────────────────────────────────────────────
// Read-only Getters
// ─────────────────────────────────────────────

/**
 * 실험 결과 통계를 반환합니다.
 * @param {string} experimentId
 * @returns {{ variants: Array, winner: string|null, winnerLockedAt: string|null }}
 */
export function getExperimentStats(experimentId) {
  const exp = _getExp(experimentId);
  const def = EXPERIMENTS[experimentId];

  const variants = def.variants.map(v => {
    const stat = exp.stats.get(v.id);
    const ctr  = stat.impressions > 0
      ? ((stat.clicks / stat.impressions) * 100).toFixed(2)
      : '0.00';
    const avgDwellSec = stat.impressions > 0
      ? (stat.totalDwellMs / stat.impressions / 1000).toFixed(1)
      : '0.0';
    return {
      id:           v.id,
      label:        v.label,
      impressions:  stat.impressions,
      clicks:       stat.clicks,
      ctr:          `${ctr}%`,
      avgDwellSec:  `${avgDwellSec}s`,
      isWinner:     exp.winner === v.id,
    };
  });

  return {
    experimentId,
    name:           def.name,
    variants,
    winner:         exp.winner,
    winnerLockedAt: exp.winnerLockedAt,
    totalImpressions: variants.reduce((s, v) => s + v.impressions, 0),
  };
}

/**
 * 모든 실험의 통계를 한번에 반환합니다.
 * Dashboard용 API에서 사용합니다.
 */
export function getAllExperimentStats() {
  return Object.keys(EXPERIMENTS).map(id => getExperimentStats(id));
}

/**
 * 특정 실험의 현재 Winner를 반환합니다.
 * Winner가 없으면 null을 반환합니다.
 * @param {string} experimentId
 * @returns {string|null}
 */
export function getWinner(experimentId) {
  const exp = _store.get(experimentId);
  return exp?.winner ?? null;
}
