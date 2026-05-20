import { useState } from 'react'
import ReportModal from './ReportModal'
import PropTypes from 'prop-types'
import styles from '../styles/ContextMenu.module.css'

export default function ContextMenu({ targetType, targetId, onReport }) {
  const [showReportModal, setShowReportModal] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div className={styles.menuContainer}>
        <button
          className={styles.menuBtn}
          onClick={() => setIsOpen(!isOpen)}
          title="옵션"
        >
          ⋮
        </button>

        {isOpen && (
          <div className={styles.dropdown}>
            <button
              className={styles.menuItem}
              onClick={() => {
                setShowReportModal(true)
                setIsOpen(false)
              }}
            >
              🚨 신고
            </button>
            <button
              className={styles.menuItem}
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                alert('링크가 복사되었습니다!')
                setIsOpen(false)
              }}
            >
              📋 링크 복사
            </button>
          </div>
        )}
      </div>

      {showReportModal && (
        <ReportModal
          targetType={targetType}
          targetId={targetId}
          onClose={() => setShowReportModal(false)}
          onSuccess={onReport}
        />
      )}
    </>
  )
}

ContextMenu.propTypes = {
  targetType: PropTypes.string.isRequired,
  targetId: PropTypes.string.isRequired,
  onReport: PropTypes.func,
}
