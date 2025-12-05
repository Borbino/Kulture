import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta charSet="utf-8" />
        
        {/* 배달의 민족 주아체 - 한글 */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          href="https://cdn.jsdelivr.net/gh/mebsout/Jua@master/Jua.css"
          rel="stylesheet"
        />
        
        {/* Pretendard - 한글 & 다국어 */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
          rel="stylesheet"
        />
        
        <style>{`
          :root {
            --font-ko-heading: 'Jua', sans-serif;
            --font-ko-body: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            --font-global: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          
          * {
            font-family: var(--font-global);
          }
          
          h1, h2, h3, h4, h5, h6 {
            font-family: var(--font-ko-heading);
          }
          
          body {
            font-family: var(--font-ko-body);
          }
        `}</style>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
