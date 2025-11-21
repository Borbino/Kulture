module.exports = {
  i18n: {
    defaultLocale: 'ko',
    locales: [
      'ko', 'en', 'ja', 'zh-CN', 'zh-TW', 'es', 'fr', 'de', 'ru', 
      'pt', 'ar', 'hi', 'bn', 'id', 'vi', 'th', 'tr', 'it', 'pl', 'nl'
    ],
    localeDetection: true,
  },
  localePath: typeof window === 'undefined' 
    ? require('path').resolve('./public/locales')
    : '/locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};
