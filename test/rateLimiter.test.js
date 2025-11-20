// Rate Limiter 테스트

import { RateLimiter, isWhitelisted, isValidCronRequest } from '../lib/rateLimiter'

describe('RateLimiter', () => {
  let limiter

  beforeEach(() => {
    limiter = new RateLimiter({ windowMs: 1000, maxRequests: 3 })
  })

  afterEach(() => {
    limiter.resetAll()
  })

  test('should allow requests within limit', () => {
    const result1 = limiter.check('test-ip')
    const result2 = limiter.check('test-ip')
    const result3 = limiter.check('test-ip')

    expect(result1.allowed).toBe(true)
    expect(result1.remaining).toBe(2)
    expect(result2.allowed).toBe(true)
    expect(result2.remaining).toBe(1)
    expect(result3.allowed).toBe(true)
    expect(result3.remaining).toBe(0)
  })

  test('should block requests exceeding limit', () => {
    limiter.check('test-ip') // 1
    limiter.check('test-ip') // 2
    limiter.check('test-ip') // 3
    const result = limiter.check('test-ip') // 4

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.retryAfter).toBeGreaterThan(0)
  })

  test('should reset after time window', async () => {
    limiter.check('test-ip') // 1
    limiter.check('test-ip') // 2
    limiter.check('test-ip') // 3

    // 시간 경과 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1100))

    const result = limiter.check('test-ip')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(2)
  }, 2000)

  test('should track multiple identifiers separately', () => {
    const result1 = limiter.check('ip1')
    const result2 = limiter.check('ip2')
    const result3 = limiter.check('ip1')

    expect(result1.remaining).toBe(2)
    expect(result2.remaining).toBe(2) // 별도 추적
    expect(result3.remaining).toBe(1)
  })

  test('should reset specific identifier', () => {
    limiter.check('test-ip')
    limiter.check('test-ip')
    limiter.reset('test-ip')

    const result = limiter.check('test-ip')
    expect(result.remaining).toBe(2)
  })

  test('should get status of identifier', () => {
    limiter.check('test-ip')
    const status = limiter.getStatus('test-ip')

    expect(status).toBeDefined()
    expect(status.count).toBe(1)
    expect(status.remaining).toBe(2)
    expect(status.expired).toBe(false)
  })

  test('should return null for unknown identifier', () => {
    const status = limiter.getStatus('unknown-ip')
    expect(status).toBeNull()
  })

  test('should cleanup expired records', async () => {
    limiter.check('test-ip')
    await new Promise(resolve => setTimeout(resolve, 1100))

    limiter.cleanup()

    // cleanup은 resetAt + windowMs 이후에만 삭제하므로 아직 존재
    const status = limiter.getStatus('test-ip')
    expect(status).toBeDefined()
    expect(status.expired).toBe(true)
  }, 2000)
})

describe('isWhitelisted', () => {
  test('should whitelist localhost', () => {
    expect(isWhitelisted('127.0.0.1')).toBe(true)
    expect(isWhitelisted('::1')).toBe(true)
    expect(isWhitelisted('192.168.1.1')).toBe(true)
  })

  test('should check custom whitelist', () => {
    const whitelist = ['1.2.3.4', '5.6.7.8']
    expect(isWhitelisted('1.2.3.4', whitelist)).toBe(true)
    expect(isWhitelisted('9.9.9.9', whitelist)).toBe(false)
  })
})

describe('isValidCronRequest', () => {
  const originalEnv = process.env.CRON_SECRET

  beforeAll(() => {
    process.env.CRON_SECRET = 'test-secret-key'
  })

  afterAll(() => {
    process.env.CRON_SECRET = originalEnv
  })

  test('should validate correct cron secret', () => {
    const req = {
      headers: {
        authorization: 'Bearer test-secret-key',
      },
    }
    expect(isValidCronRequest(req)).toBe(true)
  })

  test('should reject invalid cron secret', () => {
    const req = {
      headers: {
        authorization: 'Bearer wrong-secret',
      },
    }
    expect(isValidCronRequest(req)).toBe(false)
  })

  test('should reject missing authorization header', () => {
    const req = { headers: {} }
    expect(isValidCronRequest(req)).toBe(false)
  })

  test('should reject when CRON_SECRET not configured', () => {
    delete process.env.CRON_SECRET
    const req = {
      headers: {
        authorization: 'Bearer test-secret-key',
      },
    }
    expect(isValidCronRequest(req)).toBe(false)
    process.env.CRON_SECRET = 'test-secret-key'
  })
})
