import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import PropTypes from 'prop-types'
import styles from './Search.module.css'

export default function Search({ placeholder, autoFocus }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const performSearch = async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults(null)
      setIsOpen(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=all`)
      const data = await res.json()
      if (res.ok) {
        setResults(data.results)
        setIsOpen(true)
      } else {
        setResults(null)
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    setQuery(value)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      performSearch(value)
    }, 300)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const hasResults = results && (results.posts.length > 0 || results.trends.length > 0 || results.vips.length > 0)

  return (
    <div className={styles.searchContainer} ref={searchRef}>
      <div className={styles.searchInput}>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder || '검색어를 입력하세요'}
          autoFocus={autoFocus}
        />
        {loading && <div className={styles.spinner}></div>}
      </div>
      {isOpen && query.length >= 2 && (
        <div className={styles.searchResults}>
          {loading ? (
            <div className={styles.loading}>검색 중...</div>
          ) : hasResults ? (
            <>
              {results.posts.length > 0 && (
                <div className={styles.resultSection}>
                  <h3>포스트</h3>
                  {results.posts.map((post) => (
                    <Link href={`/posts/${post.slug.current}`} key={post._id} className={styles.resultItem}>
                      <div className={styles.resultTitle}>{post.title}</div>
                      <div className={styles.resultMeta}>
                        {post.category} · {post.author}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {results.trends.length > 0 && (
                <div className={styles.resultSection}>
                  <h3>트렌드</h3>
                  {results.trends.map((trend) => (
                    <div key={trend._id} className={styles.resultItem}>
                      <div className={styles.resultTitle}>{trend.keyword}</div>
                    </div>
                  ))}
                </div>
              )}
              {results.vips.length > 0 && (
                <div className={styles.resultSection}>
                  <h3>VIP</h3>
                  {results.vips.map((vip) => (
                    <div key={vip._id} className={styles.resultItem}>
                      <div className={styles.resultTitle}>{vip.name}</div>
                      <div className={styles.resultMeta}>{vip.platform}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className={styles.viewAll}>
                <Link href={`/search?q=${encodeURIComponent(query)}`}>모든 결과 보기 →</Link>
              </div>
            </>
          ) : (
            <div className={styles.noResults}>검색 결과가 없습니다.</div>
          )}
        </div>
      )}
    </div>
  )
}

Search.propTypes = {
  placeholder: PropTypes.string,
  autoFocus: PropTypes.bool,
}
