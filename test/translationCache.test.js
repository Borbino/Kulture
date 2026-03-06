/**
 * Tests for lib/translationCache.js
 * - getCachedTranslation: L1 메모리 캐시 조회
 * - setCachedTranslation: L1 메모리 캐시 저장
 * - getCachedTranslationsBatch: 배치 조회
 * - getCacheStatistics: 캐시 통계
 * - clearMemoryCache: 메모리 캐시 초기화
 */

// Redis는 테스트 환경에서 미사용 (REDIS_URL 없음)
// → 순수 L1 메모리 캐시 경로만 테스트

import {
  getCachedTranslation,
  setCachedTranslation,
  getCachedTranslationsBatch,
  getCacheStatistics,
  clearMemoryCache,
} from '../lib/translationCache.js';

beforeEach(() => {
  clearMemoryCache();
});

describe('setCachedTranslation + getCachedTranslation', () => {
  test('저장 후 조회 → 번역문 반환', async () => {
    await setCachedTranslation('Hello', 'en', 'ko', '안녕하세요');
    const result = await getCachedTranslation('Hello', 'en', 'ko');
    expect(result).toBe('안녕하세요');
  });

  test('미존재 키 → null 반환', async () => {
    const result = await getCachedTranslation('Unknown text', 'en', 'ko');
    expect(result).toBeNull();
  });

  test('같은 텍스트, 다른 언어쌍 → 독립적으로 저장', async () => {
    await setCachedTranslation('Hello', 'en', 'ko', '안녕하세요');
    await setCachedTranslation('Hello', 'en', 'ja', 'こんにちは');
    const ko = await getCachedTranslation('Hello', 'en', 'ko');
    const ja = await getCachedTranslation('Hello', 'en', 'ja');
    expect(ko).toBe('안녕하세요');
    expect(ja).toBe('こんにちは');
  });

  test('같은 키 재저장 → 최신 값으로 덮어쓰기', async () => {
    await setCachedTranslation('Hello', 'en', 'ko', '구버전');
    await setCachedTranslation('Hello', 'en', 'ko', '안녕하세요');
    const result = await getCachedTranslation('Hello', 'en', 'ko');
    expect(result).toBe('안녕하세요');
  });
});

describe('getCachedTranslationsBatch', () => {
  test('배치 조회 — 일부 캐시히트, 일부 미스', async () => {
    await setCachedTranslation('Hello', 'en', 'ko', '안녕하세요');
    const items = [
      { text: 'Hello', sourceLang: 'en', targetLang: 'ko' },
      { text: 'World', sourceLang: 'en', targetLang: 'ko' },
    ];
    const results = await getCachedTranslationsBatch(items);
    expect(results).toHaveLength(2);
    // Hello → 캐시 히트
    expect(results[0].hit).toBe(true);
    expect(results[0].cached).toBe('안녕하세요');
    // World → 캐시 미스
    expect(results[1].hit).toBe(false);
    expect(results[1].cached).toBeNull();
  });

  test('빈 배열 → 빈 배열 반환', async () => {
    const results = await getCachedTranslationsBatch([]);
    expect(results).toEqual([]);
  });
});

describe('getCacheStatistics', () => {
  test('통계 객체에 memory 관련 필드 존재', async () => {
    await setCachedTranslation('Test', 'en', 'ko', '테스트');
    const stats = await getCacheStatistics();
    expect(stats.memory).toBeDefined();
    expect(stats.memory.size).toBeGreaterThan(0);
  });

  test('clearMemoryCache 후 memory.size = 0', async () => {
    await setCachedTranslation('Test', 'en', 'ko', '테스트');
    clearMemoryCache();
    const stats = await getCacheStatistics();
    expect(stats.memory.size).toBe(0);
  });
});

describe('clearMemoryCache', () => {
  test('저장된 항목 삭제 후 조회 → null', async () => {
    await setCachedTranslation('Hello', 'en', 'ko', '안녕하세요');
    clearMemoryCache();
    const result = await getCachedTranslation('Hello', 'en', 'ko');
    expect(result).toBeNull();
  });
});
