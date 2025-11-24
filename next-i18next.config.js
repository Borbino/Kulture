module.exports = {
  i18n: {
    defaultLocale: 'ko',
    locales: [
      // 주요 언어 (사용자 10억+ 또는 경제적 중요성)
      'ko', 'en', 'zh-CN', 'zh-TW', 'ja', 'es', 'hi', 'ar', 'pt', 'ru',
      'fr', 'de', 'id', 'bn', 'ur', 'pa', 'jv', 'mr', 'te', 'tr',
      
      // 유럽 언어 (EU + 주변국)
      'it', 'pl', 'uk', 'nl', 'ro', 'cs', 'el', 'sv', 'hu', 'pt-BR',
      'ca', 'sr', 'hr', 'bg', 'sk', 'da', 'fi', 'no', 'lt', 'sl',
      'lv', 'et', 'ga', 'mt', 'cy', 'is', 'sq', 'mk', 'bs',
      
      // 아시아-태평양 언어
      'vi', 'th', 'my', 'km', 'lo', 'tl', 'ms', 'si', 'ne', 'ta',
      'kn', 'ml', 'gu', 'or', 'as', 'sd', 'ks', 'dz', 'bo', 'mn',
      
      // 중동 및 중앙아시아 언어
      'fa', 'he', 'az', 'uz', 'kk', 'ky', 'tk', 'tg', 'ps', 'ku',
      
      // 아프리카 언어
      'sw', 'ha', 'yo', 'ig', 'am', 'om', 'so', 'zu', 'xh', 'st',
      'tn', 'rw', 'ny', 'mg', 'sn', 'ti', 'lg',
      
      // 남미 및 카리브 언어
      'qu', 'ay', 'gn', 'ht',
      
      // 소수/지역 언어 (문화적 중요성)
      'eu', 'gl', 'eo', 'la', 'yi', 'sa', 'fo', 'kl', 'gd', 'br',
    ],
    localeDetection: true,
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
