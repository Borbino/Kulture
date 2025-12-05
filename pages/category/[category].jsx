import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import InfiniteScrollPosts from '../components/InfiniteScrollPosts'
import styles from '../styles/Category.module.css'

const CATEGORIES = {
  kpop: { name: 'K-POP', icon: '🎤', description: '케이팝 음악, 아이돌, 콘서트' },
  kdrama: { name: 'K-드라마', icon: '🎬', description: '한국 드라마, 영화, OST' },
  kfood: { name: 'K-음식', icon: '🍜', description: '한식, 요리, 음식 문화' },
  kbeauty: { name: 'K-뷰티', icon: '💄', description: '스킨케어, 코스메틱, 뷰티팁' },
  kfashion: { name: 'K-패션', icon: '👗', description: '한국 패션, 스타일, 트렌드' },
  ktourism: { name: 'K-여행', icon: '🗼', description: '한국 여행, 관광지, 문화유산' },
}

export default function CategoryPage() {
  const router = useRouter()
  const { category } = router.query
  const [sort, setSort] = useState('latest')

  const categoryInfo = CATEGORIES[category] || { name: '카테고리', icon: '📁', description: '' }

  return (
    <>
      <Head>
        <title>{categoryInfo.name} - Kulture</title>
        <meta name="description" content={categoryInfo.description} />
      </Head>

      <div className={styles.container}>
        {/* Category Header */}
        <div className={styles.categoryHeader}>
          <div className={styles.headerContent}>
            <h1>
              <span className={styles.icon}>{categoryInfo.icon}</span>
              {categoryInfo.name}
            </h1>
            <p>{categoryInfo.description}</p>
          </div>
        </div>

        {/* Sort Options */}
        <div className={styles.sortContainer}>
          <label htmlFor="sort">정렬:</label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={styles.sortSelect}
          >
            <option value="latest">최신순</option>
            <option value="popular">인기순</option>
            <option value="comments">댓글순</option>
            <option value="likes">좋아요순</option>
          </select>
        </div>

        {/* Posts */}
        <div className={styles.postsContainer}>
          <InfiniteScrollPosts category={category} sort={sort} />
        </div>

        {/* Advertisement */}
        <div className={styles.adSpace}>
          <div className={styles.adPlaceholder}>
            <h4>📢 광고</h4>
            <p>광고 공간</p>
          </div>
        </div>
      </div>
    </>
  )
}
