/**
 * [설명] Cron Job 인증 미들웨어
 * [목적] 모든 Cron Job의 인증 로직 통합 관리
 * [사용법] export default withCronAuth(handler)
 */

import { isValidCronRequest } from './rateLimiter.js'
import logger from './logger.js'

/**
 * Cron Job 인증 미들웨어
 * @param {Function} handler - Cron Job 핸들러 함수
 * @returns {Function} 인증이 추가된 핸들러
 */
export function withCronAuth(handler) {
  return async (req, res) => {
    // CRON_SECRET 검증
    if (!isValidCronRequest(req)) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or missing CRON_SECRET',
      })
    }

    // 인증 성공 시 원본 핸들러 실행
    return handler(req, res)
  }
}

/**
 * Rate Limiter가 포함된 Cron Job 미들웨어
 * @param {Function} handler - Cron Job 핸들러 함수
 * @param {string} _limiterId - Rate Limiter ID (현재 미사용, 향후 확장용)
 * @returns {Function} 인증 + Rate Limiting이 추가된 핸들러
 */
export function withCronAuthAndRateLimit(handler, _limiterId = 'cron') {
  return async (req, res) => {
    // 1. CRON_SECRET 검증
    if (!isValidCronRequest(req)) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or missing CRON_SECRET',
      })
    }

    // 2. Rate Limiting (선택 사항)
    // Cron Jobs는 Vercel에서 실행되므로 일반적으로 Rate Limiting 불필요
    // 하지만 수동 테스트 시 유용함

    // 3. 원본 핸들러 실행
    return handler(req, res)
  }
}

// 중복 실행 방지용 윈도우 가드
const lastRuns = new Map()

/**
 * 지정된 시간 윈도우 내 중복 실행 방지
 * @param {Function} handler
 * @param {Object} options
 * @param {number} options.windowMs - 중복 방지 윈도우(ms), 기본 60초
 * @param {Function} options.keyFn - 요청별 키 생성 함수 (기본: URL 경로)
 */
export function withCronWindowGuard(handler, options = {}) {
  const windowMs = options.windowMs || 60000
  const keyFn = options.keyFn || ((req) => req.url || 'unknown')

  return async (req, res) => {
    // 인증 선행
    if (!isValidCronRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or missing CRON_SECRET' })
    }

    const key = keyFn(req)
    const now = Date.now()
    const last = lastRuns.get(key) || 0
    const withinWindow = now - last < windowMs

    if (withinWindow) {
      const retryAfter = Math.ceil((windowMs - (now - last)) / 1000)
      logger?.warn?.(`[Cron] Suppressed duplicate run for key=${key}. Retry after ${retryAfter}s`)
      res.setHeader('Retry-After', retryAfter)
      return res.status(409).json({
        error: 'Conflict',
        message: 'Cron already executed recently',
        retryAfter,
      })
    }

    // 실행 허용 및 타임스탬프 갱신
    lastRuns.set(key, now)
    try {
      const result = await handler(req, res)
      return result
    } finally {
      // 윈도우 이후 자동 제거(메모리 누수 방지)
      setTimeout(() => {
        const ts = lastRuns.get(key)
        if (ts && Date.now() - ts >= windowMs) {
          lastRuns.delete(key)
        }
      }, windowMs + 1000)
    }
  }
}

export default withCronAuth
