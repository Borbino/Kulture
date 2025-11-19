# 비회원 콘텐츠 제한 기능 가이드

## 개요

회원가입/로그인을 유도하기 위해 비회원에게 콘텐츠의 50% 이상을 제한하는 기능입니다.

## 제한 범위

### 1. 게시물 본문

- **비회원**: 상위 40%만 표시, 나머지는 블러 처리
- **회원**: 전체 내용 표시

### 2. 댓글

- **비회원**: 전체 댓글의 40%만 표시
- **회원**: 모든 댓글 표시

### 3. 이미지

- **비회원**: 처음 2개 이미지만 선명, 나머지 블러
- **회원**: 모든 이미지 선명

## 사용 방법

### 컴포넌트 사용

```jsx
import ContentBlur from '@/components/ContentBlur'
import CommentList from '@/components/CommentList'

// 게시물 본문에 적용
<ContentBlur isAuthenticated={isLoggedIn}>
  <div>{postContent}</div>
</ContentBlur>

// 댓글 목록에 적용
<CommentList comments={comments} isAuthenticated={isLoggedIn} />
```

### 유틸리티 함수 사용

```javascript
import { maskContent, filterComments } from '@/utils/contentRestriction'

// 텍스트 마스킹
const maskedText = maskContent(originalText, isLoggedIn)

// 댓글 필터링
const filteredComments = filterComments(allComments, isLoggedIn)
```

## UX 고려사항

- 제한된 콘텐츠 영역에 명확한 안내 메시지 표시
- 로그인/회원가입 버튼 제공
- 회원 가입 시 혜택 명시

## 커스터마이징

- 제한 비율 조정: `threshold` prop 변경 (기본값: 0.5)
- 스타일 수정: `.module.css` 파일 편집

---

작성일: 2025-11-19
