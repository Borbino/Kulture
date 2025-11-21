/**
 * Lazy Load Wrapper Component
 * Intersection Observer API를 사용한 지연 로딩 컴포넌트
 */

import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'

export default function LazyLoad({
  children,
  placeholder = null,
  rootMargin = '200px',
  threshold = 0.01,
  onVisible,
}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            if (onVisible) {
              onVisible()
            }
            observer.disconnect()
          }
        })
      },
      {
        rootMargin,
        threshold,
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [rootMargin, threshold, onVisible])

  return <div ref={ref}>{isVisible ? children : placeholder}</div>
}

LazyLoad.propTypes = {
  children: PropTypes.node.isRequired,
  placeholder: PropTypes.node,
  rootMargin: PropTypes.string,
  threshold: PropTypes.number,
  onVisible: PropTypes.func,
}
