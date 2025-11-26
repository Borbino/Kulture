import { getServerSession } from 'next-auth'
import { authOptions } from './auth/[...nextauth]'
import { getSanityClient } from '../../lib/sanityClient'

export default async function handler(req, res) {
  const client = getSanityClient()
  const session = await getServerSession(req, res, authOptions)

  // GET: 게시글별 댓글 조회
  if (req.method === 'GET') {
    const { postId } = req.query

    if (!postId) {
      return res.status(400).json({ error: 'postId is required' })
    }

    try {
      const comments = await client.fetch(
        `*[_type == "comment" && post._ref == $postId && approved == true] | order(createdAt desc) {
          _id,
          _createdAt,
          content,
          author,
          email,
          createdAt,
          likes,
          "replies": *[_type == "comment" && parentComment._ref == ^._id && approved == true] | order(createdAt asc) {
            _id,
            content,
            author,
            createdAt,
            likes
          }
        }`,
        { postId }
      )

      return res.status(200).json({ comments })
    } catch (error) {
      console.error('댓글 조회 실패:', error)
      return res.status(500).json({ error: '댓글 조회에 실패했습니다' })
    }
  }

  // POST: 댓글 작성
  if (req.method === 'POST') {
    if (!session) {
      return res.status(401).json({ error: '로그인이 필요합니다' })
    }

    const { postId, content, parentCommentId } = req.body

    if (!postId || !content) {
      return res.status(400).json({ error: '필수 항목을 입력해주세요' })
    }

    if (content.length < 10 || content.length > 1000) {
      return res.status(400).json({ error: '댓글은 10-1000자 사이여야 합니다' })
    }

    try {
      const comment = {
        _type: 'comment',
        post: { _type: 'reference', _ref: postId },
        author: session.user.name,
        email: session.user.email,
        content,
        approved: false, // 관리자 승인 필요
        createdAt: new Date().toISOString(),
        likes: 0,
      }

      if (parentCommentId) {
        comment.parentComment = { _type: 'reference', _ref: parentCommentId }
      }

      const result = await client.create(comment)

      return res.status(201).json({
        message: '댓글이 등록되었습니다. 관리자 승인 후 표시됩니다.',
        comment: result,
      })
    } catch (error) {
      console.error('댓글 작성 실패:', error)
      return res.status(500).json({ error: '댓글 작성에 실패했습니다' })
    }
  }

  // PATCH: 댓글 수정
  if (req.method === 'PATCH') {
    if (!session) {
      return res.status(401).json({ error: '로그인이 필요합니다' })
    }

    const { commentId, content } = req.body

    if (!commentId || !content) {
      return res.status(400).json({ error: '필수 항목을 입력해주세요' })
    }

    try {
      // 댓글 작성자 확인
      const comment = await client.fetch(
        '*[_type == "comment" && _id == $commentId][0]',
        { commentId }
      )

      if (!comment) {
        return res.status(404).json({ error: '댓글을 찾을 수 없습니다' })
      }

      if (comment.email !== session.user.email && session.user.role !== 'admin') {
        return res.status(403).json({ error: '권한이 없습니다' })
      }

      const result = await client
        .patch(commentId)
        .set({ content, approved: false }) // 수정 시 재승인 필요
        .commit()

      return res.status(200).json({
        message: '댓글이 수정되었습니다',
        comment: result,
      })
    } catch (error) {
      console.error('댓글 수정 실패:', error)
      return res.status(500).json({ error: '댓글 수정에 실패했습니다' })
    }
  }

  // DELETE: 댓글 삭제
  if (req.method === 'DELETE') {
    if (!session) {
      return res.status(401).json({ error: '로그인이 필요합니다' })
    }

    const { commentId } = req.body

    if (!commentId) {
      return res.status(400).json({ error: 'commentId is required' })
    }

    try {
      const comment = await client.fetch(
        '*[_type == "comment" && _id == $commentId][0]',
        { commentId }
      )

      if (!comment) {
        return res.status(404).json({ error: '댓글을 찾을 수 없습니다' })
      }

      if (comment.email !== session.user.email && session.user.role !== 'admin') {
        return res.status(403).json({ error: '권한이 없습니다' })
      }

      await client.delete(commentId)

      return res.status(200).json({ message: '댓글이 삭제되었습니다' })
    } catch (error) {
      console.error('댓글 삭제 실패:', error)
      return res.status(500).json({ error: '댓글 삭제에 실패했습니다' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
