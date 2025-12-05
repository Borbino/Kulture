import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import SEOHead from '../../../components/SEOHead'
import Toast from '../../../components/Toast'
import styles from '../../../styles/EventDetail.module.css'

export default function EventDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const { data: session } = useSession()

  const [event, setEvent] = useState(null)
  const [attendees, setAttendees] = useState([])
  const [isAttending, setIsAttending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (id) {
      fetchEvent()
    }
  }, [id])

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/events?id=${id}`)
      const data = await res.json()

      if (data.events?.[0]) {
        setEvent(data.events[0])
        setAttendees(data.events[0].attendees || [])

        if (session?.user?.id) {
          setIsAttending(data.events[0].attendees?.some(a => a._id === session.user.id))
        }
      }
    } catch (error) {
      console.error(error)
      setToast({ type: 'error', message: '이벤트 로드 실패' })
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!session) {
      setToast({ type: 'error', message: '로그인 후 이벤트에 참여할 수 있습니다.' })
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch('/api/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: id,
          action: 'join',
          userId: session.user?.id,
        }),
      })

      if (res.ok) {
        setIsAttending(true)
        setToast({ type: 'success', message: '이벤트에 참여되었습니다!' })
        fetchEvent()
      } else {
        setToast({ type: 'error', message: '참여 실패' })
      }
    } catch (error) {
      console.error(error)
      setToast({ type: 'error', message: '오류가 발생했습니다.' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleLeave = async () => {
    if (!confirm('이벤트 참여를 취소하시겠습니까?')) return

    setActionLoading(true)
    try {
      const res = await fetch('/api/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: id,
          action: 'leave',
          userId: session.user?.id,
        }),
      })

      if (res.ok) {
        setIsAttending(false)
        setToast({ type: 'success', message: '이벤트 참여가 취소되었습니다.' })
        fetchEvent()
      } else {
        setToast({ type: 'error', message: '취소 실패' })
      }
    } catch (error) {
      console.error(error)
      setToast({ type: 'error', message: '오류가 발생했습니다.' })
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <>
        <SEOHead title="이벤트 로딩 중 - Kulture" />
        <div className={styles.container}>
          <div className={styles.loading}>로딩 중...</div>
        </div>
      </>
    )
  }

  if (!event) {
    return (
      <>
        <SEOHead title="이벤트를 찾을 수 없습니다 - Kulture" />
        <div className={styles.container}>
          <div className={styles.notFound}>
            <p>이벤트를 찾을 수 없습니다.</p>
          </div>
        </div>
      </>
    )
  }

  const isOrganizer = session?.user?.id === event.organizer?._id

  return (
    <>
      <SEOHead title={`${event.title} - Kulture`} />

      <div className={styles.container}>
        {/* Event Header */}
        <div className={styles.header}>
          {event.image && (
            <div className={styles.eventImage}>
              <img src={event.image} alt={event.title} />
            </div>
          )}

          <div className={styles.headerContent}>
            <h1>{event.title}</h1>

            <div className={styles.meta}>
              <span>📅 {formatDate(event.startDate)}</span>
              {event.location && <span>📍 {event.location}</span>}
              <span>👥 {attendees.length}명 참여</span>
              {event.ticketPrice > 0 && <span>💰 ${event.ticketPrice}</span>}
            </div>

            <p className={styles.description}>{event.description}</p>

            <div className={styles.actions}>
              {!isAttending ? (
                <button
                  className={styles.joinBtn}
                  onClick={handleJoin}
                  disabled={actionLoading}
                >
                  {actionLoading ? '...' : '참여하기'}
                </button>
              ) : (
                <button
                  className={styles.leaveBtn}
                  onClick={handleLeave}
                  disabled={actionLoading}
                >
                  {actionLoading ? '...' : '참여 취소'}
                </button>
              )}

              {isOrganizer && (
                <button className={styles.editBtn}>
                  ✏️ 편집
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Organizer Info */}
        <div className={styles.organizer}>
          <h3>주최자</h3>
          <div className={styles.organizerCard}>
            {event.organizer?.image && (
              <img src={event.organizer.image} alt={event.organizer.name} />
            )}
            <div>
              <h4>{event.organizer?.name}</h4>
              <p>{event.organizer?.email}</p>
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className={styles.details}>
          <div className={styles.detailCard}>
            <h3>📌 이벤트 정보</h3>
            <div className={styles.detailItem}>
              <span>시작:</span>
              <strong>{formatDate(event.startDate)}</strong>
            </div>
            <div className={styles.detailItem}>
              <span>종료:</span>
              <strong>{formatDate(event.endDate)}</strong>
            </div>
            {event.location && (
              <div className={styles.detailItem}>
                <span>장소:</span>
                <strong>{event.location}</strong>
              </div>
            )}
            <div className={styles.detailItem}>
              <span>카테고리:</span>
              <strong>{event.category}</strong>
            </div>
          </div>

          <div className={styles.detailCard}>
            <h3>🎟️ 티켓 정보</h3>
            <div className={styles.detailItem}>
              <span>가격:</span>
              <strong>{event.ticketPrice > 0 ? `$${event.ticketPrice}` : '무료'}</strong>
            </div>
            <div className={styles.detailItem}>
              <span>참여자:</span>
              <strong>
                {event.ticketLimit > 0
                  ? `${attendees.length}/${event.ticketLimit}`
                  : `${attendees.length}명`}
              </strong>
            </div>
          </div>
        </div>

        {/* Attendees */}
        {attendees.length > 0 && (
          <div className={styles.attendees}>
            <h3>참여자 ({attendees.length}명)</h3>
            <div className={styles.attendeesList}>
              {attendees.slice(0, 12).map((attendee) => (
                <div key={attendee._id} className={styles.attendeeCard}>
                  {attendee.image && (
                    <img src={attendee.image} alt={attendee.name} title={attendee.name} />
                  )}
                  <small>{attendee.name}</small>
                </div>
              ))}
              {attendees.length > 12 && (
                <div className={styles.attendeeCard}>
                  <span className={styles.more}>+{attendees.length - 12}</span>
                  <small>더보기</small>
                </div>
              )}
            </div>
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
