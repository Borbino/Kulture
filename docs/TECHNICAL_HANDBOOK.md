# Kulture 기술 명세서 (TECHNICAL_HANDBOOK.md)

> **AI 기능, 커뮤니티 시스템, 번역 엔진, 게이미피케이션 종합 기술 문서**  
> 문서 통합 완료: 2025-01-13

---

## 📘 문서 구조

이 문서는 다음 내용을 통합합니다:
- **docs/AI_FEATURES.md**: AI 추천, 감정 분석, 콘텐츠 생성
- **docs/COMMUNITY_FEATURES.md**: 소셜 네트워킹, 댓글, 인증
- **docs/CONTENT_RESTRICTION.md**: 콘텐츠 제한 시스템
- **docs/CEO_FEEDBACK_SYSTEM.md**: CEO 피드백 및 승인 시스템
- **docs/TRANSLATION_USAGE_GUIDE.md**: 200+ 언어 번역 시스템
- **docs/COPYRIGHT_POLICY.md**: 저작권 및 Fair Use

---

## 🤖 Section 1: AI Translation System (200+ Languages)

### 1-1. 개요

**Kulture는 전세계 모든 언어를 실시간으로 번역하는 극한의 번역 시스템을 탑재하고 있습니다.**

- **지원 언어**: 200개 이상의 언어 (한국어, 영어, 일본어, 중국어, 아랍어, 유럽/아프리카/아시아 모든 주요 언어)
- **번역 제공자**: OpenAI (주력), DeepL, Google Translate (폴백)
- **캐시 시스템**: Redis + 인메모리 LFU/LRU 혼합 캐시
- **성능**: 평균 응답 시간 < 500ms (캐시 히트 시 < 100ms)

### 1-2. 핵심 기능

**다중 제공자 폴백 체인**:
```javascript
try {
  return await translateWithOpenAI(text, targetLang, context);
} catch (openAIError) {
  try {
    return await translateWithDeepL(text, targetLang);
  } catch (deepLError) {
    return await translateWithGoogle(text, targetLang);
  }
}
```

**고급 캐싱 전략**:
- Redis 분산 캐시 (프로덕션)
- 인메모리 캐시 (로컬/폴백)
- LFU + LRU 혼합 알고리즘
- 인기도 기반 캐시 우선순위

**배치 처리 최적화**:
- 병렬 번역 처리 (최대 100개/배치)
- 긴 텍스트 자동 청크 분할
- Rate limiting 자동 관리

**컨텍스트 인식 번역**:
- 8개 도메인 특화 프로파일: general, technical, marketing, legal, medical, casual, formal, k-culture
- 문맥 기반 번역 품질 향상
- 자동 언어 감지

**품질 보증**:
- AI 기반 번역 품질 평가
- 자동 품질 검증
- 길이 이상 감지

### 1-3. API 엔드포인트

```javascript
// 1. 단일 번역
POST /api/translation/translate
{
  "text": "Hello, world!",
  "targetLang": "ko",
  "sourceLang": "auto",
  "context": "greeting"
}
Response: { success: true, data: { translatedText: "안녕하세요, 세계!", ... } }

// 2. 배치 번역
POST /api/translation/translate
{
  "batch": ["Hello", "World", "Goodbye"],
  "targetLang": "ja"
}

// 3. 언어 감지
POST /api/translation/detect
{
  "text": "Bonjour le monde"
}
Response: { success: true, data: { language: "fr", confidence: 0.98 } }

// 4. 시스템 상태
GET /api/translation/health
Response: { success: true, data: { providers: {...}, cache: {...} } }

// 5. 캐시 관리 (Admin)
GET /api/translation/cache
DELETE /api/translation/cache
```

### 1-4. 번역 제공자 비교

| 제공자 | 비용 | 언어 수 | 품질 | 속도 | 특징 |
| -------- | ------ | --------- | ------ | ------ | ------ |
| OpenAI GPT-4o-mini | $0.015/1K입력 + $0.06/1K출력 | 200+ | ⭐⭐⭐⭐ | ⭐⭐⭐ | 문맥 이해, 뉘앙스 보존 |
| DeepL | $0.02/1K chars | 30 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 최고 자연스러움 |
| Google Translate | $0.02/1K chars | 133 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 최다 언어, 최고 속도 |

### 1-5. 사용 예시

```javascript
// React 컴포넌트에서 사용
import { useTranslation } from '../hooks/useTranslation';

function MyComponent() {
  const { translate, isLoading } = useTranslation();
  
  const handleTranslate = async () => {
    const result = await translate('Hello', 'ko', { context: 'greeting' });
    console.log(result); // "안녕하세요"
  };
  
  return <button onClick={handleTranslate}>번역</button>;
}
```

### 1-6. 환경 변수

