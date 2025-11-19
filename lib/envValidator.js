/**
 * [설명] 환경변수 검증 유틸리티
 * [목적] 프로젝트 시작 시 필수 환경변수 확인
 * [일시] 2025-11-19 (KST)
 */

/**
 * 필수 환경변수 목록
 */
const REQUIRED_ENV_VARS = {
  // Sanity CMS
  NEXT_PUBLIC_SANITY_PROJECT_ID: '필수: Sanity 프로젝트 ID',
  NEXT_PUBLIC_SANITY_DATASET: '필수: Sanity 데이터셋 이름',
  SANITY_API_TOKEN: '필수: Sanity API 토큰 (쓰기 권한)',

  // Cron 보안
  CRON_SECRET: '필수: Cron Job 인증 토큰',
}

/**
 * 선택적 환경변수 목록 (경고만 표시)
 */
const OPTIONAL_ENV_VARS = {
  // 소셜 미디어 API
  TWITTER_BEARER_TOKEN: 'Twitter API 토큰',
  YOUTUBE_API_KEY: 'YouTube Data API 키',
  INSTAGRAM_ACCESS_TOKEN: 'Instagram Graph API 토큰',
  FACEBOOK_ACCESS_TOKEN: 'Facebook Graph API 토큰',

  // AI API
  HUGGINGFACE_API_TOKEN: 'Hugging Face API 토큰',
  OPENROUTER_API_KEY: 'OpenRouter API 키',

  // 관리자
  NEXT_PUBLIC_ADMIN_PASSWORD: '관리자 페이지 비밀번호',

  // 기타
  GOOGLE_ADSENSE_CLIENT_ID: 'Google AdSense 클라이언트 ID',
}

/**
 * 환경변수 유효성 검증
 * @returns {Object} 검증 결과 { valid: boolean, errors: [], warnings: [] }
 */
export function validateEnvironmentVariables() {
  const errors = []
  const warnings = []

  // 필수 환경변수 검증
  Object.entries(REQUIRED_ENV_VARS).forEach(([key, description]) => {
    const value = process.env[key]
    if (!value || value.trim() === '') {
      errors.push(`❌ ${key}: ${description} - 값이 설정되지 않았습니다.`)
    } else if (value.includes('your_') || value.includes('xxx')) {
      errors.push(`❌ ${key}: ${description} - 기본값을 실제 값으로 변경해주세요.`)
    }
  })

  // 선택적 환경변수 검증 (경고)
  Object.entries(OPTIONAL_ENV_VARS).forEach(([key, description]) => {
    const value = process.env[key]
    if (!value || value.trim() === '') {
      warnings.push(`⚠️  ${key}: ${description} - 설정되지 않음 (선택 사항)`)
    } else if (value.includes('your_') || value.includes('xxx')) {
      warnings.push(`⚠️  ${key}: ${description} - 기본값 사용 중`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * 환경변수 검증 및 출력
 * 에러 발생 시 프로세스 종료
 */
export function checkEnvironment() {
  const result = validateEnvironmentVariables()

  if (!result.valid) {
    console.error('\n🚨 환경변수 검증 실패!\n')
    result.errors.forEach(error => console.error(error))
    console.error('\n.env.local 파일을 확인하고 필수 환경변수를 설정해주세요.\n')
    
    // 개발 환경에서는 경고만 표시
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
  }

  if (result.warnings.length > 0) {
    console.warn('\n⚠️  환경변수 경고:\n')
    result.warnings.forEach(warning => console.warn(warning))
    console.warn('\n')
  }

  if (result.valid && result.warnings.length === 0) {
    console.log('✅ 모든 환경변수가 올바르게 설정되었습니다.\n')
  }

  return result
}

/**
 * 특정 환경변수 안전하게 가져오기
 * @param {string} key - 환경변수 키
 * @param {string} defaultValue - 기본값
 * @returns {string} 환경변수 값
 */
export function getEnvVar(key, defaultValue = '') {
  const value = process.env[key]
  
  if (!value || value.trim() === '') {
    if (defaultValue) {
      return defaultValue
    }
    throw new Error(`환경변수 ${key}가 설정되지 않았습니다.`)
  }

  return value
}

/**
 * 환경변수 마스킹 (로그 출력용)
 * @param {string} value - 환경변수 값
 * @param {number} visibleChars - 표시할 문자 수
 * @returns {string} 마스킹된 값
 */
export function maskEnvVar(value, visibleChars = 4) {
  if (!value || value.length <= visibleChars) {
    return '***'
  }
  return value.substring(0, visibleChars) + '*'.repeat(value.length - visibleChars)
}

const envValidator = {
  validateEnvironmentVariables,
  checkEnvironment,
  getEnvVar,
  maskEnvVar,
}

export default envValidator
