import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import SEOHead from '../../components/SEOHead'
import CommunityCard from '../../components/CommunityCard'
import Toast from '../../components/Toast'
import styles from '../../styles/Communities.module.css'

export default function CommunitiesPage() {
  const { data: session } = useSession()
  const [communities, setCommunities] = useState([])
  const [filteredCommunities, setFilteredCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all, joined, private
  const [toast, setToast] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchCommunities()
  }, [page, filter])

  useEffect(() => {
    filterCommunities()
  }, [search, communities])

  const fetchCommunities = async () => {
    setLoading(true)
    try {
      const isPrivate = filter === 'private' ? 'true' : filter === 'joined' ? 'false' : ''
      const url = `/api/communities?page=${page}&limit=12${isPrivate ? `&isPrivate=${isPrivate}` : ''}`
      
      const res = await fetch(url)
      const data = await res.json()

      if (data.communities) {
        setCommunities(prev => page === 1 ? data.communities : [...prev, ...data.communities])
        setHasMore(data.communities.length === 12)
      }
    } catch (error) {
      console.error(error)
      setToast({ type: 'error', message: '커뮤니티 로드 실패' })
    } finally {
      setLoading(false)
    }
  }

  const filterCommunities = () => {
    let filtered = communities
    
    if (search) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase())
      )
    }

    setFilteredCommunities(filtered)
  }

  const handleJoin = () => {
    setToast({ type: 'success', message: '커뮤니티에 참여되었습니다!' })
    fetchCommunities()
  }

  return (
    <>
      <SEOHead title="커뮤니티 - Kulture" />
      
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>커뮤니티</h1>
          <p>관심있는 커뮤니티에 참여하고 함께 이야기하세요</p>

          {session && (
            <Link href="/communities/create">
              <button className={styles.createBtn}>
                + 커뮤니티 만들기
              </button>
            </Link>
          )}
        </div>

        <div className={styles.controls}>
          <input
            type="text"
            placeholder="커뮤니티 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />

          <div className={styles.filters}>
            <button
              className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
              onClick={() => { setFilter('all'); setPage(1) }}
            >
              전체
            </button>
            <button
              className={`${styles.filterBtn} ${filter === 'joined' ? styles.active : ''}`}
              onClick={() => { setFilter('joined'); setPage(1) }}
            >
              참여중
            </button>
            <button
              className={`${styles.filterBtn} ${filter === 'private' ? styles.active : ''}`}
              onClick={() => { setFilter('private'); setPage(1) }}
            >
              비공개
            </button>
          </div>
        </div>

        {loading && page === 1 ? (
          <div className={styles.loading}>로딩 중...</div>
        ) : filteredCommunities.length === 0 ? (
          <div className={styles.empty}>
            <p>커뮤니티가 없습니다.</p>
            {session && (
              <Link href="/communities/create">
                <button className={styles.createBtn}>
                  첫 번째 커뮤니티 만들기
                </button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {filteredCommunities.map((community) => (
                <CommunityCard
                  key={community._id}
                  community={community}
                  onJoin={handleJoin}
                />
              ))}
            </div>

            {hasMore && (
              <button
                className={styles.loadMore}
                onClick={() => setPage(p => p + 1)}
                disabled={loading}
              >
                {loading ? '로딩 중...' : '더 보기'}
              </button>
            )}
          </>
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
