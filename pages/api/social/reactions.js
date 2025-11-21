import { sanityClient } from '../../../lib/sanityClient';
import { getSession } from 'next-auth/react';

/**
 * Reaction API
 * - GET: Get reactions for a post/comment
 * - POST: Add reaction
 * - DELETE: Remove reaction
 */

export default async function handler(req, res) {
  const session = await getSession({ req });

  if (req.method === 'GET') {
    try {
      const { targetType, targetId } = req.query;

      if (!targetType || !targetId) {
        return res.status(400).json({ error: 'Target type and ID are required' });
      }

      let query;
      if (targetType === 'post') {
        query = `*[_type == "reaction" && targetType == "post" && targetPost._ref == $targetId] {
          _id,
          reactionType,
          user->{_id, name, image},
          createdAt
        }`;
      } else {
        query = `*[_type == "reaction" && targetType == "comment" && targetComment._ref == $targetId] {
          _id,
          reactionType,
          user->{_id, name, image},
          createdAt
        }`;
      }

      const reactions = await sanityClient.fetch(query, { targetId });

      // Count by reaction type
      const counts = reactions.reduce((acc, r) => {
        acc[r.reactionType] = (acc[r.reactionType] || 0) + 1;
        return acc;
      }, {});

      return res.status(200).json({
        reactions,
        counts,
        total: reactions.length,
      });
    } catch (error) {
      console.error('Error getting reactions:', error);
      return res.status(500).json({ error: 'Failed to get reactions' });
    }
  }

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const { targetType, targetId, reactionType } = req.body;

      if (!targetType || !targetId || !reactionType) {
        return res.status(400).json({ error: 'Target type, ID, and reaction type are required' });
      }

      // Get current user ID
      const userId = await sanityClient.fetch(
        `*[_type == "user" && email == $email][0]._id`,
        { email: session.user.email }
      );

      if (!userId) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user already reacted
      const existingQuery = targetType === 'post'
        ? `*[_type == "reaction" && user._ref == $userId && targetType == "post" && targetPost._ref == $targetId][0]._id`
        : `*[_type == "reaction" && user._ref == $userId && targetType == "comment" && targetComment._ref == $targetId][0]._id`;

      const existing = await sanityClient.fetch(existingQuery, { userId, targetId });

      if (existing) {
        // Update existing reaction
        await sanityClient
          .patch(existing)
          .set({ reactionType })
          .commit();

        return res.status(200).json({ message: 'Reaction updated' });
      }

      // Create new reaction
      const reactionData = {
        _type: 'reaction',
        user: { _type: 'reference', _ref: userId },
        targetType,
        reactionType,
        createdAt: new Date().toISOString(),
      };

      if (targetType === 'post') {
        reactionData.targetPost = { _type: 'reference', _ref: targetId };
      } else {
        reactionData.targetComment = { _type: 'reference', _ref: targetId };
      }

      const reaction = await sanityClient.create(reactionData);

      return res.status(201).json({ reaction });
    } catch (error) {
      console.error('Error adding reaction:', error);
      return res.status(500).json({ error: 'Failed to add reaction' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { targetType, targetId } = req.body;

      if (!targetType || !targetId) {
        return res.status(400).json({ error: 'Target type and ID are required' });
      }

      // Get current user ID
      const userId = await sanityClient.fetch(
        `*[_type == "user" && email == $email][0]._id`,
        { email: session.user.email }
      );

      // Find and delete reaction
      const query = targetType === 'post'
        ? `*[_type == "reaction" && user._ref == $userId && targetType == "post" && targetPost._ref == $targetId][0]._id`
        : `*[_type == "reaction" && user._ref == $userId && targetType == "comment" && targetComment._ref == $targetId][0]._id`;

      const reactionId = await sanityClient.fetch(query, { userId, targetId });

      if (!reactionId) {
        return res.status(404).json({ error: 'Reaction not found' });
      }

      await sanityClient.delete(reactionId);

      return res.status(200).json({ message: 'Reaction removed' });
    } catch (error) {
      console.error('Error removing reaction:', error);
      return res.status(500).json({ error: 'Failed to remove reaction' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
