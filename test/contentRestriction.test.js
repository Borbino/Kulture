// [설명] 비회원 콘텐츠 제한 기능 테스트
// [일시] 2025-11-19 13:30 (KST)
// [수정] 2025-11-20 08:44 (KST) - 관리자 설정 기반 테스트로 업데이트

import { maskContent, filterComments, shouldBlurImage } from '../utils/contentRestriction'

describe('contentRestriction utils', () => {
  describe('maskContent', () => {
    test('비회원은 기본 40%만 표시', () => {
      const content = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5'
      const result = maskContent(content, false, 40)

      expect(result).toContain('Line 1')
      expect(result).toContain('[로그인하여 전체 내용 보기]')
      expect(result.split('\n').length).toBeLessThan(content.split('\n').length)
    })

    test('비회원은 관리자 설정 비율(70%) 적용', () => {
      const content = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8\nLine 9\nLine 10'
      const result = maskContent(content, false, 70)

      const visibleLines = result.split('\n').filter(line => line.startsWith('Line')).length
      expect(visibleLines).toBe(7) // 10개 중 70% = 7개
    })

    test('회원은 전체 내용 표시', () => {
      const content = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5'
      const result = maskContent(content, true, 40)

      expect(result).toBe(content)
    })
  })

  describe('filterComments', () => {
    const comments = [
      { id: 1, content: 'Comment 1' },
      { id: 2, content: 'Comment 2' },
      { id: 3, content: 'Comment 3' },
      { id: 4, content: 'Comment 4' },
      { id: 5, content: 'Comment 5' },
    ]

    test('비회원은 기본 40%만 표시 + 잠금 메시지', () => {
      const result = filterComments(comments, false, 40)

      expect(result.length).toBe(3) // 2개 + 잠금 메시지
      expect(result[result.length - 1].isLocked).toBe(true)
    })

    test('비회원은 관리자 설정 비율(60%) 적용', () => {
      const result = filterComments(comments, false, 60)

      expect(result.length).toBe(4) // 3개 + 잠금 메시지
    })

    test('회원은 모든 댓글 표시', () => {
      const result = filterComments(comments, true, 40)

      expect(result.length).toBe(5)
      expect(result).toEqual(comments)
    })
  })

  describe('shouldBlurImage', () => {
    test('비회원은 3번째 이미지부터 블러', () => {
      expect(shouldBlurImage(0, false)).toBe(false)
      expect(shouldBlurImage(1, false)).toBe(false)
      expect(shouldBlurImage(2, false)).toBe(true)
      expect(shouldBlurImage(3, false)).toBe(true)
    })

    test('회원은 모든 이미지 선명', () => {
      expect(shouldBlurImage(0, true)).toBe(false)
      expect(shouldBlurImage(5, true)).toBe(false)
    })
  })
})
