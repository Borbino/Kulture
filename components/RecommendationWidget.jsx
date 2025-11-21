import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './RecommendationWidget.module.css';

export default function RecommendationWidget({ type = 'personalized', postId = null, limit = 5 }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [type, postId]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      let url = `/api/recommendations?type=${type}&limit=${limit}`;
      
      if (type === 'similar' && postId) {
        url += `&postId=${postId}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'personalized':
        return '🎯 Recommended for You';
      case 'similar':
        return '🔗 Similar Posts';
      case 'trending':
        return '🔥 Trending Now';
      default:
        return 'Recommendations';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>{getTitle()}</h3>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (posts.length === 0) return null;

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{getTitle()}</h3>
      
      <div className={styles.posts}>
        {posts.map((post) => (
          <Link key={post._id} href={`/posts/${post._id}`}>
            <a className={styles.post}>
              <div className={styles.postContent}>
                <h4 className={styles.postTitle}>{post.title}</h4>
                
                <div className={styles.postMeta}>
                  <span className={styles.author}>{post.author?.name || 'Anonymous'}</span>
                  <span className={styles.separator}>•</span>
                  <span className={styles.stats}>
                    ❤️ {post.likes || 0}
                  </span>
                  <span className={styles.separator}>•</span>
                  <span className={styles.stats}>
                    💬 {post.commentCount || 0}
                  </span>
                </div>
                
                {post.tags && post.tags.length > 0 && (
                  <div className={styles.tags}>
                    {post.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className={styles.tag}>#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              
              {type === 'trending' && post.trendScore && (
                <div className={styles.trendBadge}>
                  🔥 {Math.round(post.trendScore)}
                </div>
              )}
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}
