/**
 * [설명] 미션 보상 청구 API
 * [목적] 완료된 미션의 보상 지급
 */

import { getSession } from 'next-auth/react'
import { sanityClient } from '../../../lib/sanityClient'
import { getSiteSettings } from '../../../lib/settings'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // 게이미피케이션 활성화 여부 확인
    const settings = await getSiteSettings()
    if (!settings?.gamification?.enabled || !settings?.gamification?.dailyMissionsEnabled) {
      return res.status(403).json({ 
        message: '미션 기능이 현재 비활성화되었습니다'
      })
    }

    const session = await getSession({ req })
    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { missionId } = req.body

    if (!missionId) {
      return res.status(400).json({ message: 'Mission ID is required' })
    }

    // Get user
    const user = await sanityClient.fetch(
      `*[_type == "user" && email == $email][0] {_id, points, level}`,
      { email: session.user.email }
    )

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Get mission details
    const mission = await sanityClient.fetch(
      `*[_type == "dailyMission" && _id == $missionId][0] {_id, reward, target}`,
      { missionId }
    )

    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' })
    }

    // Check existing progress
    const existingProgress = await sanityClient.fetch(
      `*[_type == "userMission" && user._ref == $userId && mission._ref == $missionId][0]{_id, claimed}`,
      { userId: user._id, missionId }
    )

    if (existingProgress?.claimed) {
      return res.status(400).json({ message: 'Reward already claimed' })
    }

    if (existingProgress?._id) {
      await sanityClient
        .patch(existingProgress._id)
        .set({
          claimed: true,
          claimedAt: new Date().toISOString()
        })
        .commit()
    } else {
      await sanityClient.create({
        _type: 'userMission',
        user: { _type: 'reference', _ref: user._id },
        mission: { _type: 'reference', _ref: missionId },
        claimed: true,
        claimedAt: new Date().toISOString(),
        progress: mission.target || 0,
      })
    }

    // Award points to user
    const reward = mission.reward || 0
    const newPoints = (user.points || 0) + reward
    const newLevel = Math.floor(newPoints / 100) + 1

    await sanityClient
      .patch(user._id)
      .set({
        points: newPoints,
        level: newLevel
      })
      .commit()

    return res.status(200).json({
      success: true,
      message: 'Reward claimed successfully',
      reward,
      newPoints,
      newLevel
    })
  } catch (error) {
    console.error('Error claiming reward:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to claim reward',
      error: error.message
    })
  }
}