```bash
# 필수
OPENAI_API_KEY=sk-...
GOOGLE_TRANSLATE_API_KEY=AIza...

# 선택사항 (성능 향상)
DEEPL_API_KEY=...
REDIS_URL=redis://...
```

---

## 🎮 Section 2: 게이미피케이션 시스템

### 2-1. 개요

사용자 참여를 극대화하는 11단계 레벨 시스템, 6개 배지, 일일 미션

### 2-2. 레벨 시스템

```javascript
const LEVELS = [
  { level: 0, name: '입문', minTranslations: 0, maxTranslations: 9 },
  { level: 1, name: '초보 번역가', minTranslations: 10, maxTranslations: 49 },
  { level: 2, name: '일반 번역가', minTranslations: 50, maxTranslations: 99 },
  { level: 3, name: '숙련 번역가', minTranslations: 100, maxTranslations: 249 },
  { level: 4, name: '전문 번역가', minTranslations: 250, maxTranslations: 499 },
  { level: 5, name: '마스터', minTranslations: 500, maxTranslations: 999 },
  { level: 6, name: '그랜드마스터', minTranslations: 1000, maxTranslations: 2499 },
  { level: 7, name: '레전드', minTranslations: 2500, maxTranslations: 4999 },
  { level: 8, name: '챔피언', minTranslations: 5000, maxTranslations: 9999 },
  { level: 9, name: '올림픽', minTranslations: 10000, maxTranslations: Infinity }
];
```

### 2-3. 배지 시스템

**6개 달성 배지**:

1. **First Steps** (첫 발걸음)
   - 조건: 첫 번역 1개 완료
   - 보상: +10 포인트

2. **Polyglot** (다국어 전문가)
   - 조건: 5개 이상의 언어로 번역
   - 보상: +50 포인트

3. **Quality Master** (품질 장인)
   - 조건: 평균 품질 점수 90점 이상
   - 보상: +100 포인트

4. **Speed Demon** (번역 속도왕)
   - 조건: 하루에 50개 이상 번역
   - 보상: +75 포인트

5. **Community Hero** (커뮤니티 영웅)
   - 조건: 100개 이상의 번역 제안 승인됨
   - 보상: +200 포인트

6. **Consistency King** (꾸준함의 왕)
   - 조건: 30일 연속 활동
   - 보상: +150 포인트

### 2-4. 일일 미션

**3단계 난이도**:

- **Easy**: 댓글 3개 작성 (보상: 5 포인트)
- **Medium**: 게시글 5개 좋아요 (보상: 10 포인트)
- **Hard**: 번역 10개 완료 (보상: 20 포인트)

**API 엔드포인트**:
```javascript
GET /api/gamification/missions
Response: { success: true, data: { missions: [...], streak: 7, date: "2025-01-13" } }

POST /api/gamification/missions
Body: { missionId: "...", increment: 1 }
Response: { success: true, data: { progress: 3, isCompleted: true, mission: {...} } }

POST /api/gamification/claim-reward
Body: { missionId: "..." }
Response: { success: true, data: { rewardPoints: 20, newBalance: 120 } }
```

### 2-5. 리더보드

**복합 점수 시스템**:
```javascript
score = (translations × 10) + (suggestions × 50) + (qualityScore × 100)
```

**필터링**:
- Timeframe: all / month / week
- Category: points / posts / engagement

**API 엔드포인트**:
```javascript
GET /api/gamification/leaderboard?timeframe=month&category=points
Response: { 
  success: true, 
  data: { 
    leaderboard: [
      { rank: 1, user: {...}, points: 15000, level: 8 },
      ...
    ],
    totalUsers: 150
  }
}
```

---

## 👥 Section 3: 소셜 네트워킹 & 커뮤니티

### 3-1. Follow/Unfollow 시스템

**기능**:
- 팔로우/언팔로우 토글
- 팔로워/팔로잉 목록 조회
- 팔로우 시 자동 알림
- Activity feed 자동 생성

**API 엔드포인트**:
```javascript
POST /api/social/follow
Body: { targetUserId: "user123", action: "follow" }

GET /api/social/follow?userId=user123&type=followers
Response: { success: true, data: { followers: [...], count: 42 } }
```

### 3-2. 이모지 반응 시스템

**6가지 이모지**: ❤️ love, 👍 like, 😂 laugh, 😮 wow, 😢 sad, 😡 angry

**API 엔드포인트**:
```javascript
POST /api/social/reactions
Body: { postId: "...", reaction: "love" }

GET /api/social/reactions?postId=...
Response: { 
  success: true, 
  data: { 
    reactions: { love: 42, like: 18, laugh: 5, wow: 3, sad: 1, angry: 0 },
    total: 69
  }
}
```

### 3-3. Activity Feed

