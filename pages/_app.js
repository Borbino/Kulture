import '../styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import { appWithTranslation } from 'next-i18next';
import { useEffect } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import ErrorBoundary from '../components/ErrorBoundary.js';
import BottomNavigation from '../components/BottomNavigation.js';
import Layout from '../components/Layout.jsx';
import { getAdSenseConfig } from '../lib/revenueEngine.js';
import { logger } from '../lib/logger.js';

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
        {/* 모바일 최적화 뷰포트: viewport-fit=cover 로 노치/홈인디케이터 safe area 활성화 */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </Head>

      {/* Google AdSense AutoAds — 게시자 ID가 설정된 경우에만 활성화 */}
      {adSenseConfig.publisherId && (
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseConfig.publisherId}`}
          crossOrigin="anonymous"
          strategy="lazyOnload"
          onError={(e) => logger.warn('[AdSense] Script load failed:', e)}
        />
      )}

      <ErrorBoundary>
        <Layout>
          <Component {...pageProps} />
        </Layout>
        {/* 모바일 하단 탭바 — 모든 페이지 공통 */}
        <BottomNavigation />
      </ErrorBoundary>
    </SessionProvider>
  );
}

// next-i18next로 앱 래핑
export default appWithTranslation(MyApp);
