/**
 * [설명] 동적 트렌드 추적 및 관리 시스템
 * [목적] 트렌드를 자동으로 감지, 추가, 삭제하는 자동화 시스템
 * [특징] 검색량, 언급량, 트래픽 기반 자동 생명주기 관리
 * [확장] Instagram, TikTok, Facebook, Weibo, Xiaohongshu, Bilibili 통합
 */

import { createClient } from '@sanity/client'
import {
  fetchWeiboHotSearch,
  fetchBilibiliRanking,
  searchInstagramHashtag,
  searchTikTokHashtag,
} from './socialMediaIntegration.js'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

// ========== 트렌드 생명주기 관리 설정 ==========

const TREND_CONFIG = {
  // 트렌드로 인정되는 최소 조건
  MIN_MENTIONS_FOR_TREND: 1000, // 최소 1000회 언급
  MIN_GROWTH_RATE: 0.2, // 전일 대비 20% 이상 증가

  // 트렌드에서 제외되는 조건
  MAX_DAYS_WITHOUT_GROWTH: 7, // 7일간 성장 없으면 제외
  MIN_DAILY_MENTIONS: 100, // 일 100회 미만이면 제외
  DECLINE_THRESHOLD: -0.5, // 50% 이상 감소 시 즉시 제외

  // 검증 기준
  MIN_SOURCES: 2, // 최소 2개 이상 출처에서 확인
  MIN_RELIABILITY_SCORE: 0.6, // 신뢰도 60% 이상
}

// ========== 다중 검색 엔진 트렌드 수집 ==========

/**
 * Google Trends (공식 RSS)
 */
async function fetchGoogleTrends() {
  try {
    const url = 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=KR'
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Kulture/1.0)',
      },
    })

    if (!response.ok) throw new Error(`Google Trends error: ${response.status}`)

    const xml = await response.text()
    const trends = []

    // RSS 파싱
    const titleRegex = /<title><!\[CDATA\[(.+?)\]\]><\/title>/g
    const trafficRegex = /<ht:approx_traffic><!\[CDATA\[(.+?)\]\]><\/ht:approx_traffic>/g

    let titleMatch, trafficMatch
    const titles = []
    const traffics = []

    while ((titleMatch = titleRegex.exec(xml)) !== null) {
      titles.push(titleMatch[1])
    }

    while ((trafficMatch = trafficRegex.exec(xml)) !== null) {
      traffics.push(trafficMatch[1])
    }

    for (let i = 1; i < titles.length; i++) {
      const traffic = traffics[i - 1] ? parseInt(traffics[i - 1].replace(/[^0-9]/g, '')) : 1000
      trends.push({
        keyword: titles[i],
        source: 'Google Trends (KR)',
        mentions: traffic,
        timestamp: new Date().toISOString(),
        reliability: 0.95,
      })
    }

    return trends.slice(0, 20)
  } catch (error) {
    console.error('[Google Trends] Fetch failed:', error.message)
    return []
  }
}

/**
 * Bing Trends (실시간 검색어)
 */
async function fetchBingTrends() {
  try {
    // Bing은 공개 API 없음, 웹 스크래핑 대신 Naver API 활용
    const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID
    const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET

    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
      return []
    }

    const response = await fetch(
      'https://openapi.naver.com/v1/search/news.json?query=K-Pop OR 한류 OR 케이팝&display=20&sort=date',
      {
        headers: {
          'X-Naver-Client-Id': NAVER_CLIENT_ID,
          'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
        },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!response.ok) return []

    const data = await response.json()
    const items = data.items || []

    // 키워드 빈도 분석
    const keywordCount = {}
    items.forEach(item => {
      const title = item.title.replace(/<[^>]*>/g, '')
      const words = title.split(/\s+/).filter(w => w.length >= 2)
      words.forEach(word => {
        if (word.match(/[가-힣]{2,}|[A-Z][a-z]+/)) {
          keywordCount[word] = (keywordCount[word] || 0) + 1
        }
      })
    })

    return Object.entries(keywordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([keyword, count]) => ({
        keyword,
        source: 'Naver News Analysis',
        mentions: count * 100,
        timestamp: new Date().toISOString(),
        reliability: 0.75,
      }))
  } catch (error) {
    console.error('[Naver News] Fetch failed:', error.message)
    return []
  }
}

