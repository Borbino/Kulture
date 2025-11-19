// [설명] Sanity CMS 클라이언트 인스턴스 - 프로젝트 전체에서 단일 인스턴스 사용
// [일시] 2025-11-19 13:00 (KST)
// [수정] 2025-11-19 - 환경변수 검증 강화

import { createClient } from '@sanity/client'

// 환경변수 검증
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_TOKEN
const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.VERCEL

if (!projectId && !isBuildTime) {
  throw new Error(
    '❌ NEXT_PUBLIC_SANITY_PROJECT_ID 환경변수가 설정되지 않았습니다. ' +
      '.env.local 파일을 확인해주세요.'
  )
}

if (!token && !isBuildTime) {
  console.warn(
    '⚠️  SANITY_API_TOKEN이 설정되지 않았습니다. ' +
      '읽기 전용 모드로 작동합니다. CMS에 쓰기를 위해서는 토큰이 필요합니다.'
  )
}

// Sanity 클라이언트 생성
const client = createClient({
  projectId: projectId || 'placeholder',
  dataset,
  apiVersion: '2024-01-01',
  useCdn: process.env.NODE_ENV === 'production', // 프로덕션에서만 CDN 사용
  token,
  ignoreBrowserTokenWarning: true, // 브라우저 토큰 경고 무시
})

// 연결 테스트 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  client
    .fetch('*[_type == "siteSettings"][0]')
    .then(() => {
      console.log('✅ Sanity CMS 연결 성공')
    })
    .catch(error => {
      console.error('❌ Sanity CMS 연결 실패:', error.message)
    })
}

export default client
