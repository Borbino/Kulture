/**
 * Revenue Maximization Engine — Kulture v14.0
 *
 * [목적] K-Culture 플랫폼 수익 극대화 전략 자동화
 * [원칙 9] 무료 도구 최대 활용, 유료 전환 시 ROI 우선 고려
 *
 * [수익 채널]
 *  1. Google AdSense — 디스플레이 광고 (RPM $2-8 K-Culture 타겟)
 *  2. Coupang Partners — 한국 K-상품 제휴 (5-12% 커미션)
 *  3. Amazon Associates — 글로벌 K-상품 제휴 (3-10% 커미션)
 *  4. 프리미엄 멤버십 — VIP 조기 콘텐츠 접근 ($4.99/월)
 *  5. 스폰서 콘텐츠 — 네이티브 광고 (브랜드당 $500-5,000/월)
 *  6. 이메일 뉴스레터 — 구독자 수익화 ($1-3 RPM)
 *  7. SEO 키워드 최적화 — 고RPM 키워드 콘텐츠 우선 생성
 *  8. 데이터 라이선싱 — K-Culture 트렌드 데이터 B2B 판매
 */

import logger from './logger.js';

// ========== 수익 채널 설정 ==========

export const REVENUE_CONFIG = {
  adsense: {
    publisherId: process.env.ADSENSE_PUBLISHER_ID || '',
    // K-Culture 카테고리 예상 RPM (달러/1000 조회)
    estimatedRPM: {
      'K-Pop':    8.5,
      'K-Drama':  6.0,
      'K-Beauty': 9.2,
      'K-Food':   4.5,
      'general':  3.0,
    },
    // 광고 슬롯 위치 (한 페이지 최대 3개 — UX 보호)
    slots: {
      header:    process.env.ADSENSE_SLOT_HEADER    || '',
      inContent: process.env.ADSENSE_SLOT_INCONTENT || '',
      footer:    process.env.ADSENSE_SLOT_FOOTER    || '',
    },
  },

  coupang: {
    trackingCode: process.env.COUPANG_TRACKING_CODE || '',
    affiliateId:  process.env.COUPANG_AFFILIATE_ID  || '',
    // 카테고리별 커미션율
    commissionRates: {
      'K-Beauty':   0.12,
      'K-Pop goods': 0.10,
      'K-Food':     0.08,
      'K-Fashion':  0.09,
      'electronics': 0.05,
      'default':    0.05,
    },
    // K-상품 검색 URL 베이스
    searchBase: 'https://link.coupang.com/re/AFFILIATES?lptag=AF',
  },

  amazon: {
    trackingId: process.env.AMAZON_TRACKING_ID   || '',
    // K-상품 관련 태그
    defaultTag: process.env.AMAZON_DEFAULT_TAG    || 'kulture-20',
    commissionRates: {
      'Beauty':       0.10,
      'Music':        0.05,
      'Electronics':  0.03,
      'default':      0.04,
    },
    searchBase: 'https://www.amazon.com/s?k=',
  },

  premium: {
    monthlyPriceUSD:  4.99,
    yearlyPriceUSD:   39.99,
    features: [
      '새 콘텐츠 1시간 조기 열람',
      '광고 제거',
      'VIP 트렌드 분석 리포트',
      '독점 K-Culture 뉴스레터',
      '커뮤니티 배지 및 포인트 배수 2×',
    ],
  },

  newsletter: {
    estimatedRPM: 2.0, // 달러/1000 구독자/발송
    optimalSendDays: ['Tuesday', 'Wednesday', 'Thursday'],
    optimalSendHour: 10, // 09:00-11:00 KST (최고 개봉률)
  },
};

// ========== 고RPM SEO 키워드 목록 ==========

/**
 * K-Culture 카테고리별 광고 RPM이 높은 키워드 목록
 * 이 키워드 관련 콘텐츠를 우선 생성하면 광고 수익 극대화 가능
 */
