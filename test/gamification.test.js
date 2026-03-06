/**
 * Tests for lib/gamification.js
 * - calculateLevel: 번역 수 기반 레벨 계산
 * - checkBadges: 사용자 통계 기반 배지 획득
 * - generateLeaderboard: 사용자 순위표 생성
 */

import { calculateLevel, checkBadges, generateLeaderboard } from '../lib/gamification.js';

describe('calculateLevel', () => {
  test('번역 0건 → 레벨 0', () => {
    const result = calculateLevel(0);
    expect(result.level).toBe(0);
    expect(result.current).toBe(0);
    expect(result.next).toBe(10);
    expect(result.progress).toBe(0);
  });

  test('첫 번역 임계값(10) 도달 → 레벨 1', () => {
    const result = calculateLevel(10);
    expect(result.level).toBe(1);
    expect(result.next).toBe(25);
  });

  test('임계값 사이 진행률 계산', () => {
    // 레벨 1(10) ~ 레벨 2(25): 번역 17건 = (7/15)*100 ≈ 46.67%
    const result = calculateLevel(17);
    expect(result.level).toBe(1);
    expect(result.progress).toBeCloseTo(46.67, 1);
  });

  test('최대 레벨(10000) 이상 → progress 100', () => {
    const result = calculateLevel(10000);
    expect(result.level).toBe(10);
    expect(result.progress).toBe(100);
  });

  test('번역 25건 → 레벨 2', () => {
    const result = calculateLevel(25);
    expect(result.level).toBe(2);
  });

  test('번역 999건 → 레벨 6 (임계값 1000 미만)', () => {
    // LEVEL_THRESHOLDS: [0,10,25,50,100,250,500,1000,...] → 500<=999<1000 → level 6
    const result = calculateLevel(999);
    expect(result.level).toBe(6);
  });
});

describe('checkBadges', () => {
  test('번역 1건 이상 → first_translation 배지 획득', () => {
    const badges = checkBadges({ translationCount: 1, languageCount: 1, avgQuality: 50, approvedSuggestions: 0, currentStreak: 0 });
    const ids = badges.map(b => b.id);
    expect(ids).toContain('first_translation');
  });

  test('5개 언어 → polyglot 배지 획득', () => {
    const badges = checkBadges({ translationCount: 10, languageCount: 5, avgQuality: 50, approvedSuggestions: 0, currentStreak: 0 });
    const ids = badges.map(b => b.id);
    expect(ids).toContain('polyglot');
  });

  test('평균 품질 90 초과 → quality_master 배지 획득', () => {
    const badges = checkBadges({ translationCount: 10, languageCount: 1, avgQuality: 95, approvedSuggestions: 0, currentStreak: 0 });
    const ids = badges.map(b => b.id);
    expect(ids).toContain('quality_master');
  });

  test('승인 제안 50건 → community_hero 배지 획득', () => {
    const badges = checkBadges({ translationCount: 10, languageCount: 1, avgQuality: 50, approvedSuggestions: 50, currentStreak: 0 });
    const ids = badges.map(b => b.id);
    expect(ids).toContain('community_hero');
  });

  test('30일 연속 → consistency_king 배지 획득', () => {
    const badges = checkBadges({ translationCount: 10, languageCount: 1, avgQuality: 50, approvedSuggestions: 0, currentStreak: 30 });
    const ids = badges.map(b => b.id);
    expect(ids).toContain('consistency_king');
  });

  test('신규 유저(0건 번역) → 배지 없음', () => {
    const badges = checkBadges({ translationCount: 0, languageCount: 0, avgQuality: 0, approvedSuggestions: 0, currentStreak: 0 });
    expect(badges).toHaveLength(0);
  });

  test('모든 조건 충족 → 5개 배지 모두 획득', () => {
    const badges = checkBadges({ translationCount: 100, languageCount: 5, avgQuality: 95, approvedSuggestions: 50, currentStreak: 30 });
    expect(badges).toHaveLength(5);
  });

  test('배지 객체에 id, name, icon, requirement 포함', () => {
    const badges = checkBadges({ translationCount: 1, languageCount: 0, avgQuality: 0, approvedSuggestions: 0, currentStreak: 0 });
    expect(badges[0]).toMatchObject({ id: 'first_translation', name: expect.any(String), icon: expect.any(String) });
  });

  test('품질 정확히 90 → quality_master 미획득 (초과 필요)', () => {
    const badges = checkBadges({ translationCount: 0, languageCount: 0, avgQuality: 90, approvedSuggestions: 0, currentStreak: 0 });
    const ids = badges.map(b => b.id);
    expect(ids).not.toContain('quality_master');
  });
});

describe('generateLeaderboard', () => {
  const users = [
    { id: 'a', translationCount: 100, approvedSuggestions: 10, avgQuality: 80 },
    { id: 'b', translationCount: 50,  approvedSuggestions: 5,  avgQuality: 95 },
    { id: 'c', translationCount: 200, approvedSuggestions: 0,  avgQuality: 60 },
  ];

  test('점수 내림차순으로 정렬됨', () => {
    const board = generateLeaderboard(users);
    for (let i = 0; i < board.length - 1; i++) {
      expect(board[i].score).toBeGreaterThanOrEqual(board[i + 1].score);
    }
  });

  test('각 item에 score와 level이 포함됨', () => {
    const board = generateLeaderboard(users);
    expect(board[0]).toHaveProperty('score');
    expect(board[0]).toHaveProperty('level');
  });

  test('최대 100명으로 제한됨', () => {
    const manyUsers = Array.from({ length: 150 }, (_, i) => ({
      id: `user-${i}`, translationCount: i, approvedSuggestions: 0, avgQuality: 50,
    }));
    const board = generateLeaderboard(manyUsers);
    expect(board.length).toBeLessThanOrEqual(100);
  });

  test('빈 배열 입력 → 빈 배열 반환', () => {
    expect(generateLeaderboard([])).toEqual([]);
  });

  test('점수 = 번역*10 + 승인*50 + 품질', () => {
    const board = generateLeaderboard([{ id: 'x', translationCount: 10, approvedSuggestions: 2, avgQuality: 75 }]);
    // 10*10 + 2*50 + 75 = 100 + 100 + 75 = 275
    expect(board[0].score).toBe(275);
  });
});
