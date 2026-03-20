import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import InfiniteScrollPosts from '../components/InfiniteScrollPosts'
import styles from '../styles/Search.module.css'

export default function SearchPage() {
  const router = useRouter()
  const { q, tag, category } = router.query
  const [activeFilter, setActiveFilter] = useState('all')

  return (
    <>
      <Head>
        <title>
          {q
            ? `"${q}" 검색 결과 - Kulture`
            : tag
            ? `#${tag} 태그 - Kulture`
            : `${category} 카테고리 - Kulture`}
        </title>
      </Head>

      <div className={styles.container}>
        {/* Search Header */}
        <div className={styles.searchHeader}>
          <h1>
            {q ? `"${q}" 검색 결과` : tag ? `#${tag}` : `${category} 카테고리`}
          </h1>
          <p>관련 게시글을 찾아보세요.</p>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${activeFilter === 'all' ? styles.active : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            모두
          </button>
          <button
            className={`${styles.filterBtn} ${activeFilter === 'latest' ? styles.active : ''}`}
            onClick={() => setActiveFilter('latest')}
          >
            최신
          </button>
          <button
            className={`${styles.filterBtn} ${activeFilter === 'popular' ? styles.active : ''}`}
            onClick={() => setActiveFilter('popular')}
          >
            인기
          </button>
          <button
            className={`${styles.filterBtn} ${activeFilter === 'comments' ? styles.active : ''}`}
            onClick={() => setActiveFilter('comments')}
          >
            댓글
          </button>
        </div>

        {/* Posts */}
        <div className={styles.postsContainer}>
          <InfiniteScrollPosts
            search={q}
            tag={tag}
            category={category}
            sort={activeFilter === 'all' ? 'latest' : activeFilter}
          />
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
