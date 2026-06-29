import { NextResponse } from 'next/server';

/**
 * Kulture - 다국어 라우팅 및 봇 감지 프록시
 * V15.1 제 2장 정책 1: 8개 국어 하이브리드 SEO 번역 및 라우팅 최적화
 * Next.js 16: middleware.js 규약 → proxy.js 로 마이그레이션
 */

// 지원 대상 8개 핵심 언어 (V15.1 제 2장 정책 1 — zh는 zh-CN 단일 처리)
const SUPPORTED_LOCALES = ['en', 'es', 'zh-CN', 'ja', 'ko', 'ar', 'fr', 'de'];
const DEFAULT_LOCALE = 'ko';
const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';

// 검색 엔진 봇 User-Agent 패턴
const BOT_USER_AGENT_PATTERN =
  /googlebot|bingbot|yandexbot|duckduckbot|slurp|baiduspider|facebookexternalhit|twitterbot|linkedinbot|whatsapp|applebot|semrushbot|ahrefsbot|mj12bot/i;

/**
 * Accept-Language 헤더에서 최적 언어를 탐색한다.
 * @param {string} acceptLanguage - HTTP Accept-Language 헤더 값
 * @returns {string} 매칭된 locale 또는 DEFAULT_LOCALE
 */
function detectLocaleFromHeader(acceptLanguage) {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  // q-factor 가중치 파싱 (예: "zh-CN,zh;q=0.9,en;q=0.8")
  const preferredLangs = acceptLanguage
    .split(',')
    .map((entry) => {
      const [lang, q] = entry.trim().split(';q=');
      return { lang: lang.trim(), q: q ? parseFloat(q) : 1.0 };
    })
    .sort((a, b) => b.q - a.q)
    .map((entry) => entry.lang);

  for (const lang of preferredLangs) {
    // 완전 일치 우선 (예: zh-CN, zh-TW)
    const exactMatch = SUPPORTED_LOCALES.find(
      (locale) => locale.toLowerCase() === lang.toLowerCase()
    );
    if (exactMatch) return exactMatch;

    // 기본 언어 코드 부분 일치 (예: "zh" → "zh-CN" 우선)
    const baseLang = lang.split('-')[0].toLowerCase();
    const partialMatch = SUPPORTED_LOCALES.find(
      (locale) => locale.split('-')[0].toLowerCase() === baseLang
    );
    if (partialMatch) return partialMatch;
  }

  return DEFAULT_LOCALE;
}

/**
 * 요청 URL의 경로에서 현재 locale prefix를 추출한다.
 * @param {string} pathname - 요청 경로
 * @returns {{ locale: string|null, pathWithoutLocale: string }}
 */
function extractLocaleFromPath(pathname) {
  for (const locale of SUPPORTED_LOCALES) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return {
        locale,
        pathWithoutLocale: pathname.slice(locale.length + 1) || '/',
      };
    }
  }
  return { locale: null, pathWithoutLocale: pathname };
}

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';

  // ── 봇 감지 ──────────────────────────────────────────────────────────────
  const isBot = BOT_USER_AGENT_PATTERN.test(userAgent);

  if (isBot) {
    // 봇인 경우: locale prefix가 없으면 기본 locale(ko) 경로로 rewrite하여
    // SSR 캐시 히트율을 극대화하고 크롤링 안정성을 보장한다.
    const { locale } = extractLocaleFromPath(pathname);
    if (!locale) {
      const botUrl = request.nextUrl.clone();
      botUrl.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`;
      const response = NextResponse.rewrite(botUrl);
      // 봇 응답에는 캐시를 활성화한다.
      response.headers.set(
        'Cache-Control',
        'public, s-maxage=3600, stale-while-revalidate=86400'
      );
      return response;
    }
    // 이미 locale prefix가 있는 봇 요청은 그대로 통과
    return NextResponse.next();
  }

  // ── 일반 사용자 locale 감지 및 리다이렉트 ───────────────────────────────
  const { locale: pathLocale, pathWithoutLocale } = extractLocaleFromPath(pathname);

  // 이미 유효한 locale prefix가 있는 경우 통과
  if (pathLocale) {
    // 쿠키에 현재 locale을 동기화한다.
    const response = NextResponse.next();
    if (request.cookies.get(LOCALE_COOKIE_NAME)?.value !== pathLocale) {
      response.cookies.set(LOCALE_COOKIE_NAME, pathLocale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1년
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    }
    return response;
  }

  // locale prefix가 없는 경우: 쿠키 → Accept-Language 순으로 locale을 결정한다.
  const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  const resolvedLocale =
    (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale) ? cookieLocale : null) ||
    detectLocaleFromHeader(request.headers.get('accept-language') || '') ||
    DEFAULT_LOCALE;

  // 결정된 locale로 리다이렉트
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = `/${resolvedLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;

  const response = NextResponse.redirect(redirectUrl, { status: 307 });
  // 리다이렉트 응답에 locale 쿠키를 설정한다.
  response.cookies.set(LOCALE_COOKIE_NAME, resolvedLocale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}

export const config = {
  matcher: [
    /*
     * 아래 경로를 제외한 모든 요청에 미들웨어를 적용한다:
     *   - /api/*          : API 라우트
     *   - /_next/static/* : Next.js 정적 빌드 에셋
     *   - /_next/image/*  : Next.js 이미지 최적화 라우트
     *   - /favicon.ico    : 파비콘
     *   - /icons/*        : PWA 아이콘
     *   - /locales/*      : i18n 번역 JSON 파일
     *   - /images/*       : 공개 이미지 에셋
     *   - *.{extension}   : 확장자가 있는 공개 정적 파일
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|icons|locales|images|[^/]+\\.[^/]+$).*)',
  ],
};
