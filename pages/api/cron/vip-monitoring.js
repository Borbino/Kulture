/**
 * [설명] VIP 인물 실시간 모니터링 Cron Job
 * [실행주기] 5분마다 (Tier 1), 1시간마다 (Tier 2)
 * [목적] BTS, aespa, PSY, 손흥민, 이병헌 등 자동 추적
 */

import { VIP_DATABASE, monitorVIP } from '../../../lib/vipMonitoring'
import sanity from '../../../lib/sanityClient'
import { withCronAuth } from '../../../lib/cronMiddleware'
import logger from '../../../lib/logger'

export default withCronAuth(async function vipMonitoringHandler(req, res) {
  try {
    const results = []
    const alerts = [] // 긴급 알림 목록

    // Tier 1: 실시간 모니터링 (항상 실행)
    for (const vip of VIP_DATABASE.tier1) {
      const data = await monitorVIP(vip.id)
      results.push(data)

      // 이전 멘션 수 조회 (트렌드 분석)
      const previousData = await sanity.fetch(
        `*[_type == "vipMonitoring" && vipId == $vipId] | order(timestamp desc)[0]`,
        { vipId: vip.id }
      )

      const previousMentions = previousData?.mentions || 0
      const changePercent =
        previousMentions > 0 ? ((data.mentions - previousMentions) / previousMentions) * 100 : 0

      // 알림 레벨 결정
      let alertLevel = 'normal'
      if (changePercent > 100)
        alertLevel = 'critical' // 100% 이상 급증
      else if (changePercent > 50) alertLevel = 'high' // 50% 이상 증가

      // 긴급 알림 대상
      if (alertLevel !== 'normal') {
        alerts.push({
          vip: vip.name,
          mentions: data.mentions,
          previousMentions,
          changePercent: changePercent.toFixed(1),
          alertLevel,
        })
      }

      // Sanity에 저장
      await sanity.create({
        _type: 'vipMonitoring',
        vipId: vip.id,
        vipName: vip.name,
        mentions: data.mentions,
        alertLevel,
        trend: {
          previousMentions,
          changePercent,
          isRising: changePercent > 0,
        },
        content: data.content.slice(0, 20), // 상위 20개만 저장
        timestamp: new Date().toISOString(),
      })
    }

    // Tier 2: 1시간마다 (매 정시에만 실행)
    const minutes = new Date().getMinutes()
    if (minutes < 5) {
      for (const vip of VIP_DATABASE.tier2) {
        const data = await monitorVIP(vip.id)
        results.push(data)

        await sanity.create({
          _type: 'vipMonitoring',
          vipId: vip.id,
          vipName: vip.name,
          mentions: data.mentions,
          content: data.content.slice(0, 20),
          timestamp: new Date().toISOString(),
        })
      }
    }

    logger.info('[cron]', `[VIP Monitoring] ${results.length} VIPs monitored at ${new Date().toISOString()}`)

    // 긴급 알림 로깅
    if (alerts.length > 0) {
      logger.warn('[cron]', '🚨 [VIP ALERT] Trending VIPs detected:', { alerts })
    }

    res.status(200).json({
      success: true,
      monitored: results.length,
      alerts: alerts.length,
      alertDetails: alerts,
      results: results.map(r => ({
        vip: r.vip,
        mentions: r.mentions,
      })),
    })
  } catch (error) {
    logger.error('[cron]', '[VIP Monitoring Error]', { error: error.message })
    res.status(500).json({ error: error.message })
  }
})
