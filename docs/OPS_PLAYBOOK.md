# Kulture 운영 플레이북 (OPS_PLAYBOOK.md)

> **배포 가이드 | 환경 변수 | Sanity 설정 | 비용 최적화 | 모니터링**  
> 문서 통합 완료: 2025-01-13

---

## 📘 문서 구조

이 문서는 다음 내용을 통합합니다:
- **docs/DEPLOYMENT_GUIDE.md**: Vercel 배포 프로세스
- **docs/SANITY_SETUP.md**: Sanity CMS 초기화
- **docs/VERCEL_DEPLOYMENT.md**: Vercel 세부 설정
- **docs/ENVIRONMENT_VARIABLES.md**: 환경 변수 관리
- **docs/API_KEYS_GUIDE.md**: API 키 발급 및 관리
- **docs/UPGRADE_GUIDE.md**: 업그레이드 가이드
- **docs/SANITY_SCHEMA_DEPLOYMENT.md**: Sanity 스키마 배포

---

## 🚀 Section 1: 빠른 배포 가이드

### 1-1. 사전 준비

**필수 계정**:
- ✅ GitHub 계정
- ✅ Vercel 계정 (GitHub로 연동)
- ✅ Sanity.io 계정

**선택 계정** (무료):
- Twitter Developer (VIP 모니터링)
- Google Cloud Platform (YouTube API)
- Reddit (커뮤니티 트렌드)
- Naver Developers (한국 트렌드)
- OpenAI (번역/AI 콘텐츠)

### 1-2. 5단계 배포 프로세스

#### Step 1: GitHub 저장소 준비

```bash
# 프로젝트 클론
git clone https://github.com/your-username/Kulture.git
cd Kulture

# 의존성 설치
npm install

# 로컬 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 열어 API 키 입력
```

#### Step 2: Sanity CMS 설정

```bash
# Sanity CLI 설치
npm install -g @sanity/cli

# Sanity 프로젝트 생성 (이미 존재하면 건너뛰기)
sanity init

# Sanity Studio 배포
cd studio
sanity deploy
# 배포 URL: https://your-project.sanity.studio
```

**Sanity 초기 데이터 생성**:
1. Sanity Studio 접속 (`https://your-project.sanity.studio`)
2. siteSettings 문서 생성:
   ```javascript
   {
     "_type": "siteSettings",
     "title": "Kulture Site Settings",
     "gamification": {
       "enabled": true,
       "leaderboardEnabled": true,
       "badgesEnabled": true,
       "dailyMissionsEnabled": true
     },
     "trends": {
       "enabled": true,
       "trendWidgetEnabled": true,
       "trendHubEnabled": true,
       "vipMonitoringEnabled": true,
       "hotIssueEnabled": true
     },
     "contentRestriction": {
       "enabled": true,
       "restrictionPercentage": 30,
       "adViewDurationSeconds": 15
     }
   }
   ```
3. Publish 클릭

#### Step 3: Vercel 배포

**방법 A: GitHub 연동 (권장)**

1. https://vercel.com/new 접속
2. "Import Git Repository" 클릭
3. GitHub에서 `Kulture` 저장소 선택
4. "Import" 클릭
5. 환경 변수 입력 (아래 Section 2 참조)
6. "Deploy" 클릭
7. 배포 완료 대기 (2-3분)

**방법 B: CLI 배포**

```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

#### Step 4: 환경 변수 설정

Vercel Dashboard → Settings → Environment Variables

**필수 변수**:
```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_api_token
```

**선택 변수** (기능 활성화 시):
```bash
# Translation
OPENAI_API_KEY=sk-...
GOOGLE_TRANSLATE_API_KEY=AIza...
DEEPL_API_KEY=...
REDIS_URL=redis://...

# VIP Monitoring
TWITTER_BEARER_TOKEN=...
YOUTUBE_API_KEY=...
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
NAVER_CLIENT_ID=...
NAVER_CLIENT_SECRET=...

# Authentication
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://your-domain.vercel.app

# MongoDB (Translation Suggestions)
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=kulture

# Notification
ADMIN_EMAIL=admin@kulture.com
EMAIL_API_KEY=...
SLACK_WEBHOOK_URL=...

