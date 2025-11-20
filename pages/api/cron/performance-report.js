/**
 * [설명] 성능 모니터링 리포트 Cron Job
 * [실행주기] 1시간마다
 * [목적] API 호출 통계, 캐시 히트율, 에러율 집계 및 Sanity 저장
 */

import performanceMonitor from '../../../lib/performanceMonitor.js'
// import sanity from '../../../lib/sanityClient.js' // 추후 performanceReport 스키마 추가 시 사용

export default async function handler(req, res) {
  // Cron Secret 검증
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // 성능 리포트 생성
    const report = performanceMonitor.generateReport()

    // 콘솔 출력
    performanceMonitor.printReport()

    // Sanity에 저장 (선택사항 - 스키마 추가 필요)
    // await sanity.create({
    //   _type: 'performanceReport',
    //   period: report.period,
    //   summary: report.summary,
    //   apis: report.apis,
    //   caches: report.caches,
    //   errors: report.errors,
    //   timestamp: new Date().toISOString(),
    // })

    console.log(`[Performance Report] Generated at ${new Date().toISOString()}`)

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
}
