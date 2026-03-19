/**
 * [설명] CEO 콘텐츠 승인 대시보드
 * [경로] /admin/content-review
 * [목적] AI 생성 콘텐츠 승인/거절
 */

import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import sanity from '../../lib/sanityClient'
import OptimizedImage from '../../components/OptimizedImage'
import styles from './content-review.module.css'
import { logger } from '../../lib/logger.js';

export default function ContentReview() {
  const { data: session, status } = useSession()
  const [pendingPosts, setPendingPosts] = useState([])
  const [selectedPost, setSelectedPost] = useState(null)
  const [loading, setLoading] = useState(false)

  const isAdmin = session?.user?.role === 'admin' ||
    (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').includes(session?.user?.email || '')

  useEffect(() => {
    if (isAdmin) {
      loadPendingPosts()
    }
  }, [isAdmin])

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
          createdAt,
          priorityScore,
          pollData,
          modelLog
        }
      `)
      setPendingPosts(posts)
    } catch (error) {
      logger.error('Failed to load posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const [feedbackModal, setFeedbackModal] = useState(null) // 'reject' or 'improve'
  const [feedbackText, setFeedbackText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const approvePost = async postId => {
    if (!confirm('이 콘텐츠를 승인하시겠습니까?')) return

    try {
      await sanity
        .patch(postId)
        .set({
          status: 'approved',
          publishedAt: new Date().toISOString(),
        })
        .commit()

      alert('승인되었습니다!')
      loadPendingPosts()
      setSelectedPost(null)
    } catch (error) {
      alert('승인 실패: ' + error.message)
    }
  }

  const rejectPost = async (postId, reason) => {
    try {
      // CEO 피드백을 학습 데이터로 저장
      await sanity.create({
        _type: 'ceoFeedback',
        action: 'reject',
        contentId: postId,
        feedback: reason,
        timestamp: new Date().toISOString(),
      })

      await sanity
        .patch(postId)
        .set({
          status: 'rejected',
          rejectionReason: reason,
        })
        .commit()

      alert('거절되었습니다. AI가 이 피드백을 학습하여 향후 콘텐츠 생성에 반영합니다.')
      loadPendingPosts()
      setSelectedPost(null)
      setFeedbackModal(null)
      setFeedbackText('')
    } catch (error) {
      alert('거절 실패: ' + error.message)
    }
  }

  const improvePost = async (postId, feedback) => {
    setIsProcessing(true)
    try {
      // 무료 AI로 콘텐츠 개선 (Hugging Face API 사용)
      const response = await fetch('/api/improve-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          feedback,
          originalContent: selectedPost,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // CEO 피드백 저장
        await sanity.create({
          _type: 'ceoFeedback',
          action: 'improve',
          contentId: postId,
          feedback,
          timestamp: new Date().toISOString(),
        })

        alert('콘텐츠가 개선되었습니다. 다시 확인해주세요.')
        loadPendingPosts()
        setSelectedPost(null)
        setFeedbackModal(null)
        setFeedbackText('')
      } else {
        alert('개선 실패: ' + result.error)
      }
    } catch (error) {
      alert('개선 실패: ' + error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFeedbackSubmit = () => {
    if (!feedbackText.trim()) {
      alert('피드백을 입력해주세요.')
      return
    }

    if (feedbackModal === 'reject') {
      rejectPost(selectedPost._id, feedbackText)
    } else if (feedbackModal === 'improve') {
      improvePost(selectedPost._id, feedbackText)
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

  if (status === 'loading') {
    return <div className={styles.loginContainer}><p>로딩 중...</p></div>
  }

  if (!session || !isAdmin) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginForm}>
          <h1>CEO 콘텐츠 승인 대시보드</h1>
          <p>관리자 계정으로 로그인이 필요합니다.</p>
          <button onClick={() => signIn()} className={styles.loginButton}>
            로그인
          </button>
        </div>
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
              {pendingPosts.map(post => (
                <li
                  key={post._id}
                  className={selectedPost?._id === post._id ? styles.selected : ''}
                  onClick={() => setSelectedPost(post)}
                >
                  <div className={styles.postItem}>
                    <div className={styles.badgeContainer}>
                      {post.priorityScore >= 8 ? (
                        <span className={`${styles.badge} ${styles.badgeHighRevenue}`}>
                          🔥 고수익 예상 (Score: {post.priorityScore})
                        </span>
                      ) : post.priorityScore <= 7 ? (
                        <span className={`${styles.badge} ${styles.badgeStableRevenue}`}>
                          안정적 수익 (Score: {post.priorityScore})
                        </span>
                      ) : null}
                      {post.pollData && (
                        <span className={`${styles.badge} ${styles.badgePoll}`}>
                          📊 투표(Poll) 장착됨
                        </span>
                      )}
                      {post.modelLog ? (
                        <span className={`${styles.badge} ${styles.badgeEconomy}`}>
                          💰 절약 모드 생성
                        </span>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgePremium}`}>
                          💎 프리미엄 생성
                        </span>
                      )}
                    </div>
                    <h3>{post.title}</h3>
                    <div className={styles.postMeta}>
                      <span className={styles.trustScore}>
                        신뢰도: {post.metadata?.trustScore || 0}
                      </span>
                      <span className={styles.source}>{post.metadata?.source}</span>
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
                    className={styles.approveButtonOneClick}
                    disabled={isProcessing}
                  >
                    ✓ 원클릭 승인 (Publish)
                  </button>
                  <button
                    onClick={() => {
                      setFeedbackModal('improve')
                      setFeedbackText('')
                    }}
                    className={styles.improveButton}
                    disabled={isProcessing}
                  >
                    ✎ 보완
                  </button>
                  <button
                    onClick={() => {
                      setFeedbackModal('reject')
                      setFeedbackText('')
                    }}
                    className={styles.rejectButton}
                    disabled={isProcessing}
                  >
                    ✗ 거절
                  </button>
                </div>
              </div>

              {/* CEO 피드백 모달 */}
              {feedbackModal && (
                <div className={styles.modalOverlay}>
                  <div className={styles.modal}>
                    <h3>{feedbackModal === 'reject' ? '거절 사유' : '보완 지시사항'}</h3>
                    <p className={styles.modalDescription}>
                      {feedbackModal === 'reject'
                        ? 'AI가 이 피드백을 학습하여 향후 콘텐츠 생성 시 반영합니다.'
                        : '무료 AI가 CEO님의 피드백을 바탕으로 콘텐츠를 즉시 개선합니다.'}
                    </p>
                    <textarea
                      className={styles.feedbackTextarea}
                      placeholder={
                        feedbackModal === 'reject'
                          ? '예: 출처가 불명확하고, 내용이 선정적입니다. 향후 더 공신력 있는 출처를 사용하세요.'
                          : '예: 제목을 더 흥미롭게 바꿔주세요. 본문에 구체적인 통계를 추가해주세요.'
                      }
                      value={feedbackText}
                      onChange={e => setFeedbackText(e.target.value)}
                      rows={6}
                      disabled={isProcessing}
                    />
                    <div className={styles.modalActions}>
                      <button
                        onClick={handleFeedbackSubmit}
                        className={styles.submitButton}
                        disabled={isProcessing}
                      >
                        {isProcessing ? '처리 중...' : '제출'}
                      </button>
                      <button
                        onClick={() => {
                          setFeedbackModal(null)
                          setFeedbackText('')
                        }}
                        className={styles.cancelButton}
                        disabled={isProcessing}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className={styles.processingOverlay}>
                  <div className={styles.spinner}></div>
                  <p>AI가 콘텐츠를 개선하고 있습니다...</p>
                </div>
              )}

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
                  <OptimizedImage
                    src={selectedPost.image.url}
                    alt={selectedPost.title}
                    width={800}
                    height={450}
                    priority={true}
                  />
                </div>
              )}

              <div className={styles.bodyPreview}>
                <h3>본문</h3>
                <textarea
                  value={selectedPost.body}
                  onChange={e => setSelectedPost({ ...selectedPost, body: e.target.value })}
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