export const HIGH_RPM_KEYWORDS = {
  'K-Beauty': [
    'Korean skincare routine', 'K-beauty products', 'glass skin',
    'Korean sunscreen', 'snail mucin', 'essence toner', 'sheet mask',
    'Korean makeup', 'cushion foundation', 'BB cream', 'CC cream',
    'retinol Korean', 'niacinamide Korean', 'hyaluronic acid',
  ],
  'K-Pop': [
    'BTS merchandise', 'BLACKPINK concert tickets', 'K-pop album',
    'light stick', 'photocard', 'fansign', 'K-pop merch',
    'K-pop streaming', 'weverse', 'Melon subscription',
  ],
  'K-Drama': [
    'Netflix Korean drama', 'Korean drama subscription',
    'Korean drama OST', 'K-drama hoodie', 'filming location tour',
    'Visit Korea', 'Seoul travel', 'Korean food tour',
  ],
  'K-Food': [
    'Korean ramen buy', 'buldak noodles', 'Korean snacks',
    'Korean grocery', 'kimchi buy', 'Korean BBQ supplies',
    'Korean cooking', 'instant tteokbokki',
  ],
};

// ========== 수익화 함수 ==========

/**
 * 콘텐츠 주제의 예상 광고 수익 계산
 * @param {string} topic - 콘텐츠 주제
 * @param {number} estimatedViews - 예상 월 조회수
 * @returns {{ category, estimatedRPM, monthlyRevenue, highRPMKeywords }}
 */
export function estimateContentRevenue(topic, estimatedViews = 10000) {
  const topicLower = topic.toLowerCase();
  let category = 'general';
  let estimatedRPM = REVENUE_CONFIG.adsense.estimatedRPM.general;

  // 카테고리 자동 분류
  if (topicLower.includes('beauty') || topicLower.includes('skincare') || topicLower.includes('makeup') || topicLower.includes('뷰티')) {
    category = 'K-Beauty';
    estimatedRPM = REVENUE_CONFIG.adsense.estimatedRPM['K-Beauty'];
  } else if (topicLower.includes('drama') || topicLower.includes('드라마') || topicLower.includes('series') || topicLower.includes('netflix')) {
    category = 'K-Drama';
    estimatedRPM = REVENUE_CONFIG.adsense.estimatedRPM['K-Drama'];
  } else if (topicLower.includes('kpop') || topicLower.includes('k-pop') || topicLower.includes('idol') || topicLower.includes('케이팝')) {
    category = 'K-Pop';
    estimatedRPM = REVENUE_CONFIG.adsense.estimatedRPM['K-Pop'];
  } else if (topicLower.includes('food') || topicLower.includes('음식') || topicLower.includes('recipe') || topicLower.includes('ramen')) {
    category = 'K-Food';
    estimatedRPM = REVENUE_CONFIG.adsense.estimatedRPM['K-Food'];
  }

  const monthlyRevenue = (estimatedViews / 1000) * estimatedRPM;
  const highRPMKeywords = HIGH_RPM_KEYWORDS[category] || [];

  return {
    category,
    estimatedRPM,
    monthlyRevenue: parseFloat(monthlyRevenue.toFixed(2)),
    estimatedViews,
    highRPMKeywords: highRPMKeywords.slice(0, 5),
    recommendation: monthlyRevenue < 5
      ? '키워드 보강 권장: 고RPM 키워드 1-2개 제목/본문에 추가'
      : '수익 최적화 양호',
  };
}

/**
 * Coupang 제휴 링크 생성
 * @param {string} keyword - 상품 검색 키워드
 * @param {string} category - 상품 카테고리
 * @returns {string} 제휴 링크 URL
 */
