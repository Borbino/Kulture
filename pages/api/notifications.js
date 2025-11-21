import { sanityClient } from '../../lib/sanityClient';
import { getSession } from 'next-auth/react';

/**
 * Notifications API
 * - GET: Fetch user's notifications
 * - POST: Create notification (internal use)
 * - PATCH: Mark notification as read
 */

export default async function handler(req, res) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const { unreadOnly, page = 1, limit = 20 } = req.query;

      // Get user reference
      const userRef = await sanityClient.fetch(
        `*[_type == "user" && email == $email][0]._id`,
        { email: session.user.email }
      );

      if (!userRef) {
        return res.status(404).json({ error: 'User not found' });
      }

      let query = `*[_type == "notification" && recipient._ref == $userId`;
      const params = { userId: userRef };

      if (unreadOnly === 'true') {
        query += ` && isRead != true`;
      }

      query += `] | order(createdAt desc)`;

      const start = (parseInt(page) - 1) * parseInt(limit);
      query += ` [${start}...${start + parseInt(limit)}]`;

      query += ` {
        _id,
        type,
        sender->{name, image},
        post->{_id, title, slug},
        comment->{_id, content},
        message,
        link,
        isRead,
        createdAt
      }`;

      const notifications = await sanityClient.fetch(query, params);

      // Get unread count
      const unreadCount = await sanityClient.fetch(
        `count(*[_type == "notification" && recipient._ref == $userId && isRead != true])`,
        { userId: userRef }
      );

      return res.status(200).json({
        notifications,
        unreadCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { recipientId, type, senderId, postId, commentId, message, link } = req.body;

      if (!recipientId || !type || !message) {
        return res.status(400).json({ error: 'Recipient ID, type, and message are required' });
      }

      const notificationData = {
        _type: 'notification',
        recipient: { _type: 'reference', _ref: recipientId },
        type,
        message,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      if (senderId) {
        notificationData.sender = { _type: 'reference', _ref: senderId };
      }

      if (postId) {
        notificationData.post = { _type: 'reference', _ref: postId };
      }

      if (commentId) {
        notificationData.comment = { _type: 'reference', _ref: commentId };
      }

      if (link) {
        notificationData.link = link;
      }

      const notification = await sanityClient.create(notificationData);

      return res.status(201).json({ notification });
    } catch (error) {
      console.error('Error creating notification:', error);
      return res.status(500).json({ error: 'Failed to create notification' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { notificationId, markAllRead } = req.body;

      // Get user reference
      const userRef = await sanityClient.fetch(
        `*[_type == "user" && email == $email][0]._id`,
        { email: session.user.email }
      );

      if (markAllRead) {
        // Mark all notifications as read
        const notifications = await sanityClient.fetch(
          `*[_type == "notification" && recipient._ref == $userId && isRead != true]._id`,
          { userId: userRef }
        );

        await Promise.all(
          notifications.map((id) =>
            sanityClient.patch(id).set({ isRead: true }).commit()
          )
        );

        return res.status(200).json({ message: 'All notifications marked as read' });
      }

      if (!notificationId) {
        return res.status(400).json({ error: 'Notification ID is required' });
      }

      // Check if notification belongs to user
      const notification = await sanityClient.fetch(
        `*[_type == "notification" && _id == $notificationId && recipient._ref == $userId][0]`,
        { notificationId, userId: userRef }
      );

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      // Mark as read
      const updatedNotification = await sanityClient
        .patch(notificationId)
        .set({ isRead: true })
        .commit();

      return res.status(200).json({ notification: updatedNotification });
    } catch (error) {
      console.error('Error updating notification:', error);
      return res.status(500).json({ error: 'Failed to update notification' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
