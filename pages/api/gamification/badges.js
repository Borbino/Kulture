/**
 * [설명] 배지 API
 * [목적] 배지 목록 및 사용자 배지 진행 상황 제공
 */

import { getSession } from 'next-auth/react'
import { sanityClient } from '../../../lib/sanityClient'
import { getSiteSettings } from '../../../lib/settings'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // 게이미피케이션 활성화 여부 확인
    const settings = await getSiteSettings()
    if (!settings?.gamification?.enabled || !settings?.gamification?.badgesEnabled) {
      return res.status(403).json({ 
        message: '배지 기능이 현재 비활성화되었습니다',
        badges: [],
        userBadges: []
      })
    }

    const session = await getSession({ req })

    // Get all badges
    const badges = await sanityClient.fetch(
      `*[_type == "badge"] | order(requirement.value asc) {
        _id,
        name,
        description,
        icon,
        requirement
      }`
    )

    let userBadges = []
    let userProgress = {}

    // Get user's badges and progress if logged in
    if (session?.user?.email) {
      const user = await sanityClient.fetch(
        `*[_type == "user" && email == $email][0] {
          _id,
          badges[]->{_id, name, icon},
          points,
          level,
          postCount,
          commentCount,
          likeCount
        }`,
        { email: session.user.email }
      )

      if (user) {
        userBadges = user.badges || []

        // Calculate progress for each badge
        badges.forEach(badge => {
          const reqType = badge.requirement?.type
          const reqValue = badge.requirement?.value || 0

          let currentValue = 0
          
          switch (reqType) {
            case 'posts':
              currentValue = user.postCount || 0
              break
            case 'comments':
              currentValue = user.commentCount || 0
              break
            case 'likes':
              currentValue = user.likeCount || 0
              break
            case 'level':
              currentValue = user.level || 1
              break
            case 'points':
              currentValue = user.points || 0
              break
            default:
              currentValue = 0
          }

          const progress = Math.min(Math.round((currentValue / reqValue) * 100), 100)
          userProgress[badge._id] = progress
        })
      }
    }

    // Add progress to badges
    const badgesWithProgress = badges.map(badge => ({
      ...badge,
      progress: userProgress[badge._id] || 0
    }))

    return res.status(200).json({
      success: true,
      data: {
        badges: badgesWithProgress,
        userBadges,
        totalBadges: badges.length,
        earnedBadges: userBadges.length
      }
    })
  } catch (error) {
    console.error('Error fetching badges:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch badges',
      error: error.message
    })
  }
}
