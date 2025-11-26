import '../styles/globals.css';
import { appWithTranslation } from 'next-i18next';
import { useEffect } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
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
