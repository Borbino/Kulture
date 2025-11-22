module.exports = {
  i18n: {
    defaultLocale: 'ko',
    locales: [
      // Major languages (Tier 1)
      'ko', 'en', 'ja', 'zh-CN', 'zh-TW', 'es', 'fr', 'de', 'ru', 'pt', 'pt-BR',
      'it', 'ar', 'hi', 'bn', 'pa', 'jv', 'vi', 'th', 'tr', 'pl', 'nl', 'id',
      
      // European languages (Tier 2)
      'uk', 'ro', 'cs', 'sv', 'el', 'hu', 'da', 'fi', 'no', 'nb', 'nn', 'he',
      'ca', 'hr', 'et', 'lv', 'lt', 'mk', 'mt', 'sk', 'sl', 'sq', 'be', 'bs',
      'bg', 'is', 'ga', 'cy', 'lb', 'gl', 'eu', 'gd', 'fo',
      
      // Asian languages (Tier 2)
      'ms', 'tl', 'my', 'km', 'lo', 'si', 'ne', 'mn', 'ta', 'te', 'mr', 'gu',
      'kn', 'ml', 'or', 'as', 'sd', 'ur', 'fa', 'ps', 'ku', 'ckb', 'ug', 'bo', 'dz',
      
      // Central Asian & Caucasus (Tier 3)
      'uz', 'kk', 'ky', 'tg', 'tk', 'az', 'hy', 'ka', 'os', 'ab',
      
      // African languages (Tier 3)
      'sw', 'am', 'ti', 'om', 'so', 'ha', 'ig', 'yo', 'zu', 'xh', 'af', 'st',
      'tn', 'ss', 've', 'ts', 'nr', 'sn', 'ny', 'rw', 'rn', 'mg', 'lg', 'ki',
      'kr', 'ff', 'wo', 'bm', 'ee', 'tw', 'ak', 'gaa',
      
      // Southeast Asian & Pacific (Tier 3)
      'ceb', 'hmn', 'haw', 'mi', 'sm', 'to', 'fj', 'ty',
      
      // South American indigenous (Tier 3)
      'ht', 'gn', 'qu', 'ay',
      
      // Additional European minority languages
      'co', 'fy', 'br', 'kw', 'gv', 'rm', 'sc', 'fur', 'lmo', 'vec', 'nap', 'scn',
      
      // Constructed & Historical languages
      'la', 'eo', 'io', 'ia', 'vo', 'sa', 'pi', 'yi',
      
      // Sign languages (representation)
      'ase', 'bfi', 'fsl',
      
      // Additional variants
      'sr', 'sr-Latn', 'zh-HK', 'yue', 'nan', 'wuu',
    ],
    localeDetection: true,
  },
  localePath: typeof window === 'undefined' 
    ? require('path').resolve('./public/locales')
    : '/locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  
  // Advanced i18n features
  react: { useSuspense: false },
  interpolation: { escapeValue: false },
  
  // Fallback language chains
  fallbackLng: {
    'zh-HK': ['zh-TW', 'zh-CN'],
    'zh-TW': ['zh-CN'],
    'pt-BR': ['pt'],
    'sr-Latn': ['sr'],
    'default': ['en']
  },
  
  // Performance optimizations
  load: 'currentOnly',
  saveMissing: false,
  updateMissing: false,
  returnEmptyString: false,
};
