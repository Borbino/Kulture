/**
 * API Key Manager 테스트
 */

import { APIKeyManager, getAPIKeyManager } from '../lib/apiKeyManager.js'

describe('API Key Manager', () => {
  let manager

  beforeEach(() => {
    manager = new APIKeyManager()
  })

  describe('trackUsage', () => {
    test('API 사용량 추적', () => {
      manager.trackUsage('twitter', 100)
      expect(manager.getUsage('twitter')).toBe(100)

      manager.trackUsage('twitter', 50)
      expect(manager.getUsage('twitter')).toBe(150)
    })

    test('기본값은 1', () => {
      manager.trackUsage('youtube')
      expect(manager.getUsage('youtube')).toBe(1)
    })

    test('알 수 없는 서비스도 추적해야 함', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      manager.trackUsage('unknown-service', 100)

      expect(manager.getUsage('unknown-service')).toBe(100)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown service: unknown-service'),
      )

      consoleWarnSpy.mockRestore()
    })

    test('90% 도달 시 경고 로그', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation()

      manager.trackUsage('youtube', 9100) // 91% (10000의 91%)

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[API Quota] youtube is at 91%')
      )

      warnSpy.mockRestore()
    })

    test('100% 도달 시 에러 로그', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation()

      manager.trackUsage('youtube', 10000)

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[API Quota] youtube has reached its daily limit')
      )

      errorSpy.mockRestore()
    })
  })

  describe('getUsage', () => {
    test('사용량 조회', () => {
      manager.trackUsage('reddit', 1000)
      expect(manager.getUsage('reddit')).toBe(1000)
    })

    test('사용 기록 없으면 0', () => {
      expect(manager.getUsage('naver')).toBe(0)
    })
  })

  describe('getRemainingQuota', () => {
    test('남은 Quota 계산', () => {
      manager.trackUsage('youtube', 3000)
      expect(manager.getRemainingQuota('youtube')).toBe(7000) // 10000 - 3000
    })

    test('한도 초과 시 0', () => {
      manager.trackUsage('youtube', 15000)
      expect(manager.getRemainingQuota('youtube')).toBe(0)
    })

    test('사용 기록 없으면 전체 한도', () => {
      expect(manager.getRemainingQuota('twitter')).toBe(500000)
    })
  })

  describe('getUsagePercent', () => {
    test('사용률 퍼센트 계산', () => {
      manager.trackUsage('youtube', 5000)
      expect(manager.getUsagePercent('youtube')).toBe(50)
    })

    test('사용 기록 없으면 0%', () => {
      expect(manager.getUsagePercent('naver')).toBe(0)
    })

    test('100% 초과해도 100 이상 표시', () => {
      manager.trackUsage('youtube', 15000)
      expect(manager.getUsagePercent('youtube')).toBeGreaterThan(100)
    })
  })

  describe('isLimitReached', () => {
    test('한도 도달 확인', () => {
      manager.trackUsage('youtube', 10000)
      expect(manager.isLimitReached('youtube')).toBe(true)
    })

    test('한도 미도달', () => {
      manager.trackUsage('youtube', 5000)
      expect(manager.isLimitReached('youtube')).toBe(false)
    })

    test('한도 초과', () => {
      manager.trackUsage('youtube', 15000)
      expect(manager.isLimitReached('youtube')).toBe(true)
    })
  })

  describe('resetDailyQuotas', () => {
    test('모든 Quota 리셋', () => {
      manager.trackUsage('twitter', 1000)
      manager.trackUsage('youtube', 500)
      manager.trackUsage('reddit', 2000)

      manager.resetDailyQuotas()

      expect(manager.getUsage('twitter')).toBe(0)
      expect(manager.getUsage('youtube')).toBe(0)
      expect(manager.getUsage('reddit')).toBe(0)
    })

    test('리셋 시간 기록', () => {
      const before = new Date()
      manager.resetDailyQuotas()
      const resetTime = new Date(manager.getLastResetTime())
      const after = new Date()

      expect(resetTime.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(resetTime.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })

  describe('getAllUsage', () => {
    test('모든 서비스 사용 현황 조회', () => {
      manager.trackUsage('twitter', 100000)
      manager.trackUsage('youtube', 5000)

      const usage = manager.getAllUsage()

      expect(usage.twitter).toEqual({
        used: 100000,
        limit: 500000,
        remaining: 400000,
        percent: 20,
        limitReached: false,
      })

      expect(usage.youtube).toEqual({
        used: 5000,
        limit: 10000,
        remaining: 5000,
        percent: 50,
        limitReached: false,
      })

      expect(usage.reddit.used).toBe(0)
      expect(usage.naver.used).toBe(0)
    })
  })

  describe('getLastResetTime', () => {
    test('리셋 전에는 null', () => {
      expect(manager.getLastResetTime()).toBeNull()
    })

    test('리셋 후에는 ISO 날짜 문자열', () => {
      manager.resetDailyQuotas()
      const resetTime = manager.getLastResetTime()

      expect(resetTime).not.toBeNull()
      expect(() => new Date(resetTime)).not.toThrow()
    })
  })

  describe('Singleton', () => {
    test('getAPIKeyManager는 동일한 인스턴스 반환', () => {
      const instance1 = getAPIKeyManager()
      const instance2 = getAPIKeyManager()

      expect(instance1).toBe(instance2)
    })

    test('Singleton 인스턴스는 상태 공유', () => {
      const instance1 = getAPIKeyManager()
      instance1.trackUsage('twitter', 1000)

      const instance2 = getAPIKeyManager()
      expect(instance2.getUsage('twitter')).toBe(1000)
    })
  })
})
