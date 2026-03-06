import '../styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import { appWithTranslation } from 'next-i18next';
import { useEffect } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import ErrorBoundary from '../components/ErrorBoundary';
import { getAdSenseConfig } from '../lib/revenueEngine';

const adSenseConfig = getAdSenseConfig();

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  useEffect(() => {
    // 사용자 선호 언어 로드
    const preferredLanguage = localStorage.getItem('preferredLanguage');
    if (preferredLanguage && window.location.pathname.indexOf(`/${preferredLanguage}`) !== 0) {
      // 선호 언어가 있으면 자동으로 리다이렉트할 수 있음 (선택사항)
      // router.push(router.pathname, router.asPath, { locale: preferredLanguage });
    }
  }, []);

  return (
    <SessionProvider session={session}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Google AdSense AutoAds — 게시자 ID가 설정된 경우에만 활성화 */}
      {adSenseConfig.publisherId && (
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseConfig.publisherId}`}
          crossOrigin="anonymous"
          strategy="lazyOnload"
          onError={(e) => console.warn('[AdSense] Script load failed:', e)}
        />
      )}

      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>
    </SessionProvider>
  );
}

// next-i18next로 앱 래핑
export default appWithTranslation(MyApp);
