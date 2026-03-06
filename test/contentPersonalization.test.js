/**
 * Tests for lib/contentPersonalization.js
 * - detectRegion: 요청 헤더에서 지역 감지
 * - personalizeForRegion: 지역별 콘텐츠 우선순위 조정
 * - getRegionConfig: 지역별 설정 반환
 */

import {
  detectRegion,
  personalizeForRegion,
  getRegionConfig,
} from '../lib/contentPersonalization.js';

// kCultureSignals는 실제 데이터 사용 (순수 데이터 모듈, 목킹 불필요)

describe('detectRegion', () => {
  test('cf-ipcountry 헤더 KR → korea', () => {
    const req = { headers: { 'cf-ipcountry': 'KR' } };
    expect(detectRegion(req)).toBe('korea');
  });

  test('cf-ipcountry 헤더 JP → japan', () => {
    const req = { headers: { 'cf-ipcountry': 'JP' } };
    expect(detectRegion(req)).toBe('japan');
  });

  test('x-vercel-ip-country 헤더 BR → southAmerica', () => {
    const req = { headers: { 'x-vercel-ip-country': 'BR' } };
    expect(detectRegion(req)).toBe('southAmerica');
  });

  test('Accept-Language ko → korea', () => {
    const req = { headers: { 'accept-language': 'ko-KR,ko;q=0.9' } };
    expect(detectRegion(req)).toBe('korea');
  });

  test('Accept-Language ja → japan', () => {
    const req = { headers: { 'accept-language': 'ja-JP,ja;q=0.9' } };
    expect(detectRegion(req)).toBe('japan');
  });

  test('Accept-Language de → europe', () => {
    const req = { headers: { 'accept-language': 'de-DE,de;q=0.9' } };
    expect(detectRegion(req)).toBe('europe');
  });

  test('헤더 없음 → northAmerica 기본값', () => {
    expect(detectRegion({ headers: {} })).toBe('northAmerica');
  });

  test('req 자체가 null/undefined → northAmerica 기본값', () => {
    expect(detectRegion(null)).toBe('northAmerica');
    expect(detectRegion(undefined)).toBe('northAmerica');
  });

  test('cf-ipcountry가 x-vercel보다 우선', () => {
    const req = { headers: { 'cf-ipcountry': 'JP', 'x-vercel-ip-country': 'US' } };
    expect(detectRegion(req)).toBe('japan');
  });

  test('매핑되지 않은 국가코드 → northAmerica 기본값', () => {
    const req = { headers: { 'cf-ipcountry': 'ZZ' } };
    expect(detectRegion(req)).toBe('northAmerica');
  });
});

describe('personalizeForRegion', () => {
  const posts = [
    { id: '1', title: 'BTS comeback', tags: ['bts', 'kpop'], score: 5 },
    { id: '2', title: 'Korean drama review', tags: ['kdrama'], score: 5 },
    { id: '3', title: 'Tech news', tags: ['tech'], score: 5 },
  ];

  test('결과 배열 길이가 입력과 동일', () => {
    const result = personalizeForRegion(posts, 'northAmerica');
    expect(result).toHaveLength(posts.length);
  });

  test('각 포스트에 personalizedScore, regionBonus, targetRegion 추가', () => {
    const result = personalizeForRegion(posts, 'northAmerica');
    for (const p of result) {
      expect(p).toHaveProperty('personalizedScore');
      expect(p).toHaveProperty('regionBonus');
      expect(p).toHaveProperty('targetRegion', 'northAmerica');
    }
  });

  test('kpop 태그 포스트는 japan 지역서 보너스 획득', () => {
    const kpopPost = { id: 'k', title: 'BTS comeback', tags: ['bts', 'kpop'], score: 5 };
    const [result] = personalizeForRegion([kpopPost], 'japan');
    expect(result.regionBonus).toBeGreaterThan(0);
    expect(result.personalizedScore).toBeGreaterThan(kpopPost.score);
  });

  test('지역 관심사와 무관한 포스트는 regionBonus = 0', () => {
    const techPost = { id: 't', title: 'Generic tech post', tags: ['javascript', 'react'], score: 5 };
    const [result] = personalizeForRegion([techPost], 'northAmerica');
    expect(result.regionBonus).toBe(0);
    expect(result.personalizedScore).toBe(techPost.score);
  });

  test('personalizedScore 내림차순 정렬', () => {
    const result = personalizeForRegion(posts, 'japan');
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].personalizedScore).toBeGreaterThanOrEqual(result[i + 1].personalizedScore);
    }
  });

  test('빈 배열 → 빈 배열 반환', () => {
    expect(personalizeForRegion([], 'japan')).toEqual([]);
  });

  test('알 수 없는 지역 → northAmerica 기본값으로 처리', () => {
    const result = personalizeForRegion(posts, 'unknown_region');
    expect(result).toHaveLength(posts.length);
  });

  test('score 필드 없을 때 기본값 5 사용', () => {
    const postNoScore = { id: 'n', title: 'Test', tags: [] };
    const [result] = personalizeForRegion([postNoScore], 'northAmerica');
    expect(result.personalizedScore).toBeGreaterThanOrEqual(5);
  });
});

describe('getRegionConfig', () => {
  test('korea 지역 → 한국어 설정 반환', () => {
    const config = getRegionConfig('korea');
    expect(config.language).toBe('ko');
    expect(config.displayName).toBeTruthy();
    expect(config.greeting).toBeTruthy();
    expect(Array.isArray(config.highlightCategories)).toBe(true);
  });

  test('japan 지역 → 일본어 설정 반환', () => {
    const config = getRegionConfig('japan');
    expect(config.language).toBe('ja');
  });

  test('northAmerica → 영어 설정 반환', () => {
    const config = getRegionConfig('northAmerica');
    expect(config.language).toBe('en');
    expect(config.highlightCategories).toContain('kpop');
  });

  test('europe → 영어 설정 반환', () => {
    const config = getRegionConfig('europe');
    expect(config.language).toBe('en');
    expect(config.highlightCategories).toContain('kdrama');
  });

  test('알 수 없는 지역 → northAmerica 기본값 반환', () => {
    const config = getRegionConfig('nowhere');
    expect(config.language).toBe('en');
    expect(config.displayName).toBe('North America');
  });

  test('모든 지역에 highlightCategories 배열 존재', () => {
    const regions = ['korea', 'japan', 'northAmerica', 'southAmerica', 'europe', 'southeast_asia', 'china', 'oceania', 'middleEast'];
    for (const region of regions) {
      const config = getRegionConfig(region);
      expect(Array.isArray(config.highlightCategories)).toBe(true);
      expect(config.highlightCategories.length).toBeGreaterThan(0);
    }
  });
});
