# E2E 테스트 시나리오

**작성일**: 2024-12-05  
**대상**: 게이미피케이션 + 트렌드/VIP 모니터링 기능  
**우선순위**: High (배포 전 필수)

---

## 🎯 테스트 환경 준비

### 필수 조건
- [ ] Sanity CMS 프로젝트 접근 가능
- [ ] Vercel 배포 완료
- [ ] 테스트용 계정 2개 준비 (일반 사용자, 관리자)
- [ ] 브라우저: Chrome, Firefox, Safari

### Sanity 초기 데이터 설정

```groq
# 1. siteSettings 생성 (관리자)
- Document ID: "settings"
- Title: "Kulture Site Settings"
- gamification.enabled: true
- gamification.dailyMissionsEnabled: true
- gamification.leaderboardEnabled: true
- gamification.badgesEnabled: true
- trends.enabled: true
- trends.trendWidgetEnabled: true
- trends.trendHubEnabled: true
- trends.vipMonitoringEnabled: true
- trends.hotIssueEnabled: true

# 2. 테스트 배지 생성 (최소 3개)
- Badge 1: "First Post" (requirement.posts = 1)
- Badge 2: "Comment Master" (requirement.comments = 10)
- Badge 3: "Level 5" (requirement.level = 5)

# 3. 테스트 미션 생성 (최소 3개, 오늘 날짜 범위)
- Mission 1: "Daily Login" (targetCount: 1, rewardPoints: 5)
- Mission 2: "Write a Comment" (targetCount: 3, rewardPoints: 10)
- Mission 3: "Like 5 Posts" (targetCount: 5, rewardPoints: 15)

# 4. VIP 모니터링 데이터 생성 (테스트용)
- VIP 1: "BTS" (mentions: 5000, alertLevel: "high")
- VIP 2: "NewJeans" (mentions: 3000, alertLevel: "normal")

# 5. Hot Issue 생성 (테스트용)
- Issue 1: "K-pop Industry News" (mentions: 2000, priority: "high")
- Issue 2: "K-drama Trending" (mentions: 1500, priority: "medium")

# 6. Trend Snapshot 생성 (테스트용)
- Timestamp: today
- Trends: [{keyword: "BTS", mentions: 5000}, {keyword: "K-drama", mentions: 3000}]
```

---

## 📝 테스트 케이스

### SECTION 1: 게이미피케이션 시스템 (4개 페이지)

#### TEST 1.1: 리더보드 페이지 - 기본 기능

**목표**: 리더보드 페이지가 정상적으로 로드되고 데이터를 표시

**절차**:
1. 로그인 상태로 `/leaderboard` 접근
2. 페이지 로드 확인
3. 리더보드 데이터 표시 확인

**기대 결과**:
- [ ] 페이지 제목 "🏆 리더보드" 표시
- [ ] Podium (1-3위) 표시
- [ ] Rank list (4위~) 표시
- [ ] 각 사용자 정보: 이름, 레벨, 뱃지, 포인트 표시
- [ ] Timeframe 필터 (all/month/week) 활성화
- [ ] Category 필터 (points/posts/engagement) 활성화

**테스트 데이터**:
- 최소 10명의 다른 points를 가진 사용자 필요

---

#### TEST 1.2: 리더보드 - 필터링 기능

**목표**: 각 필터가 정상 작동

**절차**:
1. Timeframe 필터 변경: "all" → "month" → "week"
2. 각 변경 후 데이터 갱신 확인
3. Category 필터 변경: "points" → "posts" → "engagement"

**기대 결과**:
- [ ] Timeframe 변경 시 순위 변경 (week이 더 적은 데이터)
- [ ] Category 변경 시 정렬 기준 변경 (points vs postCount vs engagement)
- [ ] 로딩 중 스피너 표시
- [ ] 5초 이내 결과 표시

**API 호출 확인**:
```
GET /api/gamification/leaderboard?timeframe=month&category=posts
→ { success: true, data: { leaderboard: [...], timeframe: "month", category: "posts", totalUsers: N } }
```

---

#### TEST 1.3: 배지 페이지 - 기본 기능

**목표**: 배지 페이지가 모든 배지를 표시하고 사용자 진행률 표시

