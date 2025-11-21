import { sanityClient } from '../../../lib/sanityClient';
import { getSession } from 'next-auth/react';

/**
 * User Activity API
 * Update user points, level, and badges based on activity
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { action, targetUserId } = req.body;

    // Get user reference
    const userId = targetUserId || await sanityClient.fetch(
      `*[_type == "user" && email == $email][0]._id`,
      { email: session.user.email }
    );

    if (!userId) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get current user data
    const user = await sanityClient.fetch(
      `*[_type == "user" && _id == $userId][0]{points, level, postCount, commentCount, likeCount}`,
      { userId }
    );

    // Point system
    const pointsMap = {
      'post_created': 10,
      'comment_created': 5,
      'received_like': 2,
      'daily_login': 1,
      'profile_completed': 20,
    };

    const points = pointsMap[action] || 0;
    const newPoints = (user.points || 0) + points;

    // Level calculation (every 100 points = 1 level)
    const newLevel = Math.floor(newPoints / 100) + 1;

    // Update user
    await sanityClient
      .patch(userId)
      .set({ points: newPoints, level: newLevel })
      .commit();

    // Check for badge achievements
    await checkBadgeAchievements(userId, user, action);

    return res.status(200).json({
      points: newPoints,
      level: newLevel,
      earnedPoints: points,
    });
  } catch (error) {
    console.error('Error updating user activity:', error);
    return res.status(500).json({ error: 'Failed to update user activity' });
  }
}

async function checkBadgeAchievements(userId, user, action) {
  try {
    // Get all badges
    const badges = await sanityClient.fetch(
      `*[_type == "badge" && isActive == true]`
    );

    // Get user's current badges
    const userBadges = await sanityClient.fetch(
      `*[_type == "user" && _id == $userId][0].badges[]._ref`,
      { userId }
    );

    for (const badge of badges) {
      // Skip if user already has this badge
      if (userBadges?.includes(badge._id)) continue;

      // Check if user meets requirements
      const req = badge.requirement || {};
      let qualified = true;

      if (req.posts && user.postCount < req.posts) qualified = false;
      if (req.comments && user.commentCount < req.comments) qualified = false;
      if (req.likes && user.likeCount < req.likes) qualified = false;
      if (req.points && user.points < req.points) qualified = false;
      if (req.level && user.level < req.level) qualified = false;

      // Award badge if qualified
      if (qualified) {
        await sanityClient
          .patch(userId)
          .setIfMissing({ badges: [] })
          .append('badges', [{ _type: 'reference', _ref: badge._id }])
          .commit();

        // Create notification
        await sanityClient.create({
          _type: 'notification',
          recipient: { _type: 'reference', _ref: userId },
          type: 'system',
          message: `🎉 You earned a new badge: ${badge.name}!`,
          link: `/profile/${userId}`,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error('Error checking badge achievements:', error);
  }
}