# Error Tracking
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...

# Cron Jobs
CRON_SECRET=$(openssl rand -base64 32)
```

#### Step 5: 배포 검증

1. **사이트 접속**: `https://your-project.vercel.app`
2. **홈페이지 로드 확인**
3. **Sanity 데이터 표시 확인**
4. **API 엔드포인트 테스트**:
   ```bash
   curl https://your-project.vercel.app/api/health
   ```
5. **관리자 페이지 접속**: `https://your-project.vercel.app/admin/settings`
6. **설정 토글 테스트**

---

## 🔑 Section 2: 환경 변수 상세 가이드

### 2-1. Sanity CMS

```bash
# Sanity Project ID
# 확인 방법: studio/sanity.config.js 또는 Sanity Dashboard
NEXT_PUBLIC_SANITY_PROJECT_ID=abc123xyz

# Dataset (일반적으로 production 사용)
NEXT_PUBLIC_SANITY_DATASET=production

# API Token
# 발급 방법: Sanity Dashboard → API → Tokens → Add Token
# 권한: Editor 이상
SANITY_API_TOKEN=skXXXXXXXXXXXXXXXXX
```

### 2-2. 번역 시스템 (3단계 폴백)

```bash
# OpenAI (Primary - 200+ 언어)
# 발급: https://platform.openai.com/api-keys
# 비용: $0.015/1K입력 + $0.06/1K출력
OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# DeepL (Secondary - 최고 품질)
# 발급: https://www.deepl.com/pro-api
# 무료: 월 500,000 characters
DEEPL_API_KEY=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX:fx

# Google Translate (Fallback - 최다 언어)
# 발급: Google Cloud Console → APIs & Services → Credentials
# 무료: 월 500,000 characters
GOOGLE_TRANSLATE_API_KEY=AIzaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Redis (Optional - 성능 향상)
# 무료 제공: Upstash, Redis Cloud
REDIS_URL=redis://default:password@hostname:6379
```

### 2-3. VIP 모니터링 & 트렌드

```bash
# Twitter API (VIP 멘션 추적)
# 발급: https://developer.twitter.com/en/portal/dashboard
# 무료: v2 Essential (50개 트윗/월)
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAXXXXXXXXXXXXXXXXXXXXXXXXXXX

# YouTube Data API (조회수, 댓글)
# 발급: Google Cloud Console → YouTube Data API v3
# 무료: 10,000 quota/day
YOUTUBE_API_KEY=AIzaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Reddit API (커뮤니티 반응)
# 발급: https://www.reddit.com/prefs/apps
REDDIT_CLIENT_ID=XXXXXXXXXXXXXX
REDDIT_CLIENT_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Naver API (한국 뉴스)
# 발급: https://developers.naver.com/apps
NAVER_CLIENT_ID=XXXXXXXXXXXXXXXXXXXX
NAVER_CLIENT_SECRET=XXXXXXXXXX
```

### 2-4. 인증 & 세션

```bash
# NextAuth Secret (32자 이상)
# 생성: openssl rand -base64 32
NEXTAUTH_SECRET=Vy2W1+/SfQqvJJfz8r5u3TKJ+hXYN9pL==

# NextAuth URL (프로덕션 도메인)
NEXTAUTH_URL=https://kulture.vercel.app

# OAuth Providers (선택사항)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_ID=...
GITHUB_SECRET=...
```

### 2-5. 데이터베이스

```bash
# MongoDB (Translation Suggestions, User Data)
# 무료: MongoDB Atlas M0 (512MB)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=kulture
```

### 2-6. 알림 & 모니터링

```bash
# Email (SendGrid)
ADMIN_EMAIL=admin@kulture.com
EMAIL_API_KEY=SG.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
EMAIL_FROM=noreply@kulture.com

# Slack Webhook
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX

# Sentry (Error Tracking)
SENTRY_DSN=https://public@sentry.io/1234567
NEXT_PUBLIC_SENTRY_DSN=https://public@sentry.io/1234567
```

### 2-7. Vercel Cron Jobs

