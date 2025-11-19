// [설명] Sanity CMS 클라이언트 인스턴스 - 프로젝트 전체에서 단일 인스턴스 사용
// [일시] 2025-11-19 13:00 (KST)

import { createClient } from '@sanity/client'

if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
  throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID is not defined')
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: process.env.NODE_ENV === 'production',
  token: process.env.SANITY_API_TOKEN,
})

export default client
