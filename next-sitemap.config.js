/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://kulture.net',
  generateRobotsTxt: true,
  exclude: ['/admin/*', '/api/*'],
  // 200개국 이상의 다국어 URL 구조를 자동으로 반영 (next-sitemap이 i18n 설정 감지 시 자동 생성)
  // 예: https://kulture.net/ko/post/123, https://kulture.net/es/post/123
  robotsTxtOptions: {
    additionalSitemaps: [
      // `${process.env.NEXT_PUBLIC_SITE_URL || 'https://kulture.net'}/server-sitemap.xml`, // 동적 경로 처리용 (필요 시 주석 해제)
    ],
  },
}
