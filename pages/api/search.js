/**
 * [설명] 검색 API 엔드포인트
 * [목적] Sanity CMS 콘텐츠 검색 기능
 */

import { getSanityClient } from '../../lib/sanityClient'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { q, type = 'all', limit = 20, offset = 0 } = req.query

  if (!q || q.trim().length === 0) {
    return res.status(400).json({ error: 'Search query is required' })
  }

  try {
    const client = getSanityClient()
    const searchQuery = q.trim()

    // 검색 타입에 따른 쿼리 빌드
    let groqQuery = ''
    const params = { searchQuery, limit: parseInt(limit), offset: parseInt(offset) }

    switch (type) {
      case 'posts':
        groqQuery = '*[_type == "post" && (title match $searchQuery + "*" || excerpt match $searchQuery + "*" || pt::text(body) match $searchQuery + "*")] | order(_createdAt desc) [$offset...$offset + $limit] { _id, title, slug, excerpt, publishedAt, "author": author->name, "category": categories[0]->title, mainImage, views, likes }'
        break

      case 'trends':
        groqQuery = '*[_type == "trendTracking" && (keyword match $searchQuery + "*" || description match $searchQuery + "*")] | order(timestamp desc) [$offset...$offset + $limit] { _id, keyword, description, trendScore, timestamp, source }'
        break

      case 'vips':
        groqQuery = '*[_type == "vipMonitoring" && (name match $searchQuery + "*" || platformHandle match $searchQuery + "*")] | order(lastActivityDate desc) [$offset...$offset + $limit] { _id, name, platform, platformHandle, category, lastActivityDate, activityCount }'
        break

      case 'all':
      default: {
        // 모든 타입 검색
        const posts = await client.fetch(
          '*[_type == "post" && (title match $searchQuery + "*" || excerpt match $searchQuery + "*")] | order(_createdAt desc) [0...5] { _id, _type, title, slug, excerpt, publishedAt, "author": author->name, "category": categories[0]->title }',
          params
        )

        const trends = await client.fetch(
          '*[_type == "trendTracking" && keyword match $searchQuery + "*"] | order(timestamp desc) [0...5] { _id, _type, keyword, trendScore, timestamp }',
          params
        )

        const vips = await client.fetch(
          '*[_type == "vipMonitoring" && name match $searchQuery + "*"] | order(lastActivityDate desc) [0...5] { _id, _type, name, platform, category }',
          params
        )

        return res.status(200).json({
          query: searchQuery,
          results: {
            posts,
            trends,
            vips,
          },
          total: posts.length + trends.length + vips.length,
        })
      }
    }

    // 단일 타입 검색 결과
    const results = await client.fetch(groqQuery, params)

    return res.status(200).json({
      query: searchQuery,
      type,
      results,
      total: results.length,
      hasMore: results.length === parseInt(limit),
    })
  } catch (error) {
    console.error('Search error:', error)
    return res.status(500).json({
      error: 'Search failed',
      message: error.message,
    })
  }
}