**절차**:
1. 로그인 상태로 `/badges` 접근
2. 배지 그리드 로드 확인
3. 각 배지의 진행률 바 확인

**기대 결과**:
- [ ] 페이지 제목 "🏅 배지" 표시
- [ ] 배지 통계: "전체 배지 N개", "획득한 배지 M개" 표시
- [ ] 필터 버튼 (all/earned/locked) 활성화
- [ ] 각 배지 카드 표시: 아이콘, 이름, 설명, 진행률 바, 진행률 퍼센트
- [ ] "획득하기까지 N개 필요" 텍스트 표시

**테스트 데이터**:
- 사용자가 1개 배지는 획득한 상태
- 사용자가 2개 배지는 진행 중인 상태

---

#### TEST 1.4: 배지 - 필터링 기능

**목표**: 필터가 정상 작동

**절차**:
1. "all" 필터 클릭
2. "earned" 필터 클릭
3. "locked" 필터 클릭

**기대 결과**:
- [ ] "all": 모든 배지 표시 (3개)
- [ ] "earned": 획득한 배지만 표시 (1개)
- [ ] "locked": 미획득한 배지만 표시 (2개)

**API 호출 확인**:
```
GET /api/gamification/badges
→ { success: true, data: { badges: [...], userBadges: [...], totalBadges: N, earnedBadges: M } }
```

---

#### TEST 1.5: 미션 페이지 - 기본 기능

**목표**: 미션 페이지가 오늘의 미션을 표시하고 상호작용 가능

**절차**:
1. 로그인 상태로 `/missions` 접근
2. 미션 카드 로드 확인
3. 미션 진행률 바 확인

**기대 결과**:
- [ ] 페이지 제목 "🎯 일일 미션" 표시
- [ ] 미션 통계: 총 완료, 오늘 완료, 연속 일수, 총 보상 표시
- [ ] 3개 이상의 미션 카드 표시
- [ ] 각 미션 카드: 아이콘, 제목, 설명, 보상, 난이도, 진행률 바
- [ ] 미진행 미션: "시작" 버튼 표시
- [ ] 진행 중 미션: 진행률 바 + "진행" 버튼
- [ ] 완료한 미션: "청구하기" 버튼

**테스트 데이터**:
- 미션 1: 미진행 (progress = 0)
- 미션 2: 진행 중 (progress = 1/3)
- 미션 3: 완료 (progress = 5/5, isCompleted = true)

---

#### TEST 1.6: 미션 - 진행률 업데이트

**목표**: 미션 진행률이 정상적으로 업데이트

**절차**:
1. 미진행 미션의 "시작" 버튼 클릭
2. 진행률 바 업데이트 확인
3. 미션 완료까지 반복

**기대 결과**:
- [ ] 버튼 클릭 후 즉시 진행률 증가
- [ ] 진행률 바 색상 변경 (회색 → 파란색)
- [ ] 미션 완료 시 "청구하기" 버튼 활성화
- [ ] 로딩 중 버튼 비활성화

**API 호출 확인**:
```
GET /api/gamification/missions
→ { success: true, data: { missions: [...], streak: N, date: "YYYY-MM-DD" } }

POST /api/gamification/missions
{ missionId: "...", increment: 1 }
→ { success: true, data: { progress: N, isCompleted: boolean, mission: {...} } }
```

---

#### TEST 1.7: 미션 - 보상 청구

**목표**: 미션 완료 후 보상 청구 가능

**절차**:
1. 완료한 미션의 "청구하기" 버튼 클릭
2. 포인트 증가 확인
3. 배지 획득 여부 확인 (rewardBadge가 있는 경우)

**기대 결과**:
- [ ] "청구하기" 클릭 후 로딩 표시
- [ ] 보상 포인트 즉시 반영
- [ ] 토스트 알림: "보상을 청구했습니다!" 표시
- [ ] 사용자 프로필의 포인트 증가
- [ ] 미션 상태 변경: "청구 완료" 표시

**API 호출 확인**:
```
POST /api/gamification/claim-reward
{ missionId: "..." }
→ { success: true, data: { progress: N, isCompleted: boolean, mission: {...} } }
```

---

#### TEST 1.8: Settings 토글 - 게이미피케이션 비활성화

