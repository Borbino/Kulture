/* eslint-disable react/prop-types */
import { useState } from 'react'
import { getImageProps, handleImageError, generateBlurPlaceholder } from '../lib/imageOptimizer'

export default function OptimizedImage({
  src,
  alt = 'Image',
  width = 1200,
  height = 675,
  priority = false,
  quality = 75,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  fallbackSrc = '/images/placeholder.png',
  className = '',
  ...props
}) {
  const [imgSrc, setImgSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)

  const imageProps = getImageProps(imgSrc, {
    alt,
    width,
    height,
    priority,
    quality,
    sizes,
  })

  if (!imageProps) {
    // Invalid image URL, use fallback
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 text-sm">No Image</span>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      <img
        {...imageProps}
        {...props}
        onLoad={() => setIsLoading(false)}
        onError={e => {
          handleImageError(e, fallbackSrc)
          setImgSrc(fallbackSrc)
          setIsLoading(false)
        }}
        style={{
          transition: 'opacity 0.3s ease-in-out',
          opacity: isLoading ? 0 : 1,
        }}
      />
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{
            backgroundImage: `url(${generateBlurPlaceholder(width, height)})`,
            backgroundSize: 'cover',
          }}
        />
      )}
    </div>
  )
}
