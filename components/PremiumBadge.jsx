/**
 * PremiumBadge Component
 * [목적] 프리미엄/창립 멤버 배지 — 프로필, 댓글, 게시물 등 재사용 가능
 * [사용법] <PremiumBadge type="monthly" size="sm" />
 */

import styles from './PremiumBadge.module.css'

const BADGE_CONFIG = {
  monthly: {
    label: 'Premium',
    emoji: '⭐',
    className: 'monthly',
  },
  annual: {
    label: 'Gold',
    emoji: '🏅',
    className: 'annual',
  },
  lifetime: {
    label: 'Diamond',
    emoji: '💎',
    className: 'lifetime',
  },
  founder: {
    label: 'Founder',
    emoji: '🔮',
    className: 'founder',
  },
}

/**
 * @param {object} props
 * @param {'monthly'|'annual'|'lifetime'|'founder'} props.type - 멤버십 종류
 * @param {'xs'|'sm'|'md'} props.size - 배지 크기
 * @param {boolean} props.showLabel - 텍스트 라벨 표시 여부 (기본 true)
 */
export default function PremiumBadge({ type = 'monthly', size = 'sm', showLabel = true }) {
  const config = BADGE_CONFIG[type] || BADGE_CONFIG.monthly

  return (
    <span
      className={`${styles.badge} ${styles[config.className]} ${styles[size]}`}
      title={`${config.label} 멤버`}
      aria-label={`${config.label} 멤버 배지`}
    >
      <span className={styles.emoji} aria-hidden="true">{config.emoji}</span>
      {showLabel && <span className={styles.label}>{config.label}</span>}
    </span>
  )
}
