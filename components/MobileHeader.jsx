/**
 * MobileHeader Component
 * [목적] 모바일 전용 헤더 (뒤로가기 버튼 + 타이틀 + 햄버거/액션)
 *        모바일 기기에서만 렌더링됨 (기존 데스크탑 헤더와 공존)
 *
 * [사용법]
 *   <MobileHeader title="트렌드" showBack />
 *   <MobileHeader title="커뮤니티" action={<NotificationBell />} />
 */

import PropTypes from 'prop-types'
import { useRouter } from 'next/router'
import Link from 'next/link'
import styles from './MobileHeader.module.css'

/**
 * @param {object} props
 * @param {string} [props.title]     - 페이지 타이틀
 * @param {boolean} [props.showBack] - 뒤로가기 버튼 표시 여부
 * @param {string} [props.backHref]  - 뒤로가기 URL (미지정 시 router.back())
 * @param {React.ReactNode} [props.action] - 우측 액션 영역
 * @param {boolean} [props.transparent] - 투명 배경 (이미지 위 오버레이용)
 */
export default function MobileHeader({
  title,
  showBack = false,
  backHref,
  action,
  transparent = false,
}) {
  const router = useRouter()

  const handleBack = () => {
    if (backHref) {
      router.push(backHref)
    } else {
      router.back()
    }
  }

  return (
    <header
      className={`${styles.header} ${transparent ? styles.transparent : ''}`}
      role="banner"
    >
      {/* 왼쪽: 뒤로가기 또는 로고 */}
      <div className={styles.left}>
        {showBack ? (
          <button
            onClick={handleBack}
            className={styles.backBtn}
            aria-label="이전 페이지로 돌아가기"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        ) : (
          <Link href="/" className={styles.logoLink} aria-label="Kulture 홈">
            <span className={styles.logoText}>Kulture</span>
          </Link>
        )}
      </div>

      {/* 중앙: 타이틀 */}
      {title && (
        <h1 className={styles.title} aria-label={title}>
          {title}
        </h1>
      )}

      {/* 오른쪽: 액션 */}
      <div className={styles.right}>
        {action || <div className={styles.rightPlaceholder} />}
      </div>
    </header>
  )
}

MobileHeader.propTypes = {
  title: PropTypes.string,
  showBack: PropTypes.bool,
  backHref: PropTypes.string,
  action: PropTypes.node,
  transparent: PropTypes.bool,
}
