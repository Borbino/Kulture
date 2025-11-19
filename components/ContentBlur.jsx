// [설명] 비회원 콘텐츠 블러 처리 컴포넌트
// [일시] 2025-11-19 13:30 (KST)

import { useState, useEffect } from 'react'
import styles from './ContentBlur.module.css'

export default function ContentBlur({ children, isAuthenticated, threshold = 0.5 }) {
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      setShowPrompt(true)
    }
  }, [isAuthenticated])

  if (isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className={styles.container}>
      <div className={styles.visibleContent}>
        {children}
      </div>
      <div className={styles.blurOverlay}>
        <div className={styles.lockMessage}>
          <h3>🔒 전체 내용을 보시려면 로그인하세요</h3>
          <p>무료 회원가입으로 모든 콘텐츠를 즐기세요!</p>
          <div className={styles.buttons}>
            <button className={styles.loginBtn}>로그인</button>
            <button className={styles.signupBtn}>회원가입</button>
          </div>
        </div>
      </div>
    </div>
  )
}
