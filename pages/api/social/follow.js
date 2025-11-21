import { sanityClient } from '../../../lib/sanityClient';
import { getSession } from 'next-auth/react';

/**
 * Follow API
 * - GET: Get followers/following list
 * - POST: Follow user
 * - DELETE: Unfollow user
 */

export default async function handler(req, res) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userEmail = session.user.email;

  if (req.method === 'GET') {
    try {
      const { userId, type = 'followers' } = req.query;

      const targetUserId = userId || await sanityClient.fetch(
        `*[_type == "user" && email == $email][0]._id`,
        { email: userEmail }
      );

      if (!targetUserId) {
        return res.status(404).json({ error: 'User not found' });
      }

      let query;
      if (type === 'followers') {
        // Get followers
        query = `*[_type == "follow" && following._ref == $userId] {
          _id,
          follower->{_id, name, image, level, bio},
          createdAt
        }`;
      } else {
        // Get following
        query = `*[_type == "follow" && follower._ref == $userId] {
          _id,
          following->{_id, name, image, level, bio},
          createdAt
        }`;
      }

      const results = await sanityClient.fetch(query, { userId: targetUserId });

      return res.status(200).json({
        type,
        users: results.map(r => type === 'followers' ? r.follower : r.following),
        count: results.length,
      });
    } catch (error) {
      console.error('Error getting follow list:', error);
      return res.status(500).json({ error: 'Failed to get follow list' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { targetUserId } = req.body;

      if (!targetUserId) {
        return res.status(400).json({ error: 'Target user ID is required' });
      }

      // Get current user ID
      const userId = await sanityClient.fetch(
        `*[_type == "user" && email == $email][0]._id`,
        { email: userEmail }
      );

      if (!userId) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Can't follow yourself
      if (userId === targetUserId) {
        return res.status(400).json({ error: 'Cannot follow yourself' });
      }

      // Check if already following
      const existing = await sanityClient.fetch(
        `*[_type == "follow" && follower._ref == $userId && following._ref == $targetUserId][0]`,
        { userId, targetUserId }
      );

      if (existing) {
        return res.status(400).json({ error: 'Already following this user' });
      }

      // Create follow relationship
      const follow = await sanityClient.create({
        _type: 'follow',
        follower: { _type: 'reference', _ref: userId },
        following: { _type: 'reference', _ref: targetUserId },
        createdAt: new Date().toISOString(),
      });

      // Create notification
      await sanityClient.create({
        _type: 'notification',
        recipient: { _type: 'reference', _ref: targetUserId },
        sender: { _type: 'reference', _ref: userId },
        type: 'follow',
        message: 'started following you',
        link: `/profile/${userId}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      // Create activity
      await sanityClient.create({
        _type: 'activity',
        user: { _type: 'reference', _ref: userId },
        activityType: 'user_followed',
        targetUser: { _type: 'reference', _ref: targetUserId },
        isPublic: true,
        createdAt: new Date().toISOString(),
      });

      return res.status(201).json({ follow });
    } catch (error) {
      console.error('Error following user:', error);
      return res.status(500).json({ error: 'Failed to follow user' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { targetUserId } = req.body;

      if (!targetUserId) {
        return res.status(400).json({ error: 'Target user ID is required' });
      }

      // Get current user ID
      const userId = await sanityClient.fetch(
        `*[_type == "user" && email == $email][0]._id`,
        { email: userEmail }
      );

      // Find and delete follow relationship
      const follow = await sanityClient.fetch(
        `*[_type == "follow" && follower._ref == $userId && following._ref == $targetUserId][0]._id`,
        { userId, targetUserId }
      );

      if (!follow) {
        return res.status(404).json({ error: 'Follow relationship not found' });
      }

      await sanityClient.delete(follow);

      return res.status(200).json({ message: 'Unfollowed successfully' });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return res.status(500).json({ error: 'Failed to unfollow user' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
