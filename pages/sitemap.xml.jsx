/**
 * Dynamic Sitemap Generation
 * /sitemap.xml 경로로 동적 Sitemap 생성
 */

import { getSanityClient } from '../lib/sanityClient'

function generateSiteMap(posts, baseUrl) {
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
           xmlns:xhtml="http://www.w3.org/1999/xhtml">
     <!-- Static Pages -->
     <url>
       <loc>${baseUrl}</loc>
       <lastmod>${new Date().toISOString()}</lastmod>
       <changefreq>daily</changefreq>
       <priority>1.0</priority>
     </url>
     <url>
       <loc>${baseUrl}/trends</loc>
       <lastmod>${new Date().toISOString()}</lastmod>
       <changefreq>hourly</changefreq>
       <priority>0.9</priority>
     </url>
     <url>
       <loc>${baseUrl}/premium</loc>
       <lastmod>${new Date().toISOString()}</lastmod>
       <changefreq>weekly</changefreq>
       <priority>0.8</priority>
     </url>
     <url>
       <loc>${baseUrl}/leaderboard</loc>
       <lastmod>${new Date().toISOString()}</lastmod>
       <changefreq>daily</changefreq>
       <priority>0.8</priority>
     </url>
     <url>
       <loc>${baseUrl}/communities</loc>
       <lastmod>${new Date().toISOString()}</lastmod>
       <changefreq>daily</changefreq>
       <priority>0.8</priority>
     </url>
     <url>
       <loc>${baseUrl}/admin/monitoring</loc>
       <lastmod>${new Date().toISOString()}</lastmod>
       <changefreq>daily</changefreq>
       <priority>0.7</priority>
     </url>
     <url>
       <loc>${baseUrl}/admin/settings</loc>
       <lastmod>${new Date().toISOString()}</lastmod>
       <changefreq>weekly</changefreq>
       <priority>0.5</priority>
     </url>
     <url>
       <loc>${baseUrl}/admin/content-review</loc>
       <lastmod>${new Date().toISOString()}</lastmod>
       <changefreq>daily</changefreq>
       <priority>0.6</priority>
     </url>

     <!-- Dynamic Post Pages -->
     ${posts
       .map(post => {
         return `
       <url>
         <loc>${baseUrl}/posts/${post.slug}</loc>
         <lastmod>${post._updatedAt || post.publishedAt}</lastmod>
         <changefreq>weekly</changefreq>
         <priority>0.8</priority>
       </url>
     `
       })
       .join('')}
   </urlset>
 `
}

export async function getServerSideProps({ res }) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
    : 'https://kulture.app'

  try {
    const client = getSanityClient()

    // Sanity에서 모든 게시물 slug 가져오기
    const posts = await client.fetch(`
      *[_type == "post" && !(_id in path("drafts.**"))] | order(publishedAt desc) {
        "slug": slug.current,
        publishedAt,
        _updatedAt
      }
    `)

    // Sitemap 생성
    const sitemap = generateSiteMap(posts, baseUrl)

    res.setHeader('Content-Type', 'text/xml')
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate')
    res.write(sitemap)
    res.end()

    return {
      props: {},
    }
  } catch (error) {
    console.error('[Sitemap] Generation failed:', error.message)

    // 에러 발생 시 최소한의 Sitemap 반환
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
     <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
       <url>
         <loc>https://yoursite.com</loc>
         <lastmod>${new Date().toISOString()}</lastmod>
         <priority>1.0</priority>
       </url>
     </urlset>`

    res.setHeader('Content-Type', 'text/xml')
    res.write(fallbackSitemap)
    res.end()

    return {
      props: {},
    }
  }
}

export default function Sitemap() {
  // getServerSideProps가 모든 처리를 함
  return null
}
