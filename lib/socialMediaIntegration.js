import { logger } from './logger.js'

/**
 * [설명] 통합 소셜 미디어 API 모니터링 시스템
 * [일시] 2025-11-19 (KST)
 * [목적] Instagram, TikTok, Facebook, Weibo, Xiaohongshu, Bilibili 등 모든 소셜 미디어 플랫폼 데이터 수집
 * [특징] 다중 플랫폼 동시 모니터링, 글로벌 인플루언서 추적, 실시간 트렌드 감지
 */

// ========== 소셜 미디어 플랫폼 설정 ==========

const PLATFORM_CONFIG = {
  // === Instagram ===
  instagram: {
    name: 'Instagram',
    apiBase: 'https://graph.instagram.com',
    rateLimits: {
      hourly: 200, // Instagram Graph API 시간당 200회
      daily: 4800, // 일 4800회
    },
    features: ['posts', 'stories', 'reels', 'hashtags', 'mentions'],
    cost: '$0 (Basic Display API)',
    enabled: true,
  },

  // === TikTok ===
  tiktok: {
    name: 'TikTok',
    apiBase: 'https://open.tiktokapis.com/v2',
    rateLimits: {
      hourly: 100,
      daily: 1000,
    },
    features: ['videos', 'hashtags', 'user_info', 'comments'],
    cost: '$0 (무료 플랜)',
    enabled: true,
  },

  // === Facebook ===
  facebook: {
    name: 'Facebook',
    apiBase: 'https://graph.facebook.com/v18.0',
    rateLimits: {
      hourly: 200,
      daily: 4800,
    },
    features: ['posts', 'pages', 'groups', 'reactions', 'shares'],
    cost: '$0 (Graph API)',
    enabled: true,
  },

  // === Weibo (웨이보, 중국) ===
  weibo: {
    name: 'Weibo',
    apiBase: 'https://api.weibo.com/2',
    rateLimits: {
      hourly: 150,
      daily: 3000,
    },
    features: ['statuses', 'users', 'trends', 'search'],
    cost: '$0 (무료 플랜)',
    enabled: true,
  },

  // === Xiaohongshu (小红书, 중국 뷰티/라이프스타일) ===
  xiaohongshu: {
    name: 'Xiaohongshu (RED)',
    apiBase: 'https://edith.xiaohongshu.com/api',
    rateLimits: {
      hourly: 60,
      daily: 500,
    },
    features: ['notes', 'user', 'search', 'trends'],
    cost: '$0 (비공식 API)',
    enabled: true,
    note: '비공식 API, 웹 스크래핑 필요할 수 있음',
  },

  // === Bilibili (비리비리, 중국 동영상) ===
  bilibili: {
    name: 'Bilibili',
    apiBase: 'https://api.bilibili.com',
    rateLimits: {
      hourly: 100,
      daily: 1000,
    },
    features: ['videos', 'users', 'rankings', 'search'],
    cost: '$0 (공개 API)',
    enabled: true,
  },

  // === Pinterest ===
  pinterest: {
    name: 'Pinterest',
    apiBase: 'https://api.pinterest.com/v5',
    rateLimits: {
      hourly: 100,
      daily: 1000,
    },
    features: ['pins', 'boards', 'users', 'search'],
    cost: '$0 (무료 플랜)',
    enabled: true,
  },

  // === Telegram ===
  telegram: {
    name: 'Telegram',
    apiBase: 'https://api.telegram.org/bot',
    rateLimits: {
      perSecond: 30,
      perMinute: 1800,
    },
    features: ['channels', 'groups', 'messages'],
    cost: '$0 (완전 무료)',
    enabled: true,
  },

  // === Mastodon (ActivityPub Fediverse) ===
  mastodon: {
    name: 'Mastodon',
    apiBase: 'https://mastodon.social/api/v1',
    rateLimits: {
      perMinute: 300,
      daily: 7500,
    },
    features: ['hashtag_timeline', 'public_posts', 'search'],
    cost: '$0 (API 키 불필요, 완전 공개)',
    enabled: true,
    note: '다국어 K-Culture 글로벌 팬 커뮤니티',
  },

  // === VK.com (러시아·동유럽) ===
  vk: {
    name: 'VK.com',
    apiBase: 'https://api.vk.com/method',
    rateLimits: {
      perSecond: 3,
      daily: 5000,
    },
    features: ['newsfeed_search', 'wall', 'groups', 'users'],
    cost: '$0 (무료 플랜)',
    enabled: true,
    note: '러시아·CIS·동유럽 K-Pop 팬베이스 커버',
  },
}