/**
 * Twitter Trending Topics
 */
async function fetchTwitterTrends() {
  const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN

  if (!TWITTER_BEARER_TOKEN || TWITTER_BEARER_TOKEN === 'your_twitter_bearer_token') {
    return []
  }

  try {
    // Twitter Trends API는 제한적이므로 한국어 키워드 검색으로 대체
    const keywords = ['K-Pop', '케이팝', '한류', 'K-Drama', '아이돌']
    const trends = []

    for (const keyword of keywords.slice(0, 2)) {
      const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(keyword)}&max_results=100&tweet.fields=public_metrics`

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${TWITTER_BEARER_TOKEN}` },
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) continue

      const data = await response.json()
      const tweets = data.data || []

      // 언급된 해시태그 추출
      const hashtags = {}
      tweets.forEach(tweet => {
        const text = tweet.text
        const hashtagMatches = text.match(/#[\w가-힣]+/g) || []
        hashtagMatches.forEach(tag => {
          const cleanTag = tag.replace('#', '')
          hashtags[cleanTag] = (hashtags[cleanTag] || 0) + (tweet.public_metrics?.like_count || 1)
        })
      })

      Object.entries(hashtags).forEach(([tag, engagement]) => {
        if (engagement >= 50) {
          trends.push({
            keyword: tag,
            source: 'Twitter Hashtags',
            mentions: engagement * 10,
            timestamp: new Date().toISOString(),
            reliability: 0.85,
          })
        }
      })

      // Rate Limit 방지
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    return trends.sort((a, b) => b.mentions - a.mentions).slice(0, 15)
  } catch (error) {
    console.error('[Twitter Trends] Fetch failed:', error.message)
    return []
  }
}

/**
 * YouTube Trending Videos (한국)
 */
async function fetchYouTubeTrends() {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'your_youtube_api_key') {
    return []
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=KR&maxResults=20&videoCategoryId=10&key=${YOUTUBE_API_KEY}`

    const response = await fetch(url, { signal: AbortSignal.timeout(10000) })

    if (!response.ok) return []

    const data = await response.json()
    const videos = data.items || []

    // 제목에서 트렌드 키워드 추출
    const keywords = {}
    videos.forEach(video => {
      const title = video.snippet.title
      const views = parseInt(video.statistics.viewCount) || 0

      // 제목에서 의미 있는 단어 추출
      const words = title
        .split(/\s+/)
        .filter(w => w.length >= 2 && !['MV', 'Official', 'Video', '공식'].includes(w))

      words.forEach(word => {
        if (word.match(/[가-힣]{2,}|[A-Z][a-z]+/)) {
          keywords[word] = (keywords[word] || 0) + Math.log10(views + 1)
        }
      })
    })

    return Object.entries(keywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([keyword, score]) => ({
        keyword,
        source: 'YouTube Trending (KR)',
        mentions: Math.floor(score * 1000),
        timestamp: new Date().toISOString(),
        reliability: 0.9,
      }))
  } catch (error) {
    console.error('[YouTube Trends] Fetch failed:', error.message)
    return []
  }
}

/**
 * Reddit 커뮤니티 트렌드 (r/kpop, r/korea)
 */
async function fetchRedditTrends() {
  const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID
  const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET

  if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) {
    return []
  }

  try {
    // OAuth 토큰 발급
    const authResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })

    if (!authResponse.ok) return []

    const authData = await authResponse.json()
    const accessToken = authData.access_token

    // r/kpop hot posts
    const subreddits = ['kpop', 'korea', 'koreanvariety']
    const trends = []

    for (const sub of subreddits) {
      const response = await fetch(`https://oauth.reddit.com/r/${sub}/hot?limit=20`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'Kulture/1.0',
        },
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) continue

      const data = await response.json()
      const posts = data.data?.children || []

      posts.forEach(post => {
        const title = post.data.title
        const score = post.data.score || 0

        if (score >= 100) {
          // 제목에서 키워드 추출
          const words = title.split(/\s+/).filter(w => w.length >= 3)
          words.forEach(word => {
            if (word.match(/[A-Z][a-z]+/)) {
              trends.push({
                keyword: word,
                source: `Reddit r/${sub}`,
                mentions: score * 5,
                timestamp: new Date().toISOString(),
                reliability: 0.8,
              })
            }
          })
        }
      })

      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // 중복 제거 및 집계
    const aggregated = {}
    trends.forEach(t => {
      if (aggregated[t.keyword]) {
        aggregated[t.keyword].mentions += t.mentions
      } else {
        aggregated[t.keyword] = t
      }
    })

    return Object.values(aggregated)
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 15)
  } catch (error) {
    console.error('[Reddit Trends] Fetch failed:', error.message)
    return []
  }
}

