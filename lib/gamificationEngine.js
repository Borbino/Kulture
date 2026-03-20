/**
 * Gamification Engine — Phase 9
 * Kulture Platform · 글로벌 팬덤 락인 시스템
 *
 * ── 포인트 지급 (awardPoints) ──────────────────────────────
 *   READ_ARTICLE          +10 EXP
 *   VOTE_POLL             +20 EXP
 *   COMMENT               +15 EXP
 *   SHARE_POST            +25 EXP
 *   CONTRIBUTE_TRANSLATION+50 EXP
 *   DAILY_LOGIN           +5  EXP
 *   COMPLETE_DAILY_MISSION+30 EXP
 *
 * ── 등급 테이블 ───────────────────────────────────────────
 *   0        Rookie          🌱
 *   100      K-Wave Starter  🌊
 *   300      K-Pop Fan       🎵
 *   600      Hallyu Rider    🚂
 *   1000     Trend Setter    🔥
 *   2000     Kultur Master   👑
 *   5000     K-Culture God   ⚡
 */

// ── 포인트 테이블 ──────────────────────────────────────────
export const ACTION_POINTS = {
  READ_ARTICLE:           10,
  VOTE_POLL:              20,
  COMMENT:                15,
  SHARE_POST:             25,
  CONTRIBUTE_TRANSLATION: 50,
  DAILY_LOGIN:             5,
  COMPLETE_DAILY_MISSION: 30,
};

// ── 등급 정의 ──────────────────────────────────────────────
export const LEVELS = [
  { minExp: 0,    level: 1, title: 'Rookie',         icon: '🌱', color: '#6b7280' },
  { minExp: 100,  level: 2, title: 'K-Wave Starter', icon: '🌊', color: '#3b82f6' },
  { minExp: 300,  level: 3, title: 'K-Pop Fan',      icon: '🎵', color: '#8b5cf6' },
  { minExp: 600,  level: 4, title: 'Hallyu Rider',   icon: '🚂', color: '#06b6d4' },
  { minExp: 1000, level: 5, title: 'Trend Setter',   icon: '🔥', color: '#f97316' },
  { minExp: 2000, level: 6, title: 'Kultur Master',  icon: '👑', color: '#eab308' },
  { minExp: 5000, level: 7, title: 'K-Culture God',  icon: '⚡', color: '#ff2e93' },
];

// ── 뱃지 정의 ─────────────────────────────────────────────
export const BADGES = {
  FIRST_READ:      { id: 'FIRST_READ',      name: 'First Read',      icon: '📖', desc: '첫 번째 기사를 읽었습니다' },
  POLL_MASTER:     { id: 'POLL_MASTER',     name: 'Poll Master',     icon: '🗳️',  desc: '투표 10회 참여' },
  POLYGLOT:        { id: 'POLYGLOT',        name: 'Polyglot',        icon: '🌍', desc: '5개 언어 번역 기여' },
  STREAK_7:        { id: 'STREAK_7',        name: '7-Day Streak',    icon: '🔥', desc: '7일 연속 로그인' },
  STREAK_30:       { id: 'STREAK_30',       name: '30-Day Streak',   icon: '💎', desc: '30일 연속 로그인' },
  TREND_HUNTER:    { id: 'TREND_HUNTER',    name: 'Trend Hunter',    icon: '📡', desc: '트렌딩 기사 20개 읽기' },
  TOP_CONTRIBUTOR: { id: 'TOP_CONTRIBUTOR', name: 'Top Contributor', icon: '⭐', desc: '번역 기여 50회' },
};

// ── 모의 DB (Mock Store) ───────────────────────────────────
// 프로덕션에서는 Sanity / DB로 교체
const _store = new Map(); // userId → UserProfile

/**
 * 유저 프로필 조회 (없으면 초기화)
 */
function getProfile(userId) {
  if (!_store.has(userId)) {
    _store.set(userId, {
      userId,
      exp:        0,
      actions:    {},      // actionType → count
      badges:     [],
      streak:     0,
      lastActive: null,
      createdAt:  Date.now(),
    });
  }
  return _store.get(userId);
}

/**
 * 누적 EXP로 현재 레벨 정보 산출
 */
export function getLevelInfo(exp) {
  let info = LEVELS[0];
  for (const lvl of LEVELS) {
    if (exp >= lvl.minExp) info = lvl;
    else break;
  }
  const nextIndex  = LEVELS.indexOf(info) + 1;
  const nextLevel  = LEVELS[nextIndex] || null;
  const toNext     = nextLevel ? nextLevel.minExp - exp : 0;
  const rangeSize  = nextLevel ? nextLevel.minExp - info.minExp : 1;
  const progress   = nextLevel
    ? Math.round(((exp - info.minExp) / rangeSize) * 100)
    : 100;

  return { ...info, exp, toNext, progress, nextLevel };
}

/**
 * 뱃지 조건 체크 후 신규 획득 뱃지 반환
 */
