/**
 * Google Analytics 4 Integration
 * 페이지뷰 및 커스텀 이벤트 추적
 */

// GA4 Measurement ID
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

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
