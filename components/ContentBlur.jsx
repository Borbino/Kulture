// [설명] 비회원 콘텐츠 블러 처리 컴포넌트 (광고 시청 옵션 포함)
// [일시] 2025-11-19 13:30 (KST)
// [수정] 2025-11-19 13:45 (KST) - 광고 시청 대체 기능 추가
// [수정] 2025-11-19 14:00 (KST) - 관리자 설정 동적 연동

import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import styles from './ContentBlur.module.css'
import { AdWatchSession } from '../utils/contentRestriction.js'
import { useSiteSettings } from '../lib/settings.js'

export default function ContentBlur({ children, isAuthenticated }) {
  const { settings, loading } = useSiteSettings()
  const [showPrompt, setShowPrompt] = useState(false)
  const [showAdOption, setShowAdOption] = useState(false)
  const [isWatchingAd, setIsWatchingAd] = useState(false)
  const [adTimer, setAdTimer] = useState(30)
  const [adSession] = useState(() => new AdWatchSession())

  // 관리자 설정에서 값 가져오기
  const restrictionEnabled = settings?.contentRestriction?.enabled ?? true
  const adFeatureEnabled = settings?.adWatchFeature?.enabled ?? true
  const adDuration = settings?.adWatchFeature?.adDuration ?? 30
  const sessionDuration = settings?.adWatchFeature?.sessionDuration ?? 60
  const adSenseClientId = settings?.adWatchFeature?.adSenseClientId ?? 'ca-pub-xxxxxxxxxxxxxxxx'

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

  // 광고 타이머 (관리자 설정의 adDuration 적용)
  useEffect(() => {
    if (isWatchingAd && adTimer > 0) {
      const timer = setTimeout(() => {
        setAdTimer(adTimer - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (isWatchingAd && adTimer === 0) {
      // 광고 시청 완료 - 관리자가 설정한 세션 시간 적용 (분 단위로 전달)
      adSession.markAdWatched(sessionDuration)
      
      // [Task 1] GA4 이벤트 전송 (광고 시청 완료)
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'content_unlocked', {
          method: 'ad_watch_complete',
          content_type: 'article'
        })
      }
      
      setIsWatchingAd(false)
      setShowPrompt(false)
    }
  }, [isWatchingAd, adTimer, adSession, sessionDuration])

  const handleWatchAd = () => {
    setShowAdOption(false)
    setIsWatchingAd(true)
    setAdTimer(adDuration) // 관리자 설정의 adDuration 사용
  }

  // [Task 1] 스폰서 링크 확인 핸들러
  const handleCheckSponsor = () => {
    // 스폰서 링크 열기 (예: 구글 검색)
    window.open('https://www.google.com/search?q=k-culture+merch', '_blank')
    
    // GA4 이벤트 전송
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'content_unlocked', {
        method: 'sponsor_link_click',
        content_type: 'article'
      })
    }

    // 즉시 블러 해제
    adSession.markAdWatched(sessionDuration)
    setShowPrompt(false)
  }

  // 설정 로딩 중이면 대기
  if (loading) {
    return (
      <div aria-live="polite" aria-busy="true">
        {children}
      </div>
    )
  }

  // 콘텐츠 제한 기능이 비활성화되어 있으면 제한 없음
  if (!restrictionEnabled) {
    return <>{children}</>
  }

  // 로그인 상태이거나 광고 세션 유효 시 전체 콘텐츠 표시
  if (isAuthenticated || (adSession.isSessionValid() && !showPrompt)) {
    return <>{children}</>
  }

  return (
    <div className={styles.container}>
      <div className={styles.visibleContent} aria-label="미리보기 콘텐츠">
        {children}
      </div>
      <div
        className={styles.blurOverlay}
        role="dialog"
        aria-modal="true"
        aria-labelledby="content-lock-title"
      >
        {isWatchingAd ? (
          <div className={styles.adContainer}>
            <div className={styles.adPlaceholder}>
              <p id="content-lock-title">📺 광고 시청 중...</p>
              <div className={styles.adTimer} role="timer" aria-live="polite">
                <div className={styles.timerCircle}>
                  <span className={styles.timerText} aria-label={`남은 시간 ${adTimer}초`}>
                    {adTimer}초
                  </span>
                </div>
              </div>
              <p className={styles.adNote}>광고가 끝나면 자동으로 전체 내용을 볼 수 있습니다</p>
              <div className={styles.adContent}>
                {/* Google AdSense 광고 영역 */}
                <ins
                  className="adsbygoogle"
                  style={{ display: 'block' }}
                  data-ad-client={adSenseClientId}
                  data-ad-slot="0000000000"
                  data-ad-format="auto"
                  data-full-width-responsive="true"
                ></ins>
              </div>
            </div>
          </div>
        ) : showAdOption && adFeatureEnabled ? (
          <div className={styles.lockMessage}>
            <h3 id="content-lock-title">💡 광고를 시청하고 무료로 보기</h3>
            <p>
              {adDuration}초 광고 시청 후 {sessionDuration}분 동안 모든 콘텐츠를 볼 수 있습니다
            </p>
            <div className={styles.buttons}>
              <button
                className={styles.adBtn}
                onClick={handleWatchAd}
                type="button"
                aria-label="광고 보고 무료로 이용하기"
              >
                광고 보고 무료로 이용하기
              </button>
              <button
                className={styles.backBtn}
                onClick={() => setShowAdOption(false)}
                type="button"
                aria-label="돌아가기"
              >
                돌아가기
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.lockMessage}>
            <h3 id="content-lock-title">🔒 전체 내용을 보시려면</h3>
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
                  <button className={styles.loginBtn} type="button" aria-label="로그인">
                    로그인
                  </button>
                  <button className={styles.signupBtn} type="button" aria-label="회원가입">
                    회원가입
                  </button>
                </div>
              </div>
              <div className={styles.divider} aria-hidden="true">
                또는
              </div>
              <div className={styles.option}>
                <h4>📺 광고 시청</h4>
                <ul className={styles.benefits}>
                  <li>{adDuration}초 광고 시청</li>
                  <li>{sessionDuration}분 무료 이용</li>
                  <li>회원가입 불필요</li>
                </ul>
                <div className={styles.buttons}>
                  <button
                    className={styles.watchAdBtn}
                    onClick={() => setShowAdOption(true)}
                    type="button"
                    aria-label="광고 시청하기 (Unlock with Ad)"
                  >
                    광고 시청하기 (Unlock with Ad)
                  </button>
                  <button
                    className={styles.watchAdBtn}
                    onClick={handleCheckSponsor}
                    type="button"
                    style={{ marginTop: '0.5rem', backgroundColor: '#4CAF50' }}
                    aria-label="스폰서 링크 확인 (Check Sponsor)"
                  >
                    스폰서 링크 확인 (Check Sponsor)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

ContentBlur.propTypes = {
  children: PropTypes.node.isRequired,
  isAuthenticated: PropTypes.bool.isRequired,
}
