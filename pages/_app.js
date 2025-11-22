import '../styles/globals.css';
import { appWithTranslation } from 'next-i18next';
import { useEffect } from 'react';
import { initializeRedis } from '../lib/translationCache';
import ErrorBoundary from '../components/ErrorBoundary';
import logger from '../lib/logger';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Redis 캐시 초기화 (선택적)
    initializeRedis().catch(err => {
      logger.warn('Redis initialization failed, using memory cache:', err);
    });

    // 사용자 선호 언어 로드
    const preferredLanguage = localStorage.getItem('preferredLanguage');
    if (preferredLanguage && window.location.pathname.indexOf(`/${preferredLanguage}`) !== 0) {
      // 선호 언어가 있으면 자동으로 리다이렉트할 수 있음 (선택사항)
      // router.push(router.pathname, router.asPath, { locale: preferredLanguage });
    }
  }, []);

  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}

// next-i18next로 앱 래핑
export default appWithTranslation(MyApp);