export function buildCoupangAffiliateLink(keyword, category = 'default') {
  const trackingCode = REVENUE_CONFIG.coupang.trackingCode;
  if (!trackingCode) {
    logger.warn('[revenue]', 'Coupang tracking code not configured');
    return `https://www.coupang.com/np/search?q=${encodeURIComponent(keyword)}`;
  }

  const commissionRate = REVENUE_CONFIG.coupang.commissionRates[category]
    || REVENUE_CONFIG.coupang.commissionRates.default;

  logger.info('[revenue]', `Coupang affiliate link: "${keyword}" (${category}, ${(commissionRate * 100).toFixed(0)}% commission)`);

  return `https://link.coupang.com/re/AFFILIATES?lptag=AF${trackingCode}&pageKey=${encodeURIComponent(keyword)}&trackerCode=${trackingCode}`;
}

/**
 * Amazon 제휴 링크 생성 (글로벌 K-상품)
 * @param {string} keyword
 * @param {string} category
 * @returns {string}
 */
export function buildAmazonAffiliateLink(keyword, category = 'default') {
  const tag = REVENUE_CONFIG.amazon.trackingId || REVENUE_CONFIG.amazon.defaultTag;
  const searchQuery = encodeURIComponent(`Korean ${keyword}`);

  return `${REVENUE_CONFIG.amazon.searchBase}${searchQuery}&tag=${tag}`;
}

/**
 * 콘텐츠에 적합한 제휴 링크 조합 생성
 * @param {string} topic - 콘텐츠 주제
 * @returns {{ coupang: string|null, amazon: string|null, category: string }}
 */
export function getAffiliateLinksForContent(topic) {
  const topicLower = topic.toLowerCase();
  let category = 'default';
  let searchKeyword = topic;
  let coupangCategory = 'default';
  let amazonCategory = 'default';

  if (topicLower.includes('beauty') || topicLower.includes('skincare') || topicLower.includes('뷰티')) {
    category = 'K-Beauty';
    coupangCategory = 'K-Beauty';
    amazonCategory = 'Beauty';
    searchKeyword = 'Korean skincare';
  } else if (topicLower.includes('kpop') || topicLower.includes('k-pop') || topicLower.includes('idol')) {
    category = 'K-Pop';
    coupangCategory = 'K-Pop goods';
    amazonCategory = 'Music';
    searchKeyword = topic.split(' ').slice(0, 3).join(' ') + ' merchandise';
  } else if (topicLower.includes('food') || topicLower.includes('음식') || topicLower.includes('ramen')) {
    category = 'K-Food';
    coupangCategory = 'K-Food';
    amazonCategory = 'Beauty';
    searchKeyword = 'Korean food';
  }

  const hasCoupang = !!REVENUE_CONFIG.coupang.trackingCode;
  const hasAmazon = !!REVENUE_CONFIG.amazon.trackingId;

  return {
    category,
    coupang: hasCoupang ? buildCoupangAffiliateLink(searchKeyword, coupangCategory) : null,
    amazon: hasAmazon ? buildAmazonAffiliateLink(searchKeyword, amazonCategory) : null,
    disclosure: '이 링크를 통해 구매하시면 Kulture에 소정의 제휴 수수료가 지급됩니다.',
  };
}

/**
 * 콘텐츠 수익성 우선순위 점수 계산
 * AI 콘텐츠 생성 순서 결정에 사용
 *
 * @param {object} item - { title, source, velocityScore }
 * @returns {number} 수익 가중치 점수
 */
export function calculateRevenuePriority(item) {
  const revenue = estimateContentRevenue(item.title, 5000);
  const baseScore = item.velocityScore || item.priorityScore || 1;

  // RPM 가중치: K-Beauty (9.2) → 최고, general (3.0) → 최저
  const rpmMultiplier = revenue.estimatedRPM / 3.0;

  // 소스 다양성 보너스 (여러 플랫폼 언급 = 더 넓은 독자)
  const sourceBonus = (item.sourceCount || 1) * 2;

  return Math.round(baseScore * rpmMultiplier + sourceBonus);
}

