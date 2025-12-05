# 📋 Sanity CMS 초기화 및 배포 가이드

**작성일**: 2024-12-05  
**대상**: 개발팀, 운영팀  
**중요도**: 🔴 CRITICAL (배포 전 필수)

---

## 1. 사전 준비

### 필수 조건
- [ ] Sanity.io 계정 access
- [ ] Kulture 프로젝트 관리자 권한
- [ ] 로컬 환경에 CLI 설치됨: `npm install -g @sanity/cli`

### 환경 확인
```bash
# Sanity 프로젝트 정보 확인
sanity projects list

# 현재 프로젝트 확인
cd /workspaces/Kulture
sanity projects list --current
```

---

## 2. Sanity Studio 배포

### Step 1: Studio 최신 상태 확인
```bash
# 로컬에서 문제 없는지 확인
npm run sanity:dev

# 브라우저에서 http://localhost:3333 접근
# 스키마가 모두 정상 표시되는지 확인
```

### Step 2: 스키마 배포
```bash
# 모든 스키마 파일이 최신 상태인지 확인
ls -la lib/schemas/

# 특히 다음 파일 확인:
# - lib/schemas/siteSettings.js (trends 섹션 추가됨)
# - lib/schemas/badge.js
# - lib/schemas/dailyMission.js
# - lib/schemas/userMission.js
```

### Step 3: Sanity Studio 배포
```bash
# Sanity Studio 배포 (선택사항 - CDN에서 제공)
# 이미 Sanity가 호스팅하는 Studio 사용 중이면 자동 업데이트

# 또는 커스텀 배포 시:
npm run build
sanity deploy
```

---

## 3. 초기 데이터 생성

### Step 1: Sanity Studio 접근
```bash
# Studio 열기
sanity studio

# 또는 온라인: https://studio.sanity.io
```

### Step 2: Site Settings 문서 생성

#### 위치: `Content > siteSettings`

1. **새 문서 생성**
   - "Create New Document"
   - Type: "siteSettings"
   - Document ID: `settings` (고정값)

2. **필수 필드 설정**

```
Title: Kulture Site Settings

📄 Content Restriction
├─ Enable Content Restriction: ✓ checked
├─ Visible Content Percentage: 40
├─ Apply to Text: ✓ checked
├─ Apply to Comments: ✓ checked
├─ Apply to Images: ✓ checked
└─ Free Images Count: 2

📺 Ad Watch Feature
├─ Enable Ad Watch Feature: ✓ checked
├─ Ad Duration: 30
├─ Session Duration: 60
├─ Google AdSense Client ID: ca-pub-xxxxxxxxxxxxxxxx
└─ Show as Option: ✓ checked

💬 Comments
├─ Enable Comments: ✓ checked
├─ Require Login to Comment: ✓ checked
└─ Enable Moderation: ☐ unchecked

🔐 Authentication
├─ Allow User Signup: ✓ checked
├─ Require Email Verification: ☐ unchecked
└─ Enable Social Login: ☐ unchecked

🌐 Translation System
├─ Enable Translation System: ✓ checked
├─ Default Language: 한국어 (ko)
├─ Quality Threshold: 7
├─ Primary Translation Provider: OpenAI (권장)
├─ Enable Translation Cache: ✓ checked
└─ Auto-Detect Language: ✓ checked

🎮 Gamification [NEW - 중요!]
├─ Enable Gamification: ✓ checked
├─ Enable Daily Missions: ✓ checked
├─ Enable Level System: ✓ checked
├─ Enable Badges: ✓ checked
├─ Point Multiplier: 1.0
├─ Enable Streak Bonus: ✓ checked
└─ Enable Leaderboard: ✓ checked

📈 Trends & VIP Monitoring [NEW - 중요!]
├─ Enable Trends Feature: ✓ checked
├─ Enable Trend Widget: ✓ checked
├─ Enable Trend Hub Page: ✓ checked
├─ Enable VIP Monitoring: ✓ checked
├─ Enable Hot Issues: ✓ checked
├─ Update Interval (minutes): 30
├─ Max Trends Per Snapshot: 50
└─ Tracking Categories: [모두 선택]
    ├─ K-Pop
    ├─ K-Drama
    ├─ K-Movie
    ├─ K-Fashion
    ├─ K-Beauty
    ├─ K-Food
    ├─ K-Gaming
    └─ K-Art

💬 Real-time Chat
├─ Enable Real-time Chat: ✓ checked
├─ Auto-translate Messages: ✓ checked
├─ Message History Count: 50
├─ Enable Typing Indicator: ✓ checked
├─ Require Login for Chat: ✓ checked
└─ Max Room Size: 100

🤖 AI Content Generation
├─ Enable AI Content Generation: ✓ checked
├─ Enabled Content Types: [모두 선택]
│  ├─ Article
│  ├─ Guide
│  ├─ Review
│  ├─ News
│  └─ Tutorial
├─ Auto-generation Schedule: [모두 선택]
│  ├─ 09:00 KST
│  ├─ 12:00 KST
│  ├─ 15:00 KST
│  └─ 18:00 KST
├─ Require CEO Approval: ✓ checked
└─ Enable Multilingual Publishing: ✓ checked

👥 Social Features
├─ Enable Follow System: ✓ checked
├─ Enable Reactions: ✓ checked
├─ Enabled Reaction Types: [모두 선택]
│  ├─ ❤️ Love
│  ├─ 👍 Like
│  ├─ 😂 Laugh
│  ├─ 😮 Wow
│  ├─ 😢 Sad
│  └─ 😡 Angry
├─ Enable Activity Feed: ✓ checked
├─ Activity Types to Show: [모두 선택]
│  ├─ Post Created
│  ├─ Comment Added
│  ├─ Post Liked
│  ├─ User Followed
│  ├─ Badge Earned
│  ├─ Level Up
│  └─ Reaction Added
└─ Enable User Profiles: ✓ checked

⚙️ General Settings
├─ Site Name: Kulture
├─ Maintenance Mode: ☐ unchecked
└─ Maintenance Message: 사이트 점검 중입니다. 잠시 후 다시 이용해 주세요.
```

