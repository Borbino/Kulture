// Sanity 쿼리 헬퍼 함수 모음
import sanity from './sanityClient'

/**
 * 단일 타입 쿼리
 */
export async function fetchSingle(type, query = '*[0]') {
  return sanity.fetch(`*[_type == "${type}"]${query}`)
}

/**
 * 다중 타입 쿼리
 */
export async function fetchMultiple(type, limit = 10) {
  return sanity.fetch(`*[_type == "${type}"][0...${limit}]`)
}

/**
 * 특정 필드만 추출
 */
export async function fetchField(type, field) {
  return sanity.fetch(`*[_type == "${type}"][0].${field}`)
}

// ...필요시 추가 함수 작성
