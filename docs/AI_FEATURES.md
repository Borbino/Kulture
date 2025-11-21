# Phase 11: AI Features, Social Networking & Gamification

## 개요

Phase 11에서는 커뮤니티 플랫폼을 AI 기반 지능형 플랫폼으로 고도화했습니다.

## 주요 기능

### 1. AI 추천 시스템

#### 1.1 Collaborative Filtering
- 사용자 행동 패턴 분석 (좋아요, 게시글 작성, 방문 기록)
- 유사 사용자 그룹 식별
- 관심사 기반 콘텐츠 추천

#### 1.2 Content-Based Filtering
- 태그, 카테고리, 게시판 기반 유사도 분석
- 텍스트 유사도 계산
- 사용자 관심사와 콘텐츠 매칭

#### 1.3 Trending Algorithm
- 실시간 인기도 점수 계산
- 시간 가중치 적용 (1시간/24시간/7일)
- 참여도 기반 트렌드 탐지

**파일:**
- `/lib/aiRecommendation.js` - AI 추천 엔진
- `/pages/api/recommendations.js` - 추천 API
- `/components/RecommendationWidget.jsx` - 추천 위젯 UI

**API 사용 예시:**
```javascript
// 개인화 추천
GET /api/recommendations?type=personalized&limit=10

// 유사 게시글
GET /api/recommendations?type=similar&postId=123&limit=5

// 트렌딩 게시글
GET /api/recommendations?type=trending&timeRange=24h&limit=10
```

### 2. AI 감정 분석 & 콘텐츠 품질 분석

#### 2.1 Sentiment Analysis
- 한국어 & 영어 감정 분석
- Positive/Negative/Neutral 분류
- 신뢰도 점수 제공

#### 2.2 Spam Detection
- URL, 전화번호 패턴 탐지
- 반복 문자 탐지
- 특수문자 과다 사용 탐지
- 스팸 확률 점수 (0-100)

#### 2.3 Content Quality Analysis
- 댓글 품질 점수 (0-100)
- 자동 승인/검토 추천
- 게시글 품질 분석 및 개선 제안

**파일:**
- `/lib/aiSentiment.js` - AI 감정 분석 엔진
- `/pages/api/ai/analyze.js` - 분석 API
- `/pages/api/ai/suggest.js` - 자동 태깅 API

**API 사용 예시:**
```javascript
// 감정 분석
POST /api/ai/analyze?type=sentiment
Body: { text: "This is amazing!" }

// 스팸 탐지
POST /api/ai/analyze?type=spam
Body: { text: "Call now 010-1234-5678!!!" }

// 자동 태그 제안
POST /api/ai/suggest
Body: { title: "K-pop trends", content: "BTS and Blackpink..." }
```

### 3. Social Networking

#### 3.1 Follow System
- 팔로우/언팔로우 기능
- 팔로워/팔로잉 목록
- 팔로우 시 알림 전송
- Activity feed 자동 생성

**파일:**
- `/lib/schemas/follow.js` - Follow 스키마
- `/pages/api/social/follow.js` - Follow API
- `/components/FollowButton.jsx` - Follow 버튼 UI

#### 3.2 Reactions (Emoji)
- 6가지 이모지 반응: ❤️👍😂😮😢😡
- 실시간 반응 카운트
- 애니메이션 효과
- 반응별 통계

**파일:**
- `/lib/schemas/reaction.js` - Reaction 스키마
- `/pages/api/social/reactions.js` - Reactions API
- `/components/ReactionButton.jsx` - 반응 버튼 UI

#### 3.3 Activity Feed
- 사용자 활동 타임라인
- 팔로우한 사용자의 활동 피드
- 활동 유형:
  - 게시글 작성 (post_created)
  - 댓글 추가 (comment_added)
  - 게시글 좋아요 (post_liked)
  - 사용자 팔로우 (user_followed)
  - 뱃지 획득 (badge_earned)
  - 레벨업 (level_up)

**파일:**
- `/lib/schemas/activity.js` - Activity 스키마
- `/pages/api/social/feed.js` - Activity Feed API
- `/components/ActivityFeed.jsx` - 활동 피드 UI

### 4. Gamification

#### 4.1 Daily Missions
- 일일 미션 시스템
- 난이도별 미션 (Easy/Medium/Hard)
- 진행도 추적
- 포인트 보상

