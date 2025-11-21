import { sanityClient } from '../../lib/sanityClient';
import { getSession } from 'next-auth/react';

/**
 * Posts API
 * - GET: Fetch posts (with filters)
 * - POST: Create new post
 * - PATCH: Update post
 * - DELETE: Delete post
 */

export default async function handler(req, res) {
  const session = await getSession({ req });

  if (req.method === 'GET') {
    try {
      const { board, category, author, tag, search, sort = 'latest', page = 1, limit = 20 } = req.query;

      let query = `*[_type == "post"`;
      const params = {};

      // Filter by board
      if (board) {
        query += ` && board._ref == $boardId`;
        params.boardId = board;
      }

      // Filter by category
      if (category) {
        query += ` && $categoryId in categories[]._ref`;
        params.categoryId = category;
      }

      // Filter by author
      if (author) {
        query += ` && (author._ref == $authorId || user._ref == $authorId)`;
        params.authorId = author;
      }

      // Filter by tag
      if (tag) {
        query += ` && $tag in tags[]`;
        params.tag = tag;
      }

      // Search
      if (search) {
        query += ` && (title match $search || body match $search)`;
        params.search = `*${search}*`;
      }

      // Only show approved and non-hidden posts
      query += ` && status == "approved" && isHidden != true]`;

      // Sorting
      if (sort === 'latest') {
        query += ` | order(publishedAt desc)`;
      } else if (sort === 'popular') {
        query += ` | order(views desc)`;
      } else if (sort === 'likes') {
        query += ` | order(likes desc)`;
      } else if (sort === 'comments') {
        query += ` | order(commentCount desc)`;
      }

      // Pagination
      const start = (parseInt(page) - 1) * parseInt(limit);
      query += ` [${start}...${start + parseInt(limit)}]`;

      // Fields to return
      query += ` {
        _id,
        title,
        slug,
        author->{name, slug, image},
        user->{name, image, level},
        board->{name, slug, type},
        mainImage,
        categories[]->{title, slug},
        tags,
        publishedAt,
        views,
        likes,
        commentCount,
        isPinned,
        isBest,
        isAnonymous,
        "excerpt": body[0...200]
      }`;

      const posts = await sanityClient.fetch(query, params);

      // Get total count for pagination
      let countQuery = `count(*[_type == "post"`;
      if (board) countQuery += ` && board._ref == $boardId`;
      if (category) countQuery += ` && $categoryId in categories[]._ref`;
      if (author) countQuery += ` && (author._ref == $authorId || user._ref == $authorId)`;
      if (tag) countQuery += ` && $tag in tags[]`;
      if (search) countQuery += ` && (title match $search || body match $search)`;
      countQuery += ` && status == "approved" && isHidden != true])`;

      const total = await sanityClient.fetch(countQuery, params);

      return res.status(200).json({
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
      return res.status(500).json({ error: 'Failed to fetch posts' });
    }
  }

  if (req.method === 'POST') {
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { title, body, boardId, categoryIds, tags, images, isAnonymous } = req.body;

      // Validation
      if (!title || !body || !boardId) {
        return res.status(400).json({ error: 'Title, body, and board are required' });
      }

      // Check board exists and get its settings
      const board = await sanityClient.fetch(
        `*[_type == "board" && _id == $boardId][0]`,
        { boardId }
      );

      if (!board) {
        return res.status(404).json({ error: 'Board not found' });
      }

      // Check if anonymous is allowed
      if (isAnonymous && !board.isAnonymous) {
        return res.status(400).json({ error: 'Anonymous posts not allowed in this board' });
      }

      // Get user reference
      const userRef = await sanityClient.fetch(
        `*[_type == "user" && email == $email][0]._id`,
        { email: session.user.email }
      );

      if (!userRef) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Create post
      const post = await sanityClient.create({
        _type: 'post',
        title,
        slug: {
          _type: 'slug',
          current: title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
        },
        body,
        user: { _type: 'reference', _ref: userRef },
        board: { _type: 'reference', _ref: boardId },
        categories: categoryIds?.map(id => ({ _type: 'reference', _ref: id })) || [],
        tags: tags || [],
        isAnonymous: isAnonymous || false,
        status: board.requireApproval ? 'pending' : 'approved',
        publishedAt: new Date().toISOString(),
        views: 0,
        likes: 0,
        commentCount: 0,
        isPinned: false,
        isBest: false,
        isHidden: false,
      });

      // Update user post count
      await sanityClient
        .patch(userRef)
        .setIfMissing({ postCount: 0 })
        .inc({ postCount: 1 })
        .commit();

      // Update board post count
      await sanityClient
        .patch(boardId)
        .setIfMissing({ postCount: 0 })
        .inc({ postCount: 1 })
        .commit();

      return res.status(201).json({ post });
    } catch (error) {
      console.error('Error creating post:', error);
      return res.status(500).json({ error: 'Failed to create post' });
    }
  }

  if (req.method === 'PATCH') {
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { postId, title, body, categoryIds, tags } = req.body;

      if (!postId) {
        return res.status(400).json({ error: 'Post ID is required' });
      }

      // Check if user owns the post
      const post = await sanityClient.fetch(
        `*[_type == "post" && _id == $postId][0]{_id, user->{email}}`,
        { postId }
      );

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      if (post.user?.email !== session.user.email && session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Update post
      const updates = {};
      if (title) updates.title = title;
      if (body) updates.body = body;
      if (categoryIds) updates.categories = categoryIds.map(id => ({ _type: 'reference', _ref: id }));
      if (tags) updates.tags = tags;

      const updatedPost = await sanityClient
        .patch(postId)
        .set(updates)
        .commit();

      return res.status(200).json({ post: updatedPost });
    } catch (error) {
      console.error('Error updating post:', error);
      return res.status(500).json({ error: 'Failed to update post' });
    }
  }

  if (req.method === 'DELETE') {
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { postId } = req.body;

      if (!postId) {
        return res.status(400).json({ error: 'Post ID is required' });
      }

      // Check if user owns the post
      const post = await sanityClient.fetch(
        `*[_type == "post" && _id == $postId][0]{_id, user->{email, _id}, board->{_id}}`,
        { postId }
      );

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      if (post.user?.email !== session.user.email && session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Delete post
      await sanityClient.delete(postId);

      // Update user post count
      if (post.user?._id) {
        await sanityClient
          .patch(post.user._id)
          .dec({ postCount: 1 })
          .commit();
      }

      // Update board post count
      if (post.board?._id) {
        await sanityClient
          .patch(post.board._id)
          .dec({ postCount: 1 })
          .commit();
      }

      return res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error('Error deleting post:', error);
      return res.status(500).json({ error: 'Failed to delete post' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
