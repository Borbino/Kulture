import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import styles from './NotificationBell.module.css';

export default function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchNotifications = async () => {
    if (!session) return;
    
    try {
      const res = await fetch('/api/notifications?limit=10');
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  return (
    <div className={styles.container}>
      <button
        className={styles.bell}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        🔔
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h3>알림</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} disabled={loading}>
                모두 읽음
              </button>
            )}
          </div>

          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.empty}>새 알림이 없습니다</div>
            ) : (
              notifications.map((notif) => (
                <Link
                  key={notif._id}
                  href={notif.link || '#'}
                  onClick={() => !notif.isRead && markAsRead(notif._id)}
                >
                  <div className={`${styles.item} ${!notif.isRead ? styles.unread : ''}`}>
                    <div className={styles.message}>{notif.message}</div>
                    <div className={styles.time}>
                      {new Date(notif.createdAt).toLocaleString('ko-KR')}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          <Link href="/notifications" className={styles.viewAll}>
            모든 알림 보기
          </Link>
        </div>
      )}
    </div>
  );
}