3. **Publish**
   - "Publish" 버튼 클릭
   - "Are you sure?" → "Yes, publish"

---

### Step 3: 테스트 배지 생성

#### 위치: `Content > badge`

**Badge 1: "First Post"**
```
Name: First Post
Icon: ✍️
Type: achievement
Color: #FFD700 (Gold)
Description: 첫 게시글을 작성했습니다!
Requirement:
  ├─ posts: 1
  └─ type: posts
Is Active: ✓ checked
```

**Badge 2: "Comment Master"**
```
Name: Comment Master
Icon: 💬
Type: achievement
Color: #00C7A8 (Mint)
Description: 댓글로 커뮤니티를 활발히 참여했습니다!
Requirement:
  ├─ comments: 10
  └─ type: comments
Is Active: ✓ checked
```

**Badge 3: "Level 5"**
```
Name: Level 5
Icon: 🎖️
Type: rank
Color: #FF6B6B (Red)
Description: 레벨 5에 도달했습니다!
Requirement:
  ├─ level: 5
  └─ type: level
Is Active: ✓ checked
```

---

### Step 4: 테스트 미션 생성

#### 위치: `Content > dailyMission`

**Mission 1: "Daily Login"**
```
Title: 일일 로그인
Description: 매일 Kulture에 방문하세요!
Difficulty: easy
Mission Type: daily_login
Icon: 🔐
Target Count: 1
Reward Points: 5
Reward Badge: (선택 사항)
Is Active: ✓ checked
Start Date: [오늘]
End Date: [내일]
```

**Mission 2: "Comment Writer"**
```
Title: 댓글 작성자
Description: 3개의 댓글을 작성하세요!
Difficulty: medium
Mission Type: write_comment
Icon: 💬
Target Count: 3
Reward Points: 10
Reward Badge: (선택 사항)
Is Active: ✓ checked
Start Date: [오늘]
End Date: [내일]
```

**Mission 3: "Like Enthusiast"**
```
Title: 좋아요 많이 해주기
Description: 5개의 게시글에 좋아요를 눌러주세요!
Difficulty: easy
Mission Type: like_posts
Icon: ❤️
Target Count: 5
Reward Points: 15
Reward Badge: (선택 사항)
Is Active: ✓ checked
Start Date: [오늘]
End Date: [내일]
```

---