**미션 예시:**
- 첫 게시글 작성 (Easy, +10pt)
- 5개 댓글 작성 (Medium, +20pt)
- 게시글 10개 좋아요 받기 (Hard, +30pt)

#### 4.2 Streak System
- 연속 출석 추적
- 연속 일수에 따른 보너스
- 스트릭 유지 동기부여

#### 4.3 Rewards
- 포인트 시스템
- 뱃지 획득
- 레벨 시스템 연동

**파일:**
- `/lib/schemas/dailyMission.js` - Daily Mission 스키마
- `/lib/schemas/userMission.js` - User Mission Progress 스키마
- `/pages/api/gamification/missions.js` - Missions API
- `/components/DailyMissions.jsx` - 미션 대시보드 UI

### 5. Real-time Interactions

#### 5.1 Infinite Scroll
- Intersection Observer API 사용
- 자동 페이지네이션
- 성능 최적화 (lazy loading)

#### 5.2 Optimistic UI Updates
- 즉각적인 UI 반응
- 백그라운드 API 호출
- 에러 시 롤백

**파일:**
- `/components/InfiniteScrollPosts.jsx` - 인피니트 스크롤 게시글 목록

## 데이터베이스 스키마

### Follow Schema
```javascript
{
  _type: 'follow',
  follower: reference(user),
  following: reference(user),
  createdAt: datetime
}
```

### Reaction Schema
```javascript
{
  _type: 'reaction',
  user: reference(user),
  targetType: string, // 'post' | 'comment'
  targetId: string,
  reactionType: string, // 'love' | 'like' | 'laugh' | 'wow' | 'sad' | 'angry'
  createdAt: datetime
}
```

### Activity Schema
```javascript
{
  _type: 'activity',
  user: reference(user),
  activityType: string,
  relatedPost: reference(post),
  relatedUser: reference(user),
  metadata: object,
  createdAt: datetime
}
```

### Daily Mission Schema
```javascript
{
  _type: 'dailyMission',
  title: string,
  description: text,
  icon: string,
  difficulty: string, // 'easy' | 'medium' | 'hard'
  missionType: string,
  targetCount: number,
  rewardPoints: number,
  rewardBadge: reference(badge),
  isActive: boolean,
  startDate: date,
  endDate: date
}
```

### User Mission Schema
```javascript
{
  _type: 'userMission',
  user: reference(user),
  mission: reference(dailyMission),
  progress: number,
  isCompleted: boolean,
  completedAt: datetime,
  rewardClaimed: boolean
}
```

## API 엔드포인트

### AI Recommendations
- `GET /api/recommendations?type=personalized&limit=10` - 개인화 추천
- `GET /api/recommendations?type=similar&postId=123` - 유사 게시글
- `GET /api/recommendations?type=trending&timeRange=24h` - 트렌딩

### AI Analysis
- `POST /api/ai/analyze?type=sentiment` - 감정 분석
- `POST /api/ai/analyze?type=spam` - 스팸 탐지
- `POST /api/ai/analyze?type=comment` - 댓글 품질 분석
- `POST /api/ai/analyze?type=post` - 게시글 품질 분석
- `POST /api/ai/suggest` - 자동 태그/카테고리 제안

### Social Features
- `GET /api/social/follow` - 팔로우 목록 조회
- `POST /api/social/follow` - 팔로우
- `DELETE /api/social/follow` - 언팔로우
- `GET /api/social/feed?mode=feed` - 활동 피드 (나 + 팔로잉)
- `GET /api/social/feed?mode=user&userId=123` - 특정 사용자 활동
- `GET /api/social/reactions` - 반응 목록
- `POST /api/social/reactions` - 반응 추가
- `DELETE /api/social/reactions` - 반응 제거

### Gamification
- `GET /api/gamification/missions` - 미션 목록 + 진행도 + 스트릭
- `POST /api/gamification/missions` - 미션 진행도 업데이트

## UI 컴포넌트

### AI & Recommendations
- `RecommendationWidget.jsx` - AI 추천 위젯
  - Props: `type` (personalized/similar/trending), `postId`, `limit`

### Social Features
- `ReactionButton.jsx` - 이모지 반응 버튼
  - Props: `targetType`, `targetId`, `initialReactions`
- `FollowButton.jsx` - 팔로우 버튼
  - Props: `userId`, `initialFollowing`, `onFollowChange`
- `ActivityFeed.jsx` - 활동 피드
  - Props: `mode` (feed/user), `userId`

