import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import SEOHead from '../../../components/SEOHead'
import InfiniteScrollPosts from '../../../components/InfiniteScrollPosts'
import Toast from '../../../components/Toast'
import styles from '../../../styles/CommunityDetail.module.css'

export default function CommunityDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const { data: session } = useSession()

  const [community, setCommunity] = useState(null)
  const [members, setMembers] = useState([])
  const [isMember, setIsMember] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [activeTab, setActiveTab] = useState('posts')
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if (id) {
      fetchCommunity()
    }
  }, [id])

  const fetchCommunity = async () => {
    try {
      const res = await fetch(`/api/communities?id=${id}`)
      const data = await res.json()
      
      if (data.communities?.[0]) {
        setCommunity(data.communities[0])
        setMembers(data.communities[0].members || [])
        
        if (session?.user?.id) {
          setIsMember(data.communities[0].members?.some(m => m._id === session.user.id))
        }
      }
    } catch (error) {
      console.error(error)
      setToast({ type: 'error', message: '커뮤니티 로드 실패' })
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!session) {
      setToast({ type: 'error', message: '로그인 후 참여할 수 있습니다.' })
      return
    }

    try {
      const res = await fetch('/api/communities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communityId: id,
          action: 'addMember',
          targetUserId: session.user?.id,
        }),
      })

      if (res.ok) {
        setIsMember(true)
        setToast({ type: 'success', message: '커뮤니티에 참여되었습니다!' })
        fetchCommunity()
      } else {
        setToast({ type: 'error', message: '참여 실패' })
      }
    } catch (error) {
      console.error(error)
      setToast({ type: 'error', message: '오류가 발생했습니다.' })
    }
  }

  const handleLeave = async () => {
    if (!confirm('정말로 커뮤니티를 나가시겠습니까?')) return

    try {
      const res = await fetch('/api/communities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communityId: id,
          action: 'removeMember',
          targetUserId: session.user?.id,
        }),
      })

      if (res.ok) {
        setIsMember(false)
        setToast({ type: 'success', message: '커뮤니티에서 나왔습니다.' })
        router.push('/communities')
      } else {
        setToast({ type: 'error', message: '나가기 실패' })
      }
    } catch (error) {
      console.error(error)
      setToast({ type: 'error', message: '오류가 발생했습니다.' })
    }
  }

  if (loading) {
    return (
      <>
        <SEOHead title="커뮤니티 로딩 중 - Kulture" />
        <div className={styles.container}>
          <div className={styles.loading}>로딩 중...</div>
        </div>
      </>
    )
  }

  if (!community) {
    return (
      <>
        <SEOHead title="커뮤니티를 찾을 수 없습니다 - Kulture" />
        <div className={styles.container}>
          <div className={styles.notFound}>
            <p>커뮤니티를 찾을 수 없습니다.</p>
          </div>
        </div>
      </>
    )
  }

  const isOwner = session?.user?.id === community.owner?._id

  return (
    <>
      <SEOHead title={`${community.name} - Kulture`} />

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          {community.image && (
            <div className={styles.headerImage}>
              <img src={community.image} alt={community.name} />
            </div>
          )}

          <div className={styles.headerContent}>
            <h1>{community.name}</h1>
            <p className={styles.description}>{community.description}</p>

            <div className={styles.meta}>
              <span>👥 {members.length}명</span>
              <span>📝 {community.postCount || 0}개</span>
              {community.isPrivate && <span>🔒 비공개</span>}
            </div>

            <div className={styles.actions}>
              {!isMember ? (
                <button className={styles.joinBtn} onClick={handleJoin}>
                  참여하기
                </button>
              ) : (
                <>
                  {isOwner && (
                    <button
                      className={styles.settingsBtn}
                      onClick={() => setShowSettings(!showSettings)}
                    >
                      ⚙️ 설정
                    </button>
                  )}
                  <button className={styles.leaveBtn} onClick={handleLeave}>
                    나가기
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {isMember ? (
          <>
            {/* Tabs */}
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'posts' ? styles.active : ''}`}
                onClick={() => setActiveTab('posts')}
              >
                게시글
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'members' ? styles.active : ''}`}
                onClick={() => setActiveTab('members')}
              >
                멤버 ({members.length})
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'posts' && (
              <div className={styles.content}>
                <InfiniteScrollPosts
                  query={`?community=${id}`}
                  showEditor={isMember}
                  editorContext={{
                    type: 'community',
                    communityId: id,
                    communityName: community.name,
                  }}
                />
              </div>
            )}

            {activeTab === 'members' && (
              <div className={styles.membersList}>
                {members.map((member) => (
                  <div key={member._id} className={styles.memberCard}>
                    {member.image && (
                      <img src={member.image} alt={member.name} />
                    )}
                    <div className={styles.memberInfo}>
                      <h3>{member.name}</h3>
                      <p>{member.email}</p>
                      {member._id === community.owner?._id && (
                        <span className={styles.ownerBadge}>👑 관리자</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className={styles.joinPrompt}>
            <p>커뮤니티에 참여하면 게시글과 멤버를 볼 수 있습니다.</p>
            <button className={styles.joinBtn} onClick={handleJoin}>
              참여하기
            </button>
          </div>
        )}

        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </>
  )
}
