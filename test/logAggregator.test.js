const { LogAggregator, getLogAggregator } = require('../lib/logAggregator')

describe('LogAggregator', () => {
  let aggregator

  beforeEach(() => {
    aggregator = new LogAggregator()
  })

  describe('logError', () => {
    it('에러 로그를 기록해야 함', () => {
      const error = new Error('Test error')
      const result = aggregator.logError('test-module', error, { userId: 123 })

      expect(result).toMatchObject({
        module: 'test-module',
        message: 'Test error',
        context: { userId: 123 },
      })
      expect(result.timestamp).toBeDefined()
      expect(result.stack).toBeDefined()
      expect(aggregator.errors).toHaveLength(1)
    })

    it('에러가 5개 이상이면 알림을 전송해야 함', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      for (let i = 0; i < 5; i++) {
        aggregator.logError('test', new Error(`Error ${i}`))
      }

      // 5개 도달 시 1번만 알림
      expect(consoleSpy).toHaveBeenCalledTimes(1)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Log Aggregator Alert]'),
      )
      
      // 추가 에러는 알림 없음 (중복 방지)
      consoleSpy.mockClear()
      aggregator.logError('test', new Error('Error 6'))
      expect(consoleSpy).not.toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('logWarning', () => {
    it('경고 로그를 기록해야 함', () => {
      const result = aggregator.logWarning('test-module', 'Test warning', {
        level: 'medium',
      })

      expect(result).toMatchObject({
        module: 'test-module',
        message: 'Test warning',
        context: { level: 'medium' },
      })
      expect(result.timestamp).toBeDefined()
      expect(aggregator.warnings).toHaveLength(1)
    })
  })

  describe('generateErrorReport', () => {
    it('종합 에러 리포트를 생성해야 함', () => {
      aggregator.logError('module-a', new Error('Error 1'))
      aggregator.logError('module-a', new Error('Error 2'))
      aggregator.logError('module-b', new Error('Error 3'))
      aggregator.logWarning('module-c', 'Warning 1')

      const report = aggregator.generateErrorReport()

      expect(report.totalErrors).toBe(3)
      expect(report.totalWarnings).toBe(1)
      expect(report.errorsByModule).toEqual({
        'module-a': 2,
        'module-b': 1,
      })
      expect(report.messagePatterns).toBeDefined()
      expect(report.recentErrors).toHaveLength(3)
      expect(report.generatedAt).toBeDefined()
    })

    it('최근 10개의 에러만 포함해야 함', () => {
      for (let i = 0; i < 15; i++) {
        aggregator.logError('test', new Error(`Error ${i}`))
      }

      const report = aggregator.generateErrorReport()

      expect(report.recentErrors).toHaveLength(10)
      expect(report.recentErrors[0].message).toBe('Error 5')
    })
  })

  describe('getErrorsByModule', () => {
    it('특정 모듈의 에러만 반환해야 함', () => {
      aggregator.logError('module-a', new Error('Error A1'))
      aggregator.logError('module-b', new Error('Error B1'))
      aggregator.logError('module-a', new Error('Error A2'))

      const errors = aggregator.getErrorsByModule('module-a')

      expect(errors).toHaveLength(2)
      expect(errors[0].message).toBe('Error A1')
      expect(errors[1].message).toBe('Error A2')
    })
  })

  describe('getErrorsByTimeRange', () => {
    it('특정 기간 내 에러만 반환해야 함', () => {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

      // 타임스탬프 직접 설정
      aggregator.errors = [
        {
          module: 'test',
          message: 'Old error',
          timestamp: twoHoursAgo.toISOString(),
        },
        {
          module: 'test',
          message: 'Recent error',
          timestamp: oneHourAgo.toISOString(),
        },
      ]

      const errors = aggregator.getErrorsByTimeRange(
        oneHourAgo.toISOString(),
        now.toISOString(),
      )

      expect(errors).toHaveLength(1)
      expect(errors[0].message).toBe('Recent error')
    })
  })

  describe('getErrorRate', () => {
    it('지정된 시간 창에서 에러율을 계산해야 함', () => {
      const now = new Date()

      // 최근 30분 동안 5개의 에러
      for (let i = 0; i < 5; i++) {
        const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000)
        aggregator.errors.push({
          module: 'test',
          message: `Error ${i}`,
          timestamp: timestamp.toISOString(),
        })
      }

      const rate = aggregator.getErrorRate(60)

      expect(rate.count).toBe(5)
      expect(rate.rate).toBe(5 / 60) // 분당 에러 수
      expect(rate.window).toBe(60)
    })

    it('시간 창 밖의 에러는 제외해야 함', () => {
      const now = new Date()
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

      aggregator.errors.push({
        module: 'test',
        message: 'Old error',
        timestamp: twoHoursAgo.toISOString(),
      })

      const rate = aggregator.getErrorRate(60)

      expect(rate.count).toBe(0)
    })
  })

  describe('getMostFrequentErrors', () => {
    it('가장 빈번한 에러를 반환해야 함', () => {
      aggregator.logError('test', new Error('Error A'))
      aggregator.logError('test', new Error('Error A'))
      aggregator.logError('test', new Error('Error A'))
      aggregator.logError('test', new Error('Error B'))
      aggregator.logError('test', new Error('Error B'))
      aggregator.logError('test', new Error('Error C'))

      const frequent = aggregator.getMostFrequentErrors(2)

      expect(frequent).toHaveLength(2)
      expect(frequent[0].message).toBe('Error A')
      expect(frequent[0].count).toBe(3)
      expect(frequent[1].message).toBe('Error B')
      expect(frequent[1].count).toBe(2)
    })

    it('기본값으로 상위 5개를 반환해야 함', () => {
      for (let i = 0; i < 10; i++) {
        aggregator.logError('test', new Error(`Error ${i}`))
      }

      const frequent = aggregator.getMostFrequentErrors()

      expect(frequent).toHaveLength(5)
    })
  })

  describe('clear', () => {
    it('모든 로그를 초기화해야 함', () => {
      aggregator.logError('test', new Error('Error'))
      aggregator.logWarning('test', 'Warning')

      aggregator.clear()

      expect(aggregator.errors).toHaveLength(0)
      expect(aggregator.warnings).toHaveLength(0)
    })

    it('메모리 제한을 초과하면 오래된 로그를 삭제해야 함', () => {
      // maxLogs는 1000개로 설정되어 있음
      for (let i = 0; i < 1005; i++) {
        aggregator.logError('test', new Error(`Error ${i}`))
      }

      expect(aggregator.errors).toHaveLength(1000)
      // 가장 오래된 로그(0-4)는 삭제되고 최근 1000개만 유지
      expect(aggregator.errors[0].message).toBe('Error 5')
      expect(aggregator.errors[aggregator.errors.length - 1].message).toBe('Error 1004')
    })
  })

  describe('getStats', () => {
    it('전체 통계를 반환해야 함', () => {
      aggregator.logError('module-a', new Error('Error 1'))
      aggregator.logError('module-b', new Error('Error 2'))
      aggregator.logWarning('module-c', 'Warning 1')

      const stats = aggregator.getStats()

      expect(stats.totalErrors).toBe(2)
      expect(stats.totalWarnings).toBe(1)
      expect(stats.uniqueModules).toBe(2)
      expect(stats.oldestError).toBeDefined()
      expect(stats.newestError).toBeDefined()
    })

    it('에러가 없을 때 null을 반환해야 함', () => {
      const stats = aggregator.getStats()

      expect(stats.totalErrors).toBe(0)
      expect(stats.oldestError).toBeNull()
      expect(stats.newestError).toBeNull()
    })
  })

  describe('Singleton', () => {
    it('getLogAggregator는 동일한 인스턴스를 반환해야 함', () => {
      const instance1 = getLogAggregator()
      const instance2 = getLogAggregator()

      expect(instance1).toBe(instance2)
    })

    it('Singleton 인스턴스는 상태를 공유해야 함', () => {
      const instance1 = getLogAggregator()
      instance1.clear() // 초기화
      instance1.logError('test', new Error('Shared error'))

      const instance2 = getLogAggregator()

      expect(instance2.errors).toHaveLength(1)
      expect(instance2.errors[0].message).toBe('Shared error')
    })
  })
})
