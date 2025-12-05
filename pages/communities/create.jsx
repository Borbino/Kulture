import { useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import SEOHead from '../../components/SEOHead'
import Toast from '../../components/Toast'
import styles from '../../styles/CreateCommunity.module.css'

export default function CreateCommunityPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    isPrivate: false,
  })

  if (!session) {
    return (
      <>
        <SEOHead title="커뮤니티 만들기 - Kulture" />
        <div className={styles.container}>
          <div className={styles.notLoggedIn}>
            <p>로그인 후 커뮤니티를 만들 수 있습니다.</p>
          </div>
        </div>
      </>
    )
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setToast({ type: 'error', message: '커뮤니티 이름을 입력하세요.' })
      return
    }

    if (!formData.description.trim()) {
      setToast({ type: 'error', message: '커뮤니티 설명을 입력하세요.' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        setToast({ type: 'success', message: '커뮤니티가 생성되었습니다!' })
        setTimeout(() => {
          router.push(`/community/${data._id}`)
        }, 1500)
      } else {
        setToast({ type: 'error', message: data.error || '커뮤니티 생성 실패' })
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
      <SEOHead title="커뮤니티 만들기 - Kulture" />

      <div className={styles.container}>
        <div className={styles.header}>
          <h1>새 커뮤니티 만들기</h1>
          <p>공통의 관심사를 가진 사람들과 함께 커뮤니티를 만들어보세요</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="name">커뮤니티 이름 *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="예: K-POP 팬 커뮤니티"
              maxLength={50}
              required
            />
            <small>{formData.name.length}/50</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">커뮤니티 설명 *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="커뮤니티에 대한 상세한 설명을 입력하세요."
              rows={5}
              maxLength={500}
              required
            />
            <small>{formData.description.length}/500</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="image">커뮤니티 이미지 URL</label>
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

          <div className={styles.formGroup}>
            <label>
              <input
                type="checkbox"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleChange}
              />
              <span>비공개 커뮤니티 (초대된 사람만 참여 가능)</span>
            </label>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? '만드는 중...' : '커뮤니티 만들기'}
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