```bash
# Cron Secret (보안 강화)
# 생성: openssl rand -base64 32
CRON_SECRET=Vy2W1+/SfQqvJJfz8r5u3TKJ+hXYN9pL==

# Cron 설정: vercel.json
{
  "crons": [
    {
      "path": "/api/cron/daily-report",
      "schedule": "0 10 * * *"
    }
  ]
}
```

---

## 🗂️ Section 3: Sanity CMS 완전 가이드

### 3-1. Sanity 프로젝트 생성

```bash
# Sanity CLI 설치
npm install -g @sanity/cli

# 새 프로젝트 생성
sanity init

# 선택사항 입력:
# - Project name: Kulture
# - Dataset: production
# - Output path: studio/
# - Schema: Clean project
```

### 3-2. Sanity 스키마 구조

**30+ 스키마**:
```
studio/schemas/
├── siteSettings.js        (사이트 전역 설정)
├── post.js               (게시물)
├── comment.js            (댓글)
├── user.js               (사용자)
├── badge.js              (배지)
├── dailyMission.js       (일일 미션)
├── hotIssue.js           (핫이슈)
├── vipMonitoring.js      (VIP 모니터링)
├── trendSnapshot.js      (트렌드 스냅샷)
├── community.js          (커뮤니티)
├── event.js              (이벤트)
└── ... (20+ more)
```

### 3-3. Sanity Studio 배포

```bash
# Studio 디렉토리로 이동
cd studio

# 로그인 (최초 1회)
sanity login

# 배포
sanity deploy

# 배포 URL 확인
# https://your-project.sanity.studio
```

### 3-4. Sanity 스키마 업데이트

```bash
# 스키마 파일 수정 후
cd studio
sanity deploy

# 로컬에서 테스트
sanity start
# http://localhost:3333
```

### 3-5. Sanity API Token 발급

1. https://sanity.io/manage 접속
2. 프로젝트 선택
3. API → Tokens → Add Token
4. 권한 선택:
   - **Viewer**: 읽기 전용
   - **Editor**: 읽기/쓰기 (권장)
   - **Administrator**: 모든 권한
5. 토큰 복사 후 환경 변수에 저장

### 3-6. 초기 데이터 셋업 상세 (참조)

**Site Settings 필수 필드 구성**:
```javascript
// Content > siteSettings > settings
{
  "gamification": {
    "enabled": true,
    "enableDailyMissions": true,
    "enableLevelSystem": true,
    "enableBadges": true,
    "pointMultiplier": 1.0
  },
  "trends": {
    "enabled": true,
    "enableTrendWidget": true,
    "enableTrendHubPage": true,
    "enableVipMonitoring": true,
    "updateInterval": 30,
    "trackingCategories": ["K-Pop", "K-Drama", "K-Movie", "K-Fashion", "K-Beauty", "K-Food", "K-Gaming", "K-Art"]
  },
  "translationSystem": {
    "enabled": true,
    "defaultLanguage": "ko",
    "primaryProvider": "openai",
    "enableCache": true
  }
}
```

**테스트 배지 예시**:
1. **First Post** (Type: achievement, Icon: ✍️, Color: Gold)
   - Requirement: `{ posts: 1, type: "posts" }`
2. **Comment Master** (Type: achievement, Icon: 💬, Color: Mint)
   - Requirement: `{ comments: 10, type: "comments" }`
3. **Level 5** (Type: rank, Icon: 🎖️, Color: Red)
   - Requirement: `{ level: 5, type: "level" }`

**테스트 미션 예시**:
1. **Daily Login** (Type: daily_login, Reward: 5pts)
2. **Comment Writer** (Type: write_comment, Target: 3, Reward: 10pts)
3. **Like Enthusiast** (Type: like_posts, Target: 5, Reward: 15pts)

---

## 💰 Section 4: 비용 최적화 가이드

### 4-1. 무료 티어 최대 활용

