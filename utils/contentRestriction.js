// [설명] 비회원 콘텐츠 제한 유틸리티 - 관리자 설정 기반 제한
// [일시] 2025-11-19 13:30 (KST)
// [수정] 2025-11-20 08:42 (KST) - 하드코딩 제거, 설정 기반으로 변경
// [목적] 회원가입/로그인 유도

/**
 * 텍스트 콘텐츠를 관리자 설정 비율에 따라 마스킹 처리
 * @param {string} content - 원본 텍스트
 * @param {boolean} isAuthenticated - 로그인 여부
 * @param {number} visiblePercentage - 보여줄 콘텐츠 비율 (기본값 40%)
 * @returns {string} - 마스킹된 텍스트 또는 원본
 */
export function maskContent(content, isAuthenticated, visiblePercentage = 40) {
  if (isAuthenticated) return content

  const lines = content.split('\n')
  const visibleLineCount = Math.floor((lines.length * visiblePercentage) / 100)
  const visibleLines = lines.slice(0, visibleLineCount)

  return visibleLines.join('\n') + '\n\n[로그인하여 전체 내용 보기]'
}

/**
 * 댓글 목록을 관리자 설정 비율에 따라 숨김 처리
 * @param {Array} comments - 댓글 배열
 * @param {boolean} isAuthenticated - 로그인 여부
 * @param {number} visiblePercentage - 보여줄 댓글 비율 (기본값 40%)
 * @returns {Array} - 필터링된 댓글 배열
 */
export function filterComments(comments, isAuthenticated, visiblePercentage = 40) {
  if (isAuthenticated) return comments

  const visibleCount = Math.floor((comments.length * visiblePercentage) / 100)
  return comments
    .slice(0, visibleCount)
    .map(comment => ({
      ...comment,
      isLocked: false,
    }))
    .concat([
      {
        id: 'locked',
        content: '나머지 댓글을 보려면 로그인하세요',
        isLocked: true,
      },
    ])
}

/**
 * 이미지 블러 처리 여부
 * @param {number} index - 이미지 인덱스
 * @param {boolean} isAuthenticated - 로그인 여부
 * @returns {boolean} - 블러 적용 여부
 */
export function shouldBlurImage(index, isAuthenticated) {
  if (isAuthenticated) return false
  return index >= 2 // 3번째 이미지부터 블러
}

/**
 * 회원가입 유도 메시지 생성
 * @returns {object} - 메시지 객체
 */
export function getSignupPrompt() {
  return {
    title: '전체 콘텐츠를 보시려면 로그인하세요',
    description: '무료 회원가입으로 모든 K-Culture 콘텐츠를 즐기세요!',
    benefits: [
      '모든 게시물 및 댓글 전체 보기',
      '좋아요 및 북마크 기능',
      '개인 맞춤 추천',
      '알림 및 새 소식 받기',
    ],
  }
}

/**
 * 광고 시청 세션 관리
 */
export class AdWatchSession {
  constructor() {
    this.storageKey = 'kulture_ad_watch_session'
    this.adDuration = 30 // 광고 최소 시청 시간 (초)
  }

  /**
   * 로컬스토리지에서 세션 정보 가져오기
   */
  getSession() {
    if (typeof window === 'undefined') return null
    const data = localStorage.getItem(this.storageKey)
    return data ? JSON.parse(data) : null
  }

  /**
   * 광고 시청 완료 기록
   * @param {number} durationInMinutes - 세션 유효 시간 (분 단위, 기본 60분)
   */
  markAdWatched(durationInMinutes = 60) {
    if (typeof window === 'undefined') return
    const sessionDurationMs = durationInMinutes * 60 * 1000
    const session = {
      timestamp: Date.now(),
      expiresAt: Date.now() + sessionDurationMs,
      articlesUnlocked: 1,
    }
    localStorage.setItem(this.storageKey, JSON.stringify(session))
  }

  /**
   * 세션 유효성 확인
   */
  isSessionValid() {
    const session = this.getSession()
    if (!session) return false
    return Date.now() < session.expiresAt
  }

  /**
   * 세션 초기화
   */
  clearSession() {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.storageKey)
  }

  /**
   * 광고 시청 필요 여부 확인
   * @param {boolean} isAuthenticated - 로그인 여부
   * @returns {boolean} - 광고 시청 필요 여부
   */
  needsAdWatch(isAuthenticated) {
    if (isAuthenticated) return false
    return !this.isSessionValid()
  }

  /**
   * 남은 시간 가져오기
   */
  getRemainingTime() {
    const session = this.getSession()
    if (!session) return 0
    const remaining = Math.max(0, session.expiresAt - Date.now())
    return Math.floor(remaining / 1000 / 60) // 분 단위
  }
}
