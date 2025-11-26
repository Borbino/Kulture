/**
 * Real-time Chat Component with Auto-translation
 */

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { io } from 'socket.io-client';
import styles from './RealtimeChat.module.css';

export default function RealtimeChat({ roomId, userLanguage = 'en', userName = 'Anonymous' }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initialize Socket.IO
    const socketInstance = io({
      path: '/api/chat/socket',
    });

    socketInstance.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
      
      // Set user language
      socketInstance.emit('set-language', userLanguage);
      
      // Join room
      socketInstance.emit('join-room', roomId);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
    });

    socketInstance.on('message-history', (history) => {
      setMessages(history.map(msg => ({
        ...msg,
        text: msg.translations[userLanguage] || msg.originalText,
        isTranslated: msg.originalLang !== userLanguage,
      })));
    });

    socketInstance.on('new-message', (message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    socketInstance.on('user-typing', ({ userId, isTyping }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    });

    socketInstance.on('error', ({ message }) => {
      console.error('Chat error:', message);
      alert(message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.emit('leave-room', roomId);
      socketInstance.disconnect();
    };
  }, [roomId, userLanguage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !socket || !isConnected) return;

    socket.emit('send-message', {
      roomId,
      message: inputMessage.trim(),
      originalLang: userLanguage,
    });

    setInputMessage('');
    setIsTyping(false);
    socket.emit('typing', { roomId, isTyping: false });
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    
    if (socket && isConnected) {
      if (!isTyping && e.target.value.length > 0) {
        setIsTyping(true);
        socket.emit('typing', { roomId, isTyping: true });
      } else if (isTyping && e.target.value.length === 0) {
        setIsTyping(false);
        socket.emit('typing', { roomId, isTyping: false });
      }
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <h3>Chat Room: {roomId}</h3>
        <div className={styles.status}>
          <span className={isConnected ? styles.connected : styles.disconnected}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          <span className={styles.language}>🌐 {userLanguage.toUpperCase()}</span>
        </div>
      </div>

      <div className={styles.messagesContainer}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.message} ${msg.userId === socket?.id ? styles.own : styles.other}`}
          >
            <div className={styles.messageContent}>
              <div className={styles.messageText}>{msg.text}</div>
              {msg.isTranslated && (
                <div className={styles.originalText} title={`Original (${msg.originalLang})`}>
                  💬 {msg.originalText}
                </div>
              )}
            </div>
            <div className={styles.messageTime}>
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        
        {typingUsers.size > 0 && (
          <div className={styles.typingIndicator}>
            <span className={styles.typingDots}>•••</span>
            <span>{typingUsers.size} user{typingUsers.size > 1 ? 's' : ''} typing...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form className={styles.inputForm} onSubmit={handleSendMessage}>
        <input
          type="text"
          value={inputMessage}
          onChange={handleInputChange}
          placeholder={`Type in ${userLanguage.toUpperCase()}... (auto-translates)`}
          className={styles.messageInput}
          disabled={!isConnected}
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={!isConnected || !inputMessage.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}

RealtimeChat.propTypes = {
  roomId: PropTypes.string.isRequired,
  userLanguage: PropTypes.string,
  userName: PropTypes.string,
};
