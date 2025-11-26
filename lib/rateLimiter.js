/**
 * [설명] API Rate Limiting 유틸리티
 * [목적] IP별 요청 제한으로 악의적 사용 방지 및 비용 관리
 * [일시] 2025-11-20 (KST)
 */

/**
 * 메모리 기반 Rate Limiter
 * 프로덕션에서는 Redis 사용 권장
 */
class RateLimiter {
  constructor(options = {}) {
    this.requests = new Map() // 식별자별 요청 기록
    this.windowMs = options.windowMs || 60000 // 기본 1분
    this.maxRequests = options.maxRequests || 60 // 지속 한도: 60회/분
    this.burst = options.burst || 20 // 버스트 한도: 짧은 시간 내 급증 허용치
    this.burstWindowMs = options.burstWindowMs || 5000 // 버스트 윈도우: 5초
    this.cleanupInterval = options.cleanupInterval || 60000 // 1분마다 정리

    // 주기적 정리
    setInterval(() => this.cleanup(), this.cleanupInterval)
  }

  /**
   * Rate limit 체크
   * @param {string} identifier - 식별자 (IP 주소)
   * @returns {Object} { allowed: boolean, remaining: number, resetAt: number }
   */
  check(identifier) {
    const now = Date.now()
    const record =
      this.requests.get(identifier) || {
        count: 0,
        resetAt: now + this.windowMs,
        burstCount: 0,
        burstResetAt: now + this.burstWindowMs,
      }

    // 시간 윈도우가 지났으면 리셋
    if (now > record.resetAt) {
      record.count = 0
      record.resetAt = now + this.windowMs
    }
    if (now > record.burstResetAt) {
      record.burstCount = 0
      record.burstResetAt = now + this.burstWindowMs
    }

    // 요청 카운트 증가
    record.count++
    record.burstCount++
    this.requests.set(identifier, record)

    const allowedSustained = record.count <= this.maxRequests
    const allowedBurst = record.burstCount <= this.burst
    const allowed = allowedSustained && allowedBurst
    const remaining = Math.max(0, this.maxRequests - record.count)
    const burstRemaining = Math.max(0, this.burst - record.burstCount)

    return {
      allowed,
      remaining,
      resetAt: record.resetAt,
      burstRemaining,
      burstResetAt: record.burstResetAt,
      retryAfter: allowed ? 0 : Math.ceil((record.resetAt - now) / 1000),
    }
  }

  // 만료된 레코드 정리
  cleanup() {
    const now = Date.now()
    for (const [identifier, record] of this.requests.entries()) {
      if (now > record.resetAt + this.windowMs) {
        this.requests.delete(identifier)
      }
    }
  }

  // 특정 식별자 리셋
  reset(identifier) {
    this.requests.delete(identifier)
  }

  // 모든 레코드 리셋
  resetAll() {
    this.requests.clear()
  }

  // 현재 상태 조회
  getStatus(identifier) {
    const record = this.requests.get(identifier)
    if (!record) return null

    const now = Date.now()
    return {
      count: record.count,
      remaining: Math.max(0, this.maxRequests - record.count),
      resetAt: record.resetAt,
      burstCount: record.burstCount,
      burstRemaining: Math.max(0, this.burst - record.burstCount),
      burstResetAt: record.burstResetAt,
      expired: now > record.resetAt,
    }
  }
}

// 전역 Rate Limiter 인스턴스
const limiterInstances = {
  // API 엔드포인트별 제한
  api: new RateLimiter({ windowMs: 60000, maxRequests: 60 }), // 60회/분
  auth: new RateLimiter({ windowMs: 300000, maxRequests: 5 }), // 5회/5분
  upload: new RateLimiter({ windowMs: 3600000, maxRequests: 10 }), // 10회/시간
  cron: new RateLimiter({ windowMs: 60000, maxRequests: 100 }), // 100회/분 (내부용)
}

// Express/Next.js 미들웨어
export function rateLimitMiddleware(limiterType = 'api') {
  const limiter = limiterInstances[limiterType] || limiterInstances.api

  return function rateLimitHandler(req, res, next) {
    // 식별자(IP + 사용자/키) 추출
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.headers['x-real-ip'] ||
      req.connection.remoteAddress ||
      'unknown'
    const userId = req.headers['x-user-id'] || (req.user && req.user.id) || undefined
    const apiKey = req.headers['x-api-key'] || undefined
    const identifier = [ip, userId, apiKey].filter(Boolean).join(':') || ip

    // Rate limit 체크
    const result = limiter.check(identifier)

    // 응답 헤더 추가
    res.setHeader('X-RateLimit-Limit', limiter.maxRequests)
    res.setHeader('X-RateLimit-Remaining', result.remaining)
    res.setHeader('X-RateLimit-Reset', new Date(result.resetAt).toISOString())
    res.setHeader('X-RateLimit-Burst-Limit', limiter.burst)
    res.setHeader('X-RateLimit-Burst-Remaining', result.burstRemaining)
    res.setHeader('X-RateLimit-Burst-Reset', new Date(result.burstResetAt).toISOString())

    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfter)
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
        identifier,
      })
    }

    // Next.js API route는 next 파라미터가 없음
    if (typeof next === 'function') {
      next()
    }
  }
}

// IP 화이트리스트 체크
export function isWhitelisted(ip, whitelist = []) {
  // 로컬 개발 환경 자동 허용
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.')) {
    return true
  }

  return whitelist.includes(ip)
}

// Vercel Cron Job 인증 체크
export function isValidCronRequest(req) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.authorization

  if (!cronSecret) {
    console.warn('[RateLimiter] CRON_SECRET not configured')
    return false
  }

  return authHeader === `Bearer ${cronSecret}`
}

export { RateLimiter, limiterInstances }
export const rateLimiter = rateLimitMiddleware
export default rateLimitMiddleware
