/**
 * SEO Sitemap Generator
 * Generates dynamic sitemap.xml with all languages
 */

import { SUPPORTED_LANGUAGES } from '../../../lib/aiTranslation.js';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kulture.com';

/**
 * 정적 페이지 목록
 */
const STATIC_PAGES = [
  '',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/vip',
  '/trends',
  '/boards',
];

/**
 * Sitemap XML 생성
 */
function generateSitemapXML() {
  const languages = Object.keys(SUPPORTED_LANGUAGES);
  const now = new Date().toISOString();
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

  // 각 페이지와 언어 조합 생성
  STATIC_PAGES.forEach((page) => {
    languages.forEach((lang) => {
      const url = `${SITE_URL}/${lang}${page}`;
      const priority = page === '' ? '1.0' : '0.8';
      const changefreq = page === '' ? 'daily' : 'weekly';

      xml += '  <url>\n';
      xml += `    <loc>${url}</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += `    <changefreq>${changefreq}</changefreq>\n`;
      xml += `    <priority>${priority}</priority>\n`;

      // hreflang 태그 추가
      languages.forEach((altLang) => {
        const altUrl = `${SITE_URL}/${altLang}${page}`;
        xml += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${altUrl}" />\n`;
      });

      xml += '  </url>\n';
    });
  });

  xml += '</urlset>';
  return xml;
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sitemap = generateSitemapXML();
    
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate');
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
}
