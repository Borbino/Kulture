/**
 * [설명] Next.js Image 최적화 유틸리티
 * [목적] 자동 WebP/AVIF 변환, Lazy Loading, 반응형 이미지
 */

/**
 * 이미지 URL 검증
 */
export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false

  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * 이미지 사이즈 계산
 */
export function getImageDimensions(width, height, maxWidth = 1200) {
  if (!width || !height) return { width: maxWidth, height: Math.round(maxWidth * 0.5625) }

  if (width > maxWidth) {
    const ratio = maxWidth / width
    return {
      width: maxWidth,
      height: Math.round(height * ratio),
    }
  }

  return { width, height }
}

/**
 * 소셜 미디어 썸네일 URL 추출
 */
export function extractThumbnailUrl(content) {
  if (!content || typeof content !== 'string') return null

  // YouTube 썸네일
  const youtubeMatch = content.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (youtubeMatch) {
    return `https://i.ytimg.com/vi/${youtubeMatch[1]}/hqdefault.jpg`
  }

  // Twitter 이미지 (markdown)
  const twitterImageMatch = content.match(/!\[.*?\]\((https:\/\/pbs\.twimg\.com\/[^)]+)\)/)
  if (twitterImageMatch) {
    return twitterImageMatch[1]
  }

  // Reddit 이미지
  const redditImageMatch = content.match(
    /(https:\/\/(?:external-preview|preview)\.redd\.it\/[^)\s]+)/
  )
  if (redditImageMatch) {
    return redditImageMatch[1]
  }

  // 일반 이미지 URL
  const imageMatch = content.match(/(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|avif))/i)
  if (imageMatch) {
    return imageMatch[1]
  }

  return null
}

/**
 * 이미지 로드 우선순위 결정
 */
export function getImagePriority(index, isFold = false) {
  // 첫 화면(Above the fold)에 있거나 첫 3개 이미지는 우선 로드
  return isFold || index < 3
}

/**
 * 반응형 이미지 srcset 생성
 */
export function generateImageSrcSet(url, sizes = [640, 750, 828, 1080, 1200]) {
  if (!isValidImageUrl(url)) return ''

  return sizes
    .map(size => {
      const params = new URLSearchParams({
        url,
        w: size,
        q: 75,
      })
      return `/_next/image?${params.toString()} ${size}w`
    })
    .join(', ')
}

/**
 * Blur placeholder 생성 (Base64)
 */
export function generateBlurPlaceholder(width = 10, height = 10) {
  // 10x10 픽셀 회색 이미지 (Base64)
  return `data:image/svg+xml;base64,${Buffer.from(
    `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#e5e7eb"/>
    </svg>
  `
  ).toString('base64')}`
}

/**
 * 이미지 로드 에러 핸들러
 */
export function handleImageError(event, fallbackUrl = '/images/placeholder.png') {
  event.target.src = fallbackUrl
  event.target.onerror = null // 무한 루프 방지
}

/**
 * Next.js Image 컴포넌트 props 생성
 */
export function getImageProps(
  src,
  {
    alt = 'Image',
    width = 1200,
    height = 675,
    priority = false,
    quality = 75,
    sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  } = {}
) {
  if (!isValidImageUrl(src)) {
    return null
  }

  return {
    src,
    alt,
    width,
    height,
    priority,
    quality,
    sizes,
    loading: priority ? 'eager' : 'lazy',
    placeholder: 'blur',
    blurDataURL: generateBlurPlaceholder(width, height),
  }
}

/**
 * Sanity 이미지 URL 빌더
 */
export function buildSanityImageUrl(image, { width = 1200, quality = 75, format = 'webp' } = {}) {
  if (!image?.asset) return null

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET

  if (!projectId || !dataset) {
    console.warn('[Image Optimizer] Sanity credentials not configured')
    return null
  }

  const imageId = image.asset._ref || image.asset._id
  if (!imageId) return null

  // Sanity Image URL 포맷: https://cdn.sanity.io/images/{projectId}/{dataset}/{imageId}-{width}x{height}.{format}
  const [assetId, dimensions] = imageId.replace('image-', '').split('-')
  const [w, h] = dimensions.split('x')

  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${assetId}-${w}x${h}.${format}?w=${width}&q=${quality}`
}
