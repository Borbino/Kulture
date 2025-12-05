import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import SEOHead from '../../../components/SEOHead'
import Toast from '../../../components/Toast'
import styles from '../../../styles/ProductDetail.module.css'

export default function ProductDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const { data: session } = useSession()

  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (id) {
      fetchProduct()
    }
  }, [id])

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/marketplace?id=${id}`)
      const data = await res.json()

      if (data.products?.[0]) {
        setProduct(data.products[0])
      }
    } catch (error) {
      console.error(error)
      setToast({ type: 'error', message: '상품 로드 실패' })
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!session) {
      setToast({ type: 'error', message: '로그인 후 구매할 수 있습니다.' })
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch('/api/marketplace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: id,
          action: 'order',
          quantity,
          paymentId: `order_${Date.now()}`,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setToast({ type: 'success', message: '주문이 생성되었습니다!' })
        setTimeout(() => {
          router.push('/marketplace')
        }, 1500)
      } else {
        setToast({ type: 'error', message: data.error || '주문 생성 실패' })
      }
    } catch (error) {
      console.error(error)
      setToast({ type: 'error', message: '오류가 발생했습니다.' })
    } finally {
      setActionLoading(false)
    }
  }

  const formatPrice = (price, discount = 0) => {
    return price * (1 - discount / 100)
  }

  if (loading) {
    return (
      <>
        <SEOHead title="상품 로딩 중 - Kulture" />
        <div className={styles.container}>
          <div className={styles.loading}>로딩 중...</div>
        </div>
      </>
    )
  }

  if (!product) {
    return (
      <>
        <SEOHead title="상품을 찾을 수 없습니다 - Kulture" />
        <div className={styles.container}>
          <div className={styles.notFound}>
            <p>상품을 찾을 수 없습니다.</p>
          </div>
        </div>
      </>
    )
  }

  const finalPrice = formatPrice(product.price, product.discount)
  const savings = product.price - finalPrice

  return (
    <>
      <SEOHead title={`${product.title} - Kulture`} />

      <div className={styles.container}>
        <div className={styles.content}>
          {/* Product Image */}
          <div className={styles.imageSection}>
            {product.image ? (
              <img src={product.image} alt={product.title} />
            ) : (
              <div className={styles.placeholder}>이미지 없음</div>
            )}
            {product.discount > 0 && (
              <div className={styles.discountBadge}>
                -{product.discount}%
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className={styles.detailSection}>
            <h1>{product.title}</h1>

            <div className={styles.meta}>
              <span className={styles.category}>
                {product.category === 'merchandise' && '🎀 굿즈'}
                {product.category === 'collectibles' && '⭐ 수집품'}
                {product.category === 'digital' && '💾 디지털'}
                {product.category === 'tickets' && '🎟️ 티켓'}
                {product.category === 'services' && '🛠️ 서비스'}
              </span>
              <span className={styles.rating}>
                ⭐ {product.rating || 0} (0 리뷰)
              </span>
            </div>

            {/* Price */}
            <div className={styles.priceSection}>
              {product.discount > 0 ? (
                <>
                  <span className={styles.originalPrice}>
                    ${product.price.toFixed(2)}
                  </span>
                  <span className={styles.finalPrice}>
                    ${finalPrice.toFixed(2)}
                  </span>
                  <span className={styles.savings}>
                    절약: ${savings.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className={styles.finalPrice}>
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>

            {/* Description */}
            <div className={styles.description}>
              <h3>상품 설명</h3>
              <p>{product.description}</p>
            </div>

            {/* Stock */}
            <div className={styles.stock}>
              {product.stock > 0 ? (
                <span className={styles.inStock}>
                  ✓ 재고 있음 ({product.stock}개)
                </span>
              ) : (
                <span className={styles.outOfStock}>품절</span>
              )}
            </div>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className={styles.quantitySection}>
                <label htmlFor="quantity">수량:</label>
                <div className={styles.quantityControl}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity === 1}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    id="quantity"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.min(product.stock, Math.max(1, parseInt(e.target.value) || 1)))
                    }
                    min="1"
                    max={product.stock}
                  />
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity === product.stock}
                  >
                    +
                  </button>
                </div>
                <span className={styles.totalPrice}>
                  총액: ${(finalPrice * quantity).toFixed(2)}
                </span>
              </div>
            )}

            {/* Action Button */}
            {product.stock > 0 && (
              <button
                className={styles.buyBtn}
                onClick={handleAddToCart}
                disabled={actionLoading}
              >
                {actionLoading ? '처리 중...' : '지금 구매'}
              </button>
            )}

            {/* Seller Info */}
            <div className={styles.sellerSection}>
              <h3>판매자 정보</h3>
              <div className={styles.sellerCard}>
                {product.seller?.image && (
                  <img src={product.seller.image} alt={product.seller.name} />
                )}
                <div>
                  <h4>{product.seller?.name}</h4>
                  <p>{product.seller?.email}</p>
                  <button className={styles.contactBtn}>
                    💬 판매자에게 문의
                  </button>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className={styles.infoSection}>
              <h3>상품 정보</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span>카테고리</span>
                  <strong>{product.category}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>판매량</span>
                  <strong>{product.sales}개</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>평점</span>
                  <strong>⭐ {product.rating || 0}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>업로드</span>
                  <strong>{new Date(product._createdAt).toLocaleDateString('ko-KR')}</strong>
                </div>
              </div>
            </div>
          </div>
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