**7가지 활동 타입**:
1. `post_created` - 새 게시물 작성
2. `comment_added` - 댓글 추가
3. `post_liked` - 게시물 좋아요
4. `user_followed` - 사용자 팔로우
5. `badge_earned` - 뱃지 획득
6. `level_up` - 레벨 상승
7. `reaction_added` - 이모지 반응 추가

**API 엔드포인트**:
```javascript
GET /api/social/feed?userId=...&limit=20
Response: { 
  success: true, 
  data: { 
    activities: [
      { type: "level_up", user: {...}, timestamp: "...", data: { newLevel: 5 } },
      ...
    ]
  }
}
```

### 3-4. 댓글 시스템

**기능**:
- CRUD (Create, Read, Update, Delete)
- 대댓글 (nested comments) 지원
- 승인 시스템 (approved: boolean)
- 작성자 권한 체크
- 10-1000자 제한

**API 엔드포인트**:
```javascript
GET /api/comments?postId={id}
POST /api/comments
Body: { postId: "...", content: "...", parentComment: null }

PATCH /api/comments
Body: { commentId: "...", content: "..." }

DELETE /api/comments
Body: { commentId: "..." }
```

---

## 🎨 Section 4: AI 추천 & 콘텐츠 생성

### 4-1. AI 추천 시스템

**3가지 추천 알고리즘**:

1. **Collaborative Filtering** (협업 필터링)
   - 사용자 행동 패턴 분석
   - 유사 사용자 그룹 식별
   - 관심사 기반 추천

2. **Content-Based Filtering** (콘텐츠 기반 필터링)
   - 태그, 카테고리, 게시판 분석
   - 텍스트 유사도 계산
   - 사용자 관심사 매칭

3. **Trending Algorithm** (트렌딩 알고리즘)
   - 실시간 인기도 점수 계산
   - 시간 가중치 적용 (1h/24h/7d)
   - 참여도 기반 트렌드 탐지

**API 엔드포인트**:
```javascript
GET /api/recommendations?type=personalized&limit=10
GET /api/recommendations?type=similar&postId=123&limit=5
GET /api/recommendations?type=trending&timeRange=24h&limit=10
```

### 4-2. AI 감정 분석

**기능**:
- Positive/Negative/Neutral 분류
- 신뢰도 점수 (0-100)
- 한국어 & 영어 지원

**API 엔드포인트**:
```javascript
POST /api/ai/analyze?type=sentiment
Body: { text: "This is amazing!" }
Response: { 
  success: true, 
  data: { 
    sentiment: "positive", 
    confidence: 0.95, 
    score: 0.87 
  }
}
```

### 4-3. 스팸 탐지

**탐지 패턴**:
- URL, 전화번호 패턴
- 반복 문자 (3회 이상)
- 특수문자 과다 사용 (>30%)
- 스팸 확률 점수 (0-100)

**API 엔드포인트**:
```javascript
POST /api/ai/analyze?type=spam
Body: { text: "Call now 010-1234-5678!!!" }
Response: { 
  success: true, 
  data: { 
    isSpam: true, 
    confidence: 0.92, 
    reasons: ["phone_number", "excessive_punctuation"] 
  }
}
```

### 4-4. AI 콘텐츠 생성

**5가지 콘텐츠 타입**:
1. **article**: 500-800단어 기사
2. **guide**: 단계별 가이드
3. **review**: 비평 및 리뷰
4. **news**: 뉴스 속보
5. **tutorial**: 튜토리얼 문서

**API 엔드포인트**:
```javascript
POST /api/ai/content-generator
Body: { 
  topic: "BTS new album", 
  type: "article", 
  targetLanguages: ["ko", "en", "ja"],
  tone: "professional"
}
Response: { 
  success: true, 
  data: { 
    content: { 
      title: "...", 
      body: "...", 
      summary: "..." 
    },
    translations: { ko: {...}, en: {...}, ja: {...} }
  }
}
```

---

## 💬 Section 5: 실시간 채팅 & 번역

### 5-1. WebSocket 채팅

**기능**:
- Socket.io 기반 실시간 통신
- 룸 기반 격리 (무제한 사용자)
- 자동 번역 (200+ 언어)
- 타이핑 표시기
- 메시지 히스토리 (최근 50개)

**서버 구조**:
```javascript
// pages/api/chat/socket.js
io.on('connection', (socket) => {
  socket.on('join', ({ room, user, language }) => {
    socket.join(room);
  });
  
  socket.on('message', async ({ room, message, language }) => {
    // 모든 사용자의 언어로 자동 번역
    const translations = await translateToAllLanguages(message);
    io.to(room).emit('message', { ...message, translations });
  });
  
  socket.on('typing', ({ room, user }) => {
    socket.to(room).emit('typing', user);
  });
});
```

