/**
 * [설명] 트렌드/핫이슈 통합 조회 API
 * [목적] 프론트엔드에서 최신 트렌드 스냅샷과 급상승 이슈를 조회
 */

import sanity from '../../lib/sanityClient'
import { getSiteSettings } from '../../lib/settings'

export default async function handler(req, res) {
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

    return res.status(200).json({
      success: true,
      snapshot: snapshot || { trends: [], timestamp: null },
      hotIssues: hotIssues || [],
    })
  } catch (error) {
    console.error('[API /trends] error:', error)
    return res.status(500).json({ success: false, message: 'Failed to fetch trends', error: error.message })
  }
}