### Step 5: VIP 모니터링 데이터 생성

#### 위치: `Content > vipMonitoring`

**VIP 1: BTS**
```
VIP ID: bts
VIP Name: BTS
Mentions: 5000
Alert Level: high
Trend:
  ├─ Previous Mentions: 4000
  ├─ Change Percent: 25
  └─ Is Rising: ✓ checked
Content: (선택 사항)
Timestamp: [현재 시간]
```

**VIP 2: NewJeans**
```
VIP ID: newjeans
VIP Name: NewJeans
Mentions: 3000
Alert Level: normal
Trend:
  ├─ Previous Mentions: 2800
  ├─ Change Percent: 7
  └─ Is Rising: ✓ checked
Content: (선택 사항)
Timestamp: [현재 시간]
```

---

### Step 6: Hot Issue 생성

#### 위치: `Content > hotIssue`

**Issue 1: "K-pop Industry News"**
```
Keyword: K-pop Industry News
Description: 최신 K-pop 산업 뉴스
Mentions: 2000
Priority: high
Sentiment:
  ├─ positive: 60
  ├─ negative: 20
  └─ neutral: 20
Content: (선택 사항)
Should Auto Generate: ☐ unchecked
Timestamp: [현재 시간]
```

**Issue 2: "K-drama Trending"**
```
Keyword: K-drama Trending
Description: 인기 있는 K-drama 트렌드
Mentions: 1500
Priority: medium
Sentiment:
  ├─ positive: 75
  ├─ negative: 10
  └─ neutral: 15
Content: (선택 사항)
Should Auto Generate: ☐ unchecked
Timestamp: [현재 시간]
```

---

### Step 7: Trend Snapshot 생성

#### 위치: `Content > trendSnapshot`

**Snapshot**
```
Timestamp: [현재 시간]
Trends:
  ├─ [0]
  │  ├─ Keyword: BTS
  │  ├─ Mentions: 5000
  │  └─ Sources: ["twitter", "instagram"]
  ├─ [1]
  │  ├─ Keyword: K-drama
  │  ├─ Mentions: 3000
  │  └─ Sources: ["twitter", "tiktok"]
  ├─ [2]
  │  ├─ Keyword: K-beauty
  │  ├─ Mentions: 2500
  │  └─ Sources: ["instagram", "youtube"]
  └─ [3]
     ├─ Keyword: K-food
     ├─ Mentions: 2000
     └─ Sources: ["tiktok", "youtube"]
```

---

## 4. 데이터 검증

### Sanity Studio에서 확인

```bash
# Sanity에서 쿼리 테스트
# Content > [Document Type] 에서 각 문서 확인

# 또는 터미널에서:
cd /workspaces/Kulture

# Settings 조회
sanity documents get settings

# 배지 목록 조회
sanity documents list badge

# 미션 목록 조회
sanity documents list dailyMission

# VIP 데이터 조회
sanity documents list vipMonitoring

# Hot Issue 조회
sanity documents list hotIssue
```

### 프론트엔드에서 확인

```bash
# 로컬 개발 서버 시작
npm run dev

# 각 페이지 방문
http://localhost:3000/leaderboard
http://localhost:3000/badges
http://localhost:3000/missions
http://localhost:3000/trends

# 콘솔 확인 (DevTools)
# - API 호출 성공 확인
# - 데이터 표시 확인
# - 에러 없음 확인
```

---

## 5. 배포 체크리스트

### 배포 전 확인

- [ ] `lib/schemas/siteSettings.js` 파일에 trends 섹션 있음
- [ ] Sanity Studio에서 siteSettings 문서 생성됨
- [ ] siteSettings의 모든 토글이 적절히 설정됨
- [ ] 테스트 배지 3개 이상 생성됨
- [ ] 테스트 미션 3개 이상 생성됨 (오늘 날짜 범위)
- [ ] VIP 모니터링 데이터 2개 이상 생성됨
- [ ] Hot Issue 데이터 2개 이상 생성됨
- [ ] Trend Snapshot 생성됨
- [ ] 로컬에서 모든 페이지 테스트 완료
- [ ] API 응답 구조 변경 반영됨 (data wrapper)
- [ ] 프론트엔드 데이터 추출 코드 업데이트됨