**클라이언트 사용**:
```javascript
// components/RealtimeChat.jsx
import { useSocket } from '../hooks/useSocket';

function RealtimeChat({ room, user }) {
  const { socket, messages, sendMessage, typing } = useSocket(room, user);
  
  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>
          {msg.translations[user.language] || msg.text}
        </div>
      ))}
      {typing.length > 0 && <div>{typing.join(', ')} is typing...</div>}
    </div>
  );
}
```

---

## 🔒 Section 6: 콘텐츠 제한 & 저작권

### 6-1. 콘텐츠 제한 시스템

**기능**:
- CEO 설정 가능한 제한 비율 (10-100%)
- 광고 시청 후 전체 콘텐츠 접근
- 세션 기반 잠금 해제 (10-1440분)
- 비로그인 사용자 지원

**설정 항목** (`/admin/settings`):
```javascript
{
  contentRestriction: {
    enabled: true,
    restrictionPercentage: 30,        // 30% 미리보기
    adViewDurationSeconds: 15,         // 15초 광고
    sessionValidityMinutes: 120        // 2시간 유효
  }
}
```

**컴포넌트 사용**:
```javascript
// components/ContentBlur.jsx
import { ContentBlur } from '../components/ContentBlur';

<ContentBlur content={fullContent} postId={post._id} />
```

### 6-2. 저작권 정책

**Fair Use 원칙**:
- ✅ 비평, 연구, 뉴스 보도 목적
- ✅ 원문 요약/재구성 (전문 복사 금지)
- ✅ 출처 명확 표기 + 원본 링크
- ❌ 상업적 이용 제한
- ❌ 저작권자 요청 시 즉시 삭제

**DMCA 준수**:
- 저작권 침해 신고 시스템
- 24시간 내 검토 및 조치
- 저작권자 직접 연락 채널

---

## 📊 Section 7: VIP 모니터링 & 트렌드 감지

### 7-1. VIP 실시간 모니터링

**모니터링 대상**:
- K-Pop: BTS, BLACKPINK, aespa, NewJeans, Stray Kids
- K-Drama: 이병헌, 손예진, 현빈
- K-Sports: 손흥민, 김연경
- K-Entertainment: PSY, IU, 싸이

**수집 소스**:
- Twitter API (멘션, 해시태그)
- YouTube Data API (조회수, 댓글)
- Reddit API (서브레딧 활동)
- Naver News API (뉴스 기사)

**API 엔드포인트**:
```javascript
GET /api/vip/top?limit=10
Response: { 
  success: true, 
  data: { 
    vips: [
      { 
        name: "BTS", 
        mentions: 15000, 
        alertLevel: "high",
        trend: "up",
        timestamp: "2025-01-13T10:00:00Z"
      },
      ...
    ]
  }
}
```

### 7-2. 트렌드 감지

**알고리즘**:
```javascript
trendScore = (mentions × 0.5) + (engagement × 0.3) + (velocity × 0.2)
```

**Hot Issue 판단 기준**:
- 멘션 수 > 임계값 (기본 1000)
- 1시간 내 급증 (>200% 증가)
- 다중 플랫폼 동시 감지

**API 엔드포인트**:
```javascript
GET /api/trends?category=all
Response: { 
  success: true, 
  data: { 
    snapshot: {
      timestamp: "...",
      trends: [
        { keyword: "BTS comeback", mentions: 25000, priority: "high" },
        ...
      ]
    },
    hotIssues: [...]
  }
}
```

---

## 🛡️ Section 8: 보안 & 성능

### 8-1. Rate Limiting

```javascript
// lib/rateLimiter.js
const LIMITS = {
  translation: { requests: 100, window: 60 }, // 100 req/min
  api: { requests: 300, window: 60 },         // 300 req/min
  ai: { requests: 10, window: 60 }            // 10 req/min (비싼 API)
};
```

### 8-2. 캐싱 전략

**L1 Cache (In-memory)**:
- LFU + LRU 혼합
- TTL: 5분
- 최대 크기: 1000 항목

**L2 Cache (Redis)**:
- TTL: 7일
- 키 패턴: `trans:{sourceLang}:{targetLang}:{hash}`
- Eviction: LRU

### 8-3. 성능 최적화

- **이미지**: Next.js Image 컴포넌트 (자동 WebP, lazy loading)
- **코드 분할**: Dynamic import
- **SSG/ISR**: 정적 페이지 우선
- **CDN**: Vercel Edge Network

---

**마지막 업데이트**: 2025-01-13  
**통합 문서**: AI_FEATURES.md, COMMUNITY_FEATURES.md, CONTENT_RESTRICTION.md, CEO_FEEDBACK_SYSTEM.md, TRANSLATION_USAGE_GUIDE.md, COPYRIGHT_POLICY.md  
**상태**: 완료
