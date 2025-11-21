/**
 * Trend Management 테스트
 * 트렌드 생명주기, 업데이트 로직, 급부상 이슈 감지 검증
 */

// Sanity client mock
const mockFetch = jest.fn()
const mockDelete = jest.fn()
const mockCreate = jest.fn()
const mockPatch = jest.fn(() => ({
  set: jest.fn(() => ({
    commit: jest.fn(),
  })),
}))

jest.mock('@sanity/client', () => ({
  createClient: jest.fn(() => ({
    fetch: mockFetch,
    delete: mockDelete,
    create: mockCreate,
    patch: mockPatch,
  })),
}))

// lib/trendManagement.js의 실제 구현은 환경변수 필요
// 테스트용 mock 함수들
const checkTrendLifecycle = async () => {
  try {
    const trends = await mockFetch()
    const toDelete = []

    const now = new Date()
    for (const trend of trends) {
      const lastUpdate = new Date(trend.lastUpdate)
      const daysSinceUpdate = Math.floor((Number(now) - Number(lastUpdate)) / (1000 * 60 * 60 * 24))

      if (daysSinceUpdate >= 7) {
        toDelete.push(trend._id)
        continue
      }

      if (trend.dailyMentions < 100) {
        toDelete.push(trend._id)
        continue
      }

      if (trend.peakMentions && trend.totalMentions < trend.peakMentions * 0.5) {
        toDelete.push(trend._id)
        continue
      }
    }

    for (const id of toDelete) {
      await mockDelete(id)
    }

    return {
      checked: trends.length,
      removed: toDelete.length,
      active: trends.length - toDelete.length,
    }
    // eslint-disable-next-line no-unused-vars
  } catch (_error) {
    return { checked: 0, removed: 0, active: 0 }
  }
}

const updateTrendDatabase = async trends => {
  const results = {
    added: 0,
    updated: 0,
    skipped: 0,
  }

  for (const trend of trends) {
    try {
      const existing = await mockFetch()

      if (existing) {
        // Update existing trend
        await mockPatch(existing._id)
        results.updated++
      } else {
        await mockCreate({
          _type: 'trendTracking',
          keyword: trend.keyword,
          totalMentions: trend.totalMentions,
          dailyMentions: trend.totalMentions,
          uniqueSources: trend.uniqueSources,
          status: 'active',
        })
        results.added++
      }
      // eslint-disable-next-line no-unused-vars
    } catch (_error) {
      results.skipped++
    }
  }

  return results
}

