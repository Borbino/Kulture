module.exports = {
  i18n: {
    defaultLocale: 'ko',
    locales: [
      // Tier 1: 주요 언어 (사용자 10억+ 또는 경제적 중요성)
      'ko', 'en', 'zh-CN', 'zh-TW', 'ja', 'es', 'hi', 'ar', 'pt', 'ru',
      'fr', 'de', 'id', 'bn', 'tr',
      
      // Tier 2: 유럽 언어
      'it', 'pl', 'uk', 'nl', 'ro', 'cs', 'el', 'sv', 'hu', 'pt-BR',
      
      // Tier 3: 아시아-태평양 주요 언어
      'vi', 'th', 'my', 'tl', 'ms',
      
      // Tier 4: 기타 중요 언어
      'fa', 'he', 'sw', 'ur', 'pa',
    ],
    localeDetection: false, // 명시적으로 false로 설정
  },
  localePath: typeof window === 'undefined' 
    ? require('path').resolve('./public/locales')
    : '/locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  
  // 고품질 번역을 위한 설정
  defaultNS: 'common',
  fallbackLng: 'ko',
  interpolation: {
    escapeValue: false, // React는 기본적으로 XSS 보호
  },
  react: {
    useSuspense: false, // SSR 호환성
  },
};