| 서비스 | 무료 한도 | 초과 시 비용 | 권장 사항 |
|--------|-----------|-------------|----------|
| **Vercel** | 100GB 대역폭/월, Serverless 100GB-hrs | $20/월~ | 이미지 최적화, CDN 캐싱 |
| **Sanity** | 3 users, 100K API requests/day | $0 (Community) | READ 최적화, 캐싱 |
| **MongoDB Atlas** | 512MB M0 | $0 | Index 최적화 |
| **OpenAI** | $5 credit (첫 3개월) | $0.075/1K토큰 + $0.06/1K출력 | 캐싱, 배치 처리 |
| **DeepL** | 500K chars/월 | $5.49/월~ | 폴백으로 사용 |
| **Google Translate** | 500K chars/월 | $20/1M chars | 최종 폴백 |
| **Redis (Upstash)** | 10K requests/day | $0.2/100K | 번역 캐싱 |
| **Sentry** | 5K errors/월 | $26/월~ | 샘플링 50% |

### 4-2. 번역 비용 최적화

**캐싱 전략**:
```javascript
// 2단계 캐싱으로 API 호출 90% 감소
L1 Cache (In-memory) → 히트율 60%
L2 Cache (Redis)     → 히트율 30%
API Call             → 10% only
```

**예상 비용** (월 10만 번역 기준):
- 캐시 없음: $150/월
- 2단계 캐싱: $15/월 (90% 절감)

**배치 처리**:
```javascript
// 100개 텍스트를 1회 API 호출로 번역
const translations = await translateBatch(texts, targetLang);
// 비용: 100회 API → 1회 API
```

### 4-3. Vercel 대역폭 최적화

```javascript
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],  // 30% 크기 감소
    deviceSizes: [640, 750, 828, 1080, 1200],
    minimumCacheTTL: 60 * 60 * 24 * 30,     // 30일 캐싱
  },
  compress: true,                             // gzip 압축
};
```

### 4-4. Sanity API 호출 최적화

```javascript
// GROQ 쿼리 최적화
const query = `*[_type == "post" && !(_id in path("drafts.**"))] {
  _id,
  title,
  slug,
  // 필요한 필드만 조회
}[0...20]`;  // 페이지네이션

// 캐싱 (Next.js ISR)
export async function getStaticProps() {
  return {
    props: { data },
    revalidate: 3600  // 1시간마다 재생성
  };
}
```

### 4-5. 월간 예상 비용

**시나리오 A: 무료 티어만 사용** (월 1만 방문자)
- Vercel: $0
- Sanity: $0
- MongoDB: $0
- OpenAI: $0 (무료 크레딧)
- **총 비용: $0/월**

**시나리오 B: 유료 티어 혼합** (월 10만 방문자)
- Vercel: $20
- Sanity: $0
- MongoDB: $0
- OpenAI: $15 (캐싱 90%)
- DeepL: $0 (무료 한도 내)
- Redis: $0 (Upstash 무료)
- **총 비용: $35/월**

---

## 📊 Section 5: 모니터링 & 장애 대응

### 5-1. Vercel Analytics

**활성화**:
```bash
# Vercel Dashboard → Analytics → Enable
# 무료: 5K 페이지뷰/월
```

**주요 지표**:
- **Real User Monitoring** (RUM): 실제 사용자 경험
- **Web Vitals**: LCP, FID, CLS
- **Edge Function 성능**: 응답 시간, 에러율
- **대역폭 사용량**: 이미지, API, 정적 파일

### 5-2. Sentry 에러 추적

```javascript
// sentry.client.config.js
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.5,  // 성능 모니터링 50% 샘플링
  beforeSend(event, hint) {
    // 민감한 정보 필터링
    if (event.request?.headers?.authorization) {
      delete event.request.headers.authorization;
    }
    return event;
  }
});
```

### 5-3. Custom Analytics

```javascript
// lib/analytics.js
export const trackEvent = (eventName, properties) => {
  // Google Analytics 4
  if (window.gtag) {
    window.gtag('event', eventName, properties);
  }
  
  // Custom logging
  fetch('/api/analytics/track', {
    method: 'POST',
    body: JSON.stringify({ eventName, properties, timestamp: new Date() })
  });
};

// 사용 예시
trackEvent('translation_completed', {
  sourceLang: 'en',
  targetLang: 'ko',
  provider: 'openai',
  cached: false,
  responseTime: 450
});
```

### 5-4. 장애 대응 체크리스트

