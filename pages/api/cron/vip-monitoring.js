/**
 * [설명] VIP 인물 실시간 모니터링 Cron Job
 * [실행주기] 5분마다 (Tier 1), 1시간마다 (Tier 2)
 * [목적] BTS, aespa, PSY, 손흥민, 이병헌 등 자동 추적
 */

import { VIP_DATABASE, monitorVIP } from '../../../lib/vipMonitoring'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

export default async function handler(req, res) {
  // Cron Secret 검증
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  try {
    const now = Date.now()
    const results = []
    
    // Tier 1: 실시간 모니터링 (항상 실행)
    for (const vip of VIP_DATABASE.tier1) {
      const data = await monitorVIP(vip.id)
      results.push(data)
      
      // Sanity에 저장
      await sanity.create({
        _type: 'vipMonitoring',
        vipId: vip.id,
        vipName: vip.name,
        mentions: data.mentions,
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
    
    console.log(`[VIP Monitoring] ${results.length} VIPs monitored at ${new Date().toISOString()}`)
    
    res.status(200).json({
      success: true,
      monitored: results.length,
      results: results.map(r => ({
        vip: r.vip,
        mentions: r.mentions,
      })),
    })
  } catch (error) {
    console.error('[VIP Monitoring Error]', error)
    res.status(500).json({ error: error.message })
  }
}
