// [설명] 댓글 제한 컴포넌트 - 비회원 40%만 표시
// [일시] 2025-11-19 13:30 (KST)

import styles from './CommentList.module.css'

export default function CommentList({ comments, isAuthenticated }) {
  const visibleCount = isAuthenticated 
    ? comments.length 
    : Math.floor(comments.length * 0.4)

  const visibleComments = comments.slice(0, visibleCount)
  const hiddenCount = comments.length - visibleCount

  return (
    <div className={styles.container}>
      <h3>댓글 {comments.length}개</h3>
      
      {visibleComments.map(comment => (
        <div key={comment.id} className={styles.comment}>
          <div className={styles.author}>{comment.author}</div>
          <div className={styles.content}>{comment.content}</div>
          <div className={styles.date}>{comment.date}</div>
        </div>
      ))}

      {!isAuthenticated && hiddenCount > 0 && (
        <div className={styles.lockedSection}>
          <div className={styles.lockIcon}>🔒</div>
          <p>나머지 {hiddenCount}개의 댓글을 보려면 로그인하세요</p>
          <button className={styles.loginBtn}>로그인하고 모든 댓글 보기</button>
        </div>
      )}
    </div>
  )
}