// ========== Instagram API ==========

/**
 * Instagram 게시물 및 해시태그 모니터링
 * API: Instagram Graph API
 */
async function fetchInstagramData(username, _options = {}) {
  try {
    const INSTAGRAM_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN

    if (!INSTAGRAM_TOKEN) {
      logger.warn('[social]', '[Instagram] Access token not configured, skipping')
      return { posts: [], metrics: {} }
    }

    // Instagram Graph API - User Media
    const mediaUrl = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&access_token=${INSTAGRAM_TOKEN}`

    const response = await fetch(mediaUrl, {
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Kulture/1.0)',
      },
    })

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`)
    }

    const data = await response.json()

    return {
      platform: 'Instagram',
      username,
      posts: data.data || [],
      metrics: {
        totalLikes: data.data?.reduce((sum, post) => sum + (post.like_count || 0), 0) || 0,
        totalComments: data.data?.reduce((sum, post) => sum + (post.comments_count || 0), 0) || 0,
        postsCount: data.data?.length || 0,
      },
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    logger.error('[social]', '[Instagram] Fetch failed', { error: error.message })
    return { posts: [], metrics: {}, error: error.message }
  }
}

/**
 * Instagram 해시태그 검색
 */
async function searchInstagramHashtag(hashtag) {
  try {
    const INSTAGRAM_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN

    if (!INSTAGRAM_TOKEN) {
      return { posts: [] }
    }

    // Instagram Graph API - Hashtag Search
    const hashtagUrl = `https://graph.instagram.com/ig_hashtag_search?user_id=me&q=${encodeURIComponent(hashtag)}&access_token=${INSTAGRAM_TOKEN}`

    const response = await fetch(hashtagUrl, {
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      throw new Error(`Instagram Hashtag API error: ${response.status}`)
    }

    const data = await response.json()

    return {
      platform: 'Instagram',
      hashtag,
      posts: data.data || [],
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    logger.error('[social]', '[Instagram Hashtag] Fetch failed', { error: error.message })
    return { posts: [], error: error.message }
  }
}

// ========== TikTok API ==========

/**
 * TikTok 영상 및 해시태그 모니터링
 * API: TikTok for Developers API
 */
async function fetchTikTokData(username, _options = {}) {
  try {
    const TIKTOK_ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN

    if (!TIKTOK_ACCESS_TOKEN) {
      logger.warn('[social]', '[TikTok] Access token not configured, skipping')
      return { videos: [], metrics: {} }
    }

    // TikTok API - User Info & Videos
    const userUrl = `https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url,follower_count,following_count,likes_count,video_count`

    const response = await fetch(userUrl, {
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${TIKTOK_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`TikTok API error: ${response.status}`)
    }

    const data = await response.json()

    return {
      platform: 'TikTok',
      username,
      userInfo: data.data?.user || {},
      videos: [], // Videos API requires separate call
      metrics: {
        followers: data.data?.user?.follower_count || 0,
        likes: data.data?.user?.likes_count || 0,
        videos: data.data?.user?.video_count || 0,
      },
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    logger.error('[social]', '[TikTok] Fetch failed', { error: error.message })
    return { videos: [], metrics: {}, error: error.message }
  }
}

/**
 * TikTok 해시태그 트렌드 검색
 */
async function searchTikTokHashtag(hashtag) {
  try {
    const TIKTOK_ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN

    if (!TIKTOK_ACCESS_TOKEN) {
      return { videos: [] }
    }

    // TikTok Research API - Hashtag Search
    const searchUrl = `https://open.tiktokapis.com/v2/research/video/query/`

    const requestBody = {
      query: {
        and: [{ field_name: 'hashtag_name', field_values: [hashtag], operation: 'IN' }],
      },
      max_count: 100,
      start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
      end_date: new Date().toISOString().split('T')[0],
    }

    const response = await fetch(searchUrl, {
      method: 'POST',
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${TIKTOK_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`TikTok Search API error: ${response.status}`)
    }

    const data = await response.json()

    return {
      platform: 'TikTok',
      hashtag,
      videos: data.data?.videos || [],
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    logger.error('[social]', '[TikTok Hashtag] Fetch failed', { error: error.message })
    return { videos: [], error: error.message }
  }
}

// ========== Facebook API ==========

/**
 * Facebook 페이지 및 그룹 모니터링
 * API: Facebook Graph API
 */
async function fetchFacebookData(pageId, _options = {}) {
  try {
    const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN

    if (!FACEBOOK_ACCESS_TOKEN) {
      logger.warn('[social]', '[Facebook] Access token not configured, skipping')
      return { posts: [], metrics: {} }
    }

    // Facebook Graph API - Page Feed
    const feedUrl = `https://graph.facebook.com/v18.0/${pageId}/feed?fields=id,message,created_time,likes.summary(true),comments.summary(true),shares&access_token=${FACEBOOK_ACCESS_TOKEN}`

    const response = await fetch(feedUrl, {
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      throw new Error(`Facebook API error: ${response.status}`)
    }

    const data = await response.json()

    return {
      platform: 'Facebook',
      pageId,
      posts: data.data || [],
      metrics: {
        totalLikes:
          data.data?.reduce((sum, post) => sum + (post.likes?.summary?.total_count || 0), 0) || 0,
        totalComments:
          data.data?.reduce((sum, post) => sum + (post.comments?.summary?.total_count || 0), 0) ||
          0,
        totalShares: data.data?.reduce((sum, post) => sum + (post.shares?.count || 0), 0) || 0,
      },
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    logger.error('[social]', '[Facebook] Fetch failed', { error: error.message })
    return { posts: [], metrics: {}, error: error.message }
  }
}

// ========== Weibo API (중국) ==========

/**
 * Weibo 트렌드 및 사용자 게시물 모니터링
 * API: Weibo Open API
 */
async function fetchWeiboData(userId, _options = {}) {
  try {
    const WEIBO_ACCESS_TOKEN = process.env.WEIBO_ACCESS_TOKEN

    if (!WEIBO_ACCESS_TOKEN) {
      logger.warn('[social]', '[Weibo] Access token not configured, skipping')
      return { posts: [], metrics: {} }
    }

    // Weibo API - User Timeline
    const timelineUrl = `https://api.weibo.com/2/statuses/user_timeline.json?access_token=${WEIBO_ACCESS_TOKEN}&uid=${userId}&count=50`

    const response = await fetch(timelineUrl, {
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      throw new Error(`Weibo API error: ${response.status}`)
    }

    const data = await response.json()

    return {
      platform: 'Weibo',
      userId,
      posts: data.statuses || [],
      metrics: {
        totalReposts: data.statuses?.reduce((sum, post) => sum + (post.reposts_count || 0), 0) || 0,
        totalComments:
          data.statuses?.reduce((sum, post) => sum + (post.comments_count || 0), 0) || 0,
        totalLikes: data.statuses?.reduce((sum, post) => sum + (post.attitudes_count || 0), 0) || 0,
      },
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    logger.error('[social]', '[Weibo] Fetch failed', { error: error.message })
    return { posts: [], metrics: {}, error: error.message }
  }
}

/**
 * Weibo 실시간 핫 검색어
 */
async function fetchWeiboHotSearch() {
  try {
    const WEIBO_ACCESS_TOKEN = process.env.WEIBO_ACCESS_TOKEN

    if (!WEIBO_ACCESS_TOKEN) {
      return { trends: [] }
    }

    // Weibo API - Hot Trends
    const trendsUrl = `https://api.weibo.com/2/trends/hourly.json?access_token=${WEIBO_ACCESS_TOKEN}`

    const response = await fetch(trendsUrl, {
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      throw new Error(`Weibo Trends API error: ${response.status}`)
    }

    const data = await response.json()

    return {
      platform: 'Weibo',
      trends: data.trends || [],
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    logger.error('[social]', '[Weibo Trends] Fetch failed', { error: error.message })
    return { trends: [], error: error.message }
  }
}

// ========== Xiaohongshu API (小红书, RED) ==========

/**
 * Xiaohongshu (小红书) 노트 및 트렌드 모니터링
 * 주의: 비공식 API, 웹 스크래핑 또는 제3자 서비스 필요
 */
async function fetchXiaohongshuData(keyword, _options = {}) {
  try {
    // 주의: Xiaohongshu는 공식 API가 제한적이므로 웹 스크래핑이 필요할 수 있음
    console.log('[Xiaohongshu] 공식 API 제한으로 웹 스크래핑 또는 제3자 서비스 필요')

    // 대안: RapidAPI의 Xiaohongshu API 사용
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY

    if (!RAPIDAPI_KEY) {
      console.log('[Xiaohongshu] RapidAPI key not configured, skipping')
      return { notes: [], metrics: {} }
    }

    const searchUrl = `https://xiaohongshu-red-china.p.rapidapi.com/search/notes?keyword=${encodeURIComponent(keyword)}&pageSize=20`

    const response = await fetch(searchUrl, {
      signal: AbortSignal.timeout(15000),
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'xiaohongshu-red-china.p.rapidapi.com',
      },
    })

    if (!response.ok) {
      throw new Error(`Xiaohongshu API error: ${response.status}`)
    }

    const data = await response.json()

    return {
      platform: 'Xiaohongshu',
      keyword,
      notes: data.data?.notes || [],
      metrics: {
        totalLikes: data.data?.notes?.reduce((sum, note) => sum + (note.liked_count || 0), 0) || 0,
        totalComments:
          data.data?.notes?.reduce((sum, note) => sum + (note.comment_count || 0), 0) || 0,
      },
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('[Xiaohongshu] Fetch failed:', error.message)
    return { notes: [], metrics: {}, error: error.message }
  }
}

// ========== Bilibili API (哔哩哔哩) ==========

/**
 * Bilibili 영상 및 트렌드 모니터링
 * API: Bilibili Open API
 */
async function fetchBilibiliData(keyword, _options = {}) {
  try {
    // Bilibili API - Search Videos
    const searchUrl = `https://api.bilibili.com/x/web-interface/search/all/v2?keyword=${encodeURIComponent(keyword)}&page=1&pagesize=50`

    const response = await fetch(searchUrl, {
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Kulture/1.0)',
        Referer: 'https://www.bilibili.com/',
      },
    })

    if (!response.ok) {
      throw new Error(`Bilibili API error: ${response.status}`)
    }

    const data = await response.json()

    return {
      platform: 'Bilibili',
      keyword,
      videos: data.data?.result?.video || [],
      metrics: {
        totalViews:
          data.data?.result?.video?.reduce((sum, video) => sum + (video.play || 0), 0) || 0,
        totalComments:
          data.data?.result?.video?.reduce((sum, video) => sum + (video.review || 0), 0) || 0,
      },
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    logger.error('[social]', '[Bilibili] Fetch failed', { error: error.message })
    return { videos: [], metrics: {}, error: error.message }
  }
}

/**
 * Bilibili 실시간 랭킹
 */
async function fetchBilibiliRanking() {
  try {
    // Bilibili API - Ranking
    const rankingUrl = `https://api.bilibili.com/x/web-interface/ranking/v2?rid=0&type=all`

    const response = await fetch(rankingUrl, {
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Kulture/1.0)',
        Referer: 'https://www.bilibili.com/',
      },
    })

    if (!response.ok) {
      throw new Error(`Bilibili Ranking API error: ${response.status}`)
    }

    const data = await response.json()

    return {
      platform: 'Bilibili',
      ranking: data.data?.list || [],
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    logger.error('[social]', '[Bilibili Ranking] Fetch failed', { error: error.message })
    return { ranking: [], error: error.message }
  }
}

// ========== 통합 모니터링 함수 ==========

/**
 * 모든 소셜 미디어 플랫폼에서 동시에 데이터 수집
 */
export async function monitorAllPlatforms(target, options = {}) {
  const { platforms = ['instagram', 'tiktok', 'facebook', 'weibo', 'bilibili'], type = 'user' } =
    options

  const results = {}

  // 병렬 실행으로 속도 최적화
  const promises = []

  if (platforms.includes('instagram')) {
    promises.push(
      (type === 'user' ? fetchInstagramData(target) : searchInstagramHashtag(target)).then(data => {
        results.instagram = data
      })
    )
  }

  if (platforms.includes('tiktok')) {
    promises.push(
      (type === 'user' ? fetchTikTokData(target) : searchTikTokHashtag(target)).then(data => {
        results.tiktok = data
      })
    )
  }

  if (platforms.includes('facebook')) {
    promises.push(
      fetchFacebookData(target).then(data => {
        results.facebook = data
      })
    )
  }

  if (platforms.includes('weibo')) {
    promises.push(
      (type === 'user' ? fetchWeiboData(target) : fetchWeiboHotSearch()).then(data => {
        results.weibo = data
      })
    )
  }

  if (platforms.includes('xiaohongshu')) {
    promises.push(
      fetchXiaohongshuData(target).then(data => {
        results.xiaohongshu = data
      })
    )
  }

  if (platforms.includes('bilibili')) {
    promises.push(
      (type === 'keyword' ? fetchBilibiliData(target) : fetchBilibiliRanking()).then(data => {
        results.bilibili = data
      })
    )
  }

  // 모든 API 호출 완료 대기
  const settledResults = await Promise.allSettled(promises)

  // 실패한 프로미스 로깅
  settledResults.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.warn(
        `[Social Media] Platform ${index} failed:`,
        result.reason?.message || result.reason
      )
    }
  })

  return {
    target,
    type,
    platforms: Object.keys(results),
    data: results,
    timestamp: new Date().toISOString(),
    summary: {
      totalPlatforms: Object.keys(results).length,
      successfulPlatforms: Object.values(results).filter(r => !r.error).length,
      failedPlatforms: Object.values(results).filter(r => r.error).length,
    },
  }
}

/**
 * 특정 VIP의 모든 소셜 미디어 계정 모니터링
 */
export async function monitorVIPAcrossPlatforms(vip) {
  const { socialMedia, keywords } = vip

  const results = {
    vipId: vip.id,
    vipName: vip.name,
    platforms: {},
  }

  // Instagram 모니터링
  if (socialMedia.instagram) {
    const username = socialMedia.instagram.split('/').filter(Boolean).pop()
    results.platforms.instagram = await fetchInstagramData(username)
  }

  // TikTok 모니터링
  if (socialMedia.tiktok) {
    const username = socialMedia.tiktok.split('/').filter(Boolean).pop().replace('@', '')
    results.platforms.tiktok = await fetchTikTokData(username)
  }

  // Facebook 모니터링
  if (socialMedia.facebook) {
    const pageId = socialMedia.facebook.split('/').filter(Boolean).pop()
    results.platforms.facebook = await fetchFacebookData(pageId)
  }

  // 키워드 기반 검색 (Weibo, Xiaohongshu, Bilibili)
  if (keywords && keywords.length > 0) {
    const mainKeyword = keywords[0]

    // Weibo 검색
    results.platforms.weibo = await fetchWeiboData(mainKeyword)

    // Xiaohongshu 검색
    results.platforms.xiaohongshu = await fetchXiaohongshuData(mainKeyword)

    // Bilibili 검색
    results.platforms.bilibili = await fetchBilibiliData(mainKeyword)
  }

  // Mastodon 공개 해시태그 검색 (완전 무료)
  if (keywords && keywords.length > 0) {
    results.platforms.mastodon = await fetchMastodonHashtag(keywords[0])
  }

  // VK.com 검색 (동유럽·러시아 커버)
  if (keywords && keywords.length > 0) {
    results.platforms.vk = await fetchVKData(keywords[0])
  }

  return results
}

// ========== Mastodon (ActivityPub, 완전 무료) ==========

/**
 * Mastodon 공개 해시태그 타임라인 (API 키 불필요, 완전 공개)
 * @param {string} hashtag
 * @returns {Promise<object>}
 */
async function fetchMastodonHashtag(hashtag) {
  try {
    // 일반 영어 문자만 허용 (Mastodon 해시태그 규칙)
    const cleanTag = hashtag
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20)

    if (!cleanTag) return { posts: [], metrics: {}, platform: 'Mastodon' }

    const url = `https://mastodon.social/api/v1/timelines/tag/${encodeURIComponent(cleanTag)}?limit=20`

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Kulture/2.0)' },
    })

    if (!response.ok) {
      throw new Error(`Mastodon API error: ${response.status}`)
    }

    const posts = await response.json()

    return {
      platform: 'Mastodon',
      hashtag: cleanTag,
      posts: posts.map(p => ({
        id: p.id,
        text: p.content?.replace(/<[^>]*>/g, '').trim() || '',
        url: p.url,
        timestamp: p.created_at,
        favourites: p.favourites_count || 0,
        reblogs: p.reblogs_count || 0,
      })),
      metrics: {
        totalLikes: posts.reduce((s, p) => s + (p.favourites_count || 0), 0),
        totalReblogs: posts.reduce((s, p) => s + (p.reblogs_count || 0), 0),
        postsCount: posts.length,
      },
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    logger.error('[social]', '[Mastodon] Fetch failed', { error: error.message })
    return { posts: [], metrics: {}, platform: 'Mastodon', error: error.message }
  }
}

/**
 * Mastodon 공개 인스턴스 검색 (글로벌 K-Culture 커뮤니티 탐색)
 * @param {string} keyword
 * @returns {Promise<object>}
 */
export async function searchMastodon(keyword) {
  return fetchMastodonHashtag(keyword)
}

// ========== VK.com (러시아·동유럽, 무료 API) ==========

/**
 * VK.com 뉴스피드 검색 (K-Culture 동유럽 관심도 측정)
 * @param {string} keyword
 * @returns {Promise<object>}
 */
async function fetchVKData(keyword) {
  const VK_ACCESS_TOKEN = process.env.VK_ACCESS_TOKEN

  if (!VK_ACCESS_TOKEN) {
    logger.warn('[social]', '[VK] Access token not configured, skipping')
    return { posts: [], metrics: {}, platform: 'VK' }
  }

  try {
    const url = `https://api.vk.com/method/newsfeed.search?q=${encodeURIComponent(keyword)}&count=20&access_token=${VK_ACCESS_TOKEN}&v=5.131`

    const response = await fetch(url, { signal: AbortSignal.timeout(10000) })

    if (!response.ok) throw new Error(`VK API error: ${response.status}`)

    const data = await response.json()

    if (data.error) {
      throw new Error(`VK API: ${data.error.error_msg}`)
    }

    const items = data.response?.items || []

    return {
      platform: 'VK',
      keyword,
      posts: items.map(p => ({
        id: p.id,
        text: (p.text || '').slice(0, 200),
        url: `https://vk.com/wall${p.owner_id}_${p.id}`,
        timestamp: new Date(p.date * 1000).toISOString(),
        likes: p.likes?.count || 0,
        reposts: p.reposts?.count || 0,
        views: p.views?.count || 0,
      })),
      metrics: {
        totalLikes: items.reduce((s, p) => s + (p.likes?.count || 0), 0),
        totalReposts: items.reduce((s, p) => s + (p.reposts?.count || 0), 0),
        postsCount: items.length,
      },
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    logger.error('[social]', '[VK] Fetch failed', { error: error.message })
    return { posts: [], metrics: {}, platform: 'VK', error: error.message }
  }
}

// ========== 내보내기 ==========

export {
  PLATFORM_CONFIG,
  fetchInstagramData,
  searchInstagramHashtag,
  fetchTikTokData,
  searchTikTokHashtag,
  fetchFacebookData,
  fetchWeiboData,
  fetchWeiboHotSearch,
  fetchXiaohongshuData,
  fetchBilibiliData,
  fetchBilibiliRanking,
  fetchMastodonHashtag,
  fetchVKData,
}
