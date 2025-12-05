import { useState } from 'react'
import { useSession } from 'next-auth/react'
import styles from '../styles/ReportModal.module.css'

export default function ReportModal({ targetType, targetId, onClose, onSuccess }) {
  const { data: session } = useSession()
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!session) {
      alert('로그인 후 신고 가능합니다.')
      return
    }

    if (!reason.trim()) {
      setError('신고 사유를 입력해주세요.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const reportBody = {
        type: targetType,
        reason,
      }

      if (targetType === 'post') {
        reportBody.targetPostId = targetId
      } else if (targetType === 'comment') {
        reportBody.targetCommentId = targetId
      } else if (targetType === 'user') {
        reportBody.targetUserId = targetId
      }

      const res = await fetch('/api/moderation/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportBody),
      })

      if (res.ok) {
        setReason('')
        onSuccess && onSuccess()
        onClose()
      } else {
        const data = await res.json()
        setError(data.error || '신고 실패')
      }
    } catch (err) {
      setError('신고 중 오류 발생')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>📢 신고하기</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>신고 사유</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
            >
              <option value="">선택해주세요</option>
              <option value="spamming">스팸</option>
              <option value="harassment">괴롭힘/명예훼손</option>
              <option value="inappropriate_content">부적절한 내용</option>
              <option value="copyright">저작권 침해</option>
              <option value="other">기타</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>상세 설명</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="신고 사유를 상세히 설명해주세요"
              rows="4"
              disabled={loading}
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? '처리 중...' : '신고'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
