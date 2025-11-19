/**
 * [설명] 보안 유틸리티
 * [목적] XSS 방지, 입력 검증, 민감 정보 보호
 * [일시] 2025-11-19 (KST)
 */

/**
 * HTML 이스케이프 - XSS 공격 방지
 * @param {string} str - 이스케이프할 문자열
 * @returns {string} 이스케이프된 문자열
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') {
    return ''
  }

  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }

  return str.replace(/[&<>"'/]/g, char => htmlEscapes[char])
}

/**
 * URL 검증
 * @param {string} url - 검증할 URL
 * @returns {boolean} 유효한 URL 여부
 */
export function isValidUrl(url) {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * 이메일 검증
 * @param {string} email - 검증할 이메일
 * @returns {boolean} 유효한 이메일 여부
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * SQL Injection 방지용 입력 정제
 * @param {string} input - 정제할 입력
 * @returns {string} 정제된 입력
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return ''
  }

  // SQL 예약어 및 특수 문자 제거
  const dangerous = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
    'EXEC', 'EXECUTE', 'UNION', 'DECLARE', 'CAST', 'CONVERT',
    '--', '/*', '*/', ';', "'", '"', '=', '<', '>',
  ]

  let sanitized = input
  dangerous.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi')
    sanitized = sanitized.replace(regex, '')
  })

  return sanitized.trim()
}

/**
 * 비밀번호 강도 검증
 * @param {string} password - 검증할 비밀번호
 * @returns {Object} { valid: boolean, strength: string, issues: [] }
 */
export function validatePasswordStrength(password) {
  const issues = []
  let strength = 'weak'

  if (password.length < 8) {
    issues.push('최소 8자 이상이어야 합니다')
  }

  if (!/[a-z]/.test(password)) {
    issues.push('소문자를 포함해야 합니다')
  }

  if (!/[A-Z]/.test(password)) {
    issues.push('대문자를 포함해야 합니다')
  }

  if (!/[0-9]/.test(password)) {
    issues.push('숫자를 포함해야 합니다')
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    issues.push('특수문자를 포함해야 합니다')
  }

  const valid = issues.length === 0

  if (valid) {
    if (password.length >= 12) {
      strength = 'strong'
    } else if (password.length >= 10) {
      strength = 'medium'
    }
  }

  return { valid, strength, issues }
}

/**
 * CSRF 토큰 생성
 * @returns {string} CSRF 토큰
 */
export function generateCsrfToken() {
  const array = new Uint8Array(32)
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array)
  } else {
    // Node.js 환경
    const crypto = require('crypto')
    crypto.randomFillSync(array)
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * 안전한 JSON 파싱
 * @param {string} jsonString - 파싱할 JSON 문자열
 * @param {*} defaultValue - 파싱 실패 시 기본값
 * @returns {*} 파싱된 객체 또는 기본값
 */
export function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString)
  } catch {
    return defaultValue
  }
}

/**
 * 개인정보 마스킹
 * @param {string} data - 마스킹할 데이터
 * @param {string} type - 데이터 타입 (email, phone, name, card)
 * @returns {string} 마스킹된 데이터
 */
export function maskPersonalInfo(data, type = 'email') {
  if (!data) {
    return ''
  }

  switch (type) {
    case 'email': {
      const [local, domain] = data.split('@')
      if (!domain) {
        return data
      }
      const maskedLocal = local.substring(0, 2) + '*'.repeat(Math.max(local.length - 2, 1))
      return `${maskedLocal}@${domain}`
    }

    case 'phone': {
      const cleaned = data.replace(/\D/g, '')
      if (cleaned.length < 8) {
        return data
      }
      return cleaned.substring(0, 3) + '-****-' + cleaned.substring(cleaned.length - 4)
    }

    case 'name': {
      if (data.length <= 2) {
        return data[0] + '*'
      }
      return data[0] + '*'.repeat(data.length - 2) + data[data.length - 1]
    }

    case 'card': {
      const cleaned = data.replace(/\s/g, '')
      if (cleaned.length !== 16) {
        return data
      }
      return cleaned.substring(0, 4) + '-****-****-' + cleaned.substring(12)
    }

    default:
      return data
  }
}

/**
 * Rate Limiting 체크 (클라이언트 사이드)
 * @param {string} key - 제한 키
 * @param {number} maxAttempts - 최대 시도 횟수
 * @param {number} timeWindow - 시간 창 (ms)
 * @returns {boolean} 허용 여부
 */
export function checkRateLimit(key, maxAttempts = 5, timeWindow = 60000) {
  if (typeof window === 'undefined') {
    return true
  }

  const storageKey = `rate_limit_${key}`
  const now = Date.now()
  
  const stored = localStorage.getItem(storageKey)
  const attempts = stored ? JSON.parse(stored) : []
  
  // 시간 창 밖의 시도는 제거
  const recentAttempts = attempts.filter(timestamp => now - timestamp < timeWindow)
  
  if (recentAttempts.length >= maxAttempts) {
    return false
  }
  
  recentAttempts.push(now)
  localStorage.setItem(storageKey, JSON.stringify(recentAttempts))
  
  return true
}

/**
 * Content Security Policy 헤더 생성
 * @returns {Object} CSP 헤더
 */
export function generateCspHeaders() {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.sanity.io https://pagead2.googlesyndication.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.sanity.io https://*.sanity.io",
      "frame-src 'self' https://www.youtube.com https://player.vimeo.com",
      "media-src 'self' https:",
    ].join('; '),
  }
}

/**
 * 안전한 쿠키 설정
 * @param {string} name - 쿠키 이름
 * @param {string} value - 쿠키 값
 * @param {number} days - 유효 기간 (일)
 * @param {Object} options - 추가 옵션
 */
export function setSecureCookie(name, value, days = 7, options = {}) {
  if (typeof document === 'undefined') {
    return
  }

  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)

  const cookieOptions = {
    expires: expires.toUTCString(),
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    ...options,
  }

  const cookieString = [
    `${name}=${encodeURIComponent(value)}`,
    `expires=${cookieOptions.expires}`,
    `path=${cookieOptions.path}`,
    cookieOptions.secure ? 'Secure' : '',
    `SameSite=${cookieOptions.sameSite}`,
  ]
    .filter(Boolean)
    .join('; ')

  document.cookie = cookieString
}

/**
 * 입력 길이 제한
 * @param {string} input - 입력 문자열
 * @param {number} maxLength - 최대 길이
 * @returns {string} 제한된 문자열
 */
export function limitInputLength(input, maxLength = 1000) {
  if (typeof input !== 'string') {
    return ''
  }
  return input.substring(0, maxLength)
}

const securityUtils = {
  escapeHtml,
  isValidUrl,
  isValidEmail,
  sanitizeInput,
  validatePasswordStrength,
  generateCsrfToken,
  safeJsonParse,
  maskPersonalInfo,
  checkRateLimit,
  generateCspHeaders,
  setSecureCookie,
  limitInputLength,
}

export default securityUtils