### Gamification
- `DailyMissions.jsx` - 일일 미션 대시보드
  - Props: 없음 (현재 로그인 사용자 기준)

### Performance
- `InfiniteScrollPosts.jsx` - 인피니트 스크롤 게시글 목록
  - Props: `boardId`, `categoryId`
  - Features: Intersection Observer, lazy loading

## 성능 최적화

1. **Lazy Loading**
   - 이미지 lazy loading
   - 컴포넌트 code splitting
   - 데이터 페이지네이션

2. **Caching**
   - API 응답 캐싱
   - 클라이언트 사이드 캐싱
   - GROQ 쿼리 최적화

3. **Real-time Updates**
   - Optimistic UI updates
   - WebSocket 준비 (향후 구현)

## 사용 가이드

### 추천 시스템 사용하기

```jsx
import RecommendationWidget from '@/components/RecommendationWidget';

// 개인화 추천
<RecommendationWidget type="personalized" limit={5} />

// 유사 게시글 (게시글 상세 페이지)
<RecommendationWidget type="similar" postId={post._id} limit={5} />

// 트렌딩
<RecommendationWidget type="trending" limit={10} />
```

### 반응 버튼 사용하기

```jsx
import ReactionButton from '@/components/ReactionButton';

// 게시글에 반응 버튼
<ReactionButton 
  targetType="post" 
  targetId={post._id} 
  initialReactions={post.reactions}
/>

// 댓글에 반응 버튼
<ReactionButton 
  targetType="comment" 
  targetId={comment._id} 
/>
```

### 팔로우 버튼 사용하기

```jsx
import FollowButton from '@/components/FollowButton';

<FollowButton 
  userId={user._id}
  initialFollowing={isFollowing}
  onFollowChange={(following) => console.log('Follow changed:', following)}
/>
```

### 일일 미션 표시하기

```jsx
import DailyMissions from '@/components/DailyMissions';

// 사이드바나 대시보드에 표시
<DailyMissions />
```

### 활동 피드 표시하기

```jsx
import ActivityFeed from '@/components/ActivityFeed';

// 전체 피드 (나 + 팔로잉)
<ActivityFeed mode="feed" />

// 특정 사용자 활동
<ActivityFeed mode="user" userId={user._id} />
```

### 인피니트 스크롤 사용하기

```jsx
import InfiniteScrollPosts from '@/components/InfiniteScrollPosts';

// 전체 게시글
<InfiniteScrollPosts />

// 특정 게시판
<InfiniteScrollPosts boardId={board._id} />

// 특정 카테고리
<InfiniteScrollPosts categoryId={category._id} />
```

## 향후 개선 방향

1. **AI 고도화**
   - 딥러닝 모델 통합 (TensorFlow.js)
   - 더 정교한 추천 알고리즘
   - 다국어 감정 분석 확장

2. **Real-time Features**
   - WebSocket 통합
   - 실시간 알림
   - 실시간 온라인 사용자 표시

3. **Gamification 확장**
   - 주간/월간 미션
   - 리더보드
   - 토너먼트 시스템
   - 아이템 상점

4. **Social Features 확장**
   - 그룹/커뮤니티 기능
   - 프라이빗 메시지 (DM)
   - 스토리 기능
   - 라이브 스트리밍

## 기술 스택

- **Frontend**: React 19.2.0, Next.js 16.0.3
- **Backend**: Next.js API Routes
- **Database**: Sanity CMS 4.17.0
- **AI/ML**: Custom JavaScript algorithms
- **Performance**: Intersection Observer API, Lazy Loading
- **Authentication**: NextAuth.js 4.24.10

## 마이그레이션 가이드

기존 Phase 10에서 Phase 11로 업그레이드하려면:

1. **스키마 추가**
   ```bash
   # Sanity Studio에서 새 스키마 적용
   cd studio
   sanity deploy
   ```

2. **의존성 확인**
   ```bash
   npm install
   ```

3. **환경 변수 확인**
   - Phase 10의 환경 변수 모두 유지

4. **데이터 마이그레이션**
   - 기존 데이터는 영향받지 않음
   - 새로운 기능은 즉시 사용 가능

## 성능 메트릭

- **Lighthouse Score**: 90+ (목표)
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.0s
- **API Response Time**: < 500ms (평균)

## 라이선스 & 크레딧

- 이모지: Unicode Standard
- AI 알고리즘: Custom implementation
- UI/UX: Modern best practices
