/**
 * [설명] 성능 모니터링 리포트 Cron Job
 * [실행주기] 1시간마다
 * [목적] API 성능 지표 수집 및 분석
 */

import performanceMonitor from '../../../lib/performanceMonitor'
import sanity from '../../../lib/sanityClient.js'
import { withCronAuth } from '../../../lib/cronMiddleware'

export default withCronAuth(async function performanceReportHandler(req, res) {
  try {
    // 성능 리포트 생성
    const report = performanceMonitor.generateReport()

    // 콘솔 출력
    performanceMonitor.printReport()

    // Sanity에 저장
    await sanity.create({
      _type: 'performanceReport',
      period: report.period,
      summary: report.summary,
      apis: report.apis,
      caches: report.caches,
      errors: report.errors,
      timestamp: new Date().toISOString(),
    })

    console.log(`[Performance Report] Saved to Sanity at ${new Date().toISOString()}`)

    // 메트릭 초기화 (다음 시간 집계 준비)
    performanceMonitor.reset()

    res.status(200).json({
      success: true,
      report,
    })
  } catch (error) {
    console.error('[Performance Report Error]', error)
    res.status(500).json({ error: error.message })
  }
})
