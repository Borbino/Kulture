import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import PropTypes from 'prop-types'
import Head from 'next/head'
import Link from 'next/link'
import CommentSection from '../../components/CommentSection'
import ReactionButton from '../../components/ReactionButton'
import FollowButton from '../../components/FollowButton'
import Toast from '../../components/Toast'
import PollComponent from '../../components/PollComponent'
import styles from '../../styles/PostDetail.module.css'

export default function Post() {
  const router = useRouter()
  const { slug } = router.query
  const { data: session } = useSession()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [poll, setPoll] = useState(null)
  const [pollLoading, setPollLoading] = useState(true)

  useEffect(() => {
    if (!slug) return

    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/posts?search=${slug}`)
        const data = await res.json()

        if (data.posts && data.posts.length > 0) {
          setPost(data.posts[0])
        } else {
          setError('게시글을 찾을 수 없습니다')
        }
      } catch (err) {
        setError('게시글 로드 실패')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [slug])

  useEffect(() => {
    const fetchPoll = async () => {
      setPollLoading(true)
      try {
        const res = await fetch('/api/polls?limit=1')
        const data = await res.json()
        setPoll(data?.polls?.[0] || null)
      } catch (err) {
        console.error('투표 로드 실패', err)
      } finally {
        setPollLoading(false)
      }
    }

    fetchPoll()
  }, [])

  const handlePollVote = async () => {
    try {
      const res = await fetch('/api/polls?limit=1')
      const data = await res.json()
      setPoll(data?.polls?.[0] || null)
    } catch (err) {
      console.error('투표 갱신 실패', err)
    }
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  if (error || !post) {
    return (
      <div className={styles.errorBox}>
        <h2>⚠️ {error || '게시글을 찾을 수 없습니다'}</h2>
        <Link href="/">
          <button className={styles.backBtn}>홈으로 돌아가기</button>
        </Link>
      </div>
    )
  }

  const publishedDate = new Date(post.publishedAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.mainImage,
    datePublished: post.publishedAt,
    dateModified: post._updatedAt || post.publishedAt,
    author: {
      '@type': 'Person',
      name: post.author?.name || 'Kulture',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Kulture',
      logo: {
        '@type': 'ImageObject',
        url: 'https://yoursite.com/logo.png',
      },
    },
  }

  return (
    <>
      <Head>
        <title>{post.title} - Kulture</title>
        <meta name="description" content={post.excerpt || post.title} />
        <meta name="keywords" content={post.keywords?.join(', ')} />
        <meta name="author" content={post.author?.name || 'Kulture'} />

        {/* Open Graph */}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://yoursite.com/posts/${post.slug}`} />
        {post.mainImage && <meta property="og:image" content={post.mainImage} />}
        <meta property="article:published_time" content={post.publishedAt} />
        <meta property="article:author" content={post.author?.name} />
        {post.categories?.map(cat => (
          <meta key={cat} property="article:tag" content={cat} />
        ))}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
        {post.mainImage && <meta name="twitter:image" content={post.mainImage} />}

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        <link rel="canonical" href={`https://yoursite.com/posts/${post.slug}`} />
      </Head>

      <article className={styles.container}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <a href="/">홈</a>
          <span className={styles.separator}>/</span>
          <span>{post.category?.title || '포스트'}</span>
        </nav>

        {/* Header */}
        <header className={styles.header}>
          {post.category && (
            <span className={styles.category}>{post.category.title}</span>
          )}
          <h1 className={styles.title}>{post.title}</h1>
          <div className={styles.meta}>
            <div className={styles.author}>
              {post.author?.image && (
                <img
                  src={post.author.image}
                  alt={post.author.name}
                  className={styles.authorImage}
                />
              )}
              <span className={styles.authorName}>{post.author?.name || 'Kulture AI'}</span>
            </div>
            <time className={styles.date}>{publishedDate}</time>
            {post.readTime && (
              <span className={styles.readTime}>{post.readTime}분 읽기</span>
            )}
          </div>
        </header>

        {/* Main Image */}
        {post.mainImage && (
          <div className={styles.mainImage}>
            <img src={post.mainImage} alt={post.title} />
          </div>
        )}

        {/* Content */}
        <div className={styles.content}>
          {post.body?.map((block, idx) => {
            if (block._type === 'block') {
              const Tag = block.style === 'h2' ? 'h2' : block.style === 'h3' ? 'h3' : 'p'
              return (
                <Tag key={idx} className={styles[block.style || 'normal']}>
                  {block.children?.map(child => child.text).join('')}
                </Tag>
              )
            }
            if (block._type === 'image') {
              return (
                <figure key={idx} className={styles.figure}>
                  <img src={block.url} alt={block.alt || ''} />
                  {block.caption && <figcaption>{block.caption}</figcaption>}
                </figure>
              )
            }
            return null
          })}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className={styles.tags}>
            {post.tags.map(tag => (
              <span key={tag} className={styles.tag}>
                #{tag}
              </span>
            ))}
          </div>
        )}
          {/* Poll */}
          {!pollLoading && poll && (
            <section className={styles.pollSection}>
              <h2 className={styles.sectionTitle}>커뮤니티 투표</h2>
              <PollComponent poll={poll} onVote={handlePollVote} />
            </section>
          )}


        {/* Share Buttons */}
        <div className={styles.shareButtons}>
          <button
            onClick={() =>
              window.open(
                `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`,
                '_blank'
              )
            }
            className={styles.shareButton}
          >
            Twitter 공유
          </button>
          <button
            onClick={() =>
              window.open(
                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
                '_blank'
              )
            }
            className={styles.shareButton}
          >
            Facebook 공유
          </button>
        </div>

        {/* Related Posts */}
        {relatedPosts && relatedPosts.length > 0 && (
          <section className={styles.relatedPosts}>
            <h2 className={styles.relatedTitle}>관련 포스트</h2>
            <div className={styles.relatedGrid}>
              {relatedPosts.map(related => (
                <a
                  key={related.slug}
                  href={`/posts/${related.slug}`}
                  className={styles.relatedCard}
                >
                  {related.mainImage && (
                    <div className={styles.relatedImage}>
                      <img src={related.mainImage} alt={related.title} />
                    </div>
                  )}
                  <div className={styles.relatedContent}>
                    <h3 className={styles.relatedCardTitle}>{related.title}</h3>
                    <p className={styles.relatedExcerpt}>{related.excerpt}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  )
}

Post.propTypes = {
  post: PropTypes.object,
  relatedPosts: PropTypes.array,
}

// Static Paths for SSG
export async function getStaticPaths() {
  // 실제로는 Sanity에서 모든 slug 가져옴
  return {
    paths: [],
    fallback: true,
  }
}

// Static Props for SSG
export async function getStaticProps({ params }) {
  const { slug } = params

  try {
    // 샘플 데이터 (실제로는 Sanity에서 가져옴)
    const post = {
      slug,
      title: 'K-POP 트렌드 분석: 2025년 상반기 리뷰',
      excerpt: 'AI가 분석한 2025년 상반기 K-POP 트렌드를 심층 분석합니다.',
      publishedAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
      category: { title: 'Analysis' },
      author: {
        name: 'Kulture AI',
        image: null,
      },
      mainImage: null,
      body: [
        {
          _type: 'block',
          style: 'h2',
          children: [{ text: '2025년 상반기 주요 트렌드' }],
        },
        {
          _type: 'block',
          style: 'normal',
          children: [
            {
              text: 'AI 분석 결과, 2025년 상반기에는 다음과 같은 주요 트렌드가 관찰되었습니다.',
            },
          ],
        },
      ],
      tags: ['K-POP', 'Trend', 'Analysis', '2025'],
      keywords: ['K-POP', '트렌드', '분석'],
      readTime: 5,
    }

    const relatedPosts = [
      {
        slug: 'kpop-global-expansion',
        title: 'K-POP의 글로벌 확장 전략',
        excerpt: 'K-POP이 세계 시장을 장악하는 방법',
        mainImage: null,
      },
    ]

    return {
      props: {
        post,
        relatedPosts,
      },
      revalidate: 3600, // 1시간마다 재생성
    }
  } catch (error) {
    console.error('[Post SSG] Error:', error)
    return {
      notFound: true,
    }
  }
}