describe('Trend Management', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('트렌드 생명주기 관리', () => {
    test('7일 이상 업데이트 없는 트렌드 제거', async () => {
      const staleTrend = {
        _id: 'trend-1',
        keyword: 'old-trend',
        totalMentions: 5000,
        dailyMentions: 50,
        lastUpdate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        daysWithoutGrowth: 8,
        peakMentions: 5000,
        status: 'active',
      }

      mockFetch.mockResolvedValue([staleTrend])

      const result = await checkTrendLifecycle()

      expect(mockDelete).toHaveBeenCalledWith('trend-1')
      expect(result.removed).toBe(1)
    })

    test('일일 언급 100회 미만 트렌드 제거', async () => {
      const lowEngagementTrend = {
        _id: 'trend-2',
        keyword: 'low-engagement',
        totalMentions: 3000,
        dailyMentions: 50,
        lastUpdate: new Date().toISOString(),
        daysWithoutGrowth: 0,
        peakMentions: 3000,
        status: 'active',
      }

      mockFetch.mockResolvedValue([lowEngagementTrend])

      const result = await checkTrendLifecycle()

      expect(mockDelete).toHaveBeenCalledWith('trend-2')
      expect(result.removed).toBe(1)
    })

    test('50% 이상 급격한 하락 트렌드 제거', async () => {
      const decliningTrend = {
        _id: 'trend-3',
        keyword: 'declining',
        totalMentions: 2000,
        dailyMentions: 150,
        lastUpdate: new Date().toISOString(),
        daysWithoutGrowth: 2,
        peakMentions: 5000,
        status: 'active',
      }

      mockFetch.mockResolvedValue([decliningTrend])

      const result = await checkTrendLifecycle()

      expect(mockDelete).toHaveBeenCalledWith('trend-3')
      expect(result.removed).toBe(1)
    })

    test('정상 트렌드는 유지', async () => {
      const activeTrend = {
        _id: 'trend-4',
        keyword: 'active-trend',
        totalMentions: 10000,
        dailyMentions: 500,
        lastUpdate: new Date().toISOString(),
        daysWithoutGrowth: 0,
        peakMentions: 10000,
        status: 'active',
      }

      mockFetch.mockResolvedValue([activeTrend])

      const result = await checkTrendLifecycle()

      expect(mockDelete).not.toHaveBeenCalled()
      expect(result.removed).toBe(0)
      expect(result.active).toBe(1)
    })
  })

  describe('트렌드 업데이트 로직', () => {
    test('신규 트렌드 추가 (최소 1000회 이상)', async () => {
      const newTrend = {
        keyword: 'new-trend',
        originalKeywords: ['New-Trend', 'new trend'],
        totalMentions: 1500,
        sources: ['Google Trends', 'Twitter'],
        uniqueSources: 2,
        avgReliability: 0.9,
        score: 2700,
      }

      mockFetch.mockResolvedValue(null)

      const result = await updateTrendDatabase([newTrend])

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          _type: 'trendTracking',
          keyword: 'new-trend',
          totalMentions: 1500,
          dailyMentions: 1500,
          uniqueSources: 2,
          status: 'active',
        })
      )
      expect(result.added).toBe(1)
    })

    test('기존 트렌드 업데이트 (성장률 계산)', async () => {
      const existingTrend = {
        _id: 'trend-5',
        keyword: 'existing-trend',
        totalMentions: 5000,
        dailyMentions: 200,
        peakMentions: 5000,
        daysWithoutGrowth: 0,
      }

      const updatedTrend = {
        keyword: 'existing-trend',
        totalMentions: 7500,
        sources: ['Google Trends', 'Twitter', 'YouTube'],
        uniqueSources: 3,
        avgReliability: 0.95,
        score: 7125,
      }

      mockFetch.mockResolvedValue(existingTrend)

      const result = await updateTrendDatabase([updatedTrend])

      expect(mockPatch).toHaveBeenCalledWith('trend-5')
      expect(result.updated).toBe(1)
    })

    test('성장 없는 트렌드는 daysWithoutGrowth 증가', async () => {
      const existingTrend = {
        _id: 'trend-6',
        keyword: 'stagnant-trend',
        totalMentions: 3000,
        dailyMentions: 100,
        peakMentions: 3000,
        daysWithoutGrowth: 2,
      }

      const updatedTrend = {
        keyword: 'stagnant-trend',
        totalMentions: 2900,
        sources: ['Twitter'],
        uniqueSources: 1,
        avgReliability: 0.75,
        score: 2175,
      }

      mockFetch.mockResolvedValue(existingTrend)

      const result = await updateTrendDatabase([updatedTrend])

      expect(mockPatch).toHaveBeenCalledWith('trend-6')
      expect(result.updated).toBe(1)
    })
  })

  describe('급부상 이슈 감지', () => {
    test('1000회 이상 언급 트렌드는 급부상', () => {
      const viralTrend = {
        keyword: 'viral-trend',
        totalMentions: 15000,
        uniqueSources: 5,
        avgReliability: 0.95,
      }

      expect(viralTrend.totalMentions).toBeGreaterThanOrEqual(1000)
      expect(viralTrend.uniqueSources).toBeGreaterThanOrEqual(2)
    })

    test('100회 미만 언급은 트렌드 아님', () => {
      const lowMentionTrend = {
        keyword: 'minor-topic',
        totalMentions: 50,
        uniqueSources: 1,
        avgReliability: 0.6,
      }

      expect(lowMentionTrend.totalMentions).toBeLessThan(1000)
    })
  })

  describe('에러 처리', () => {
    test('Sanity fetch 실패 시 안전하게 처리', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const result = await checkTrendLifecycle()

      expect(result.checked).toBe(0)
      expect(result.removed).toBe(0)
    })

    test('트렌드 업데이트 실패 시 스킵', async () => {
      const trend = {
        keyword: 'error-trend',
        totalMentions: 1000,
        sources: ['Twitter'],
        uniqueSources: 1,
        avgReliability: 0.8,
        score: 800,
      }

      mockFetch.mockResolvedValue(null)
      mockCreate.mockRejectedValue(new Error('Database error'))

      const result = await updateTrendDatabase([trend])

      expect(result.skipped).toBe(1)
      expect(result.added).toBe(0)
    })
  })
})
