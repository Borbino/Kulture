import { useState } from 'react';
import { useSession } from 'next-auth/react';
import styles from './FollowButton.module.css';

export default function FollowButton({ userId, initialFollowing = false, onFollowChange }) {
  const { data: session } = useSession();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    if (!session || loading) return;

    try {
      setLoading(true);

      if (isFollowing) {
        // Unfollow
        const res = await fetch('/api/social/follow', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ followingId: userId }),
        });

        if (res.ok) {
          setIsFollowing(false);
          if (onFollowChange) onFollowChange(false);
        }
      } else {
        // Follow
        const res = await fetch('/api/social/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ followingId: userId }),
        });

        if (res.ok) {
          setIsFollowing(true);
          if (onFollowChange) onFollowChange(true);
        }
      }
    } catch (error) {
      console.error('Failed to update follow status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!session || session.user.id === userId) return null;

  return (
    <button
      className={`${styles.button} ${isFollowing ? styles.following : styles.notFollowing}`}
      onClick={handleFollow}
      disabled={loading}
    >
      {loading ? (
        <span>...</span>
      ) : isFollowing ? (
        <>
          <span className={styles.icon}>✓</span>
          Following
        </>
      ) : (
        <>
          <span className={styles.icon}>+</span>
          Follow
        </>
      )}
    </button>
  );
}
