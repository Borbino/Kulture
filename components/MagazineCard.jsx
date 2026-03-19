/**
 * MagazineCard — Neon Glassmorphism Article Card
 * Phase 7 · Kulture Design System
 */
import Link from 'next/link';
import PropTypes from 'prop-types';
import styles from './MagazineCard.module.css';

const CATEGORY_COLORS = {
  'K-Pop':    'pink',
  'K-Drama':  'cyan',
  'K-Beauty': 'pink',
  'K-Food':   'cyan',
  'K-Games':  'pink',
  'default':  'pink',
};

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCount(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function MagazineCard({ article, glowColor, trending = false }) {
  const {
    title      = 'Untitled',
    excerpt    = '',
    thumbnail  = null,
    category   = 'default',
    views      = 0,
    votes      = 0,
    createdAt  = null,
    slug       = null,
  } = article || {};

  const variant = glowColor || CATEGORY_COLORS[category] || 'pink';
  const href = slug ? `/posts/${typeof slug === 'object' ? slug.current : slug}` : '#';

  return (
    <Link href={href} className={`${styles.card} ${variant === 'cyan' ? styles.cyan : ''}`}>
      {/* Thumbnail */}
      <div className={styles.thumbnail}>
        {thumbnail ? (
          <img src={thumbnail} alt={title} loading="lazy" />
        ) : (
          <div className={styles.thumbnailPlaceholder}>
            {category === 'K-Pop' ? '🎵' :
             category === 'K-Drama' ? '🎬' :
             category === 'K-Beauty' ? '💄' :
             category === 'K-Food' ? '🍜' : '🌏'}
          </div>
        )}
        <div className={styles.gradientOverlay} />

        {/* Category badge */}
        {category && category !== 'default' && (
          <span className={`${styles.categoryBadge} ${variant === 'cyan' ? styles.cyan : ''}`}>
            {category}
          </span>
        )}

        {/* Trending badge */}
        {trending && (
          <span className={styles.trendingBadge}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
            </svg>
            HOT
          </span>
        )}
      </div>

      {/* Body */}
      <div className={styles.body}>
        <h3 className={styles.title}>{title}</h3>
        {excerpt && <p className={styles.excerpt}>{excerpt}</p>}

        {/* Meta */}
        <div className={styles.meta}>
          <div className={styles.metaLeft}>
            <span className={styles.metaItem}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
              {formatCount(views)}
            </span>
            <span className={styles.metaItem}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              {formatCount(votes)}
            </span>
          </div>
          {createdAt && <span className={styles.metaDate}>{formatDate(createdAt)}</span>}
        </div>
      </div>
    </Link>
  );
}

MagazineCard.propTypes = {
  article:   PropTypes.object.isRequired,
  glowColor: PropTypes.oneOf(['pink', 'cyan']),
  trending:  PropTypes.bool,
};