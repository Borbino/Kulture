/**
 * 성능 최적화된 이미지 컴포넌트
 * - Lazy loading (Intersection Observer)
 * - Progressive loading (blur placeholder)
 * - WebP 자동 변환
 * - 반응형 srcset
 */

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import styles from './LazyImage.module.css';

export default function LazyImage({ 
  src, 
  alt, 
  width, 
  height, 
  priority = false,
  className = '',
  onLoad,
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef(null);

  useEffect(() => {
    if (priority) return; // 우선순위 이미지는 즉시 로드

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // 50px 전에 미리 로드
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  // WebP 변환 (Vercel Image Optimization 활용)
  const optimizedSrc = src?.startsWith('http') 
    ? `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`
    : src;

  return (
    <div 
      ref={imgRef}
      className={`${styles.container} ${className}`}
      style={{ width, height }}
    >
      {/* Blur placeholder */}
      {!isLoaded && (
        <div className={styles.placeholder}>
          <div className={styles.shimmer} />
        </div>
      )}

      {/* 실제 이미지 */}
      {isInView && (
        <img
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          className={`${styles.image} ${isLoaded ? styles.loaded : ''}`}
        />
      )}
    </div>
  );
}

LazyImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  priority: PropTypes.bool,
  className: PropTypes.string,
  onLoad: PropTypes.func,
};