/**
 * AdSense 자동 광고 설정 메타데이터 반환
 * _app.js 또는 _document.jsx에서 활용
 * @returns {object}
 */
export function getAdSenseConfig() {
  const publisherId = REVENUE_CONFIG.adsense.publisherId;

  if (!publisherId) {
    return { enabled: false, reason: 'ADSENSE_PUBLISHER_ID not configured' };
  }

  return {
    enabled: true,
    publisherId,
    scriptSrc: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`,
    slots: REVENUE_CONFIG.adsense.slots,
    autoAdsEnabled: true,
  };
}

/**
 * 뉴스레터 수익 예측
 * @param {number} subscriberCount
 * @param {number} openRate - 개봉률 (0-1)
 * @returns {{ monthlyRevenue, yearlyRevenue, perSendRevenue }}
 */
export function estimateNewsletterRevenue(subscriberCount, openRate = 0.25) {
  const activeReaders = subscriberCount * openRate;
  const sendsPerMonth = 4; // 주 1회 발송
  const rpmPerSend = REVENUE_CONFIG.newsletter.estimatedRPM;

  const perSendRevenue = (activeReaders / 1000) * rpmPerSend;
  const monthlyRevenue = perSendRevenue * sendsPerMonth;

  return {
    subscriberCount,
    activeReaders: Math.round(activeReaders),
    perSendRevenue: parseFloat(perSendRevenue.toFixed(2)),
    monthlyRevenue: parseFloat(monthlyRevenue.toFixed(2)),
    yearlyRevenue: parseFloat((monthlyRevenue * 12).toFixed(2)),
    breakEvenSubscribers: Math.ceil(100 / rpmPerSend * 1000), // $100/월 손익분기
  };
}

/**
 * 월간 수익 예측 종합 리포트
 * @param {{ pageViews, subscribers, premiumUsers }} metrics
 * @returns {object}
 */
export function generateRevenueReport(metrics = {}) {
  const {
    pageViews = 0,
    subscribers = 0,
    premiumUsers = 0,
    avgRPM = REVENUE_CONFIG.adsense.estimatedRPM.general,
  } = metrics;

  const adRevenue = (pageViews / 1000) * avgRPM;
  const premiumRevenue = premiumUsers * REVENUE_CONFIG.premium.monthlyPriceUSD;
  const newsletterRevenue = estimateNewsletterRevenue(subscribers).monthlyRevenue;
  // 제휴 수익: 조회수의 0.5%가 클릭, 그중 2%가 구매, 평균 $10 상품, 7% 커미션
  const affiliateRevenue = pageViews * 0.005 * 0.02 * 10 * 0.07;
  const totalRevenue = adRevenue + premiumRevenue + newsletterRevenue + affiliateRevenue;

  return {
    period: new Date().toISOString().slice(0, 7),
    metrics,
    revenue: {
      ads: parseFloat(adRevenue.toFixed(2)),
      premium: parseFloat(premiumRevenue.toFixed(2)),
      newsletter: parseFloat(newsletterRevenue.toFixed(2)),
      affiliate: parseFloat(affiliateRevenue.toFixed(2)),
      total: parseFloat(totalRevenue.toFixed(2)),
    },
    topOpportunities: [
      `K-Beauty 콘텐츠 비율 증가 시 RPM ${REVENUE_CONFIG.adsense.estimatedRPM['K-Beauty']} 달성 가능`,
      `뉴스레터 구독자 ${estimateNewsletterRevenue(subscribers).breakEvenSubscribers.toLocaleString()}명 달성 시 월 $100 수익`,
      `프리미엄 멤버십 100명 → 월 $${(100 * REVENUE_CONFIG.premium.monthlyPriceUSD).toFixed(0)} 고정 수입`,
      'Coupang Partners + Amazon Associates 동시 활성화 시 제휴 수익 2-3배',
    ],
  };
}
