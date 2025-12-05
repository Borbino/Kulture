import { sanityClient } from '../../../lib/sanityClient';
import { getSession } from 'next-auth/react';
import { getSiteSettings } from '../../../lib/settings';

/**
 * Daily Missions API
 * - GET: Get today's missions and user progress
 * - POST: Update mission progress
 */

export default async function handler(req, res) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 미션 기능 활성화 여부 확인
  const settings = await getSiteSettings();
  if (!settings?.gamification?.enabled || !settings?.gamification?.dailyMissionsEnabled) {
    return res.status(403).json({ 
      error: '미션 기능이 현재 비활성화되었습니다',
      missions: []
    });
  }

  const today = new Date().toISOString().split('T')[0];

  if (req.method === 'GET') {
    try {
      // Get current user ID
      const userId = await sanityClient.fetch(
        `*[_type == "user" && email == $email][0]._id`,
        { email: session.user.email }
      );

      if (!userId) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get today's active missions
      const missions = await sanityClient.fetch(
        `*[_type == "dailyMission" && isActive == true && (
          !defined(startDate) || startDate <= $today
        ) && (
          !defined(endDate) || endDate >= $today
        )] {
          _id,
          title,
          description,
          missionType,
          targetCount,
          rewardPoints,
          rewardBadge->{_id, name, icon},
          icon,
          difficulty
        }`,
        { today }
      );

      // Get user's progress for today
      const progress = await sanityClient.fetch(
        `*[_type == "userMission" && user._ref == $userId && date == $today] {
          _id,
          mission->{_id},
          progress,
          isCompleted,
          completedAt
        }`,
        { userId, today }
      );

      // Merge missions with progress
      const missionsWithProgress = missions.map(mission => {
        const userProgress = progress.find(p => p.mission._id === mission._id);
        return {
          ...mission,
          userProgress: userProgress?.progress || 0,
          isCompleted: userProgress?.isCompleted || false,
          completedAt: userProgress?.completedAt || null,
        };
      });

      // Calculate streak (consecutive days completed)
      const streak = await calculateStreak(userId);

      return res.status(200).json({
        missions: missionsWithProgress,
        streak,
        date: today,
      });
    } catch (error) {
      console.error('Error getting missions:', error);
      return res.status(500).json({ error: 'Failed to get missions' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { missionId, increment = 1 } = req.body;

      if (!missionId) {
        return res.status(400).json({ error: 'Mission ID is required' });
      }

      // Get current user ID
      const userId = await sanityClient.fetch(
        `*[_type == "user" && email == $email][0]._id`,
        { email: session.user.email }
      );

      if (!userId) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get mission details
      const mission = await sanityClient.fetch(
        `*[_type == "dailyMission" && _id == $missionId][0]`,
        { missionId }
      );

      if (!mission) {
        return res.status(404).json({ error: 'Mission not found' });
      }

      // Get or create user mission progress
      let userMission = await sanityClient.fetch(
        `*[_type == "userMission" && user._ref == $userId && mission._ref == $missionId && date == $today][0]`,
        { userId, missionId, today }
      );

      if (!userMission) {
        // Create new progress record
        userMission = await sanityClient.create({
          _type: 'userMission',
          user: { _type: 'reference', _ref: userId },
          mission: { _type: 'reference', _ref: missionId },
          progress: 0,
          isCompleted: false,
          date: today,
        });
      }

      // Update progress
      const newProgress = Math.min(userMission.progress + increment, mission.targetCount);
      const isCompleted = newProgress >= mission.targetCount;

      await sanityClient
        .patch(userMission._id)
        .set({
          progress: newProgress,
          isCompleted,
          ...(isCompleted && !userMission.isCompleted ? { completedAt: new Date().toISOString() } : {}),
        })
        .commit();

      // If mission just completed, award points
      if (isCompleted && !userMission.isCompleted) {
        await sanityClient
          .patch(userId)
          .setIfMissing({ points: 0 })
          .inc({ points: mission.rewardPoints })
          .commit();

        // Award badge if applicable
        if (mission.rewardBadge) {
          const userBadges = await sanityClient.fetch(
            `*[_type == "user" && _id == $userId][0].badges[]._ref`,
            { userId }
          );

          if (!userBadges?.includes(mission.rewardBadge._ref)) {
            await sanityClient
              .patch(userId)
              .setIfMissing({ badges: [] })
              .append('badges', [{ _type: 'reference', _ref: mission.rewardBadge._ref }])
              .commit();
          }
        }

        // Create notification
        await sanityClient.create({
          _type: 'notification',
          recipient: { _type: 'reference', _ref: userId },
          type: 'system',
          message: `🎉 Mission completed: ${mission.title}! +${mission.rewardPoints} points`,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }

      return res.status(200).json({
        progress: newProgress,
        isCompleted,
        mission,
      });
    } catch (error) {
      console.error('Error updating mission progress:', error);
      return res.status(500).json({ error: 'Failed to update mission progress' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

/**
 * Calculate user's streak (consecutive days with at least one mission completed)
 */
async function calculateStreak(userId) {
  try {
    // Get all dates where user completed at least one mission
    const completedDates = await sanityClient.fetch(
      `*[_type == "userMission" && user._ref == $userId && isCompleted == true] | order(date desc) {
        date
      }`,
      { userId }
    );

    if (completedDates.length === 0) return 0;

    const uniqueDates = [...new Set(completedDates.map(d => d.date))].sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expected = expectedDate.toISOString().split('T')[0];

      if (uniqueDates[i] === expected) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
}