**목표**: 게이미피케이션 비활성화 시 페이지 접근 차단

**절차**:
1. Sanity Studio에서 `gamification.enabled = false` 설정
2. 각 페이지 재접근

**기대 결과**:
- [ ] `/leaderboard` 접근 시 "🔒 현재 이 페이지는 이용할 수 없습니다" 표시
- [ ] `/badges` 접근 시 동일 메시지
- [ ] `/missions` 접근 시 동일 메시지
- [ ] 홈페이지 네비게이션에서 게이미피케이션 링크 숨김

**API 호출 확인**:
```
GET /api/gamification/leaderboard
→ { success: false, message: "리더보드 기능이 현재 비활성화되었습니다" }
(403 Forbidden)
```

---

#### TEST 1.9: Settings 토글 - 개별 기능 비활성화

**목표**: 개별 기능 비활성화 시 정확히 그 기능만 차단

**절차**:
1. `gamification.enabled = true`, `gamification.leaderboardEnabled = false`
2. `/leaderboard` 접근
3. `/badges` 접근

**기대 결과**:
- [ ] `/leaderboard`: "🔒 현재 이 페이지는 이용할 수 없습니다"
- [ ] `/badges`: 정상 로드
- [ ] 홈페이지 네비게이션: 리더보드 링크 숨김, 배지 링크 표시

---

### SECTION 2: 트렌드 & VIP 모니터링 (2개 페이지)

#### TEST 2.1: 트렌드 허브 페이지 - 기본 기능

**목표**: 트렌드 허브 페이지가 정상적으로 로드되고 데이터 표시

**절차**:
1. 로그인 불필요, `/trends` 접근
2. 페이지 로드 확인

**기대 결과**:
- [ ] 페이지 제목 "📈 글로벌 K-Culture 트렌드 허브" 표시
- [ ] TrendSpotlight 위젯 표시
- [ ] 8개 K-문화 카테고리 버튼 표시 (K-Pop, K-Drama, K-Movie, K-Fashion, K-Beauty, K-Food, K-Gaming, K-Art)

**API 호출 확인**:
```
GET /api/trends
→ { success: true, data: { snapshot: {...}, hotIssues: [...] } }
```

---

#### TEST 2.2: TrendSpotlight 위젯 - 트렌드 표시

**목표**: 실시간 트렌드와 VIP 데이터 정상 표시

**절차**:
1. `/trends` 또는 홈페이지에서 TrendSpotlight 로드 확인
2. 데이터 카테고리별 확인

**기대 결과**:
- [ ] "📈 실시간 트렌드" 섹션: 상위 10개 트렌드 표시 (keyword, mentions)
- [ ] "🔥 급상승 이슈" 섹션: Hot issues 표시 (keyword, mentions, priority)
- [ ] "🎤 VIP 알림" 섹션: 상위 VIP 표시 (vipName, mentions, alertLevel)
- [ ] 업데이트 시각 표시: "업데이트: [timestamp]"
- [ ] 로딩 중: "불러오는 중..." 표시

**테스트 데이터**:
- Trends: BTS (5000), K-drama (3000) 등
- Hot Issues: K-pop News (2000), K-drama Trending (1500)
- VIP: BTS (5000, high), NewJeans (3000, normal)

---

#### TEST 2.3: TrendSpotlight - 에러 처리

**목표**: API 실패 시 에러 메시지 표시

**절차**:
1. 브라우저 DevTools에서 네트워크 에러 시뮬레이션
2. `/api/trends` 응답을 None으로 설정
3. 페이지 새로고침

**기대 결과**:
- [ ] "트렌드 데이터를 불러오지 못했습니다" 에러 메시지 표시
- [ ] 콘솔에 에러 로깅
- [ ] 페이지는 렌더링되지만 위젯 내용 없음

---

#### TEST 2.4: Settings 토글 - 트렌드 비활성화

**목표**: 트렌드 비활성화 시 페이지 접근 차단

**절차**:
1. Sanity Studio에서 `trends.enabled = false`
2. `/trends` 접근
3. 홈페이지에서 TrendSpotlight 확인

