/**
 * [설명] 트렌드/핫이슈 통합 조회 API
 * [목적] 프론트엔드에서 최신 트렌드 스냅샷과 급상승 이슈를 조회
 */

import sanity from '../../lib/sanityClient.js'
import { getSiteSettings } from '../../lib/settings.js'
import { withErrorHandler } from '../../lib/apiErrorHandler.js'
import { getAffiliateLinksForContent } from '../../lib/revenueEngine.js'
import { logger } from '../../lib/logger.js';

async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' })

  try {
    // 트렌드 기능 활성화 여부 확인
    const settings = await getSiteSettings()
    if (!settings?.trends?.enabled) {
      return res.status(403).json({ 
        message: '트렌드 기능이 현재 비활성화되었습니다',
        success: false,
        snapshot: null,
        hotIssues: []
      })
    }

    const snapshotQuery = `*[_type == "trendSnapshot"] | order(timestamp desc)[0]{
      trends[0...20],
      timestamp
    }`

    const hotIssuesQuery = `*[_type == "hotIssue"] | order(mentions desc)[0...10]{
      keyword,
      description,
      mentions,
      priority,
      sentiment,
      timestamp
    }`

    const [snapshot, hotIssues] = await Promise.all([
      sanity.fetch(snapshotQuery),
      sanity.fetch(hotIssuesQuery),
    ])

    // [V15.1 정책 2] 2-Step 수익화: 제휴 링크 메타데이터만 생성하고 pending 상태로 반환.
    // 최종 삽입은 CEO가 /admin 대시보드에서 승인해야 한다. (자동 삽입 금지)
    const topTopic = hotIssues?.[0]?.keyword || snapshot?.trends?.[0]?.keyword || 'K-Pop'
    const affiliateSuggestions = {
      status: 'pending_approval', // CEO 승인 전까지 프론트엔드에서 렌더링하지 않음
      metadata: getAffiliateLinksForContent(topTopic),
      generatedAt: new Date().toISOString(),
    }

    return res.status(200).json({
      success: true,
      data: {
        snapshot: snapshot || { trends: [], timestamp: null },
        hotIssues: hotIssues || [],
        affiliateSuggestions, // 변경: affiliateLinks → affiliateSuggestions (pending_approval)
        topTopic,
      },
    })
  } catch (error) {
    logger.error('[API /trends] error:', error)
    return res.status(500).json({ success: false, message: 'Failed to fetch trends', error: error.message })
  }
}

export default withErrorHandler(handler);
