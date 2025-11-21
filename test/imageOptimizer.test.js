/**
 * Image Optimizer 테스트
 * URL 유효성, 이미지 치수, 썸네일 URL, Blur placeholder, Sanity URL 검증
 */

import {
  isValidImageUrl,
  getImageDimensions,
  extractThumbnailUrl,
  generateBlurPlaceholder,
  getImagePriority,
  generateImageSrcSet,
  getImageProps,
  buildSanityImageUrl,
} from '../lib/imageOptimizer.js'

describe('Image Optimizer', () => {
  describe('isValidImageUrl', () => {
    test('유효한 HTTP URL', () => {
      expect(isValidImageUrl('http://example.com/image.jpg')).toBe(true)
    })

    test('유효한 HTTPS URL', () => {
      expect(isValidImageUrl('https://example.com/image.png')).toBe(true)
    })

    test('유효하지 않은 URL', () => {
      expect(isValidImageUrl('not-a-url')).toBe(false)
      expect(isValidImageUrl('')).toBe(false)
      expect(isValidImageUrl(null)).toBe(false)
      expect(isValidImageUrl(undefined)).toBe(false)
    })

    test('프로토콜 없는 URL', () => {
      expect(isValidImageUrl('//example.com/image.jpg')).toBe(false)
    })

    test('file:// 프로토콜', () => {
      expect(isValidImageUrl('file:///path/to/image.jpg')).toBe(false)
    })
  })

  describe('getImageDimensions', () => {
    test('원본 크기가 maxWidth보다 작으면 그대로 반환', () => {
      const result = getImageDimensions(800, 600, 1200)
      expect(result).toEqual({ width: 800, height: 600 })
    })

    test('원본 크기가 maxWidth보다 크면 비율 유지하며 축소', () => {
      const result = getImageDimensions(1600, 1200, 1200)
      expect(result.width).toBe(1200)
      expect(result.height).toBe(900) // 1200 * (1200/1600)
    })

    test('width/height 없으면 16:9 비율로 기본값 반환', () => {
      const result = getImageDimensions(null, null, 1200)
      expect(result.width).toBe(1200)
      expect(result.height).toBe(675) // 1200 * 0.5625
    })

    test('width만 없을 때', () => {
      const result = getImageDimensions(null, 800, 1200)
      expect(result.width).toBe(1200)
      expect(result.height).toBe(675)
    })
  })

  describe('extractThumbnailUrl', () => {
    test('YouTube URL에서 썸네일 추출', () => {
      const content = 'Check this video: https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      const result = extractThumbnailUrl(content)
      expect(result).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
    })

    test('짧은 YouTube URL에서 썸네일 추출', () => {
      const content = 'Watch: https://youtu.be/dQw4w9WgXcQ'
      const result = extractThumbnailUrl(content)
      expect(result).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
    })

    test('Twitter 이미지 URL 추출', () => {
      const content = '![Twitter](https://pbs.twimg.com/media/abc123.jpg)'
      const result = extractThumbnailUrl(content)
      expect(result).toBe('https://pbs.twimg.com/media/abc123.jpg')
    })

    test('Reddit 이미지 URL 추출', () => {
      const content = 'Image: https://preview.redd.it/abc123.jpg?width=640'
      const result = extractThumbnailUrl(content)
      expect(result).toContain('preview.redd.it/abc123.jpg')
    })

    test('일반 이미지 URL 추출', () => {
      const content = 'Here is an image: https://example.com/photo.jpg'
      const result = extractThumbnailUrl(content)
      expect(result).toBe('https://example.com/photo.jpg')
    })

    test('이미지 URL이 없으면 null 반환', () => {
      const content = 'No image here'
      const result = extractThumbnailUrl(content)
      expect(result).toBeNull()
    })

    test('빈 문자열 처리', () => {
      expect(extractThumbnailUrl('')).toBeNull()
      expect(extractThumbnailUrl(null)).toBeNull()
    })
  })

  describe('generateBlurPlaceholder', () => {
    test('기본 10x10 회색 SVG 생성', () => {
      const result = generateBlurPlaceholder()
      expect(result).toContain('data:image/svg+xml;base64')

      // Base64 디코딩하여 내용 확인
      const base64Part = result.replace('data:image/svg+xml;base64,', '')
      const decoded = Buffer.from(base64Part, 'base64').toString()
      expect(decoded).toContain('width="10"')
      expect(decoded).toContain('height="10"')
    })

    test('커스텀 사이즈', () => {
      const result = generateBlurPlaceholder(20, 15)

      const base64Part = result.replace('data:image/svg+xml;base64,', '')
      const decoded = Buffer.from(base64Part, 'base64').toString()
      expect(decoded).toContain('width="20"')
      expect(decoded).toContain('height="15"')
    })

    test('Base64 인코딩 확인', () => {
      const result = generateBlurPlaceholder()
      const base64Part = result.replace('data:image/svg+xml;base64,', '')
      expect(() => Buffer.from(base64Part, 'base64')).not.toThrow()
    })
  })

  describe('getImagePriority', () => {
    test('첫 3개 이미지는 우선 로드', () => {
      expect(getImagePriority(0)).toBe(true)
      expect(getImagePriority(1)).toBe(true)
      expect(getImagePriority(2)).toBe(true)
    })

    test('4번째 이미지부터는 lazy loading', () => {
      expect(getImagePriority(3)).toBe(false)
      expect(getImagePriority(10)).toBe(false)
    })

    test('Above the fold 이미지는 항상 우선', () => {
      expect(getImagePriority(5, true)).toBe(true)
      expect(getImagePriority(10, true)).toBe(true)
    })
  })

  describe('generateImageSrcSet', () => {
    test('기본 사이즈로 srcset 생성', () => {
      const url = 'https://example.com/image.jpg'
      const result = generateImageSrcSet(url)

      expect(result).toContain('640w')
      expect(result).toContain('750w')
      expect(result).toContain('828w')
      expect(result).toContain('1080w')
      expect(result).toContain('1200w')
    })

    test('커스텀 사이즈', () => {
      const url = 'https://example.com/image.jpg'
      const result = generateImageSrcSet(url, [320, 640, 960])

      expect(result).toContain('320w')
      expect(result).toContain('640w')
      expect(result).toContain('960w')
      expect(result).not.toContain('1200w')
    })

    test('유효하지 않은 URL은 빈 문자열 반환', () => {
      const result = generateImageSrcSet('not-a-url')
      expect(result).toBe('')
    })
  })

  describe('getImageProps', () => {
    test('유효한 URL로 props 생성', () => {
      const src = 'https://example.com/image.jpg'
      const result = getImageProps(src)

      expect(result).toMatchObject({
        src,
        alt: 'Image',
        width: 1200,
        height: 675,
        priority: false,
        quality: 75,
        loading: 'lazy',
        placeholder: 'blur',
      })
      expect(result.blurDataURL).toContain('data:image/svg+xml')
    })

    test('우선 로드 이미지', () => {
      const src = 'https://example.com/image.jpg'
      const result = getImageProps(src, { priority: true })

      expect(result.priority).toBe(true)
      expect(result.loading).toBe('eager')
    })

    test('커스텀 alt 텍스트', () => {
      const src = 'https://example.com/image.jpg'
      const result = getImageProps(src, { alt: 'K-Pop idol' })

      expect(result.alt).toBe('K-Pop idol')
    })

    test('유효하지 않은 URL은 null 반환', () => {
      const result = getImageProps('invalid-url')
      expect(result).toBeNull()
    })
  })

  describe('buildSanityImageUrl', () => {
    const originalEnv = process.env

    beforeEach(() => {
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_SANITY_PROJECT_ID: 'test-project',
        NEXT_PUBLIC_SANITY_DATASET: 'production',
      }
    })

    afterEach(() => {
      process.env = originalEnv
    })

    test('Sanity 이미지 URL 생성', () => {
      const image = {
        asset: {
          _ref: 'image-abc123-1920x1080-jpg',
        },
      }

      const result = buildSanityImageUrl(image)

      expect(result).toContain('cdn.sanity.io/images/test-project/production')
      expect(result).toContain('abc123')
      expect(result).toContain('w=1200')
      expect(result).toContain('q=75')
    })

    test('커스텀 width/quality', () => {
      const image = {
        asset: {
          _ref: 'image-def456-800x600-jpg',
        },
      }

      const result = buildSanityImageUrl(image, { width: 640, quality: 90 })

      expect(result).toContain('w=640')
      expect(result).toContain('q=90')
    })

    test('환경변수 없으면 null 반환', () => {
      process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = ''

      const image = {
        asset: {
          _ref: 'image-abc123-1920x1080-jpg',
        },
      }

      const result = buildSanityImageUrl(image)
      expect(result).toBeNull()
    })

    test('image.asset 없으면 null 반환', () => {
      const image = {}
      const result = buildSanityImageUrl(image)
      expect(result).toBeNull()
    })

    test('_id 형식도 지원', () => {
      const image = {
        asset: {
          _id: 'image-ghi789-1024x768-png',
        },
      }

      const result = buildSanityImageUrl(image)

      expect(result).toContain('ghi789')
      expect(result).toContain('cdn.sanity.io')
    })
  })
})
