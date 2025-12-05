import { useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import SEOHead from '../../components/SEOHead'
import Toast from '../../components/Toast'
import styles from '../../styles/SellProduct.module.css'

export default function SellProductPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    price: 0,
    discount: 0,
    category: 'merchandise',
    stock: 1,
  })

  if (!session) {
    return (
      <>
        <SEOHead title="상품 판매 - Kulture" />
        <div className={styles.container}>
          <div className={styles.notLoggedIn}>
            <p>로그인 후 상품을 판매할 수 있습니다.</p>
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
      setToast({ type: 'error', message: '상품명을 입력하세요.' })
      return
    }

    if (!formData.description.trim()) {
      setToast({ type: 'error', message: '상품 설명을 입력하세요.' })
      return
    }

    if (formData.price <= 0) {
      setToast({ type: 'error', message: '가격을 입력하세요.' })
      return
    }

    if (formData.stock <= 0) {
      setToast({ type: 'error', message: '재고 수량을 입력하세요.' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        setToast({ type: 'success', message: '상품이 등록되었습니다!' })
        setTimeout(() => {
          router.push(`/marketplace/${data._id}`)
        }, 1500)
      } else {
        setToast({ type: 'error', message: data.error || '상품 등록 실패' })
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
      <SEOHead title="상품 판매 - Kulture" />

      <div className={styles.container}>
        <div className={styles.header}>
          <h1>상품 판매하기</h1>
          <p>K-컬처 관련 상품을 판매하고 수익을 얻으세요</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="title">상품명 *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="예: BTS 공식 굿즈 세트"
              maxLength={100}
              required
            />
            <small>{formData.title.length}/100</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">상품 설명 *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="상품에 대한 상세한 설명을 입력하세요."
              rows={6}
              maxLength={1000}
              required
            />
            <small>{formData.description.length}/1000</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="image">상품 이미지 URL</label>
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
              <label htmlFor="price">가격 ($) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="discount">할인율 (%) (0-100)</label>
              <input
                type="number"
                id="discount"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
                min="0"
                max="100"
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label htmlFor="category">카테고리 *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="merchandise">굿즈</option>
                <option value="collectibles">수집품</option>
                <option value="digital">디지털</option>
                <option value="tickets">티켓</option>
                <option value="services">서비스</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="stock">재고 수량 *</label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                placeholder="1"
                min="1"
                required
              />
            </div>
          </div>

          {formData.discount > 0 && (
            <div className={styles.pricePreview}>
              <p>
                정가: <strong>${formData.price.toFixed(2)}</strong>
                <br />
                할인가: <strong className={styles.discountedPrice}>
                  ${(formData.price * (1 - formData.discount / 100)).toFixed(2)}
                </strong>
              </p>
            </div>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? '등록 중...' : '상품 등록하기'}
          </button>
        </form>

        <div className={styles.tips}>
          <h3>판매 팁</h3>
          <ul>
            <li>명확하고 상세한 상품 설명을 작성하세요.</li>
            <li>고질의 상품 이미지를 업로드하세요.</li>
            <li>적정한 가격을 설정하세요.</li>
            <li>빠른 배송으로 평점을 높이세요.</li>
            <li>고객 리뷰에 성실히 응하세요.</li>
          </ul>
        </div>

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
