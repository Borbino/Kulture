/**
 * Google Analytics 4 Integration
 * 페이지뷰 및 커스텀 이벤트 추적
 */

// GA4 Measurement ID
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

// 서버 사이드 이벤트 브리지 (GA가 없을 때 logger로 대체)
import { logger } from './logger.js'

/**
 * GA4 페이지뷰 추적
 */
export const pageview = url => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    })
  }
}

/**
 * GA4 커스텀 이벤트 추적
 */
export const event = ({ action, category, label, value }) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  } else {
    // SSR/서버 사이드: 로거로 백업 기록
    logger.info('analytics', 'event', { action, category, label, value })
  }
}

// 번역 관련 이벤트 헬퍼
export const trackTranslationEvent = ({
  type, // 'request' | 'success' | 'error' | 'cache-hit'
  provider,
  sourceLang,
  targetLang,
  durationMs,
  cached,
  error,
}) => {
  const action = `translation_${type}`
  const label = `${provider || 'unknown'}:${sourceLang || 'auto'}>${targetLang}`
  const value = Math.round(durationMs || 0)
  event({ action, category: 'translation', label, value })

  // 서버 사이드 로거 메타 강화
  if (typeof logger?.translation === 'function') {
    logger.translation(action, {
      provider,
      sourceLang,
      targetLang,
      durationMs,
      cached: !!cached,
      error: error ? String(error) : undefined,
    })
  } else if (typeof logger?.info === 'function') {
    logger.info('translation', action, {
      provider,
      sourceLang,
      targetLang,
      durationMs,
      cached: !!cached,
      error: error ? String(error) : undefined,
    })
  }
}

/**
 * 자주 사용하는 이벤트 헬퍼
 */

// 게시물 클릭
export const trackPostClick = (postSlug, postTitle) => {
  event({
    action: 'post_click',
    category: 'engagement',
    label: `${postSlug} - ${postTitle}`,
  })
}

// 트렌드 클릭
export const trackTrendClick = (keyword, source) => {
  event({
    action: 'trend_click',
    category: 'engagement',
    label: `${keyword} (${source})`,
  })
}

// VIP 클릭
export const trackVIPClick = vipName => {
  event({
    action: 'vip_click',
    category: 'engagement',
    label: vipName,
  })
}

// 공유 버튼 클릭
export const trackShare = (platform, contentType, contentTitle) => {
  event({
    action: 'share',
    category: 'social',
    label: `${platform} - ${contentType} - ${contentTitle}`,
  })
}

// 검색
export const trackSearch = (query, resultCount) => {
  event({
    action: 'search',
    category: 'engagement',
    label: query,
    value: resultCount,
  })
}

// 에러 추적
export const trackError = (errorMessage, errorPage) => {
  event({
    action: 'error',
    category: 'technical',
    label: `${errorPage} - ${errorMessage}`,
  })
}

// 성능 추적
export const trackPerformance = (metricName, value) => {
  event({
    action: 'performance',
    category: 'technical',
    label: metricName,
    value: Math.round(value),
  })
}

// ─────────────────────────────────────────────
// Phase 11 — 수익 전환 실시간 추적 (Revenue Conversion Tracking)
// ─────────────────────────────────────────────

/**
 * 광고 클릭 추적
 * A/B 테스트 Variant와 언어별 수익성을 GA4로 전송
 *
 * @param {string} slotId        - 광고 슬롯 ID (예: 'feed-slot-1', 'article-mid')
 * @param {string} variant       - A/B Variant ID ('A' | 'B' | 'C')
 * @param {string} userLanguage  - i18n.language (예: 'ko', 'en', 'ja')
 */
export const trackAdClick = (slotId, variant, userLanguage) => {
  const lang = userLanguage || (typeof window !== 'undefined' ? document.documentElement.lang : 'unknown')
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'ad_click', {
      event_category:  'monetization',
      event_label:     slotId,
      ad_variant:      variant,
      user_language:   lang,
      // GA4 권장 이커머스 비교 파라미트
      currency:        'USD',
      value:           1, // 광고 클릭 가치 (AdSense eCPM 변환을 위한 추정치)
    })
  }
  logger.info('analytics', 'ad_click', { slotId, variant, lang })
}

/**
 * 제휴 링크 / 수익화 블록 클릭 추적
 * 본문 내 제휴 상품 링크 클릭 실시간 GA4 전송
 *
 * @param {string} productId    - 제휴 상품/서비스 ID (예: 'melon-pass', 'weverse-shop')
 * @param {string} contentSlug  - 클릭이 발생한 기사 slug
 */
export const trackMonetizationClick = (productId, contentSlug) => {
  const lang = typeof window !== 'undefined' ? document.documentElement.lang : 'unknown'
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'monetization_click', {
      event_category:  'monetization',
      event_label:     productId,
      content_slug:    contentSlug,
      user_language:   lang,
      currency:        'USD',
      value:           2, // 제휴 클릭 수익가치는 광고보다 보수적으로 높게 설정
    })
  }
  logger.info('analytics', 'monetization_click', { productId, contentSlug, lang })
}

/**
 * 기사 체류 시간 추적 (스크롤 깊이 연동)
 * 스크롤 50% / 75% / 100% 도달 시마다 호출하면 정밀한 디우시스 영향 신호 확보
 *
 * @param {string} slug     - 기사 slug
 * @param {number} seconds  - 체류 시간 (초)
 * @param {number} [scrollDepthPct] - 스크롤 깊이 % (0~100)
 */
export const trackTimeOnPage = (slug, seconds, scrollDepthPct) => {
  const lang = typeof window !== 'undefined' ? document.documentElement.lang : 'unknown'
  const roundedSec = Math.round(seconds)

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'time_on_page', {
      event_category:   'engagement',
      event_label:      slug,
      value:            roundedSec,
      user_language:    lang,
      scroll_depth_pct: scrollDepthPct ?? null,
      // GA4 UserEngagementTime 메트릭과 연동
      engagement_time_msec: roundedSec * 1000,
    })
  }
  logger.info('analytics', 'time_on_page', { slug, seconds: roundedSec, scrollDepthPct, lang })
}