**기대 결과**:
- [ ] `/trends`: "🔒 현재 이 페이지는 이용할 수 없습니다"
- [ ] 홈페이지: TrendSpotlight 위젯 숨김
- [ ] 네비게이션: "📈 트렌드 허브" 링크 숨김

**API 호출 확인**:
```
GET /api/trends
→ { success: false, message: "트렌드 기능이 현재 비활성화되었습니다" }
(403 Forbidden)
```

---

#### TEST 2.5: Settings 토글 - VIP 모니터링 비활성화

**목표**: VIP 모니터링만 비활성화 시 다른 트렌드는 표시

**절차**:
1. `trends.enabled = true`, `trends.vipMonitoringEnabled = false`
2. `/trends` 접근
3. TrendSpotlight 확인

**기대 결과**:
- [ ] 페이지 정상 로드
- [ ] "📈 실시간 트렌드" 섹션 표시
- [ ] "🔥 급상승 이슈" 섹션 표시
- [ ] "🎤 VIP 알림" 섹션: 비어있음 또는 숨김

**API 호출 확인**:
```
GET /api/vip/top
→ { success: false, message: "VIP 모니터링 기능이 현재 비활성화되었습니다" }
(403 Forbidden)
```

---

#### TEST 2.6: Settings 토글 - 트렌드 위젯 비활성화

**목표**: 트렌드 위젯만 비활성화 시 /trends 페이지는 접근 가능

**절차**:
1. `trends.enabled = true`, `trends.trendWidgetEnabled = false`, `trends.trendHubEnabled = true`
2. 홈페이지에서 TrendSpotlight 확인
3. `/trends` 접근

**기대 결과**:
- [ ] 홈페이지: TrendSpotlight 위젯 숨김
- [ ] `/trends`: 정상 로드 (왜냐하면 trendHubEnabled = true)
- [ ] TrendSpotlight 없이 카테고리 버튼만 표시

---

### SECTION 3: 3-Layer Control 검증

#### TEST 3.1: UI Layer - 페이지 조건부 렌더링

**목표**: 설정 기반 페이지 차단 정상 작동

**절차**:
1. 각 게이미피케이션 페이지에서 settings 확인
2. settings가 false인 경우 "🔒" 메시지 표시 확인

**기대 결과**:
- [ ] pages/leaderboard.jsx: settings.gamification.enabled && settings.gamification.leaderboardEnabled 체크
- [ ] pages/badges.jsx: settings.gamification.enabled && settings.gamification.badgesEnabled 체크
- [ ] pages/missions.jsx: settings.gamification.enabled && settings.gamification.dailyMissionsEnabled 체크
- [ ] pages/trends.jsx: settings.trends.enabled && settings.trends.trendHubEnabled 체크

---

#### TEST 3.2: API Layer - 403 응답

**목표**: 설정 기반 API 차단 정상 작동

**절차**:
1. Sanity에서 settings 수정
2. 직접 API 호출 (curl)

**기대 결과**:
```bash
# gamification 비활성화
curl http://localhost:3000/api/gamification/leaderboard
→ 403 Forbidden
{ "success": false, "message": "리더보드 기능이 현재 비활성화되었습니다" }

# trends 비활성화
curl http://localhost:3000/api/trends
→ 403 Forbidden
{ "success": false, "message": "트렌드 기능이 현재 비활성화되었습니다" }
```

---

#### TEST 3.3: Admin Layer - 관리자 설정 UI

**목표**: 관리자가 settings 토글 가능

**절차**:
1. 관리자 계정으로 로그인
2. `/admin/settings` 접근
3. 각 토글 on/off

**기대 결과**:
- [ ] Gamification 섹션: 모든 토글 표시
- [ ] Trends 섹션: 모든 토글 표시
- [ ] 토글 변경 시 Sanity 업데이트 확인
- [ ] 변경 후 다른 사용자도 즉시 반영 (캐싱 고려)

---

### SECTION 4: 크로스 브라우저 테스트

#### TEST 4.1: Chrome/Edge (Chromium)

**테스트 항목**:
- [ ] 모든 페이지 로드
- [ ] 모든 필터 작동
- [ ] 모든 API 호출 정상
- [ ] 모바일 뷰 (375px): 반응형 레이아웃

---

#### TEST 4.2: Firefox

