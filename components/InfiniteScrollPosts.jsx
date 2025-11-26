import { useEffect, useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import ReactionButton from './ReactionButton';
import styles from './InfiniteScrollPosts.module.css';

export default function InfiniteScrollPosts({ boardId = null, categoryId = null }) {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef(null);

  const loadPosts = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      
      let url = `/api/posts?page=${page}&limit=10`;
      if (boardId) url += `&boardId=${boardId}`;
      if (categoryId) url += `&categoryId=${categoryId}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.posts && data.posts.length > 0) {
        setPosts(prev => [...prev, ...data.posts]);
        setPage(prev => prev + 1);
        setHasMore(data.posts.length >= 10);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, boardId, categoryId]);

  // Intersection Observer setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadPosts();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [loadPosts, hasMore, loading]);

  // Initial load
  useEffect(() => {
    if (posts.length === 0) {
      loadPosts();
    }
  }, []);

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now - d) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    
    return d.toLocaleDateString();
  };

  return (
    <div className={styles.container}>
      <div className={styles.posts}>
        {posts.map((post) => (
          <article key={post._id} className={styles.post}>
            <div className={styles.postHeader}>
              <Link href={`/posts/${post._id}`}>
                <a className={styles.postTitle}>
                  {post.isAnonymous ? '🕶️ ' : ''}
                  {post.title}
                </a>
              </Link>
              
              {post.isPinned && (
                <span className={styles.pinnedBadge}>📌 Pinned</span>
              )}
            </div>

            <p className={styles.postExcerpt}>
              {post.body?.substring(0, 150)}
              {post.body?.length > 150 ? '...' : ''}
            </p>

            <div className={styles.postMeta}>
              <span className={styles.author}>
                {post.author?.name || 'Anonymous'}
              </span>
              <span className={styles.separator}>•</span>
              <span className={styles.time}>{formatDate(post.publishedAt)}</span>
              <span className={styles.separator}>•</span>
              <span className={styles.stats}>👁️ {post.views || 0}</span>
              <span className={styles.separator}>•</span>
              <span className={styles.stats}>💬 {post.commentCount || 0}</span>
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className={styles.tags}>
                {post.tags.slice(0, 5).map((tag) => (
                  <span key={tag} className={styles.tag}>#{tag}</span>
                ))}
              </div>
            )}

            <div className={styles.postActions}>
              <ReactionButton
                targetType="post"
                targetId={post._id}
                initialReactions={post.reactions}
              />
            </div>
          </article>
        ))}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading more posts...</p>
        </div>
      )}

      {/* Intersection Observer target */}
      <div ref={observerRef} className={styles.observer} />

      {/* End message */}
      {!hasMore && posts.length > 0 && (
        <div className={styles.end}>
          <p>You've reached the end! 🎉</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && posts.length === 0 && (
        <div className={styles.empty}>
          <p>No posts yet</p>
        </div>
      )}
    </div>
  );
}

InfiniteScrollPosts.propTypes = {
  boardId: PropTypes.string,
  categoryId: PropTypes.string,
};
