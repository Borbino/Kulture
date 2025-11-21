import { useState, useEffect } from 'react';
import styles from './ReactionButton.module.css';

const REACTIONS = [
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'laugh', emoji: '😂', label: 'Laugh' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
  { type: 'sad', emoji: '😢', label: 'Sad' },
  { type: 'angry', emoji: '😡', label: 'Angry' },
];

export default function ReactionButton({ targetType, targetId, initialReactions = {} }) {
  const [reactions, setReactions] = useState(initialReactions);
  const [showPicker, setShowPicker] = useState(false);
  const [userReaction, setUserReaction] = useState(null);
  const [animating, setAnimating] = useState(null);

  useEffect(() => {
    fetchReactions();
  }, [targetId]);

  const fetchReactions = async () => {
    try {
      const res = await fetch(`/api/social/reactions?targetType=${targetType}&targetId=${targetId}`);
      const data = await res.json();
      setReactions(data.counts || {});
      
      // TODO: Get user's reaction from data.reactions
    } catch (error) {
      console.error('Failed to fetch reactions:', error);
    }
  };

  const handleReaction = async (reactionType) => {
    try {
      setAnimating(reactionType);
      setTimeout(() => setAnimating(null), 600);

      if (userReaction === reactionType) {
        // Remove reaction
        await fetch('/api/social/reactions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetType, targetId }),
        });
        
        setReactions(prev => ({
          ...prev,
          [reactionType]: Math.max(0, (prev[reactionType] || 0) - 1),
        }));
        setUserReaction(null);
      } else {
        // Add or change reaction
        await fetch('/api/social/reactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetType, targetId, reactionType }),
        });
        
        setReactions(prev => {
          const updated = {
            ...prev,
            [reactionType]: (prev[reactionType] || 0) + 1,
          };
          if (userReaction) {
            updated[userReaction] = Math.max(0, (prev[userReaction] || 0) - 1);
          }
          return updated;
        });
        setUserReaction(reactionType);
      }
      
      setShowPicker(false);
    } catch (error) {
      console.error('Failed to update reaction:', error);
    }
  };

  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);

  return (
    <div className={styles.container}>
      <button
        className={styles.mainButton}
        onClick={() => setShowPicker(!showPicker)}
        onMouseEnter={() => setShowPicker(true)}
      >
        {userReaction ? (
          <>
            {REACTIONS.find(r => r.type === userReaction)?.emoji}
            <span>{reactions[userReaction] || 0}</span>
          </>
        ) : (
          <>
            👍
            <span>{totalReactions > 0 ? totalReactions : 'React'}</span>
          </>
        )}
      </button>

      {showPicker && (
        <div
          className={styles.picker}
          onMouseLeave={() => setShowPicker(false)}
        >
          {REACTIONS.map((reaction) => (
            <button
              key={reaction.type}
              className={`${styles.reactionBtn} ${animating === reaction.type ? styles.animate : ''} ${userReaction === reaction.type ? styles.active : ''}`}
              onClick={() => handleReaction(reaction.type)}
              title={reaction.label}
            >
              <span className={styles.emoji}>{reaction.emoji}</span>
              {reactions[reaction.type] > 0 && (
                <span className={styles.count}>{reactions[reaction.type]}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {totalReactions > 0 && (
        <div className={styles.summary}>
          {Object.entries(reactions)
            .filter(([_, count]) => count > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([type]) => REACTIONS.find(r => r.type === type)?.emoji)
            .join('')}
        </div>
      )}
    </div>
  );
}