**Level 1: 경고** (응답 시간 > 1초)
- [ ] Vercel Logs 확인
- [ ] Sanity API 상태 확인
- [ ] Redis 연결 상태 확인
- [ ] 원인 파악 후 ReviseLog 기록

**Level 2: 심각** (에러율 > 5%)
- [ ] 즉시 Vercel Deployment 롤백
- [ ] CEO 및 팀 알림
- [ ] Sentry 에러 로그 분석
- [ ] 긴급 핫픽스 PR 생성

**Level 3: 위급** (서비스 다운)
- [ ] Vercel Status Page 확인
- [ ] Sanity Status 확인
- [ ] DNS 설정 확인
- [ ] 백업 환경으로 전환 고려

### 5-5. 헬스체크 API

```javascript
// pages/api/health.js
export default async function handler(req, res) {
  const checks = {
    sanity: await checkSanity(),
    mongodb: await checkMongoDB(),
    redis: await checkRedis(),
    openai: await checkOpenAI(),
  };
  
  const allHealthy = Object.values(checks).every(c => c.status === 'ok');
  
  return res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    timestamp: new Date().toISOString(),
    checks
  });
}
```

**모니터링 설정**:
```bash
# Vercel Cron (10분마다)
{
  "crons": [{
    "path": "/api/health",
    "schedule": "*/10 * * * *"
  }]
}

# UptimeRobot (무료, 5분마다)
https://uptimerobot.com → Add Monitor
→ URL: https://your-domain.vercel.app/api/health
```

---

## 🔄 Section 6: 업그레이드 가이드

### 6-1. Next.js 업그레이드

```bash
# 현재 버전 확인
npm list next

# 최신 버전으로 업그레이드
npm install next@latest react@latest react-dom@latest

# 빌드 테스트
npm run build

# 로컬 테스트
npm run dev
```

**주의사항**:
- Breaking changes 확인: https://nextjs.org/docs/upgrading
- 새 기능 활용: App Router, Server Components
- 성능 개선: Turbopack, Image Optimization

### 6-2. Sanity 업그레이드

```bash
# Sanity 패키지 업그레이드
cd studio
npm install @sanity/cli@latest

# 스키마 마이그레이션 (필요 시)
sanity dataset export production backup.tar.gz
sanity dataset import backup.tar.gz production --replace

# 배포
sanity deploy
```

### 6-3. 의존성 보안 업데이트

```bash
# 보안 취약점 확인
npm audit

# 자동 수정 (minor/patch 버전만)
npm audit fix

# Major 버전 업그레이드 (수동 검토)
npm audit fix --force

# GitHub Dependabot 활성화
# .github/dependabot.yml 생성
```

### 6-4. 보안 취약점 해결 및 마이그레이션 전략

**주요 보안 취약점 유형**:
- **Command Injection**: `glob` 패키지 관련 (CLI 도구에서 주로 발생)
- **DOM Clobbering**: `prismjs` 관련 (Sanity Studio 내 사용)

**단계적 업그레이드 전략**:

**Option 1: 전체 업그레이드 (권장)**
1. 현재 상태 백업 (`git commit`)
2. `next-sanity@latest` 설치
3. `npm audit fix --force` 실행
4. 전체 테스트 수행 (`npm test`, `npm run build`)

**Option 2: 단계적 업그레이드**
1. 새 브랜치 생성 (`git checkout -b upgrade/next-sanity`)
2. 패키지 업데이트 및 로컬 테스트
3. Breaking changes 확인 (Sanity 릴리스 노트 참조)
4. Vercel Preview 배포 후 검증
5. Main 브랜치 병합

**보안 권장사항**:
- `.env.local` 사용하여 환경변수 보호
- `CRON_SECRET` 등 민감 정보 주기적 교체 (openssl rand -base64 32)
- Dependabot 설정으로 의존성 자동 업데이트

---

**마지막 업데이트**: 2025-01-13  
**통합 문서**: DEPLOYMENT_GUIDE.md, SANITY_SETUP.md, VERCEL_DEPLOYMENT.md, ENVIRONMENT_VARIABLES.md, API_KEYS_GUIDE.md, UPGRADE_GUIDE.md, SANITY_SCHEMA_DEPLOYMENT.md  
**상태**: 완료
