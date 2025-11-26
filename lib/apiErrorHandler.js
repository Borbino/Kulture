/**
 * API 에러 핸들링 미들웨어 (재사용 가능)
 *
 * 목적:
 * - 중복된 try-catch-res.status().json() 패턴 제거
 * - 일관된 에러 응답 형식 제공
 * - 에러 로깅 중앙화
 *
 * 사용법:
 * export default withErrorHandler(async (req, res) => {
 *   // 로직 작성 (에러 발생 시 자동으로 핸들링됨)
 *   const data = await someAsyncOperation()
 *   return res.status(200).json({ success: true, data })
 * })
 */

/**
 * 에러 핸들링 미들웨어
 * @param {Function} handler - 원본 API 핸들러 함수
 * @param {Object} options - 옵션 설정
 * @param {string} options.logPrefix - 로그 접두사 (기본값: '[API Error]')
 * @param {boolean} options.includeStack - 스택 트레이스 포함 여부 (기본값: false)
 * @returns {Function} 래핑된 핸들러 함수
 */
export function withErrorHandler(handler, options = {}) {
  const { logPrefix = '[API Error]', includeStack = false } = options

  return async (req, res) => {
    try {
      return await handler(req, res)
    } catch (error) {
      console.error(logPrefix, error)

      const errorResponse = {
        error: error.message || 'Internal Server Error',
      }

      if (includeStack && process.env.NODE_ENV !== 'production') {
        errorResponse.stack = error.stack
      }

      // 이미 응답이 전송된 경우 무시
      if (res.headersSent) {
        return
      }

      res.status(500).json(errorResponse)
    }
  }
  }

// 표준화된 API 에러 핸들러
export default function apiErrorHandler(err, req, res, next) {
  const status = err.status || err.code || 500
  const isProd = process.env.NODE_ENV === 'production'
  const requestId = req.headers['x-request-id'] || req.headers['x-correlation-id'] || undefined

  const payload = {
    error: normalizeMessage(err),
    status: Number(status) || 500,
    requestId,
  }

  // 개발 환경에서는 간단한 디버그 힌트 포함
  if (!isProd) {
    payload.debug = {
      name: err.name,
      stack: typeof err.stack === 'string' ? err.stack.split('\n').slice(0, 3) : undefined,
      provider: err.provider,
      code: err.code,
    }
  }

  res.status(payload.status).json(payload)
}

function normalizeMessage(err) {
  if (!err) return 'Unknown error'
  if (typeof err === 'string') return err
  if (err.message) return err.message
  if (err.error) return String(err.error)
  return 'Unhandled error'
}

/**
 * 체크 함수용 에러 핸들러 (헬스체크 등에서 사용)
 * @param {Function} checkFunction - 체크를 수행하는 async 함수
 * @returns {Object} { ok: boolean, message: string }
 */
export async function tryCatch(checkFunction) {
  try {
    const result = await checkFunction()
    return result
  } catch (error) {
    return { ok: false, message: error.message }
  }
}

/**
 * Retry 로직이 포함된 에러 핸들러
 * @param {Function} operation - 수행할 작업
 * @param {number} maxAttempts - 최대 시도 횟수 (기본값: 3)
 * @param {number} baseDelay - 기본 지연 시간(ms) (기본값: 1000)
 * @param {string} logPrefix - 로그 접두사
 * @returns {Promise} 작업 결과
 * @throws {Error} 모든 시도 실패 시 마지막 에러
 */
export async function withRetry(
  operation,
  maxAttempts = 3,
  baseDelay = 1000,
  logPrefix = '[Retry]'
) {
  let lastError

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      if (attempt < maxAttempts - 1) {
        const delay = baseDelay * Math.pow(2, attempt)
        console.warn(
          `${logPrefix} Attempt ${attempt + 1}/${maxAttempts} failed: ${error.message}, retrying after ${delay}ms`
        )
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}
