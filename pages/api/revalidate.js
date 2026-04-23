/**
 * [설명] Sanity Webhook → Next.js On-demand ISR 갱신 엔드포인트
 * [목적] CEO가 Sanity Studio에서 포스트를 "published"로 변경하면
 *        자동으로 해당 기사 페이지와 메인 페이지를 즉시 재빌드 없이 갱신
 *
 * [연동 순서]
 *  1. Sanity Studio → 문서 상태 변경 (published)
 *  2. Sanity Webhook → POST /api/revalidate (이 엔드포인트)
 *  3. Next.js res.revalidate() → CDN 캐시 즉시 무효화
 *
 * [필요 환경 변수]
 *  - SANITY_REVALIDATE_SECRET : Sanity Webhook 설정 시 등록한 비밀 토큰 (Bearer 인증)
 *  - (선택) VERCEL_DEPLOY_HOOK_URL : 전체 재빌드가 필요할 때 수동으로 호출할 훅 URL
 */

import { logger } from '../../lib/logger.js'

// Vercel Hobby 플랜 최대 실행 시간 확보
export const maxDuration = 60

export default async function revalidateHandler(req, res) {
  // ── 1. Method Guard ───────────────────────────────────────────────
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  // ── 2. Secret 검증 (Bearer 토큰 방식) ────────────────────────────
  const secret = process.env.SANITY_REVALIDATE_SECRET
  if (!secret) {
    logger.error('revalidate', 'SANITY_REVALIDATE_SECRET 환경변수가 설정되지 않았습니다.')
    return res.status(500).json({ error: 'Server misconfiguration: secret not set' })
  }

  const authHeader = req.headers['authorization'] || ''
  const providedToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : req.headers['x-sanity-revalidate-secret'] || ''  // Sanity 헤더 대안

  // timing-safe 비교 (타이밍 어택 방지)
  if (!timingSafeEqual(providedToken, secret)) {
    logger.warn('revalidate', 'Unauthorized revalidate attempt', {
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
    })
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // ── 3. Webhook 페이로드 파싱 ────────────────────────────────────
  const body = req.body || {}
  const { _type, slug, status } = body

  logger.info('revalidate', 'Webhook received', { _type, slug: slug?.current, status })

  // post 타입이 아니거나 published 상태가 아니면 갱신 생략
  if (_type !== 'post') {
    return res.status(200).json({ revalidated: false, message: `Skipped: _type=${_type}` })
  }

  const slugValue = slug?.current || slug || null

  // ── 4. On-demand ISR 갱신 ────────────────────────────────────────
  const revalidatedPaths = []
  const errors = []

  // 4-1. 메인 페이지 항상 갱신 (최신 포스트 목록)
  try {
    await res.revalidate('/')
    revalidatedPaths.push('/')
    logger.info('revalidate', 'Revalidated /')
  } catch (err) {
    errors.push({ path: '/', error: err.message })
    logger.error('revalidate', 'Failed to revalidate /', { error: err.message })
  }

  // 4-2. 해당 기사 슬러그 페이지 갱신
  if (slugValue) {
    const articlePath = `/posts/${slugValue}`
    try {
      await res.revalidate(articlePath)
      revalidatedPaths.push(articlePath)
      logger.info('revalidate', `Revalidated ${articlePath}`)
    } catch (err) {
      errors.push({ path: articlePath, error: err.message })
      logger.error('revalidate', `Failed to revalidate ${articlePath}`, { error: err.message })
    }
  }

  // 4-3. (선택) status == "published" 변경 시 Vercel Deploy Hook 트리거
  //      → ISR이 충분하지 않은 Edge Case (예: 전체 sitemap 재생성) 대응
  if (status === 'published' && process.env.VERCEL_DEPLOY_HOOK_URL) {
    try {
      const hookRes = await fetch(process.env.VERCEL_DEPLOY_HOOK_URL, { method: 'POST' })
      if (!hookRes.ok) throw new Error(`Deploy hook responded ${hookRes.status}`)
      logger.info('revalidate', 'Vercel Deploy Hook triggered')
    } catch (hookErr) {
      // Deploy Hook 실패는 ISR 성공과 무관하므로 경고만 기록
      logger.warn('revalidate', 'Deploy Hook trigger failed (non-critical)', {
        error: hookErr.message,
      })
    }
  }

  return res.status(200).json({
    revalidated: revalidatedPaths.length > 0,
    paths: revalidatedPaths,
    errors: errors.length > 0 ? errors : undefined,
  })
}

/**
 * 타이밍 어택(Timing Attack)을 방지하는 문자열 비교
 * crypto.timingSafeEqual은 Buffer 길이가 같아야 해서 패딩 처리 포함
 */
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  // 길이가 다르면 false이지만, 비교는 끝까지 실행해 타이밍 노출 차단
  const aLen = Buffer.byteLength(a)
  const bLen = Buffer.byteLength(b)
  const maxLen = Math.max(aLen, bLen)
  const aBuf = Buffer.alloc(maxLen)
  const bBuf = Buffer.alloc(maxLen)
  aBuf.write(a)
  bBuf.write(b)
  const equal = require('crypto').timingSafeEqual(aBuf, bBuf)
  return equal && aLen === bLen
}
