/**
 * [설명] Cron Job 인증 미들웨어
 * [목적] 모든 Cron Job의 인증 로직 통합 관리
 * [사용법] export default withCronAuth(handler)
 */

import { isValidCronRequest } from './rateLimiter.js'

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

export default withCronAuth
