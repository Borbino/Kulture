/**
 * [아키텍처] Micro-Batching 패턴
 *   - Vercel Hobby 플랜 실행 시간 제한 대응
 *   - 매 실행마다 플랫폼 1곳만 수집, 콘텐츠 1건만 생성 (타임아웃 방지)
 *   - 시간 기반 라운드로빈으로 플랫폼 순환 → 장기적으로 전 소스 커버
 */
import { runAutonomousDiscovery } from '../../../lib/autonomousScraper.js'
import { withCronAuth } from '../../../lib/cronMiddleware.js'
import { logger } from '../../../lib/logger.js'

// Vercel Hobby 플랜이 허용하는 최대 실행 시간(초) 확보
export const maxDuration = 60

// 신뢰도·중요도 순 플랫폼 목록 (라운드로빈 순환)
const PLATFORMS = [
  'reddit',
  'googleTrends',
  'kculture_news',
  'youtube',
  'naver',
  'tumblr',
  'mastodon',
]

export default withCronAuth(async function autonomousDiscoveryHandler(req, res) {
  try {
    // 시간 기반 라운드로빈: 매 크론 실행마다 다른 플랫폼 선택
    // (크론 주기 = 6시간 → 하루에 4개 플랫폼 순환)
    const platformIndex = Math.floor(Date.now() / 1000 / 3600) % PLATFORMS.length
    const platformKey = PLATFORMS[platformIndex]

    logger.info('[cron]', `[Autonomous Discovery] Starting micro-batch — platform: ${platformKey}`)

    // [Micro-Batching] 단일 플랫폼만 수집, AI 생성 1건만 처리
    const result = await runAutonomousDiscovery({ platformKey, microBatch: true })

    logger.info('[cron]', '[Autonomous Discovery] Cycle completed', {
      platform: platformKey,
      rawCount: result.rawCount,
      filteredCount: result.filteredCount,
      generatedCount: result.generatedCount,
    })

    return res.status(200).json({
      success: true,
      message: `Autonomous discovery cycle completed (platform: ${platformKey})`,
      platform: platformKey,
      stats: result,
    })
  } catch (error) {
    logger.error('[cron]', '[Autonomous Discovery] Cron job failed', { error: error.message })
    return res.status(500).json({ success: false, error: error.message })
  }
})
