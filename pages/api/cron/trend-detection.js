/**
 * [설명] 트렌드 자동 감지 Cron Job
 * [실행주기] 1시간마다
 * [목적] "K-pop demon hunters", "Huntrix" 등 트렌드 자동 포착
 */

import { detectTrends, trackIssue, TRACKING_ISSUES } from '../../../lib/vipMonitoring'
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
    // 1. 전체 트렌드 감지
    const trends = await detectTrends()
    
    // 상위 50개 Sanity에 저장
    await sanity.create({
      _type: 'trendSnapshot',
      trends: trends.slice(0, 50),
      timestamp: new Date().toISOString(),
    })
    
    // 2. 특정 이슈 추적 (K-pop demon hunters, Huntrix 등)
    const issueResults = []
    
    for (const issue of TRACKING_ISSUES) {
      const data = await trackIssue(issue.keyword)
      issueResults.push(data)
      
      // 멘션 1000개 이상이면 고우선순위로 저장
      if (data.mentions >= 1000) {
        await sanity.create({
          _type: 'hotIssue',
          keyword: data.issue,
          description: data.description,
          mentions: data.mentions,
          sentiment: data.sentiment,
          content: data.content.slice(0, 50),
          priority: 'high',
          shouldAutoGenerate: data.shouldAutoGenerate,
          timestamp: new Date().toISOString(),
        })
        
        console.log(`[Hot Issue] ${data.issue} - ${data.mentions} mentions`)
      }
    }
    
    // 3. Sanity 설정에서 커스텀 키워드도 추적
    const settings = await sanity.fetch(`*[_type == "siteSettings"][0]`)
    const customKeywords = settings?.crawler?.trendDetection?.trackingKeywords || []
    
    for (const keyword of customKeywords) {
      if (!TRACKING_ISSUES.some(i => i.keyword === keyword)) {
        // 커스텀 키워드 추적
        const customData = await trackIssue(keyword)
        issueResults.push(customData)
      }
    }
    
    console.log(`[Trend Detection] ${trends.length} trends, ${issueResults.length} issues tracked`)
    
    res.status(200).json({
      success: true,
      trends: trends.slice(0, 10),
      issues: issueResults.map(i => ({
        keyword: i.issue,
        mentions: i.mentions,
      })),
    })
  } catch (error) {
    console.error('[Trend Detection Error]', error)
    res.status(500).json({ error: error.message })
  }
}
