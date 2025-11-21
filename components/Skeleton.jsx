import PropTypes from 'prop-types'
import styles from './Skeleton.module.css'

export function PostCardSkeleton() {
  return (
    <div className={styles.postCardSkeleton}>
      <div className={styles.postImageSkeleton} />
      <div className={styles.postContentSkeleton}>
        <div className={`${styles.skeleton} ${styles.postTitleSkeleton}`} />
        <div className={`${styles.skeleton} ${styles.postExcerptSkeleton}`} />
        <div className={`${styles.skeleton} ${styles.postExcerptSkeleton}`} style={{ width: '60%' }} />
        <div className={`${styles.skeleton} ${styles.postMetaSkeleton}`} />
      </div>
    </div>
  )
}

export function TrendCardSkeleton() {
  return (
    <div className={styles.trendCardSkeleton}>
      <div className={`${styles.skeleton} ${styles.trendBadgeSkeleton}`} />
      <div className={`${styles.skeleton} ${styles.trendTitleSkeleton}`} />
      <div className={`${styles.skeleton} ${styles.trendStatsSkeleton}`} />
    </div>
  )
}

export function VIPCardSkeleton() {
  return (
    <div className={styles.vipCardSkeleton}>
      <div className={`${styles.skeleton} ${styles.vipAvatarSkeleton}`} />
      <div className={styles.vipInfoSkeleton}>
        <div className={`${styles.skeleton} ${styles.vipNameSkeleton}`} />
        <div className={`${styles.skeleton} ${styles.vipActivitySkeleton}`} />
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 3, type = 'post' }) {
  const SkeletonComponent = 
    type === 'post' ? PostCardSkeleton :
    type === 'trend' ? TrendCardSkeleton :
    VIPCardSkeleton

  return (
    <div className={styles.skeletonGrid}>
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonComponent key={idx} />
      ))}
    </div>
  )
}

SkeletonGrid.propTypes = {
  count: PropTypes.number,
  type: PropTypes.oneOf(['post', 'trend', 'vip']),
}
