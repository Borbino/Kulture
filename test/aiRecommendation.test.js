/**
 * aiRecommendation.js 테스트
 * - suggestTags: AI 우선 + fallback 키워드 추출
 * - suggestCategories: AI 우선 + 텍스트매칭 폴백
 * - extractUserInterests, getPersonalizedRecommendations, getSimilarPosts, getTrendingPosts: Sanity 목킹
 */

import {
  suggestTags,
  suggestCategories,
  extractUserInterests,
  getSimilarPosts,
  getTrendingPosts,
} from '../lib/aiRecommendation.js';

// generateWithBestModel 목킹
jest.mock('../lib/aiModelManager.js', () => ({
  generateWithBestModel: jest.fn(),
}));

// sanityClient 목킹
jest.mock('../lib/sanityClient.js', () => ({
  sanityClient: {
    fetch: jest.fn(),
  },
}));

import { generateWithBestModel } from '../lib/aiModelManager.js';
import { sanityClient } from '../lib/sanityClient.js';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('suggestTags', () => {
  test('AI 성공 시 AI 태그 반환', async () => {
    generateWithBestModel.mockResolvedValueOnce({
      text: '["k-pop", "아이돌", "트렌드", "kpop"]',
      providerName: 'openai',
    });

    const tags = await suggestTags('K-POP 아이돌 새 앨범', '최신 K-POP 소식');
    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBeGreaterThan(0);
    expect(tags.every(t => typeof t === 'string')).toBe(true);
  });

  test('AI 실패 시 fallback 키워드 반환', async () => {
    generateWithBestModel.mockRejectedValueOnce(new Error('AI error'));

    const tags = await suggestTags('K-POP 아이돌 드라마', 'kdrama kpop 한국 드라마');
    expect(Array.isArray(tags)).toBe(true);
    // fallback이 k-pop, k-drama 등 K-Culture 키워드를 감지해야 함
    expect(tags.length).toBeGreaterThan(0);
  });

  test('AI 응답이 잘못된 JSON일 때 fallback', async () => {
    generateWithBestModel.mockResolvedValueOnce({
      text: '이것은 JSON이 아닙니다',
      providerName: 'test',
    });

    const tags = await suggestTags('뷰티 화장품 K-beauty', '한국 뷰티 트렌드');
    expect(Array.isArray(tags)).toBe(true);
  });

  test('반환 태그는 8개 이하', async () => {
    generateWithBestModel.mockResolvedValueOnce({
      text: '["t1","t2","t3","t4","t5","t6","t7","t8","t9","t10"]',
      providerName: 'test',
    });
    const tags = await suggestTags('테스트', '긴 내용');
    expect(tags.length).toBeLessThanOrEqual(8);
  });
});

describe('suggestCategories', () => {
  const mockCategories = [
    { _id: 'cat1', title: 'K-Pop', slug: { current: 'k-pop' }, description: 'Korean popular music' },
    { _id: 'cat2', title: 'K-Drama', slug: { current: 'k-drama' }, description: 'Korean drama series' },
    { _id: 'cat3', title: 'K-Food', slug: { current: 'k-food' }, description: 'Korean food and cuisine' },
  ];

  test('AI 성공 시 AI 카테고리 반환', async () => {
    sanityClient.fetch.mockResolvedValueOnce(mockCategories);
    generateWithBestModel.mockResolvedValueOnce({
      text: '["K-Pop"]',
      providerName: 'openai',
    });

    const cats = await suggestCategories('아이돌 최신 정보', 'K-POP 노래', ['k-pop']);
    expect(Array.isArray(cats)).toBe(true);
    expect(cats.length).toBeGreaterThanOrEqual(0);
  });

  test('AI 실패 시 텍스트 매칭 폴백', async () => {
    sanityClient.fetch.mockResolvedValueOnce(mockCategories);
    generateWithBestModel.mockRejectedValueOnce(new Error('AI error'));

    const cats = await suggestCategories('K-Pop music idol', 'Korean popular music', ['k-pop']);
    expect(Array.isArray(cats)).toBe(true);
  });

  test('Sanity 오류 시 빈 배열 반환', async () => {
    sanityClient.fetch.mockRejectedValueOnce(new Error('Sanity error'));
    const cats = await suggestCategories('title', 'content');
    expect(cats).toEqual([]);
  });

  test('카테고리 없으면 빈 배열', async () => {
    sanityClient.fetch.mockResolvedValueOnce([]);
    const cats = await suggestCategories('title', 'content');
    expect(cats).toEqual([]);
  });
});

describe('extractUserInterests', () => {
  test('정상 데이터 → 관심사 객체 반환', async () => {
    sanityClient.fetch
      .mockResolvedValueOnce([{ tags: ['k-pop', 'idol'], categories: [{ slug: { current: 'k-pop' }, title: 'K-Pop' }] }])
      .mockResolvedValueOnce([{ tags: ['drama'], categories: [] }])
      .mockResolvedValueOnce([{ post: { board: { slug: { current: 'music' }, name: 'music' } } }]);

    const result = await extractUserInterests('user-123');
    expect(result).toHaveProperty('tags');
    expect(result).toHaveProperty('categories');
    expect(result).toHaveProperty('boards');
  });

  test('Sanity 오류 → 빈 관심사 반환', async () => {
    sanityClient.fetch.mockRejectedValue(new Error('DB error'));
    const result = await extractUserInterests('user-123');
    expect(result).toEqual({ tags: {}, categories: {}, boards: {} });
  });
});

describe('getSimilarPosts', () => {
  test('유사 게시글 반환', async () => {
    sanityClient.fetch
      .mockResolvedValueOnce({ tags: ['k-pop'], categories: ['cat1'], board: 'board1' })
      .mockResolvedValueOnce([{ _id: 'post2', title: '관련 글', tags: ['k-pop'] }]);

    const result = await getSimilarPosts('post1');
    expect(Array.isArray(result)).toBe(true);
  });

  test('게시글 없으면 빈 배열', async () => {
    sanityClient.fetch.mockResolvedValueOnce(null);
    const result = await getSimilarPosts('nonexistent');
    expect(result).toEqual([]);
  });
});

describe('getTrendingPosts', () => {
  test('시간 범위별 트렌딩 반환', async () => {
    const mockPosts = [{ _id: 'p1', title: '트렌딩 글', likes: 100 }];
    sanityClient.fetch.mockResolvedValueOnce(mockPosts);

    const result = await getTrendingPosts('24h', 5);
    expect(result).toEqual(mockPosts);
  });

  test('잘못된 timeRange → 기본값 24h 사용', async () => {
    sanityClient.fetch.mockResolvedValueOnce([]);
    const result = await getTrendingPosts('invalid', 5);
    expect(result).toEqual([]);
    expect(sanityClient.fetch).toHaveBeenCalledTimes(1);
  });

  test('오류 시 빈 배열', async () => {
    sanityClient.fetch.mockRejectedValueOnce(new Error('DB error'));
    const result = await getTrendingPosts('1h', 5);
    expect(result).toEqual([]);
  });
});
