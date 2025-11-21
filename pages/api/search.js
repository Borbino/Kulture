/**
 * [설명] 검색 API 엔드포인트 (고도화)
 * [목적] Sanity CMS 콘텐츠 검색 기능 + 게시판, 댓글, 유저 검색
 */

import { getSanityClient } from '../../lib/sanityClient'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    q,
    type = 'all',
    board,
    category,
    tag,
    author,
    dateFrom,
    dateTo,
    sort = 'relevance',
    limit = 20,
    offset = 0,
  } = req.query

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' })
  }

  try {
    const client = getSanityClient()
    const searchQuery = q.trim()
    const params = { searchQuery, limit: parseInt(limit), offset: parseInt(offset) }

    // 추가 필터 파라미터
    if (board) params.boardId = board
    if (category) params.categoryId = category
    if (tag) params.tag = tag
    if (author) params.authorId = author
    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo

    let results = {}

    // 게시글 검색
    if (type === 'all' || type === 'posts') {
      let postQuery = `*[_type == "post" && (title match $searchQuery + "*" || pt::text(body) match $searchQuery + "*")`
      
      if (board) postQuery += ` && board._ref == $boardId`
      if (category) postQuery += ` && $categoryId in categories[]._ref`
      if (tag) postQuery += ` && $tag in tags[]`
      if (author) postQuery += ` && (author._ref == $authorId || user._ref == $authorId)`
      if (dateFrom) postQuery += ` && publishedAt >= $dateFrom`
      if (dateTo) postQuery += ` && publishedAt <= $dateTo`
      
      postQuery += ` && status == "approved" && isHidden != true]`
      
      // 정렬
      if (sort === 'date') {
        postQuery += ` | order(publishedAt desc)`
      } else if (sort === 'views') {
        postQuery += ` | order(views desc)`
      } else if (sort === 'likes') {
        postQuery += ` | order(likes desc)`
      } else {
        postQuery += ` | order(_createdAt desc)`
      }
      
      postQuery += ` [$offset...$offset + $limit] {
        _id,
        title,
        slug,
        author->{name, slug},
        user->{name, level},
        board->{name, slug},
        mainImage,
        tags,
        publishedAt,
        views,
        likes,
        commentCount,
        "excerpt": pt::text(body)[0...200]
      }`
      
      results.posts = await client.fetch(postQuery, params)
    }

    // 댓글 검색
    if (type === 'all' || type === 'comments') {
      const commentQuery = `*[_type == "comment" && content match $searchQuery + "*" && isApproved == true && isHidden != true] | order(_createdAt desc) [0...20] {
        _id,
        content,
        user->{name, level},
        post->{_id, title, slug},
        createdAt,
        likes
      }`
      
      results.comments = await client.fetch(commentQuery, params)
    }

    // 유저 검색
    if (type === 'all' || type === 'users') {
      const userQuery = `*[_type == "user" && (name match $searchQuery + "*" || bio match $searchQuery + "*") && isBanned != true] | order(level desc) [0...20] {
        _id,
        name,
        image,
        bio,
        level,
        points,
        badges[]->{name, icon},
        postCount,
        commentCount
      }`
      
      results.users = await client.fetch(userQuery, params)
    }

    // 게시판 검색
    if (type === 'all' || type === 'boards') {
      const boardQuery = `*[_type == "board" && (name match $searchQuery + "*" || description match $searchQuery + "*") && isActive == true] | order(postCount desc) [0...20] {
        _id,
        name,
        slug,
        description,
        type,
        icon,
        color,
        postCount,
        subscriberCount
      }`
      
      results.boards = await client.fetch(boardQuery, params)
    }

    // 트렌드 검색
    if (type === 'all' || type === 'trends') {
      const trendQuery = `*[_type == "trendTracking" && keyword match $searchQuery + "*"] | order(timestamp desc) [0...10] {
        _id,
        keyword,
        trendScore,
        timestamp
      }`
      
      results.trends = await client.fetch(trendQuery, params)
    }

    const totalResults = Object.values(results).reduce((sum, arr) => sum + (arr?.length || 0), 0)

    return res.status(200).json({
      query: searchQuery,
      type,
      results,
      totalResults,
      hasMore: totalResults === parseInt(limit),
    })
  } catch (error) {
    console.error('Search error:', error)
    return res.status(500).json({
      error: 'Search failed',
      message: error.message,
    })
  }
}
