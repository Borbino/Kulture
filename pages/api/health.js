/**
 * [설명] API 헬스체크 엔드포인트
 * [목적] 모든 외부 API 연결 상태 확인 (stub 함수 탐지)
 */

import rateLimitMiddleware from '../../lib/rateLimiter.js'
import { tryCatch, withErrorHandler } from '../../lib/apiErrorHandler.js'

const handler = async function healthHandler(req, res) {
  // Rate limiting: 60회/분
  const rateLimitResult = rateLimitMiddleware('api')(req, res, () => {})
  if (rateLimitResult !== undefined) return rateLimitResult

  const checks = {
    twitter: checkTwitter(),
    youtube: checkYouTube(),
    reddit: checkReddit(),
    naver: checkNaver(),
    huggingface: checkHuggingFace(),
    sanity: checkSanity(),
  }

  const results = await Promise.allSettled(Object.values(checks))
  const status = {}

  Object.keys(checks).forEach((key, index) => {
    const result = results[index]
    status[key] = {
      ok: result.status === 'fulfilled' && result.value,
      message: result.status === 'fulfilled' ? result.value.message : result.reason.message,
    }
  })

  const allOk = Object.values(status).every(s => s.ok)

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks: status,
  })
}

export default withErrorHandler(handler)

/**
 * Twitter API 체크
 */
async function checkTwitter() {
  const token = process.env.TWITTER_BEARER_TOKEN

  if (!token || token === 'your_twitter_bearer_token') {
    return { ok: false, message: 'Token not configured' }
  }

  return tryCatch(async () => {
    const response = await fetch(
      'https://api.twitter.com/2/tweets/search/recent?query=test&max_results=10',
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(5000),
      }
    )

    if (response.status === 401) {
      return { ok: false, message: 'Invalid token' }
    }

    if (response.status === 429) {
      return { ok: true, message: 'Rate limited (but token valid)' }
    }

    return { ok: response.ok, message: response.ok ? 'Connected' : `Error ${response.status}` }
  })
}

/**
 * YouTube API 체크
 */
async function checkYouTube() {
  const apiKey = process.env.YOUTUBE_API_KEY

  if (!apiKey || apiKey === 'your_youtube_api_key') {
    return { ok: false, message: 'API key not configured' }
  }

  return tryCatch(async () => {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&type=video&maxResults=1&key=${apiKey}`,
      {
        signal: AbortSignal.timeout(5000),
      }
    )

    if (
      response.status === 400 &&
      (await response.json()).error?.errors?.[0]?.reason === 'keyInvalid'
    ) {
      return { ok: false, message: 'Invalid API key' }
    }

    return { ok: response.ok, message: response.ok ? 'Connected' : `Error ${response.status}` }
  })
}

/**
 * Reddit API 체크
 */
async function checkReddit() {
  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET

  if (!clientId || clientId === 'your_reddit_client_id' || !clientSecret) {
    return { ok: false, message: 'Credentials not configured' }
  }

  return tryCatch(async () => {
    const authResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(5000),
    })

    if (!authResponse.ok) {
      return { ok: false, message: 'Auth failed' }
    }

    return { ok: true, message: 'Connected' }
  })
}

/**
 * Naver API 체크
 */
async function checkNaver() {
  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET

  if (!clientId || clientId === 'your_naver_client_id' || !clientSecret) {
    return { ok: false, message: 'Credentials not configured' }
  }

  return tryCatch(async () => {
    const response = await fetch(
      'https://openapi.naver.com/v1/search/news.json?query=test&display=1',
      {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
        signal: AbortSignal.timeout(5000),
      }
    )

    return { ok: response.ok, message: response.ok ? 'Connected' : `Error ${response.status}` }
  })
}

/**
 * Hugging Face API 체크
 */
async function checkHuggingFace() {
  const token = process.env.HUGGINGFACE_API_KEY

  if (!token || token === 'your_huggingface_api_key') {
    return { ok: false, message: 'Token not configured' }
  }

  return tryCatch(async () => {
    const response = await fetch('https://api-inference.huggingface.co/models/microsoft/phi-2', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: 'test' }),
      signal: AbortSignal.timeout(10000),
    })

    if (response.status === 401) {
      return { ok: false, message: 'Invalid token' }
    }

    if (response.status === 503) {
      return { ok: true, message: 'Model loading (token valid)' }
    }

    return { ok: response.ok, message: response.ok ? 'Connected' : `Error ${response.status}` }
  })
}

/**
 * Sanity CMS 체크
 */
async function checkSanity() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
  const token = process.env.SANITY_API_TOKEN

  if (!projectId || !dataset) {
    return { ok: false, message: 'Sanity not configured' }
  }

  return tryCatch(async () => {
    const headers = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    const response = await fetch(
      `https://${projectId}.api.sanity.io/v2024-01-01/data/query/${dataset}?query=*[_type == "post"][0]`,
      {
        headers,
        signal: AbortSignal.timeout(5000),
      }
    )

    return { ok: response.ok, message: response.ok ? 'Connected' : `Error ${response.status}` }
  })
}
