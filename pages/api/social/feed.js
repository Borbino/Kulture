import { sanityClient } from '../../../lib/sanityClient';
import { getSession } from 'next-auth/react';

/**
 * Activity Feed API
 * - GET: Get activity feed (user's + following users' activities)
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { type = 'feed', page = 1, limit = 20 } = req.query;

    // Get current user ID
    const userId = await sanityClient.fetch(
      `*[_type == "user" && email == $email][0]._id`,
      { email: session.user.email }
    );

    if (!userId) {
      return res.status(404).json({ error: 'User not found' });
    }

    let query;
    const params = { userId };

    if (type === 'feed') {
      // Get activities from user and following users
      const following = await sanityClient.fetch(
        `*[_type == "follow" && follower._ref == $userId].following._ref`,
        { userId }
      );

      const userIds = [userId, ...following];

      query = `*[_type == "activity" && user._ref in $userIds && isPublic == true] | order(createdAt desc) [${(parseInt(page) - 1) * parseInt(limit)}...${parseInt(page) * parseInt(limit)}] {
        _id,
        activityType,
        user->{_id, name, image, level},
        post->{_id, title, slug, mainImage},
        comment->{_id, content},
        targetUser->{_id, name, image},
        badge->{_id, name, icon},
        metadata,
        createdAt
      }`;

      params.userIds = userIds;
    } else if (type === 'user') {
      // Get only current user's activities
      query = `*[_type == "activity" && user._ref == $userId] | order(createdAt desc) [${(parseInt(page) - 1) * parseInt(limit)}...${parseInt(page) * parseInt(limit)}] {
        _id,
        activityType,
        user->{_id, name, image, level},
        post->{_id, title, slug, mainImage},
        comment->{_id, content},
        targetUser->{_id, name, image},
        badge->{_id, name, icon},
        metadata,
        createdAt
      }`;
    } else {
      return res.status(400).json({ error: 'Invalid feed type' });
    }

    const activities = await sanityClient.fetch(query, params);

    return res.status(200).json({
      activities,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error getting activity feed:', error);
    return res.status(500).json({ error: 'Failed to get activity feed' });
  }
}
