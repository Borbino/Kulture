/**
 * [설명] 리더보드 API
 * [목적] 사용자 순위 및 통계 제공
 */

import { getSession } from 'next-auth/react'
import { sanityClient } from '../../../lib/sanityClient'
import { DEFAULT_SETTINGS, getSiteSettings } from '../../../lib/settings'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // 게이미피케이션 활성화 여부 확인
    const settings = await getSiteSettings()
    if (!settings?.gamification?.enabled || !settings?.gamification?.leaderboardEnabled) {
      return res.status(403).json({ 
        message: '리더보드 기능이 현재 비활성화되었습니다',
        leaderboard: []
      })
    }

    const session = await getSession({ req })
    const { timeframe = 'all', category = 'points', limit = 50 } = req.query

    // Date filter based on timeframe
    let dateFilter = ''
    const now = new Date()
    
    if (timeframe === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      dateFilter = `&& _updatedAt >= "${weekAgo.toISOString()}"`
    } else if (timeframe === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      dateFilter = `&& _updatedAt >= "${monthAgo.toISOString()}"`
    }

    // Build query based on category
    let orderBy = 'points desc'
    let selectFields = `
      _id,
      name,
      email,
      image,
      level,
      points,
      postCount,
      commentCount,
      likeCount,
      badges[]->{name, icon}
    `

    if (category === 'posts') {
      orderBy = 'postCount desc'
    } else if (category === 'engagement') {
      // Engagement score = posts + comments + likes received
      orderBy = 'engagementScore desc'
      selectFields += `,
        "engagementScore": postCount + commentCount + likeCount
      `
    }

    const query = `*[_type == "user" && isBanned != true ${dateFilter}] | order(${orderBy}) [0...${limit}] {
      ${selectFields}
    }`

    const leaderboard = await sanityClient.fetch(query)

    // Add engagement score for all users if not already calculated
    const processedLeaderboard = leaderboard.map(user => ({
      ...user,
      engagementScore: user.engagementScore || (user.postCount || 0) + (user.commentCount || 0) + (user.likeCount || 0)
    }))

    // Re-sort if necessary (for engagement category)
    if (category === 'engagement') {
      processedLeaderboard.sort((a, b) => b.engagementScore - a.engagementScore)
    }

    return res.status(200).json({
      success: true,
      leaderboard: processedLeaderboard,
      timeframe,
      category,
      totalUsers: processedLeaderboard.length
    })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message
    })
  }
}
