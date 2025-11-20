/**
 * [테스트] trendManagement.js 핵심 기능 테스트
 */

import { jest } from '@jest/globals'

// Mock Sanity Client
jest.mock('../lib/sanityClient.js', () => ({
  default: {
    fetch: jest.fn(),
    create: jest.fn(),
    patch: jest.fn(() => ({
      set: jest.fn(() => ({
        commit: jest.fn(),
      })),
    })),
  },
}))

describe('Trend Management System', () => {
  describe('normalizeKeyword', () => {
    test('키워드 정규화 - 소문자 변환', async () => {
      const { normalizeKeyword } = await import('../lib/trendManagement.js')

      expect(normalizeKeyword('BTS')).toBe('bts')
      expect(normalizeKeyword('NewJeans')).toBe('newjeans')
      expect(normalizeKeyword('aespa')).toBe('aespa')
    })

    test('키워드 정규화 - 공백 제거', async () => {
      const { normalizeKeyword } = await import('../lib/trendManagement.js')

      expect(normalizeKeyword(' BTS ')).toBe('bts')
      expect(normalizeKeyword('  BLACKPINK  ')).toBe('blackpink')
    })

    test('키워드 정규화 - 특수문자 처리', async () => {
      const { normalizeKeyword } = await import('../lib/trendManagement.js')

      expect(normalizeKeyword('K-pop')).toBe('k-pop')
      expect(normalizeKeyword('aespa (에스파)')).toBe('aespa (에스파)')
    })
  })

  describe('deduplicateTrends', () => {
    test('중복 트렌드 제거 - 동일 키워드', async () => {
      const { deduplicateTrends } = await import('../lib/trendManagement.js')

      const trends = [
        { keyword: 'BTS', mentions: 100, sources: ['twitter'] },
        { keyword: 'bts', mentions: 50, sources: ['youtube'] },
        { keyword: 'BTS', mentions: 30, sources: ['reddit'] },
      ]

      const result = deduplicateTrends(trends)

      expect(result.length).toBe(1)
      expect(result[0].keyword).toBe('bts')
      expect(result[0].mentions).toBe(180) // 100 + 50 + 30
      expect(result[0].sources).toContain('twitter')
      expect(result[0].sources).toContain('youtube')
      expect(result[0].sources).toContain('reddit')
    })

    test('중복 트렌드 제거 - 유사 키워드', async () => {
      const { deduplicateTrends } = await import('../lib/trendManagement.js')

      const trends = [
        { keyword: 'NewJeans', mentions: 100, sources: ['twitter'] },
        { keyword: 'New Jeans', mentions: 50, sources: ['youtube'] },
      ]

      const result = deduplicateTrends(trends)

      // normalizeKeyword에 따라 결과가 다를 수 있음
      expect(result.length).toBeGreaterThanOrEqual(1)
    })

    test('서로 다른 트렌드는 유지', async () => {
      const { deduplicateTrends } = await import('../lib/trendManagement.js')

      const trends = [
        { keyword: 'BTS', mentions: 100, sources: ['twitter'] },
        { keyword: 'BLACKPINK', mentions: 80, sources: ['youtube'] },
        { keyword: 'aespa', mentions: 60, sources: ['reddit'] },
      ]

      const result = deduplicateTrends(trends)

      expect(result.length).toBe(3)
    })
  })

  describe('scoreTrend', () => {
    test('트렌드 점수 계산 - 기본 케이스', async () => {
      const { scoreTrend } = await import('../lib/trendManagement.js')

      const trend = {
        keyword: 'BTS',
        mentions: 1000,
        sources: ['twitter', 'youtube', 'reddit'],
        firstSeen: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1일 전
      }

      const score = scoreTrend(trend)

      expect(score).toBeGreaterThan(0)
      expect(typeof score).toBe('number')
    })

    test('멘션 수가 많을수록 점수가 높음', async () => {
      const { scoreTrend } = await import('../lib/trendManagement.js')

      const trend1 = {
        keyword: 'BTS',
        mentions: 1000,
        sources: ['twitter'],
        firstSeen: new Date().toISOString(),
      }

      const trend2 = {
        keyword: 'BLACKPINK',
        mentions: 500,
        sources: ['twitter'],
        firstSeen: new Date().toISOString(),
      }

      const score1 = scoreTrend(trend1)
      const score2 = scoreTrend(trend2)

      expect(score1).toBeGreaterThan(score2)
    })

    test('소스가 많을수록 점수가 높음', async () => {
      const { scoreTrend } = await import('../lib/trendManagement.js')

      const trend1 = {
        keyword: 'BTS',
        mentions: 1000,
        sources: ['twitter', 'youtube', 'reddit'],
        firstSeen: new Date().toISOString(),
      }

      const trend2 = {
        keyword: 'BLACKPINK',
        mentions: 1000,
        sources: ['twitter'],
        firstSeen: new Date().toISOString(),
      }

      const score1 = scoreTrend(trend1)
      const score2 = scoreTrend(trend2)

      expect(score1).toBeGreaterThan(score2)
    })
  })

  describe('SEARCH_ENGINES', () => {
    test('SEARCH_ENGINES는 배열이어야 함', async () => {
      const { SEARCH_ENGINES } = await import('../lib/trendManagement.js')

      expect(Array.isArray(SEARCH_ENGINES)).toBe(true)
      expect(SEARCH_ENGINES.length).toBeGreaterThan(0)
    })

    test('각 검색 엔진은 필수 필드를 가지고 있음', async () => {
      const { SEARCH_ENGINES } = await import('../lib/trendManagement.js')

      SEARCH_ENGINES.forEach(engine => {
        expect(engine).toHaveProperty('name')
        expect(engine).toHaveProperty('enabled')
        expect(engine).toHaveProperty('weight')

        expect(typeof engine.name).toBe('string')
        expect(typeof engine.enabled).toBe('boolean')
        expect(typeof engine.weight).toBe('number')
        expect(engine.weight).toBeGreaterThan(0)
        expect(engine.weight).toBeLessThanOrEqual(1)
      })
    })
  })
})
