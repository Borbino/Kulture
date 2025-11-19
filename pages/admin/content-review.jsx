/**
 * [설명] CEO 콘텐츠 승인 대시보드
 * [경로] /admin/content-review
 * [목적] AI 생성 콘텐츠 승인/거절
 */

import { useState, useEffect } from 'react'
import { createClient } from '@sanity/client'
import styles from './content-review.module.css'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.NEXT_PUBLIC_SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

export default function ContentReview() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [pendingPosts, setPendingPosts] = useState([])
  const [selectedPost, setSelectedPost] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      loadPendingPosts()
    }
  }, [isAuthenticated])

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true)
    } else {
      alert('비밀번호가 틀렸습니다.')
    }
  }

  const loadPendingPosts = async () => {
    setLoading(true)
    try {
      const posts = await sanity.fetch(`
        *[_type == "post" && status == "pending"]
        | order(_createdAt desc)
        {
          _id,
          title,
          body,
          image,
          socialPosts,
          metadata,
          createdAt
        }
      `)
      setPendingPosts(posts)
    } catch (error) {
      console.error('Failed to load posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const approvePost = async (postId) => {
    if (!confirm('이 콘텐츠를 승인하시겠습니까?')) return

    try {
      await sanity.patch(postId).set({ 
        status: 'approved',
        publishedAt: new Date().toISOString(),
      }).commit()
      
      alert('승인되었습니다!')
      loadPendingPosts()
      setSelectedPost(null)
    } catch (error) {
      alert('승인 실패: ' + error.message)
    }
  }

  const rejectPost = async (postId) => {
    const reason = prompt('거절 사유를 입력하세요:')
    if (!reason) return

    try {
      await sanity.patch(postId).set({ 
        status: 'rejected',
        rejectionReason: reason,
      }).commit()
      
      alert('거절되었습니다.')
      loadPendingPosts()
      setSelectedPost(null)
    } catch (error) {
      alert('거절 실패: ' + error.message)
    }
  }

  const editPost = async (postId, updates) => {
    try {
      await sanity.patch(postId).set(updates).commit()
      alert('수정되었습니다.')
      loadPendingPosts()
    } catch (error) {
      alert('수정 실패: ' + error.message)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.loginContainer}>
        <form onSubmit={handleLogin} className={styles.loginForm}>
          <h1>CEO 콘텐츠 승인 대시보드</h1>
          <input
            type="password"
            placeholder="관리자 비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.passwordInput}
          />
          <button type="submit" className={styles.loginButton}>
            로그인
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>콘텐츠 승인 대시보드</h1>
        <div className={styles.stats}>
          <span>승인 대기: {pendingPosts.length}건</span>
          <button onClick={loadPendingPosts} className={styles.refreshButton}>
            새로고침
          </button>
        </div>
      </header>

      <div className={styles.content}>
        {/* 왼쪽: 콘텐츠 목록 */}
        <aside className={styles.sidebar}>
          <h2>승인 대기 목록</h2>
          {loading ? (
            <p>로딩 중...</p>
          ) : pendingPosts.length === 0 ? (
            <p>승인 대기 중인 콘텐츠가 없습니다.</p>
          ) : (
            <ul className={styles.postList}>
              {pendingPosts.map((post) => (
                <li
                  key={post._id}
                  className={selectedPost?._id === post._id ? styles.selected : ''}
                  onClick={() => setSelectedPost(post)}
                >
                  <div className={styles.postItem}>
                    <h3>{post.title}</h3>
                    <div className={styles.postMeta}>
                      <span className={styles.trustScore}>
                        신뢰도: {post.metadata?.trustScore || 0}
                      </span>
                      <span className={styles.source}>
                        {post.metadata?.source}
                      </span>
                    </div>
                    <time>{new Date(post.createdAt).toLocaleString('ko-KR')}</time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* 오른쪽: 콘텐츠 미리보기 */}
        <main className={styles.preview}>
          {selectedPost ? (
            <>
              <div className={styles.previewHeader}>
                <h2>{selectedPost.title}</h2>
                <div className={styles.actions}>
                  <button
                    onClick={() => approvePost(selectedPost._id)}
                    className={styles.approveButton}
                  >
                    ✓ 승인
                  </button>
                  <button
                    onClick={() => rejectPost(selectedPost._id)}
                    className={styles.rejectButton}
                  >
                    ✗ 거절
                  </button>
                </div>
              </div>

              <div className={styles.metadata}>
                <div className={styles.metaItem}>
                  <strong>신뢰도:</strong> {selectedPost.metadata?.trustScore}
                </div>
                <div className={styles.metaItem}>
                  <strong>출처:</strong> {selectedPost.metadata?.source}
                </div>
                <div className={styles.metaItem}>
                  <strong>트렌드:</strong> {selectedPost.metadata?.sourceIssue}
                </div>
                <div className={styles.metaItem}>
                  <strong>멘션 수:</strong> {selectedPost.metadata?.mentions?.toLocaleString()}
                </div>
                <div className={styles.metaItem}>
                  <strong>AI 모델:</strong> {selectedPost.metadata?.aiModel}
                </div>
              </div>

              {selectedPost.image?.url && (
                <div className={styles.imagePreview}>
                  <img src={selectedPost.image.url} alt={selectedPost.title} />
                </div>
              )}

              <div className={styles.bodyPreview}>
                <h3>본문</h3>
                <textarea
                  value={selectedPost.body}
                  onChange={(e) => setSelectedPost({ ...selectedPost, body: e.target.value })}
                  className={styles.bodyEditor}
                  rows={15}
                />
                <button
                  onClick={() => editPost(selectedPost._id, { body: selectedPost.body })}
                  className={styles.saveButton}
                >
                  본문 저장
                </button>
              </div>

              {selectedPost.socialPosts && (
                <div className={styles.socialPosts}>
                  <h3>소셜 미디어 포스트</h3>
                  <div className={styles.socialPreview}>
                    <div className={styles.socialItem}>
                      <strong>Twitter:</strong>
                      <p>{selectedPost.socialPosts.twitter}</p>
                    </div>
                    <div className={styles.socialItem}>
                      <strong>Instagram:</strong>
                      <p>{selectedPost.socialPosts.instagram}</p>
                    </div>
                    <div className={styles.socialItem}>
                      <strong>Facebook:</strong>
                      <p>{selectedPost.socialPosts.facebook}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              <p>왼쪽 목록에서 콘텐츠를 선택하세요</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
