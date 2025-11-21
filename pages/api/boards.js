import { sanityClient } from '../../lib/sanityClient';
import { getSession } from 'next-auth/react';

/**
 * Boards API
 * - GET: Fetch boards list
 * - POST: Create new board (admin only)
 * - PATCH: Update board (admin/moderator)
 */

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { type, categoryId, activeOnly = 'true' } = req.query;

      let query = `*[_type == "board"`;
      const params = {};

      if (type) {
        query += ` && type == $type`;
        params.type = type;
      }

      if (categoryId) {
        query += ` && category._ref == $categoryId`;
        params.categoryId = categoryId;
      }

      if (activeOnly === 'true') {
        query += ` && isActive == true`;
      }

      query += `] | order(order asc, _createdAt asc) {
        _id,
        name,
        slug,
        description,
        type,
        category->{title, slug},
        isAnonymous,
        requireApproval,
        moderators[]->{name, image},
        icon,
        color,
        isActive,
        order,
        postCount,
        subscriberCount
      }`;

      const boards = await sanityClient.fetch(query, params);

      return res.status(200).json({ boards });
    } catch (error) {
      console.error('Error fetching boards:', error);
      return res.status(500).json({ error: 'Failed to fetch boards' });
    }
  }

  if (req.method === 'POST') {
    const session = await getSession({ req });

    if (!session || session.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      const {
        name,
        description,
        type,
        categoryId,
        isAnonymous,
        requireApproval,
        icon,
        color,
      } = req.body;

      if (!name || !type) {
        return res.status(400).json({ error: 'Name and type are required' });
      }

      const boardData = {
        _type: 'board',
        name,
        slug: {
          _type: 'slug',
          current: name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
        },
        description: description || '',
        type,
        isAnonymous: isAnonymous || false,
        requireApproval: requireApproval || false,
        icon: icon || '',
        color: color || '#3B82F6',
        isActive: true,
        order: 0,
        postCount: 0,
        subscriberCount: 0,
      };

      if (categoryId) {
        boardData.category = { _type: 'reference', _ref: categoryId };
      }

      const board = await sanityClient.create(boardData);

      return res.status(201).json({ board });
    } catch (error) {
      console.error('Error creating board:', error);
      return res.status(500).json({ error: 'Failed to create board' });
    }
  }

  if (req.method === 'PATCH') {
    const session = await getSession({ req });

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { boardId, ...updates } = req.body;

      if (!boardId) {
        return res.status(400).json({ error: 'Board ID is required' });
      }

      // Check if user is admin or moderator of this board
      const board = await sanityClient.fetch(
        `*[_type == "board" && _id == $boardId][0]{
          _id,
          moderators[]->{email}
        }`,
        { boardId }
      );

      if (!board) {
        return res.status(404).json({ error: 'Board not found' });
      }

      const isAdmin = session.user.role === 'admin';
      const isModerator = board.moderators?.some(mod => mod.email === session.user.email);

      if (!isAdmin && !isModerator) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Update board
      const updatedBoard = await sanityClient
        .patch(boardId)
        .set(updates)
        .commit();

      return res.status(200).json({ board: updatedBoard });
    } catch (error) {
      console.error('Error updating board:', error);
      return res.status(500).json({ error: 'Failed to update board' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
