import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import styles from './ActivityFeed.module.css';

const ACTIVITY_TYPES = {
  post_created: { icon: '📝', color: '#3b82f6', label: 'created a post' },
  comment_added: { icon: '💬', color: '#10b981', label: 'commented on' },
  post_liked: { icon: '❤️', color: '#ef4444', label: 'liked' },
  user_followed: { icon: '👤', color: '#8b5cf6', label: 'started following' },
  badge_earned: { icon: '🏆', color: '#f59e0b', label: 'earned badge' },
  level_up: { icon: '⭐', color: '#ec4899', label: 'leveled up to' },
};

export default function ActivityFeed({ mode = 'feed', userId = null }) {
  const { data: session } = useSession();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchActivities();
    }
  }, [session, mode, userId]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const endpoint = mode === 'user' && userId
        ? `/api/social/feed?mode=user&userId=${userId}`
        : '/api/social/feed?mode=feed';
      
      const res = await fetch(endpoint);
      const data = await res.json();
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderActivity = (activity) => {
    const activityType = ACTIVITY_TYPES[activity.activityType] || {
      icon: '📌',
      color: '#6b7280',
      label: activity.activityType,
    };

    return (
      <div key={activity._id} className={styles.activity}>
        <div
          className={styles.icon}
          style={{ background: activityType.color }}
        >
          {activityType.icon}
        </div>

        <div className={styles.content}>
          <div className={styles.text}>
            <Link href={`/users/${activity.user._id}`}>
              <a className={styles.userName}>{activity.user.name}</a>
            </Link>
            {' '}
            <span className={styles.action}>{activityType.label}</span>
            {' '}
            
            {activity.relatedPost && (
              <Link href={`/posts/${activity.relatedPost._id}`}>
                <a className={styles.postTitle}>"{activity.relatedPost.title}"</a>
              </Link>
            )}
            
            {activity.relatedUser && (
              <>
                {' '}
                <Link href={`/users/${activity.relatedUser._id}`}>
                  <a className={styles.relatedUserName}>{activity.relatedUser.name}</a>
                </Link>
              </>
            )}
            
            {activity.metadata?.badgeName && (
              <>
                {' '}
                <span className={styles.badgeName}>
                  {activity.metadata.badgeIcon} {activity.metadata.badgeName}
                </span>
              </>
            )}
            
            {activity.metadata?.level && (
              <>
                {' '}
                <span className={styles.level}>Level {activity.metadata.level}</span>
              </>
            )}
          </div>

          <div className={styles.time}>
            {formatTimeAgo(activity.createdAt)}
          </div>
        </div>
      </div>
    );
  };

  if (!session) return null;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading activities...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{mode === 'user' ? 'User Activity' : 'Activity Feed'}</h2>
      </div>

      <div className={styles.activities}>
        {activities.map(renderActivity)}
      </div>

      {activities.length === 0 && (
        <div className={styles.empty}>
          <p>No activities yet</p>
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(date) {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return past.toLocaleDateString();
}

ActivityFeed.propTypes = {
  mode: PropTypes.string,
  userId: PropTypes.string,
};
