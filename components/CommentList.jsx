// [설명] 댓글 제한 컴포넌트 - 관리자 설정 기반 동적 제한
// [일시] 2025-11-19 13:30 (KST)
// [수정] 2025-11-20 08:40 (KST) - 관리자 설정 연동 추가

import PropTypes from 'prop-types'
import styles from './CommentList.module.css'
import { useSiteSettings } from '../lib/settings.js'

export default function CommentList({ comments, isAuthenticated }) {
  const { settings, loading } = useSiteSettings()

  // 관리자 설정에서 비율 가져오기 (기본값 40%)
  const visiblePercentage = settings?.contentRestriction?.visiblePercentage ?? 40
  const restrictionEnabled = settings?.contentRestriction?.enabled ?? true
  const applyToComments = settings?.contentRestriction?.applyToComments ?? true

  // 설정 로딩 중이거나, 제한 기능이 비활성화되었거나, 댓글 제한이 비활성화된 경우
  if (loading || !restrictionEnabled || !applyToComments || isAuthenticated) {
    return (
      <div className={styles.container}>
        <h3>댓글 {comments.length}개</h3>
        <div role="list" aria-label="댓글 목록">
          {comments.map(comment => (
            <div key={comment.id} className={styles.comment} role="listitem">
              <div className={styles.author}>{comment.author}</div>
              <div className={styles.content}>{comment.content}</div>
              <div className={styles.date}>
                <time dateTime={comment.date}>{comment.date}</time>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 비회원: 관리자 설정 비율 적용
  const visibleCount = Math.floor((comments.length * visiblePercentage) / 100)
  const visibleComments = comments.slice(0, visibleCount)
  const hiddenCount = comments.length - visibleCount

  return (
    <div className={styles.container}>
      <h3>댓글 {comments.length}개</h3>

      <div role="list" aria-label="댓글 목록">
        {visibleComments.map(comment => (
          <div key={comment.id} className={styles.comment} role="listitem">
            <div className={styles.author}>{comment.author}</div>
            <div className={styles.content}>{comment.content}</div>
            <div className={styles.date}>
              <time dateTime={comment.date}>{comment.date}</time>
            </div>
          </div>
        ))}
      </div>

      {!isAuthenticated && hiddenCount > 0 && (
        <div className={styles.lockedSection} role="alert" aria-live="polite">
          <div className={styles.lockIcon} aria-hidden="true">
            🔒
          </div>
          <p>나머지 {hiddenCount}개의 댓글을 보려면 로그인하세요</p>
          <button className={styles.loginBtn} type="button" aria-label="로그인하고 모든 댓글 보기">
            로그인하고 모든 댓글 보기
          </button>
        </div>
      )}
    </div>
  )
}

CommentList.propTypes = {
  comments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      author: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
    })
  ).isRequired,
  isAuthenticated: PropTypes.bool.isRequired,
}
