import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import PropTypes from 'prop-types'
import styles from './CommentSection.module.css'

export default function CommentSection({ postId }) {
  const { data: session } = useSession()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?postId=${postId}`)
      const data = await res.json()
      if (res.ok) {
        setComments(data.comments)
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!session) {
      alert('로그인이 필요합니다')
      return
    }
    if (newComment.trim().length < 10) {
      alert('댓글은 최소 10자 이상 입력해주세요')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content: newComment, parentCommentId: replyTo }),
      })
      const data = await res.json()
      if (res.ok) {
        alert(data.message)
        setNewComment('')
        setReplyTo(null)
        fetchComments()
      } else {
        alert(data.error)
      }
    } catch {
      alert('댓글 작성에 실패했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading...</div>
  }

  return (
    <div className={styles.commentSection}>
      <h3>댓글 {comments.length}</h3>
      {session ? (
        <form onSubmit={handleSubmit}>
          {replyTo && <div>답글 작성 중 <button type="button" onClick={() => setReplyTo(null)}>취소</button></div>}
          <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="댓글을 입력하세요" rows={4} disabled={submitting} />
          <button type="submit" disabled={submitting}>{submitting ? '작성 중...' : '댓글 작성'}</button>
        </form>
      ) : (
        <div>로그인이 필요합니다</div>
      )}
      <div>
        {comments.length === 0 ? (
          <div>첫 댓글을 작성해보세요!</div>
        ) : (
          comments.map((comment) => (
            <div key={comment._id}>
              <div><strong>{comment.author}</strong> {new Date(comment.createdAt).toLocaleDateString('ko-KR')}</div>
              <p>{comment.content}</p>
              {session && <button onClick={() => setReplyTo(comment._id)}>답글</button>}
              {comment.replies && comment.replies.length > 0 && (
                <div style={{ marginLeft: '20px' }}>
                  {comment.replies.map((reply) => (
                    <div key={reply._id}>
                      <div><strong>{reply.author}</strong></div>
                      <p>{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

CommentSection.propTypes = {
  postId: PropTypes.string.isRequired,
}
