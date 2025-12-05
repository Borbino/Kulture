import { useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import SEOHead from '../../components/SEOHead'
import Toast from '../../components/Toast'
import styles from '../../styles/CreateEvent.module.css'

export default function CreateEventPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    startDate: '',
    endDate: '',
    location: '',
    category: 'meetup',
    ticketPrice: 0,
    ticketLimit: 0,
  })

  if (!session) {
    return (
      <>
        <SEOHead title="이벤트 만들기 - Kulture" />
        <div className={styles.container}>
          <div className={styles.notLoggedIn}>
            <p>로그인 후 이벤트를 만들 수 있습니다.</p>
          </div>
        </div>
      </>
    )
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      setToast({ type: 'error', message: '이벤트 제목을 입력하세요.' })
      return
    }

    if (!formData.description.trim()) {
      setToast({ type: 'error', message: '이벤트 설명을 입력하세요.' })
      return
    }

    if (!formData.startDate) {
      setToast({ type: 'error', message: '시작 시간을 입력하세요.' })
      return
    }

    if (!formData.endDate) {
      setToast({ type: 'error', message: '종료 시간을 입력하세요.' })
      return
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setToast({ type: 'error', message: '종료 시간이 시작 시간 이후여야 합니다.' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        setToast({ type: 'success', message: '이벤트가 생성되었습니다!' })
        setTimeout(() => {
          router.push(`/event/${data._id}`)
        }, 1500)
      } else {
        setToast({ type: 'error', message: data.error || '이벤트 생성 실패' })
      }
    } catch (error) {
      console.error(error)
      setToast({ type: 'error', message: '오류가 발생했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SEOHead title="이벤트 만들기 - Kulture" />

      <div className={styles.container}>
        <div className={styles.header}>
          <h1>새 이벤트 만들기</h1>
          <p>다른 사람들과 함께할 멋진 이벤트를 만들어보세요</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="title">이벤트 제목 *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="예: K-POP 팬 밋업"
              maxLength={100}
              required
            />
            <small>{formData.title.length}/100</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">이벤트 설명 *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="이벤트에 대한 상세한 설명을 입력하세요."
              rows={5}
              maxLength={1000}
              required
            />
            <small>{formData.description.length}/1000</small>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label htmlFor="startDate">시작 시간 *</label>
              <input
                type="datetime-local"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="endDate">종료 시간 *</label>
              <input
                type="datetime-local"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label htmlFor="location">장소</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="예: 서울시 강남구"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="category">카테고리</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="conference">컨퍼런스</option>
                <option value="concert">콘서트</option>
                <option value="workshop">워크숍</option>
                <option value="meetup">밋업</option>
                <option value="sports">스포츠</option>
                <option value="other">기타</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="image">이벤트 이미지 URL</label>
            <input
              type="url"
              id="image"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
            {formData.image && (
              <div className={styles.imagePreview}>
                <img src={formData.image} alt="Preview" />
              </div>
            )}
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label htmlFor="ticketPrice">티켓 가격 ($)</label>
              <input
                type="number"
                id="ticketPrice"
                name="ticketPrice"
                value={formData.ticketPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="ticketLimit">최대 참여자 수 (0 = 무제한)</label>
              <input
                type="number"
                id="ticketLimit"
                name="ticketLimit"
                value={formData.ticketLimit}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? '만드는 중...' : '이벤트 만들기'}
          </button>
        </form>

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
