import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import styles from '../styles/CommunityCard.module.css'

export default function CommunityCard({ community, onJoin }) {
  const { data: session } = useSession()
  const [isMember, setIsMember] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleJoin = async () => {
    if (!session) {
      alert('로그인 후 커뮤니티에 참여할 수 있습니다.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/communities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communityId: community._id,
          action: 'addMember',
          targetUserId: session.user?.id,
        }),
      })

      if (res.ok) {
        setIsMember(true)
        onJoin && onJoin()
      }
    } catch (error) {
      console.error(error)
      alert('커뮤니티 참여 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.card}>
      {community.image && (
        <div className={styles.cardImage}>
          <img src={community.image} alt={community.name} />
        </div>
      )}

      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{community.name}</h3>
        <p className={styles.cardDescription}>{community.description}</p>

        <div className={styles.cardMeta}>
          <span>👥 {community.memberCount} 멤버</span>
          <span>📝 {community.postCount} 게시글</span>
          {community.isPrivate && <span>🔒 비공개</span>}
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.organizer}>
            {community.owner?.image && (
              <img src={community.owner.image} alt={community.owner.name} />
            )}
            <small>{community.owner?.name}</small>
          </div>

          {!isMember ? (
            <button
              className={styles.joinBtn}
              onClick={handleJoin}
              disabled={loading}
            >
              {loading ? '...' : '참여'}
            </button>
          ) : (
            <Link href={`/community/${community._id}`}>
              <button className={styles.viewBtn}>보기</button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
