import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import SEOHead from '../../components/SEOHead'
import Toast from '../../components/Toast'
import styles from '../../styles/Events.module.css'

export default function EventsPage() {
  const { data: session } = useSession()
  const [events, setEvents] = useState([])
  const [filteredEvents, setFilteredEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('upcoming') // upcoming, past, joined
  const [category, setCategory] = useState('all')
  const [toast, setToast] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const categories = ['all', 'conference', 'concert', 'workshop', 'meetup', 'sports', 'other']

  useEffect(() => {
    fetchEvents()
  }, [page, filter, category])

  useEffect(() => {
    filterEvents()
  }, [search, events])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const filterQuery = filter === 'upcoming' ? `&startDate=${today}` : filter === 'past' ? `&endDate=${today}` : ''
      const categoryQuery = category !== 'all' ? `&category=${category}` : ''
      
      const url = `/api/events?page=${page}&limit=12${filterQuery}${categoryQuery}`
      
      const res = await fetch(url)
      const data = await res.json()

      if (data.events) {
        setEvents(prev => page === 1 ? data.events : [...prev, ...data.events])
        setHasMore(data.events.length === 12)
      }
    } catch (error) {
      console.error(error)
      setToast({ type: 'error', message: '이벤트 로드 실패' })
    } finally {
      setLoading(false)
    }
  }

  const filterEvents = () => {
    let filtered = events

    if (search) {
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.description?.toLowerCase().includes(search.toLowerCase())
      )
    }

    setFilteredEvents(filtered)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <>
      <SEOHead title="이벤트 - Kulture" />

      <div className={styles.container}>
        <div className={styles.header}>
          <h1>이벤트</h1>
          <p>다양한 이벤트에 참여하고 재미있는 경험을 나누세요</p>

          {session && (
            <Link href="/events/create">
              <button className={styles.createBtn}>
                + 이벤트 만들기
              </button>
            </Link>
          )}
        </div>

        <div className={styles.controls}>
          <input
            type="text"
            placeholder="이벤트 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />

          <div className={styles.filterGroup}>
            <div className={styles.filters}>
              <button
                className={`${styles.filterBtn} ${filter === 'upcoming' ? styles.active : ''}`}
                onClick={() => { setFilter('upcoming'); setPage(1) }}
              >
                예정중
              </button>
              <button
                className={`${styles.filterBtn} ${filter === 'past' ? styles.active : ''}`}
                onClick={() => { setFilter('past'); setPage(1) }}
              >
                지난 이벤트
              </button>
              <button
                className={`${styles.filterBtn} ${filter === 'joined' ? styles.active : ''}`}
                onClick={() => { setFilter('joined'); setPage(1) }}
              >
                참여중
              </button>
            </div>

            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1) }}
              className={styles.categorySelect}
            >
              <option value="all">전체 카테고리</option>
              {categories.filter(c => c !== 'all').map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'conference' && '컨퍼런스'}
                  {cat === 'concert' && '콘서트'}
                  {cat === 'workshop' && '워크숍'}
                  {cat === 'meetup' && '밋업'}
                  {cat === 'sports' && '스포츠'}
                  {cat === 'other' && '기타'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && page === 1 ? (
          <div className={styles.loading}>로딩 중...</div>
        ) : filteredEvents.length === 0 ? (
          <div className={styles.empty}>
            <p>이벤트가 없습니다.</p>
            {session && (
              <Link href="/events/create">
                <button className={styles.createBtn}>
                  첫 번째 이벤트 만들기
                </button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {filteredEvents.map((event) => (
                <Link key={event._id} href={`/event/${event._id}`}>
                  <a className={styles.eventCard}>
                    {event.image && (
                      <div className={styles.eventImage}>
                        <img src={event.image} alt={event.title} />
                      </div>
                    )}

                    <div className={styles.eventContent}>
                      <h3>{event.title}</h3>

                      <div className={styles.eventMeta}>
                        <span className={styles.date}>
                          📅 {formatDate(event.startDate)}
                        </span>
                        {event.location && (
                          <span className={styles.location}>
                            📍 {event.location}
                          </span>
                        )}
                      </div>

                      <p className={styles.description}>{event.description}</p>

                      <div className={styles.eventFooter}>
                        <span className={styles.attendees}>
                          👥 {event.attendeeCount || 0}명 참여
                        </span>
                        {event.ticketPrice > 0 && (
                          <span className={styles.price}>
                            💰 ${event.ticketPrice}
                          </span>
                        )}
                      </div>

                      <div className={styles.organizer}>
                        {event.organizer?.image && (
                          <img src={event.organizer.image} alt={event.organizer.name} />
                        )}
                        <small>{event.organizer?.name}</small>
                      </div>
                    </div>
                  </a>
                </Link>
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
