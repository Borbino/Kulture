import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { getSanityClient } from '../../../lib/sanityClient.js'
import supabase from '../../../lib/supabaseClient.js'

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1분
const LIKE_POINT_AMOUNT = 5            // 추천 수신 시 작성자 포인트 가중치

// ─────────────────────────────────────────────
// Rate Limiting 헬퍼
// Supabase `rate_limits` 테이블 스키마:
//   user_key TEXT PRIMARY KEY,
//   last_interaction TIMESTAMPTZ NOT NULL
// ─────────────────────────────────────────────
async function checkRateLimit(userKey) {
  const now = new Date()
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS).toISOString()

  const { data, error } = await supabase
    .from('rate_limits')
    .select('last_interaction')
    .eq('user_key', userKey)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = row not found (정상 케이스)
    throw new Error(`Rate limit DB 조회 실패: ${error.message}`)
  }

  if (data && data.last_interaction > windowStart) {
    return false // 제한 초과
  }

  // upsert: 최초 요청이면 insert, 이후엔 update
  const { error: upsertError } = await supabase
    .from('rate_limits')
    .upsert({ user_key: userKey, last_interaction: now.toISOString() })

  if (upsertError) {
    throw new Error(`Rate limit upsert 실패: ${upsertError.message}`)
  }

  return true // 허용
}

// ─────────────────────────────────────────────
// 포인트 증가 헬퍼 (Supabase RPC 호출)
// Supabase DB Function 예시:
//   CREATE OR REPLACE FUNCTION increment_points(p_user_id TEXT, p_amount INT)
//   RETURNS VOID AS $$
//     UPDATE users SET points = points + p_amount WHERE id = p_user_id;
//   $$ LANGUAGE sql;
// ─────────────────────────────────────────────
async function incrementAuthorPoints(authorId, amount) {
  const { error } = await supabase.rpc('increment_points', {
    p_user_id: authorId,
    p_amount: amount,
  })

  if (error) {
    // 포인트 실패는 치명적이지 않으므로 경고만 기록하고 진행
    console.warn(`[interactions] 포인트 증가 RPC 실패 (author: ${authorId}):`, error.message)
  }
}

// ─────────────────────────────────────────────
// 핸들러
// ─────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const client = getSanityClient()
  const action = req.query.action

  // ── 조회수 업데이트 (비인증, rate limit 미적용) ──
  if (action === 'view') {
    const { postId } = req.body
    if (!postId) {
      return res.status(400).json({ error: 'postId is required' })
    }
    try {
      const post = await client.fetch(
        '*[_type == "post" && _id == $postId][0]{ views }',
        { postId }
      )
      const currentViews = post?.views || 0
      await client.patch(postId).set({ views: currentViews + 1 }).commit()
      return res.status(200).json({ views: currentViews + 1 })
    } catch (err) {
      console.error('[interactions] view 업데이트 실패:', err)
      return res.status(500).json({ error: 'Failed to update views' })
    }
  }

  // ── 좋아요 (인증 필수 + rate limit + 포인트 트리거) ──
  if (action === 'like') {
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ error: '로그인이 필요합니다' })
    }

    const { postId } = req.body
    if (!postId) {
      return res.status(400).json({ error: 'postId is required' })
    }

    // Rate Limit: 유저 ID 우선, 없으면 IP 폴백
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      'unknown'
    const userKey = `like:${session.user.email ?? ip}`

    try {
      const allowed = await checkRateLimit(userKey)
      if (!allowed) {
        return res.status(429).json({
          error: '요청이 너무 빠릅니다. 1분에 1회만 상호작용할 수 있습니다.',
          retryAfter: 60,
        })
      }
    } catch (err) {
      console.error('[interactions] rate limit 체크 실패:', err)
      return res.status(500).json({ error: 'Rate limit 처리 중 오류가 발생했습니다.' })
    }

    try {
      const [post, user] = await Promise.all([
        client.fetch(
          '*[_type == "post" && _id == $postId][0]{ _id, likes, "authorId": author._ref }',
          { postId }
        ),
        client.fetch(
          '*[_type == "user" && email == $email][0]{ _id, likedPosts }',
          { email: session.user.email }
        ),
      ])

      if (!post || !user) {
        return res.status(404).json({ error: 'Post or user not found' })
      }

      const hasLiked = user.likedPosts?.some((ref) => ref._ref === postId)

      if (hasLiked) {
        // 좋아요 취소
        await Promise.all([
          client.patch(postId).set({ likes: Math.max((post.likes || 0) - 1, 0) }).commit(),
          client.patch(user._id).unset([`likedPosts[_ref == "${postId}"]`]).commit(),
        ])
        return res.status(200).json({
          liked: false,
          likes: Math.max((post.likes || 0) - 1, 0),
        })
      } else {
        // 좋아요 추가
        await Promise.all([
          client.patch(postId).set({ likes: (post.likes || 0) + 1 }).commit(),
          client
            .patch(user._id)
            .setIfMissing({ likedPosts: [] })
            .append('likedPosts', [{ _type: 'reference', _ref: postId }])
            .commit(),
        ])

        // 포인트 트리거: 작성자에게 LIKE_POINT_AMOUNT 포인트 부여
        if (post.authorId) {
          await incrementAuthorPoints(post.authorId, LIKE_POINT_AMOUNT)
        }

        return res.status(200).json({
          liked: true,
          likes: (post.likes || 0) + 1,
        })
      }
    } catch (err) {
      console.error('[interactions] like 처리 실패:', err)
      return res.status(500).json({ error: 'Failed to process like' })
    }
  }

  return res.status(400).json({ error: '지원하지 않는 action입니다.' })
}
