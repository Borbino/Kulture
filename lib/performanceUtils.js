/**
 * [설명] 성능 최적화 유틸리티
 * [목적] 디바운싱, 쓰로틀링, 메모이제이션 등 성능 개선 함수
 * [일시] 2025-11-19 (KST)
 */

/**
 * 디바운스 - 마지막 호출 후 일정 시간이 지나면 실행
 * @param {Function} func - 실행할 함수
 * @param {number} wait - 대기 시간 (ms)
 * @returns {Function} 디바운스된 함수
 */
export function debounce(func, wait = 300) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * 쓰로틀 - 일정 시간마다 한 번만 실행
 * @param {Function} func - 실행할 함수
 * @param {number} limit - 제한 시간 (ms)
 * @returns {Function} 쓰로틀된 함수
 */
export function throttle(func, limit = 300) {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * 메모이제이션 - 함수 결과 캐싱
 * @param {Function} func - 캐싱할 함수
 * @returns {Function} 메모이제이션된 함수
 */
export function memoize(func) {
  const cache = new Map()
  return function memoized(...args) {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key)
    }
    const result = func(...args)
    cache.set(key, result)
    return result
  }
}

/**
 * 배치 처리 - 여러 요청을 묶어서 처리
 * @param {Function} func - 배치 처리할 함수
 * @param {number} wait - 대기 시간 (ms)
 * @param {number} maxSize - 최대 배치 크기
 * @returns {Function} 배치 처리 함수
 */
export function batch(func, wait = 100, maxSize = 10) {
  let queue = []
  let timeout

  return function batched(item) {
    queue.push(item)

    if (queue.length >= maxSize) {
      const items = queue
      queue = []
      clearTimeout(timeout)
      func(items)
    } else {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        if (queue.length > 0) {
          const items = queue
          queue = []
          func(items)
        }
      }, wait)
    }
  }
}

/**
 * 재시도 로직 - 실패 시 재시도
 * @param {Function} func - 재시도할 함수
 * @param {number} maxRetries - 최대 재시도 횟수
 * @param {number} delay - 재시도 간격 (ms)
 * @param {boolean} exponential - 지수 백오프 사용 여부
 * @returns {Promise} 함수 실행 결과
 */
export async function retry(func, maxRetries = 3, delay = 1000, exponential = true) {
  let lastError

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await func()
    } catch (error) {
      lastError = error
      if (i < maxRetries - 1) {
        const waitTime = exponential ? delay * Math.pow(2, i) : delay
        console.warn(`재시도 ${i + 1}/${maxRetries} (${waitTime}ms 후)`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  throw lastError
}

/**
 * 타임아웃 래퍼 - 함수에 타임아웃 적용
 * @param {Function} func - 실행할 함수
 * @param {number} timeout - 타임아웃 (ms)
 * @returns {Promise} 함수 실행 결과
 */
export async function withTimeout(func, timeout = 30000) {
  return Promise.race([
    func(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout exceeded')), timeout)
    ),
  ])
}

/**
 * 캐시 관리자
 */
export class CacheManager {
  constructor(ttl = 60000) {
    this.cache = new Map()
    this.ttl = ttl // Time to live in milliseconds
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    })
  }

  get(key) {
    const item = this.cache.get(key)
    if (!item) {
      return null
    }

    const age = Date.now() - item.timestamp
    if (age > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  has(key) {
    return this.get(key) !== null
  }

  clear() {
    this.cache.clear()
  }

  size() {
    return this.cache.size
  }
}

/**
 * Rate Limiter - API 요청 제한
 */
export class RateLimiter {
  constructor(maxRequests, timeWindow) {
    this.maxRequests = maxRequests
    this.timeWindow = timeWindow
    this.requests = []
  }

  async acquire() {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.timeWindow)

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0]
      const waitTime = this.timeWindow - (now - oldestRequest)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      return this.acquire()
    }

    this.requests.push(now)
    return true
  }
}

/**
 * 청크 처리 - 대용량 배열을 청크로 나누어 처리
 * @param {Array} array - 처리할 배열
 * @param {number} chunkSize - 청크 크기
 * @param {Function} processor - 각 청크를 처리할 함수
 * @returns {Promise<Array>} 처리 결과
 */
export async function processInChunks(array, chunkSize, processor) {
  const results = []
  
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize)
    const result = await processor(chunk, i / chunkSize)
    results.push(result)
  }
  
  return results.flat()
}

/**
 * 동시 실행 제한
 * @param {Array} tasks - 실행할 작업 배열
 * @param {number} concurrency - 동시 실행 제한
 * @returns {Promise<Array>} 실행 결과
 */
export async function limitConcurrency(tasks, concurrency = 5) {
  const results = []
  const executing = []

  for (const task of tasks) {
    const promise = Promise.resolve().then(() => task())
    results.push(promise)

    if (concurrency <= tasks.length) {
      const e = promise.then(() => executing.splice(executing.indexOf(e), 1))
      executing.push(e)
      if (executing.length >= concurrency) {
        await Promise.race(executing)
      }
    }
  }

  return Promise.all(results)
}

const performanceUtils = {
  debounce,
  throttle,
  memoize,
  batch,
  retry,
  withTimeout,
  CacheManager,
  RateLimiter,
  processInChunks,
  limitConcurrency,
}

export default performanceUtils
