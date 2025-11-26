/**
 * Real-time Chat Translation Server
 * WebSocket-based instant message translation
 */

import { Server } from 'socket.io';
import { translate } from '../../../lib/aiTranslation';
import { getCostMonitor } from '../../../lib/costMonitor';
import logger from '../../../lib/logger';

const rooms = new Map(); // roomId -> { users: Set, messages: [] }
const userLanguages = new Map(); // socketId -> language

export default function handler(req, res) {
  if (res.socket.server.io) {
    console.log('Socket.IO already initialized');
    res.end();
    return;
  }

  const io = new Server(res.socket.server, {
    path: '/api/chat/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_SITE_URL || '*',
      methods: ['GET', 'POST'],
    },
  });

  res.socket.server.io = io;

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Set user language
    socket.on('set-language', (language) => {
      userLanguages.set(socket.id, language);
      console.log(`User ${socket.id} language set to ${language}`);
    });

    // Join chat room
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          users: new Set(),
          messages: [],
        });
      }
      
      const room = rooms.get(roomId);
      room.users.add(socket.id);
      
      // Notify others
      socket.to(roomId).emit('user-joined', {
        userId: socket.id,
        userCount: room.users.size,
      });
      
      // Send recent messages
      socket.emit('message-history', room.messages.slice(-50));
      
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    // Send message with auto-translation
    socket.on('send-message', async (data) => {
      const { roomId, message, originalLang } = data;
      const room = rooms.get(roomId);
      
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      try {
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date().toISOString();
        
        // Store original message
        const messageData = {
          id: messageId,
          userId: socket.id,
          originalText: message,
          originalLang,
          translations: {},
          timestamp,
        };
        
        room.messages.push(messageData);
        
        // Get all unique languages in the room
        const targetLanguages = new Set();
        room.users.forEach((userId) => {
          const lang = userLanguages.get(userId);
          if (lang && lang !== originalLang) {
            targetLanguages.add(lang);
          }
        });

        // Translate to all needed languages
        const translations = {};
        const costMonitor = getCostMonitor();
        
        for (const targetLang of targetLanguages) {
          try {
            const result = await translate(message, targetLang, originalLang);
            translations[targetLang] = result.translatedText;
            
            // Track cost
            costMonitor.trackRequest(result.provider || 'openai', message.length);
          } catch (error) {
            logger.error('Translation error in chat', {
              error: error.message,
              targetLang,
            });
            translations[targetLang] = message; // Fallback to original
          }
        }
        
        messageData.translations = translations;

        // Broadcast message to room with appropriate translation
        room.users.forEach((userId) => {
          const userLang = userLanguages.get(userId);
          const translatedText = translations[userLang] || message;
          
          io.to(userId).emit('new-message', {
            id: messageId,
            userId: socket.id,
            text: translatedText,
            originalText: message,
            originalLang,
            translatedLang: userLang,
            isTranslated: userLang !== originalLang,
            timestamp,
          });
        });

        logger.info('Chat message sent', {
          roomId,
          messageId,
          originalLang,
          targetLanguages: Array.from(targetLanguages),
        });
      } catch (error) {
        logger.error('Send message error', { error: error.message });
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { roomId, isTyping } = data;
      socket.to(roomId).emit('user-typing', {
        userId: socket.id,
        isTyping,
      });
    });

    // Leave room
    socket.on('leave-room', (roomId) => {
      const room = rooms.get(roomId);
      if (room) {
        room.users.delete(socket.id);
        socket.leave(roomId);
        
        socket.to(roomId).emit('user-left', {
          userId: socket.id,
          userCount: room.users.size,
        });
        
        // Clean up empty rooms
        if (room.users.size === 0) {
          rooms.delete(roomId);
        }
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      userLanguages.delete(socket.id);
      
      // Remove from all rooms
      rooms.forEach((room, roomId) => {
        if (room.users.has(socket.id)) {
          room.users.delete(socket.id);
          io.to(roomId).emit('user-left', {
            userId: socket.id,
            userCount: room.users.size,
          });
          
          if (room.users.size === 0) {
            rooms.delete(roomId);
          }
        }
      });
    });
  });

  console.log('Socket.IO initialized');
  res.end();
}
