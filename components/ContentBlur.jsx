// [설명] 비회원 콘텐츠 블러 처리 컴포넌트 (광고 시청 옵션 포함)
// [일시] 2025-11-19 13:30 (KST)
// [수정] 2025-11-19 13:45 (KST) - 광고 시청 대체 기능 추가

import { useState, useEffect } from 'react'
import styles from './ContentBlur.module.css'
import { AdWatchSession } from '@/utils/contentRestriction'

export default function ContentBlur({ children, isAuthenticated, threshold = 0.5 }) {
  const [showPrompt, setShowPrompt] = useState(false)
  const [showAdOption, setShowAdOption] = useState(false)
  const [isWatchingAd, setIsWatchingAd] = useState(false)
  const [adTimer, setAdTimer] = useState(30)
  const [adSession] = useState(() => new AdWatchSession())

  useEffect(() => {
    if (!isAuthenticated) {
      // 광고 세션 확인
      if (adSession.isSessionValid()) {
        // 세션 유효 -> 콘텐츠 표시
        setShowPrompt(false)
      } else {
        setShowPrompt(true)
      }
    }
  }, [isAuthenticated, adSession])

  // 광고 타이머
  useEffect(() => {
    if (isWatchingAd && adTimer > 0) {
      const timer = setTimeout(() => {
        setAdTimer(adTimer - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (isWatchingAd && adTimer === 0) {
      // 광고 시청 완료
      adSession.markAdWatched()
      setIsWatchingAd(false)
      setShowPrompt(false)
    }
  }, [isWatchingAd, adTimer, adSession])

  const handleWatchAd = () => {
    setShowAdOption(false)
    setIsWatchingAd(true)
    setAdTimer(30)
  }

  // 로그인 상태이거나 광고 세션 유효 시 전체 콘텐츠 표시
  if (isAuthenticated || (adSession.isSessionValid() && !showPrompt)) {
    return <>{children}</>
  }

  return (
    <div className={styles.container}>
      <div className={styles.visibleContent}>
        {children}
      </div>
      <div className={styles.blurOverlay}>
        {isWatchingAd ? (
          <div className={styles.adContainer}>
            <div className={styles.adPlaceholder}>
              <p>📺 광고 시청 중...</p>
              <div className={styles.adTimer}>
                <div className={styles.timerCircle}>
                  <span className={styles.timerText}>{adTimer}초</span>
                </div>
              </div>
              <p className={styles.adNote}>광고가 끝나면 자동으로 전체 내용을 볼 수 있습니다</p>
              <div className={styles.adContent}>
                {/* Google AdSense 광고 영역 */}
                <ins className="adsbygoogle"
                     style={{ display: 'block' }}
                     data-ad-client="ca-pub-xxxxxxxxxxxxxxxx"
                     data-ad-slot="0000000000"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
              </div>
            </div>
          </div>
        ) : showAdOption ? (
          <div className={styles.lockMessage}>
            <h3>💡 광고를 시청하고 무료로 보기</h3>
            <p>30초 광고 시청 후 1시간 동안 모든 콘텐츠를 볼 수 있습니다</p>
            <div className={styles.buttons}>
              <button className={styles.adBtn} onClick={handleWatchAd}>
                광고 보고 무료로 이용하기
              </button>
              <button className={styles.backBtn} onClick={() => setShowAdOption(false)}>
                돌아가기
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.lockMessage}>
            <h3>🔒 전체 내용을 보시려면</h3>
            <p>회원가입하거나 광고를 시청하세요!</p>
            <div className={styles.optionsGrid}>
              <div className={styles.option}>
                <h4>✨ 회원가입 (추천)</h4>
                <ul className={styles.benefits}>
                  <li>광고 없이 무제한 이용</li>
                  <li>개인 맞춤 추천</li>
                  <li>좋아요 & 북마크</li>
                </ul>
                <div className={styles.buttons}>
                  <button className={styles.loginBtn}>로그인</button>
                  <button className={styles.signupBtn}>회원가입</button>
                </div>
              </div>
              <div className={styles.divider}>또는</div>
              <div className={styles.option}>
                <h4>📺 광고 시청</h4>
                <ul className={styles.benefits}>
                  <li>30초 광고 시청</li>
                  <li>1시간 무료 이용</li>
                  <li>회원가입 불필요</li>
                </ul>
                <button className={styles.watchAdBtn} onClick={() => setShowAdOption(true)}>
                  광고 보고 계속 읽기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