**테스트 항목**:
- [ ] 모든 페이지 로드
- [ ] CSS 렌더링 정상
- [ ] 콘솔 에러 없음

---

#### TEST 4.3: Safari (iOS)

**테스트 항목**:
- [ ] 모든 페이지 로드
- [ ] 터치 이벤트 정상
- [ ] 모바일 UX 정상

---

### SECTION 5: 성능 테스트

#### TEST 5.1: API 응답 시간

**목표**: 각 API 응답 시간 < 500ms

**측정**:
```bash
# DevTools Network 탭에서 측정
GET /api/gamification/leaderboard → 기대: 200-300ms
GET /api/gamification/badges → 기대: 150-250ms
GET /api/gamification/missions → 기대: 150-250ms
GET /api/trends → 기대: 300-500ms
GET /api/vip/top → 기대: 300-500ms
```

---

#### TEST 5.2: 페이지 로딩 시간

**목표**: 각 페이지 초기 로드 < 2초

**측정**:
```bash
# Lighthouse 또는 DevTools Performance 탭
/leaderboard → 기대: 1-2초
/badges → 기대: 1-2초
/missions → 기대: 1-2초
/trends → 기대: 1.5-2초
```

---

### SECTION 6: 보안 테스트

#### TEST 6.1: 인증 확인

**목표**: 비로그인 사용자는 적절히 차단

**절차**:
1. 로그아웃 상태에서 각 페이지 접근
2. 미션, 배지 등 개인 데이터 접근 시도

**기대 결과**:
- [ ] `/leaderboard`: 비로그인도 접근 가능 (공개 정보)
- [ ] `/badges`: 비로그인도 접근 가능 (배지 목록 공개)
- [ ] `/missions`: 비로그인 시 로그인 유도 페이지 표시
- [ ] `/trends`: 비로그인도 접근 가능 (공개 정보)

---

#### TEST 6.2: CORS 테스트

**목표**: 외부 도메인에서 API 호출 차단 (필요시)

**절차**:
1. 개발자 도구에서 XHR 호출 시뮬레이션

**기대 결과**:
- [ ] 같은 도메인: 정상
- [ ] 다른 도메인: CORS 에러 (설정에 따라)

---

## 📋 체크리스트

### 배포 전 최종 확인

- [ ] Sanity 초기 데이터 모두 생성됨
- [ ] siteSettings 문서 생성됨 (또는 존재함)
- [ ] 모든 Settings 토글 기본값 설정됨
- [ ] 모든 게이미피케이션 페이지 테스트 완료 (TEST 1.1 ~ 1.9)
- [ ] 모든 트렌드 페이지 테스트 완료 (TEST 2.1 ~ 2.6)
- [ ] 3-Layer Control 검증 완료 (TEST 3.1 ~ 3.3)
- [ ] 크로스 브라우저 테스트 완료 (TEST 4.1 ~ 4.3)
- [ ] 성능 테스트 완료 (TEST 5.1 ~ 5.2)
- [ ] 보안 테스트 완료 (TEST 6.1 ~ 6.2)

### 테스트 결과 기록

**테스트 담당자**: _______________  
**테스트 날짜**: _______________  
**결과**: ☐ PASS ☐ FAIL

**발견된 이슈**:
```
1. 
2.
3.
```

**승인자**: _______________  
**승인 날짜**: _______________

---

## 🚀 배포 체크리스트

- [ ] 모든 E2E 테스트 통과
- [ ] 성능 메트릭 확인 (Lighthouse > 85)
- [ ] 보안 취약점 스캔 완료
- [ ] 긴급 버그 픽스 완료
- [ ] 배포 전 백업 생성
- [ ] 배포 후 모니터링 설정
- [ ] 긴급 롤백 계획 준비

---

## 📞 문제 발생 시

### 로그 확인
```bash
# 브라우저 DevTools Console
- 에러 메시지 캡처
- 네트워크 탭에서 API 응답 확인

# Vercel Dashboard
- Deployment logs 확인
- Function logs 확인

# Sanity Studio
- Query errors 확인
- Document publish status 확인
```

### 연락처
- 개발팀: [연락처]
- 운영팀: [연락처]
- 긴급: [연락처]

