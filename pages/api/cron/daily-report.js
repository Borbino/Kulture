/**
 * [설명] 일일 리포트 생성 Cron Job
 * [실행주기] 매일 22:00 KST
 * [목적] CEO에게 일일 요약 리포트 제공
 */

import sanity from '../../../lib/sanityClient'
import { withCronAuth } from '../../../lib/cronMiddleware'

export default withCronAuth(async function dailyReportHandler(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // 1. VIP 모니터링 요약
    const vipStats = await sanity.fetch(
      `
      *[_type == "vipMonitoring" && timestamp > $yesterday] {
        vipName,
        mentions
      }
    `,
      { yesterday }
    )

    const vipSummary = vipStats.reduce((acc, cur) => {
      if (!acc[cur.vipName]) {
        acc[cur.vipName] = 0
      }
      acc[cur.vipName] += cur.mentions
      return acc
    }, {})

    // 2. 핫 이슈 요약
    const hotIssues = await sanity.fetch(
      `
      *[_type == "hotIssue" && timestamp > $yesterday]
      | order(mentions desc)[0...10]
    `,
      { yesterday }
    )

    // 3. 생성된 콘텐츠 요약
    const pendingPosts = await sanity.fetch(
      `
      *[_type == "post" && status == "pending" && createdAt > $yesterday]
      | order(_createdAt desc)
    `,
      { yesterday }
    )

    // 4. 승인된 콘텐츠 요약
    const approvedPosts = await sanity.fetch(
      `
      *[_type == "post" && status == "approved" && _updatedAt > $yesterday]
      | order(_updatedAt desc)
    `,
      { yesterday }
    )

    // 리포트 생성
    const report = {
      date: today,
      vip: {
        monitored: Object.keys(vipSummary).length,
        topMentions: Object.entries(vipSummary)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, mentions: count })),
      },
      trends: {
        detected: hotIssues.length,
        top5: hotIssues.slice(0, 5).map(i => ({
          keyword: i.keyword,
          mentions: i.mentions,
        })),
      },
      content: {
        generated: pendingPosts.length,
        approved: approvedPosts.length,
        pendingReview: pendingPosts.length,
      },
    }

    // Sanity에 리포트 저장
    await sanity.create({
      _type: 'dailyReport',
      date: today,
      report,
      timestamp: new Date().toISOString(),
    })

    console.log(`[Daily Report] ${today} - Generated`)

    res.status(200).json({
      success: true,
      report,
    })
  } catch (error) {
    console.error('[Daily Report Error]', error)
    res.status(500).json({ error: error.message })
  }
})