function checkNewBadges(profile) {
  const newBadges = [];
  const earned    = new Set(profile.badges);

  const add = (id) => {
    if (!earned.has(id)) { newBadges.push(BADGES[id]); earned.add(id); }
  };

  if ((profile.actions.READ_ARTICLE   || 0) >= 1)  add('FIRST_READ');
  if ((profile.actions.READ_ARTICLE   || 0) >= 20) add('TREND_HUNTER');
  if ((profile.actions.VOTE_POLL      || 0) >= 10) add('POLL_MASTER');
  if ((profile.actions.CONTRIBUTE_TRANSLATION || 0) >= 50) add('TOP_CONTRIBUTOR');
  if (profile.streak >= 7)  add('STREAK_7');
  if (profile.streak >= 30) add('STREAK_30');

  profile.badges = [...earned];
  return newBadges;
}

/**
 * 포인트 지급 함수 (핵심 API)
 *
 * @param {string}  userId     유저 고유 ID
 * @param {string}  actionType ACTION_POINTS 키 (e.g. 'READ_ARTICLE')
 * @returns {{
 *   exp:         number,     // 지급 후 총 EXP
 *   awarded:     number,     // 이번에 지급된 포인트
 *   levelInfo:   object,     // getLevelInfo 결과
 *   leveledUp:   boolean,    // 레벨업 여부
 *   newBadges:   array,      // 신규 획득 뱃지 배열
 * }}
 */
export function awardPoints(userId, actionType) {
  const pts = ACTION_POINTS[actionType];
  if (!pts) throw new Error(`Unknown actionType: ${actionType}`);

  const profile     = getProfile(userId);
  const prevLevel   = getLevelInfo(profile.exp).level;

  profile.exp      += pts;
  profile.actions[actionType] = (profile.actions[actionType] || 0) + 1;

  // 연속 로그인 체크
  const today = new Date().toDateString();
  if (actionType === 'DAILY_LOGIN') {
    const last = profile.lastActive ? new Date(profile.lastActive).toDateString() : null;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (last === yesterday)      profile.streak += 1;
    else if (last !== today)     profile.streak  = 1;
  }
  profile.lastActive = Date.now();

  const newBadges  = checkNewBadges(profile);
  const levelInfo  = getLevelInfo(profile.exp);
  const leveledUp  = levelInfo.level > prevLevel;

  _store.set(userId, profile);

  return { exp: profile.exp, awarded: pts, levelInfo, leveledUp, newBadges };
}

/**
 * 유저 프로필 전체 조회
 *
 * @param {string} userId
 * @returns {{ userId, exp, levelInfo, badges, streak, actions }}
 */
export function getUserProfile(userId) {
  const profile   = getProfile(userId);
  const levelInfo = getLevelInfo(profile.exp);
  return { ...profile, levelInfo };
}

/**
 * 일일 미션 목록 생성
 * 매일 초기화되는 미션 세트를 반환 (날짜 기반 일관성)
 *
 * @param {string} userId
 * @returns {Array<MissionItem>}
 */
export function getDailyMissions(userId) {
  const profile = getProfile(userId);
  const today   = new Date().toDateString();

  const BASE_MISSIONS = [
    {
      id:         'read_3',
      title:      '기사 3개 읽기',
      description: '오늘의 K-Culture 기사 3개를 읽어보세요',
      icon:       '📖',
      actionType: 'READ_ARTICLE',
      target:     3,
      reward:     30,
      difficulty: 'easy',
    },
    {
      id:         'vote_1',
      title:      '투표 1회 참여',
      description: '오늘의 K-Pop 인기 투표에 참여하세요',
      icon:       '🗳️',
      actionType: 'VOTE_POLL',
      target:     1,
      reward:     20,
      difficulty: 'easy',
    },
    {
      id:         'comment_1',
      title:      '댓글 1개 달기',
      description: '커뮤니티에 의견을 남겨보세요',
      icon:       '💬',
      actionType: 'COMMENT',
      target:     1,
      reward:     15,
      difficulty: 'easy',
    },
    {
      id:         'share_1',
      title:      '기사 1개 공유',
      description: 'K-Culture 소식을 친구에게 알리세요',
      icon:       '📤',
      actionType: 'SHARE_POST',
      target:     1,
      reward:     25,
      difficulty: 'medium',
    },
    {
      id:         'translate_1',
      title:      '번역 기여 1회',
      description: '해외 팬들을 위해 번역을 도와주세요',
      icon:       '🌐',
      actionType: 'CONTRIBUTE_TRANSLATION',
      target:     1,
      reward:     50,
      difficulty: 'hard',
    },
  ];

  return BASE_MISSIONS.map((m) => {
    const done  = profile.actions[m.actionType] || 0;
    const progress = Math.min(done, m.target);
    return {
      ...m,
      date:      today,
      progress,
      completed: progress >= m.target,
      claimed:   false,
    };
  });
}

export default { awardPoints, getUserProfile, getLevelInfo, getDailyMissions, ACTION_POINTS, LEVELS, BADGES };
