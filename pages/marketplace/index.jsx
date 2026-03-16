import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import SEOHead from '../../components/SEOHead'
import Toast from '../../components/Toast'
import styles from '../../styles/Marketplace.module.css'
import { logger } from '../../lib/logger.js';

export default function MarketplacePage() {
  const { data: session } = useSession()
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('newest')
  const [toast, setToast] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const categories = ['all', 'merchandise', 'collectibles', 'digital', 'tickets', 'services']

  useEffect(() => {
    fetchProducts()
  }, [page, category, sort])

  useEffect(() => {
    filterProducts()
  }, [search, products])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const url = `/api/marketplace?page=${page}&limit=12&category=${category}&sort=${sort}`
      
      const res = await fetch(url)
      const data = await res.json()

      if (data.products) {
        setProducts(prev => page === 1 ? data.products : [...prev, ...data.products])
        setHasMore(data.products.length === 12)
      }
    } catch (error) {
      logger.error(error)
      setToast({ type: 'error', message: '상품 로드 실패' })
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = products

    if (search) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
      )
    }

    setFilteredProducts(filtered)
  }

  const formatPrice = (price, discount = 0) => {
    const discountedPrice = price * (1 - discount / 100)
    return `$${discountedPrice.toFixed(2)}`
  }

  return (
    <>
      <SEOHead title="마켓플레이스 - Kulture" />

      <div className={styles.container}>
        <div className={styles.header}>
          <h1>마켓플레이스</h1>
          <p>K-컬처 관련 상품과 서비스를 거래하세요</p>

          {session && (
            <Link href="/marketplace/sell">
              <button className={styles.createBtn}>
                + 상품 판매하기
              </button>
            </Link>
          )}
        </div>

        <div className={styles.controls}>
          <input
            type="text"
            placeholder="상품 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />

          <div className={styles.filterGroup}>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1) }}
              className={styles.categorySelect}
            >
              <option value="all">전체 카테고리</option>
              {categories.filter(c => c !== 'all').map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'merchandise' && '굿즈'}
                  {cat === 'collectibles' && '수집품'}
                  {cat === 'digital' && '디지털'}
                  {cat === 'tickets' && '티켓'}
                  {cat === 'services' && '서비스'}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1) }}
              className={styles.sortSelect}
            >
              <option value="newest">최신순</option>
              <option value="popular">인기순</option>
              <option value="price-low">낮은 가격순</option>
              <option value="price-high">높은 가격순</option>
            </select>
          </div>
        </div>

        {loading && page === 1 ? (
          <div className={styles.loading}>로딩 중...</div>
        ) : filteredProducts.length === 0 ? (
          <div className={styles.empty}>
            <p>상품이 없습니다.</p>
            {session && (
              <Link href="/marketplace/sell">
                <button className={styles.createBtn}>
                  첫 번째 상품 판매하기
                </button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {filteredProducts.map((product) => (
                <Link key={product._id} href={`/marketplace/${product._id}`}>
                  <a className={styles.productCard}>
                    <div className={styles.productImage}>
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

                    <div className={styles.productContent}>
                      <h3>{product.title}</h3>

                      <div className={styles.productMeta}>
                        <span className={styles.category}>
                          {product.category === 'merchandise' && '🎀 굿즈'}
                          {product.category === 'collectibles' && '⭐ 수집품'}
                          {product.category === 'digital' && '💾 디지털'}
                          {product.category === 'tickets' && '🎟️ 티켓'}
                          {product.category === 'services' && '🛠️ 서비스'}
                        </span>
                        <span className={styles.rating}>
                          ⭐ {product.rating || 0}
                        </span>
                      </div>

                      <p className={styles.description}>{product.description}</p>

                      <div className={styles.productFooter}>
                        <div className={styles.price}>
                          {product.discount > 0 ? (
                            <>
                              <span className={styles.original}>
                                ${product.price.toFixed(2)}
                              </span>
                              <span className={styles.discounted}>
                                {formatPrice(product.price, product.discount)}
                              </span>
                            </>
                          ) : (
                            <span>${product.price.toFixed(2)}</span>
                          )}
                        </div>

                        <div className={styles.stock}>
                          {product.stock > 0 ? (
                            <span className={styles.inStock}>재고있음</span>
                          ) : (
                            <span className={styles.outOfStock}>품절</span>
                          )}
                        </div>
                      </div>

                      <div className={styles.seller}>
                        {product.seller?.image && (
                          <img src={product.seller.image} alt={product.seller.name} />
                        )}
                        <small>{product.seller?.name}</small>
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
