# 🚀 Kulture 배포 가이드

## 📋 목차

1. [사전 준비](#사전-준비)
2. [환경 변수 설정](#환경-변수-설정)
3. [Vercel 배포](#vercel-배포)
4. [Sanity CMS 설정](#sanity-cms-설정)
5. [API 키 발급](#api-키-발급)
6. [배포 후 검증](#배포-후-검증)
7. [문제 해결](#문제-해결)

---

## 사전 준비

### 필수 계정

- ✅ GitHub 계정
- ✅ Vercel 계정 (GitHub로 연동)
- ✅ Sanity.io 계정

### 선택 계정 (무료)

- Twitter Developer (VIP 모니터링)
- Google Cloud Platform (YouTube API)
- Reddit (커뮤니티 트렌드)
- Naver Developers (한국 트렌드)
- Hugging Face (AI 콘텐츠 생성)

---

## 환경 변수 설정

### 1. 로컬 개발 환경

`.env.example` 파일을 복사하여 `.env.local` 생성:

```bash
cp .env.example .env.local
```

`.env.local` 파일을 열어 각 API 키를 실제 값으로 교체:

```bash
# 최소 필수 (Sanity만)
NEXT_PUBLIC_SANITY_PROJECT_ID=your_actual_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_actual_token

# 권장 (무료 API 활용)
TWITTER_BEARER_TOKEN=your_twitter_token
YOUTUBE_API_KEY=your_youtube_key
HUGGINGFACE_API_TOKEN=hf_your_token
CRON_SECRET=$(openssl rand -base64 32)
```

### 2. Vercel 프로덕션 환경

Vercel Dashboard → Settings → Environment Variables에서 설정:

| 변수명                          | 값                   | 환경       |
| ------------------------------- | -------------------- | ---------- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity Project ID    | All        |
| `NEXT_PUBLIC_SANITY_DATASET`    | `production`         | All        |
| `SANITY_API_TOKEN`              | Sanity API Token     | All        |
| `TWITTER_BEARER_TOKEN`          | Twitter Bearer Token | Production |
| `YOUTUBE_API_KEY`               | YouTube API Key      | Production |
| `REDDIT_CLIENT_ID`              | Reddit Client ID     | Production |
| `REDDIT_CLIENT_SECRET`          | Reddit Client Secret | Production |
| `NAVER_CLIENT_ID`               | Naver Client ID      | Production |
| `NAVER_CLIENT_SECRET`           | Naver Client Secret  | Production |
| `HUGGINGFACE_API_TOKEN`         | Hugging Face Token   | Production |
| `CRON_SECRET`                   | Random Secret (32자) | Production |

**Cron Secret 생성**:

```bash
openssl rand -base64 32
```

---

## Vercel 배포

### 방법 1: GitHub 연동 (권장)

1. **GitHub 저장소에 푸시**

   ```bash
   git add .
   git commit -m "feat: 배포 준비 완료"
   git push origin main
   ```

2. **Vercel 연동**
   - https://vercel.com/new 접속
   - "Import Git Repository" 클릭
   - GitHub에서 `Kulture` 저장소 선택
   - "Import" 클릭

3. **프로젝트 설정**
   - Framework Preset: **Next.js** (자동 감지)
   - Root Directory: `./` (기본값)
   - Build Command: `next build` (자동 설정)
   - Output Directory: `.next` (자동 설정)

4. **환경 변수 추가**
   - "Environment Variables" 섹션에서 위의 표 참고하여 추가
   - "Production", "Preview", "Development" 환경 모두 체크

5. **배포 시작**
   - "Deploy" 버튼 클릭
   - 약 2-3분 후 배포 완료
   - 배포 URL: `https://kulture-xxx.vercel.app`

### 방법 2: Vercel CLI

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

---

## Sanity CMS 설정

### 1. Sanity 프로젝트 생성

```bash
# Sanity Studio 초기화 (이미 완료된 경우 Skip)
cd sanity-studio
npm install
```

### 2. Sanity 배포

```bash
# Studio 배포
cd sanity-studio
npm run deploy

# 배포 URL: https://your-project.sanity.studio
```

### 3. CORS 설정

Sanity Dashboard → Settings → API → CORS Origins에 추가:

```
https://kulture.vercel.app
https://*.vercel.app (Preview 배포용)
http://localhost:3000 (로컬 개발용)
```

### 4. 초기 데이터 생성

Sanity Studio에서 다음 항목 생성:

1. **Site Settings**
   - Content Restriction 설정
   - Ad Watch Feature 설정
   - Comments 설정
   - Authentication 설정
   - General 설정

2. **Categories**
   - K-Pop
   - K-Drama
   - K-Movie
   - K-Food
   - K-Beauty
   - K-Fashion

3. **Author** (최소 1개)
   - Name: "Kulture Team"
   - Slug: "kulture-team"

---

## API 키 발급

### Twitter API (무료 - 월 50만 조회)

1. https://developer.twitter.com/en/portal/dashboard 접속
2. "Create App" 클릭
3. App 이름, 설명 입력
4. "Keys and tokens" → "Bearer Token" 발급
5. Vercel에 `TWITTER_BEARER_TOKEN` 추가

**비용**: $0/월 (Essential 플랜)

---

### YouTube Data API v3 (무료 - 일 10,000 쿼터)

1. https://console.cloud.google.com 접속
2. "새 프로젝트" 생성
3. "API 및 서비스" → "YouTube Data API v3" 검색 및 활성화
4. "사용자 인증 정보" → "API 키" 생성
5. Vercel에 `YOUTUBE_API_KEY` 추가

**비용**: $0/월

---

### Reddit API (완전 무료)

1. https://www.reddit.com/prefs/apps 접속
2. "create another app" 클릭
3. Type: "script" 선택
4. Redirect URI: `http://localhost:8000`
5. Client ID, Secret 복사
6. Vercel에 `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET` 추가

**비용**: $0/월

---

### Naver Open API (무료 - 일 25,000회)

1. https://developers.naver.com/apps/#/register 접속
2. "애플리케이션 등록" 클릭
3. "검색" API 선택
4. 웹 서비스 URL: `https://kulture.vercel.app`
5. Client ID, Secret 복사
6. Vercel에 `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` 추가

**비용**: $0/월

---

### Hugging Face API (무료 - 무제한)

1. https://huggingface.co/settings/tokens 접속
2. "New token" 클릭
3. Name: "Kulture"
4. Type: "Read" (무료)
5. 토큰 복사 (hf\_로 시작)
6. Vercel에 `HUGGINGFACE_API_TOKEN` 추가

**비용**: $0/월 (느림, Cold Start 30초)

---

## 배포 후 검증

### 1. 헬스체크

배포 완료 후 API 상태 확인:

```bash
curl https://kulture.vercel.app/api/health
```

**예상 응답** (API 키 설정 전):

```json
{
  "status": "degraded",
  "checks": {
    "sanity": { "ok": true, "message": "Connected" },
    "twitter": { "ok": false, "message": "Token not configured" },
    "youtube": { "ok": false, "message": "API key not configured" },
    "huggingface": { "ok": false, "message": "Token not configured" }
  }
}
```

**목표** (API 키 설정 후):

```json
{
  "status": "healthy",
  "checks": {
    "sanity": { "ok": true, "message": "Connected" },
    "twitter": { "ok": true, "message": "Connected" },
    "youtube": { "ok": true, "message": "Connected" },
    "huggingface": { "ok": true, "message": "Connected" }
  }
}
```

### 2. Cron Job 확인

Vercel Dashboard → Deployments → Functions → Cron Logs:

- `/api/cron/vip-monitoring` - 30분마다 실행 확인
- `/api/cron/trend-detection` - 2시간마다 실행 확인
- `/api/cron/content-generation` - 일 4회 실행 확인
- `/api/health` - 10분마다 실행 확인

### 3. 관리자 페이지 접근

1. https://kulture.vercel.app/admin/settings 접속
2. 비밀번호 입력: `kulture2025` (기본값)
3. 모든 설정이 정상 표시되는지 확인

### 4. Sanity 데이터 확인

Sanity Studio → Vision:

```groq
// VIP 모니터링 데이터 확인
*[_type == "vipMonitoring"] | order(_createdAt desc) [0..5]

// Hot Issue 확인
*[_type == "hotIssue"] | order(mentions desc) [0..5]

// AI 생성 콘텐츠 확인
*[_type == "post" && status == "pending"] | order(_createdAt desc) [0..5]
```

---

## 문제 해결

### 문제 1: Cron Job이 실행되지 않음

**증상**: Vercel Cron Logs에 로그 없음

**해결**:

1. `vercel.json`이 프로젝트 루트에 있는지 확인
2. Vercel Dashboard → Settings → Cron Jobs 확인
3. `CRON_SECRET` 환경 변수 설정 확인
4. 수동 실행 테스트:
   ```bash
   curl -X GET \
     https://kulture.vercel.app/api/cron/vip-monitoring \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

---

### 문제 2: Sanity 연결 실패

**증상**: `Error: SANITY_PROJECT_ID is not defined`

**해결**:

1. Vercel 환경 변수에 `NEXT_PUBLIC_SANITY_PROJECT_ID` 확인
2. "All Environments" 체크 확인
3. 재배포: Vercel Dashboard → Deployments → "Redeploy"

---

### 문제 3: API 키 Invalid

**증상**: `"ok": false, "message": "Invalid token"`

**해결**:

1. API 키 재발급
2. Vercel 환경 변수 업데이트
3. 재배포

---

### 문제 4: Hugging Face Model Loading

**증상**: `503 Service Unavailable`

**해결**:

- 정상 현상 (Cold Start)
- 30초 대기 후 자동 재시도
- 3회 재시도 실패 시 Fallback (규칙 기반 개선)

---

### 문제 5: 무료 플랜 한도 초과

**증상**: `429 Too Many Requests`

**해결**:

1. Cron 스케줄 조정 (`vercel.json`)
2. Rate Limiter 설정 확인 (`lib/vipMonitoring.js`)
3. 일일 사용량 모니터링:

   ```bash
   # Twitter API 사용량 확인
   # https://developer.twitter.com/en/portal/dashboard

   # YouTube API 사용량 확인
   # https://console.cloud.google.com/apis/dashboard
   ```

---

## 성능 최적화

### 1. CDN 캐싱

`next.config.js`에 추가:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ]
  },
}
```

### 2. 이미지 최적화

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['cdn.sanity.io'],
    formats: ['image/avif', 'image/webp'],
  },
}
```

### 3. API Rate Limiting

`lib/vipMonitoring.js`의 `rateLimiter` 설정 조정:

```javascript
const rateLimiter = {
  twitter: { lastCall: 0, minInterval: 2000 }, // 2초당 1회 (더 안전)
  youtube: { lastCall: 0, minInterval: 2000 },
  reddit: { lastCall: 0, minInterval: 1000 },
}
```

---

## 보안 체크리스트

- [ ] `.env.local` 파일을 `.gitignore`에 추가
- [ ] Sanity API Token을 "Editor" 권한으로 제한
- [ ] Vercel Cron Secret 설정
- [ ] 관리자 비밀번호 변경 (`NEXT_PUBLIC_ADMIN_PASSWORD`)
- [ ] Sanity CORS 설정 (특정 도메인만 허용)
- [ ] API 키 정기 갱신 (3개월마다)

---

## 모니터링

### Vercel Analytics

Vercel Dashboard → Analytics:

- Page Views
- Unique Visitors
- Top Pages
- Web Vitals (Core Web Vitals)

### Sanity Usage

Sanity Dashboard → Usage:

- API Requests
- Bandwidth
- Documents Count

### API Quota Monitoring

- Twitter: https://developer.twitter.com/en/portal/dashboard
- YouTube: https://console.cloud.google.com/apis/dashboard
- Naver: https://developers.naver.com/apps

---

## 비용 최적화

### 무료 플랜 범위 내 유지

| 서비스  | 무료 한도    | 현재 사용량 | 안전 마진 |
| ------- | ------------ | ----------- | --------- |
| Vercel  | 100GB/월     | ~5GB/월     | ✅ 95GB   |
| Sanity  | 100k read/월 | ~10k/월     | ✅ 90k    |
| Twitter | 500k/월      | ~1.4k/월    | ✅ 498k   |
| YouTube | 10k/일       | ~50/일      | ✅ 9.95k  |

**예상 트래픽**:

- 월 방문자 1만 명: $0/월
- 월 방문자 10만 명: $0/월 (여전히 무료)
- 월 방문자 100만 명: Vercel Pro ($20/월) 전환 필요

---

## 지원

### 문서

- [Next.js 공식 문서](https://nextjs.org/docs)
- [Sanity 공식 문서](https://www.sanity.io/docs)
- [Vercel 공식 문서](https://vercel.com/docs)

### 커뮤니티

- [Kulture GitHub Issues](https://github.com/Borbino/Kulture/issues)
- CEO 직접 문의: 프로젝트 내 ReviseLog.md 참조

---

**배포 완료 후 CEO에게 보고**:

- ✅ 배포 URL: https://kulture.vercel.app
- ✅ 관리자 페이지: https://kulture.vercel.app/admin/settings
- ✅ Sanity Studio: https://your-project.sanity.studio
- ✅ 헬스체크: https://kulture.vercel.app/api/health
- ✅ 총 비용: $0/월

🎉 **축하합니다! Kulture 프로젝트가 성공적으로 배포되었습니다!**
