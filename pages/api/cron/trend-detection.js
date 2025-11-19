/**
 * [설명] 동적 트렌드 자동 감지 및 생명주기 관리 Cron Job
 * [실행주기] 2시간마다
 * [목적] 다중 검색 엔진 기반 트렌드 자동 추가/삭제
 */

import {
  collectAllTrends,
  checkTrendLifecycle,
  updateTrendDatabase,
} from '../../../lib/trendManagement'
import { trackIssue, TRACKING_ISSUES } from '../../../lib/vipMonitoring'
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
    const startTime = Date.now()

    console.log('[Trend Detection] Starting dynamic trend detection...')

    // 1. 기존 트렌드 생명주기 체크 (오래된 트렌드 제거)
    const lifecycleResult = await checkTrendLifecycle()
    console.log(`[Trend Detection] Lifecycle check: ${lifecycleResult.removed} trends removed`)

    // 2. 다중 소스에서 새 트렌드 수집
    const newTrends = await collectAllTrends()
    console.log(`[Trend Detection] Collected ${newTrends.length} new trends`)

    // 3. 트렌드 데이터베이스 업데이트
    const updateResult = await updateTrendDatabase(newTrends)
    console.log(
      `[Trend Detection] Database updated: ${updateResult.added} added, ${updateResult.updated} updated`
    )

    // 4. 특정 이슈 추적 (기존 시스템 유지)
    const issueResults = []

    for (const issue of TRACKING_ISSUES) {
      try {
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
      } catch (error) {
        console.error(`[Trend Detection] Failed to track issue "${issue.keyword}":`, error.message)
      }
    }

    // 5. Sanity 설정에서 커스텀 키워드도 추적
    const settings = await sanity.fetch(`*[_type == "siteSettings"][0]`)
    const customKeywords = settings?.crawler?.trendDetection?.trackingKeywords || []

    for (const keyword of customKeywords) {
      if (!TRACKING_ISSUES.some(i => i.keyword === keyword)) {
        try {
          const customData = await trackIssue(keyword)
          issueResults.push(customData)
        } catch (error) {
          console.error(
            `[Trend Detection] Failed to track custom keyword "${keyword}":`,
            error.message
          )
        }
      }
    }

    const elapsed = Date.now() - startTime

    console.log(`[Trend Detection] Completed in ${elapsed}ms`)

    res.status(200).json({
      success: true,
      lifecycle: lifecycleResult,
      newTrends: {
        collected: newTrends.length,
        added: updateResult.added,
        updated: updateResult.updated,
        top10: newTrends.slice(0, 10).map(t => ({
          keyword: t.keyword,
          mentions: t.totalMentions,
          sources: t.uniqueSources,
        })),
      },
      issues: issueResults.map(i => ({
        keyword: i.issue,
        mentions: i.mentions,
      })),
      executionTime: elapsed,
    })
  } catch (error) {
    console.error('[Trend Detection Error]', error)
    res.status(500).json({ error: error.message, stack: error.stack })
  }
}
