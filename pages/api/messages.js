import { sanityClient } from '../../lib/sanityClient';
import { getSession } from 'next-auth/react';

/**
 * Messages (DM) API
 * - GET: Fetch user's messages
 * - POST: Send new message
 * - PATCH: Mark message as read
 * - DELETE: Delete message
 */

export default async function handler(req, res) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const { conversationWith, page = 1, limit = 20 } = req.query;

      // Get user reference
      const userRef = await sanityClient.fetch(
        `*[_type == "user" && email == $email][0]._id`,
        { email: session.user.email }
      );

      if (!userRef) {
        return res.status(404).json({ error: 'User not found' });
      }

      let query = `*[_type == "message" && (sender._ref == $userId || recipient._ref == $userId)`;
      const params = { userId: userRef };

      // Filter by conversation partner
      if (conversationWith) {
        query += ` && ((sender._ref == $userId && recipient._ref == $otherId) || (sender._ref == $otherId && recipient._ref == $userId))`;
        params.otherId = conversationWith;
      }

      query += `] | order(createdAt desc)`;

      const start = (parseInt(page) - 1) * parseInt(limit);
      query += ` [${start}...${start + parseInt(limit)}]`;

      query += ` {
        _id,
        sender->{_id, name, image},
        recipient->{_id, name, image},
        subject,
        content,
        isRead,
        parentMessage->{_id, subject},
        createdAt,
        readAt
      }`;

      const messages = await sanityClient.fetch(query, params);

      // Get unread count
      const unreadCount = await sanityClient.fetch(
        `count(*[_type == "message" && recipient._ref == $userId && isRead != true])`,
        { userId: userRef }
      );

      return res.status(200).json({
        messages,
        unreadCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { recipientId, subject, content, parentMessageId } = req.body;

      if (!recipientId || !content) {
        return res.status(400).json({ error: 'Recipient ID and content are required' });
      }

      if (content.length > 5000) {
        return res.status(400).json({ error: 'Content too long (max 5000 characters)' });
      }

      // Get sender reference
      const senderRef = await sanityClient.fetch(
        `*[_type == "user" && email == $email][0]._id`,
        { email: session.user.email }
      );

      if (!senderRef) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if recipient exists
      const recipientExists = await sanityClient.fetch(
        `*[_type == "user" && _id == $recipientId][0]._id`,
        { recipientId }
      );

      if (!recipientExists) {
        return res.status(404).json({ error: 'Recipient not found' });
      }

      // Create message
      const messageData = {
        _type: 'message',
        sender: { _type: 'reference', _ref: senderRef },
        recipient: { _type: 'reference', _ref: recipientId },
        content,
        subject: subject || '',
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      if (parentMessageId) {
        messageData.parentMessage = { _type: 'reference', _ref: parentMessageId };
      }

      const message = await sanityClient.create(messageData);

      // Create notification for recipient
      await sanityClient.create({
        _type: 'notification',
        recipient: { _type: 'reference', _ref: recipientId },
        sender: { _type: 'reference', _ref: senderRef },
        type: 'message',
        message: 'New message received',
        link: `/messages/${message._id}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      return res.status(201).json({ message });
    } catch (error) {
      console.error('Error sending message:', error);
      return res.status(500).json({ error: 'Failed to send message' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { messageId } = req.body;

      if (!messageId) {
        return res.status(400).json({ error: 'Message ID is required' });
      }

      // Get user reference
      const userRef = await sanityClient.fetch(
        `*[_type == "user" && email == $email][0]._id`,
        { email: session.user.email }
      );

      // Check if user is the recipient
      const message = await sanityClient.fetch(
        `*[_type == "message" && _id == $messageId && recipient._ref == $userId][0]`,
        { messageId, userId: userRef }
      );

      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      // Mark as read
      const updatedMessage = await sanityClient
        .patch(messageId)
        .set({ isRead: true, readAt: new Date().toISOString() })
        .commit();

      return res.status(200).json({ message: updatedMessage });
    } catch (error) {
      console.error('Error updating message:', error);
      return res.status(500).json({ error: 'Failed to update message' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { messageId } = req.body;

      if (!messageId) {
        return res.status(400).json({ error: 'Message ID is required' });
      }

      // Get user reference
      const userRef = await sanityClient.fetch(
        `*[_type == "user" && email == $email][0]._id`,
        { email: session.user.email }
      );

      // Check if user is sender or recipient
      const message = await sanityClient.fetch(
        `*[_type == "message" && _id == $messageId && (sender._ref == $userId || recipient._ref == $userId)][0]`,
        { messageId, userId: userRef }
      );

      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      // Delete message
      await sanityClient.delete(messageId);

      return res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error) {
      console.error('Error deleting message:', error);
      return res.status(500).json({ error: 'Failed to delete message' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