/**
 * Instagram 해시태그 트렌드 수집
 */
async function fetchInstagramTrends() {
  try {
    // 한류 관련 주요 해시태그 검색
    const trendingHashtags = ['kpop', 'kdrama', 'kbeauty', 'mukbang', 'koreanfood', 'hallyuwave']
    const trends = []

    for (const hashtag of trendingHashtags) {
      const result = await searchInstagramHashtag(hashtag)

      if (result.posts && result.posts.length > 0) {
        trends.push({
          keyword: hashtag,
          source: 'Instagram',
          mentions: result.posts.length * 50, // 가중치
          timestamp: new Date().toISOString(),
          reliability: 0.85,
        })
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    return trends
  } catch (error) {
    console.error('[Instagram Trends] Fetch failed:', error.message)
    return []
  }
}

/**
 * TikTok 해시태그 트렌드 수집
 */
async function fetchTikTokTrends() {
  try {
    // TikTok 트렌딩 키워드 검색
    const trendingHashtags = ['kpop', 'kdrama', 'koreanfood', 'mukbang', 'kbeauty', 'korea']
    const trends = []

    for (const hashtag of trendingHashtags) {
      const result = await searchTikTokHashtag(hashtag)

      if (result.videos && result.videos.length > 0) {
        // TikTok은 바이럴 가능성이 높으므로 가중치 상향
        trends.push({
          keyword: hashtag,
          source: 'TikTok',
          mentions: result.videos.length * 100,
          timestamp: new Date().toISOString(),
          reliability: 0.9,
        })
      }

      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    return trends
  } catch (error) {
    console.error('[TikTok Trends] Fetch failed:', error.message)
    return []
  }
}

/**
 * Weibo 실시간 핫 검색어 수집
 */
async function fetchWeiboTrends() {
  try {
    const result = await fetchWeiboHotSearch()

    if (!result.trends || result.trends.length === 0) {
      return []
    }

    // Weibo 트렌드를 우리 포맷으로 변환
    return result.trends.slice(0, 20).map(trend => ({
      keyword: trend.name || trend.keyword,
      source: 'Weibo (中国)',
      mentions: trend.num || 10000, // Weibo는 대형 플랫폼이므로 기본값 높게
      timestamp: new Date().toISOString(),
      reliability: 0.95, // Weibo는 중국 내 신뢰도 매우 높음
    }))
  } catch (error) {
    console.error('[Weibo Trends] Fetch failed:', error.message)
    return []
  }
}

/**
 * Bilibili 실시간 랭킹 수집
 */
async function fetchBilibiliTrends() {
  try {
    const result = await fetchBilibiliRanking()

    if (!result.ranking || result.ranking.length === 0) {
      return []
    }

    // Bilibili 랭킹에서 키워드 추출
    return result.ranking
      .slice(0, 15)
      .map(video => {
        // 제목에서 키워드 추출
        const title = video.title || ''
        const keywords = title.split(/\s+/).filter(w => w.length >= 2)

        return keywords.slice(0, 3).map(keyword => ({
          keyword: keyword,
          source: 'Bilibili (哔哩哔哩)',
          mentions: video.stat?.view || 5000,
          timestamp: new Date().toISOString(),
          reliability: 0.88,
        }))
      })
      .flat()
      .slice(0, 20)
  } catch (error) {
    console.error('[Bilibili Trends] Fetch failed:', error.message)
    return []
  }
}

// ========== 트렌드 종합 분석 및 관리 ==========

/**
 * 모든 소스에서 트렌드 수집 및 통합
 */
export async function collectAllTrends() {
  const startTime = Date.now()

  console.log('[Trend Collection] Starting multi-source trend collection...')

  // 기존 5개 소스 + 신규 5개 소셜 미디어 플랫폼
  const [
    googleTrends,
    naverTrends,
    twitterTrends,
    youtubeTrends,
    redditTrends,
    instagramTrends,
    tiktokTrends,
    weiboTrends,
    bilibiliTrends,
  ] = await Promise.all([
    fetchGoogleTrends(),
    fetchBingTrends(), // 실제로는 Naver
    fetchTwitterTrends(),
    fetchYouTubeTrends(),
    fetchRedditTrends(),
    fetchInstagramTrends(),
    fetchTikTokTrends(),
    fetchWeiboTrends(),
    fetchBilibiliTrends(),
  ])

  const allTrends = [
    ...googleTrends,
    ...naverTrends,
    ...twitterTrends,
    ...youtubeTrends,
    ...redditTrends,
    ...instagramTrends,
    ...tiktokTrends,
    ...weiboTrends,
    ...bilibiliTrends,
  ]

  console.log(`[Trend Collection] Collected ${allTrends.length} raw trends from ${9} sources`)

  // 트렌드 정규화 및 집계
  const aggregated = {}

  allTrends.forEach(trend => {
    const normalized = normalizeKeyword(trend.keyword)

    if (!aggregated[normalized]) {
      aggregated[normalized] = {
        keyword: normalized,
        originalKeywords: [trend.keyword],
        sources: [trend.source],
        totalMentions: 0,
        reliabilityScores: [],
        firstSeen: trend.timestamp,
        lastSeen: trend.timestamp,
      }
    }

    aggregated[normalized].totalMentions += trend.mentions
    aggregated[normalized].reliabilityScores.push(trend.reliability)
    aggregated[normalized].sources.push(trend.source)
    aggregated[normalized].originalKeywords.push(trend.keyword)
  })

  // 신뢰도 및 출처 수 계산
  const validated = Object.values(aggregated).map(trend => {
    const avgReliability =
      trend.reliabilityScores.reduce((a, b) => a + b, 0) / trend.reliabilityScores.length
    const uniqueSources = [...new Set(trend.sources)].length

    return {
      ...trend,
      avgReliability,
      uniqueSources,
      score: trend.totalMentions * avgReliability * (1 + uniqueSources * 0.2),
    }
  })

  // 필터링: 최소 조건 충족 확인
  const filtered = validated.filter(
    trend =>
      trend.totalMentions >= TREND_CONFIG.MIN_MENTIONS_FOR_TREND &&
      trend.uniqueSources >= TREND_CONFIG.MIN_SOURCES &&
      trend.avgReliability >= TREND_CONFIG.MIN_RELIABILITY_SCORE
  )

  const sorted = filtered.sort((a, b) => b.score - a.score)

  const elapsed = Date.now() - startTime
  console.log(`[Trend Collection] Completed in ${elapsed}ms. ${sorted.length} validated trends.`)

  return sorted
}

/**
 * 키워드 정규화 (유사 키워드 통합)
 */
function normalizeKeyword(keyword) {
  // 소문자 변환
  let normalized = keyword.toLowerCase().trim()

  // 특수문자 제거
  normalized = normalized.replace(/[^a-z0-9가-힣\s-]/g, '')

  // 공백 정리
  normalized = normalized.replace(/\s+/g, ' ')

  // 동의어 매핑
  const synonyms = {
    kpop: 'k-pop',
    케이팝: 'k-pop',
    kdrama: 'k-drama',
    케이드라마: 'k-drama',
    bts: 'bts',
    방탄소년단: 'bts',
    blackpink: 'blackpink',
    블랙핑크: 'blackpink',
  }

  return synonyms[normalized] || normalized
}

/**
 * 기존 트렌드 생명주기 체크
 */
export async function checkTrendLifecycle() {
  try {
    // Sanity에서 기존 트렌드 조회
    const existingTrends = await sanity.fetch(`
      *[_type == "trendTracking"] | order(score desc) [0...100] {
        _id,
        keyword,
        totalMentions,
        dailyMentions,
        lastUpdate,
        daysWithoutGrowth,
        peakMentions,
        status
      }
    `)

    const now = new Date()
    const updates = []
    const toDelete = []

    for (const trend of existingTrends) {
      const lastUpdate = new Date(trend.lastUpdate)
      const daysSinceUpdate = Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24))

      // 7일 이상 업데이트 없으면 제외 고려
      if (daysSinceUpdate >= TREND_CONFIG.MAX_DAYS_WITHOUT_GROWTH) {
        toDelete.push(trend._id)
        console.log(
          `[Lifecycle] Removing stale trend: ${trend.keyword} (${daysSinceUpdate} days inactive)`
        )
        continue
      }

      // 일일 언급 수가 너무 적으면 제외
      if (trend.dailyMentions < TREND_CONFIG.MIN_DAILY_MENTIONS) {
        toDelete.push(trend._id)
        console.log(
          `[Lifecycle] Removing low-engagement trend: ${trend.keyword} (${trend.dailyMentions} daily mentions)`
        )
        continue
      }

      // 급격한 하락 (50% 이상) 감지
      if (
        trend.peakMentions &&
        trend.totalMentions < trend.peakMentions * (1 + TREND_CONFIG.DECLINE_THRESHOLD)
      ) {
        toDelete.push(trend._id)
        console.log(
          `[Lifecycle] Removing declining trend: ${trend.keyword} (${Math.floor((1 - trend.totalMentions / trend.peakMentions) * 100)}% decline)`
        )
        continue
      }
    }

    // 제거 실행
    for (const id of toDelete) {
      await sanity.delete(id)
    }

    console.log(`[Lifecycle] Removed ${toDelete.length} obsolete trends`)

    return {
      checked: existingTrends.length,
      removed: toDelete.length,
      active: existingTrends.length - toDelete.length,
    }
  } catch (error) {
    console.error('[Lifecycle] Check failed:', error.message)
    return { checked: 0, removed: 0, active: 0 }
  }
}

/**
 * 트렌드 업데이트 또는 추가
 */
export async function updateTrendDatabase(trends) {
  const results = {
    added: 0,
    updated: 0,
    skipped: 0,
  }

  for (const trend of trends) {
    try {
      // 기존 트렌드 확인
      const existing = await sanity.fetch(
        `
        *[_type == "trendTracking" && keyword == $keyword][0]
      `,
        { keyword: trend.keyword }
      )

      if (existing) {
        // 업데이트
        const growthRate =
          existing.totalMentions > 0
            ? (trend.totalMentions - existing.totalMentions) / existing.totalMentions
            : 0

        await sanity
          .patch(existing._id)
          .set({
            totalMentions: trend.totalMentions,
            dailyMentions: trend.totalMentions - (existing.totalMentions || 0),
            sources: trend.sources,
            uniqueSources: trend.uniqueSources,
            avgReliability: trend.avgReliability,
            score: trend.score,
            growthRate,
            peakMentions: Math.max(existing.peakMentions || 0, trend.totalMentions),
            daysWithoutGrowth: growthRate > 0 ? 0 : (existing.daysWithoutGrowth || 0) + 1,
            lastUpdate: new Date().toISOString(),
            status: 'active',
          })
          .commit()

        results.updated++
      } else {
        // 새로 추가
        await sanity.create({
          _type: 'trendTracking',
          keyword: trend.keyword,
          originalKeywords: trend.originalKeywords,
          totalMentions: trend.totalMentions,
          dailyMentions: trend.totalMentions,
          sources: trend.sources,
          uniqueSources: trend.uniqueSources,
          avgReliability: trend.avgReliability,
          score: trend.score,
          growthRate: 0,
          peakMentions: trend.totalMentions,
          daysWithoutGrowth: 0,
          firstSeen: new Date().toISOString(),
          lastUpdate: new Date().toISOString(),
          status: 'active',
        })

        results.added++
      }
    } catch (error) {
      console.error(`[Update] Failed for trend "${trend.keyword}":`, error.message)
      results.skipped++
    }
  }

  console.log(
    `[Update] Trends updated: ${results.updated} updated, ${results.added} added, ${results.skipped} skipped`
  )

  return results
}