### Vercel 배포

```bash
# GitHub에 push
git add -A
git commit -m "chore: Initial Sanity data setup for gamification and trends"
git push origin main

# Vercel에서 자동 배포
# https://vercel.com/dashboard

# 배포 상태 확인
# Deployments 탭에서 "Building"에서 "Ready"로 변경 대기

# 배포 완료 후
# https://kulture.wiki (또는 프로젝트 도메인)
```

---

## 6. 배포 후 검증

### 실시간 확인

```bash
# 1. 웹사이트 접근
https://kulture.wiki

# 2. 각 페이지 확인
- /leaderboard: 데이터 표시 확인
- /badges: 배지 표시 확인
- /missions: 미션 표시 확인
- /trends: 트렌드 데이터 표시 확인
- /: TrendSpotlight 위젯 표시 확인

# 3. 관리자 페이지 확인
- /admin/settings: 모든 토글 표시 확인

# 4. Settings 토글 테스트
- gamification.enabled = false → /leaderboard 차단 확인
- trends.enabled = false → /trends 차단 확인

# 5. API 직접 호출 확인
curl https://kulture.wiki/api/gamification/leaderboard
curl https://kulture.wiki/api/gamification/badges
curl https://kulture.wiki/api/gamification/missions
curl https://kulture.wiki/api/trends
curl https://kulture.wiki/api/vip/top
```

### 모니터링

```bash
# Vercel에서 에러 모니터링
# Vercel Dashboard > Monitoring > Errors

# Sanity에서 쿼리 성능 모니터링
# Sanity > Manage > Usage

# 24시간 모니터링 추천
```

---

## 7. 문제 해결

### 문제: Sanity에 데이터가 표시되지 않음

**원인**: 스키마 캐시 또는 선택사항

**해결**:
```bash
# 1. Sanity 캐시 청소
npm run sanity -- graphql delete

# 2. Studio 재시작
npm run sanity:dev

# 3. 브라우저 캐시 청소 (F12 > Application > Clear Storage)
```

---

### 문제: API가 403 Forbidden 반환

**원인**: Settings 비활성화 또는 인증 실패

**확인**:
```bash
# 1. Sanity에서 settings 문서 확인
sanity documents get settings

# 2. 응답 메시지 확인
curl -v https://kulture.wiki/api/gamification/leaderboard
# "게이미피케이션 기능이 현재 비활성화되었습니다" 확인

# 3. Settings 토글 활성화
# Sanity Studio > siteSettings > gamification.enabled = true
```

---

### 문제: 프론트엔드에 데이터가 표시되지 않음

**원인**: API 응답 구조 변경 미반영

**확인**:
```bash
# 1. DevTools Network 탭에서 API 응답 확인
GET /api/gamification/leaderboard
→ { "success": true, "data": { "leaderboard": [...] } }

# 2. 프론트엔드 코드에서 data 추출 확인
if (data.data?.leaderboard) { ... }

# 3. 재배포 필요시:
git push origin main
# Vercel 자동 배포
```

---

## 8. 모니터링 및 유지보수

### 일일 점검

```bash
# 매일 09:00 KST
- API 응답 시간 < 500ms 확인
- Settings 값 정상 확인
- 에러 로그 없음 확인
```

### 주간 점검

```bash
# 매주 월요일
- 모든 페이지 접근 가능 확인
- 모든 필터 작동 확인
- 사용자 피드백 검토
```

### 월간 점검

```bash
# 매달 첫 주
- 성능 리포트 생성
- 사용 통계 분석
- 개선사항 식별
```

---

## 🚀 최종 배포 체크리스트

- [ ] 모든 Sanity 데이터 생성 완료
- [ ] siteSettings 문서 publish 완료
- [ ] 로컬 테스트 모두 통과
- [ ] GitHub 커밋 완료
- [ ] Vercel 배포 완료
- [ ] 실시간 웹사이트 확인 완료
- [ ] 24시간 모니터링 설정 완료
- [ ] 긴급 연락망 공유 완료

**배포 승인**: ________________  
**배포 일시**: ________________  
**모니터링 담당자**: ________________

---

**문제 발생 시 연락**:
- 개발팀: [연락처]
- 운영팀: [연락처]
- 긴급: [연락처]

