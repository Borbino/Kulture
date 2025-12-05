/**
 * [설명] VIP 모니터링 상위 결과 조회 API
 * [목적] 최신 멘션 수 기준 상위 VIP 및 알림 레벨 제공
 */

import sanity from '../../../lib/sanityClient'
import { getSiteSettings } from '../../../lib/settings'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' })

  try {
    // VIP 모니터링 기능 활성화 여부 확인
    const settings = await getSiteSettings()
    if (!settings?.trends?.enabled || !settings?.trends?.vipMonitoringEnabled) {
      return res.status(403).json({ 
        message: 'VIP 모니터링 기능이 현재 비활성화되었습니다',
        success: false,
        vip: []
      })
    }

    const docs = await sanity.fetch(`*[_type == "vipMonitoring"] | order(timestamp desc)[0...120]{
      vipId,
      vipName,
      mentions,
      alertLevel,
      trend,
      content,
      timestamp
    }`)

    const latestByVip = {}
    for (const doc of docs) {
      if (!latestByVip[doc.vipId]) {
        latestByVip[doc.vipId] = doc
      }
    }

    const vipList = Object.values(latestByVip).sort((a, b) => (b.mentions || 0) - (a.mentions || 0))

    return res.status(200).json({
      success: true,
      vip: vipList,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[API /vip/top] error:', error)
    return res.status(500).json({ success: false, message: 'Failed to fetch vip monitoring', error: error.message })
  }
}
