import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { getSanityClient } from '../../../lib/sanityClient'

export default async function handler(req, res) {
  const client = getSanityClient()

  if (req.method === 'POST' && req.query.action === 'view') {
    const { postId } = req.body
    if (!postId) {
      return res.status(400).json({ error: 'postId is required' })
    }
    try {
      const post = await client.fetch('*[_type == "post" && _id == $postId][0]{ views }', { postId })
      const currentViews = post?.views || 0
      await client.patch(postId).set({ views: currentViews + 1 }).commit()
      return res.status(200).json({ views: currentViews + 1 })
    } catch {
      return res.status(500).json({ error: 'Failed to update views' })
    }
  }

  if (req.method === 'POST' && req.query.action === 'like') {
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ error: '로그인이 필요합니다' })
    }
    const { postId } = req.body
    if (!postId) {
      return res.status(400).json({ error: 'postId is required' })
    }
    try {
      const [post, user] = await Promise.all([
        client.fetch('*[_type == "post" && _id == $postId][0]{ _id, likes }', { postId }),
        client.fetch('*[_type == "user" && email == $email][0]{ _id, likedPosts }', { email: session.user.email }),
      ])
      if (!post || !user) {
        return res.status(404).json({ error: 'Not found' })
      }
      const hasLiked = user.likedPosts?.some((ref) => ref._ref === postId)
      if (hasLiked) {
        await Promise.all([
          client.patch(postId).set({ likes: (post.likes || 0) - 1 }).commit(),
          client.patch(user._id).unset([`likedPosts[_ref == "${postId}"]`]).commit(),
        ])
        return res.status(200).json({ liked: false, likes: (post.likes || 0) - 1 })
      } else {
        await Promise.all([
          client.patch(postId).set({ likes: (post.likes || 0) + 1 }).commit(),
          client.patch(user._id).setIfMissing({ likedPosts: [] }).append('likedPosts', [{ _type: 'reference', _ref: postId }]).commit(),
        ])
        return res.status(200).json({ liked: true, likes: (post.likes || 0) + 1 })
      }
    } catch {
      return res.status(500).json({ error: 'Failed to process like' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
