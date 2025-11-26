/**
 * [설명] 자동 최적화 API
 * [일시] 2025-11-26 (KST)
 * [목적] AI 기반 성능 최적화 제안 및 자동 적용
 */

import autoOptimizer from '../../../lib/autoOptimizer'
import { withErrorHandler } from '../../../lib/apiErrorHandler'

async function handler(req, res) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    case 'POST':
      return handlePost(req, res)
    default:
      return res.status(405).json({ error: 'Method not allowed' })
  }
}

/**
 * GET: 최적화 제안 조회
 */
async function handleGet(req, res) {
  const { action } = req.query

  if (action === 'analyze') {
    // 성능 분석 및 최적화 제안 생성
    const optimizations = await autoOptimizer.analyzeAndOptimize()
    const report = autoOptimizer.generateOptimizationReport()

    return res.status(200).json({
      message: `${optimizations.length}개의 최적화 제안이 생성되었습니다.`,
      ...report,
    })
  }

  // 기존 최적화 리포트 조회
  const report = autoOptimizer.generateOptimizationReport()
  return res.status(200).json(report)
}

/**
 * POST: 자동 최적화 적용
 */
async function handlePost(req, res) {
  const { action, password } = req.body

  // 관리자 권한 체크
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'kulture2025'
  if (password !== adminPassword) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (action === 'apply_auto') {
    // 자동 적용 가능한 최적화만 실행
    const results = await autoOptimizer.applyAutoOptimizations()

    return res.status(200).json({
      message: '자동 최적화가 적용되었습니다.',
      results,
      appliedCount: results.filter(r => r.status === 'applied').length,
      failedCount: results.filter(r => r.status === 'failed').length,
    })
  }

  if (action === 'apply_manual') {
    // 수동 최적화 가이드 제공
    const report = autoOptimizer.generateOptimizationReport()
    const manualOptimizations = report.optimizations.filter(opt => !opt.autoApplicable)

    return res.status(200).json({
      message: '수동 최적화 가이드',
      count: manualOptimizations.length,
      optimizations: manualOptimizations.map(opt => ({
        type: opt.type,
        priority: opt.priority,
        issue: opt.issue,
        suggestions: opt.suggestions,
        estimatedImprovement: opt.estimatedImprovement,
      })),
    })
  }

  return res.status(400).json({ error: 'Invalid action' })
}

export default withErrorHandler(handler)
