# 🚀 KULTURE.NET — 런칭 체크리스트 (LAUNCH CHECKLIST)

> **CEO 전용 가이드** · Phase 11 발급 · 2026-03-20 KST  
> 이 체크리스트를 순서대로 완료하면 Kulture.net이 실서비스로 오픈됩니다.  
> 완료한 항목은 `- [x]`로 표시하세요.

---

## ✅ STEP 1 — 환경변수 (.env) 세팅

> Vercel 대시보드 → 프로젝트 → **Settings → Environment Variables** 에서 아래 키를 입력합니다.  
> 로컬 개발 시 `.env.local` 파일에 동일하게 입력합니다.

### 🤖 AI / 번역 API

- [ ] `OPENAI_API_KEY` — [platform.openai.com](https://platform.openai.com) → API Keys
- [ ] `ANTHROPIC_API_KEY` — [console.anthropic.com](https://console.anthropic.com) → API Keys (Claude 폴백용)
- [ ] `GOOGLE_AI_API_KEY` — [aistudio.google.com](https://aistudio.google.com) → Get API Key (Gemini 폴백용)
- [ ] `DEEPL_API_KEY` — [deepl.com/pro-api](https://www.deepl.com/pro-api) → 번역 1순위 엔진

### 📰 CMS (Sanity)

- [ ] `NEXT_PUBLIC_SANITY_PROJECT_ID` — [sanity.io/manage](https://sanity.io/manage) → 프로젝트 ID 확인
- [ ] `NEXT_PUBLIC_SANITY_DATASET` — 일반적으로 `production`
- [ ] `SANITY_API_TOKEN` — Sanity 프로젝트 → API → Tokens → Editor 권한 토큰 생성

### 🔐 인증 (NextAuth)

- [ ] `NEXTAUTH_URL` — 실제 도메인 입력 (예: `https://kulture.net`)
- [ ] `NEXTAUTH_SECRET` — 터미널에서 `openssl rand -base64 32` 실행 후 복사
- [ ] `GOOGLE_CLIENT_ID` — [console.cloud.google.com](https://console.cloud.google.com) → OAuth 2.0 클라이언트
- [ ] `GOOGLE_CLIENT_SECRET` — 위와 동일 (소셜 로그인용)

### 📡 실시간 기능 (Supabase)

- [ ] `NEXT_PUBLIC_SUPABASE_URL` — [supabase.com](https://supabase.com) → 프로젝트 → Settings → API
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — 위와 동일 (anon key)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — 위와 동일 (service_role key — 서버 전용, 절대 공개 금지)

### 📱 SNS 자동 공유

- [ ] `TWITTER_API_KEY` — [developer.twitter.com](https://developer.twitter.com) → 프로젝트 → Keys and Tokens
- [ ] `TWITTER_API_SECRET` — 위와 동일
- [ ] `TWITTER_ACCESS_TOKEN` — 위와 동일
- [ ] `TWITTER_ACCESS_TOKEN_SECRET` — 위와 동일
- [ ] `FACEBOOK_APP_ID` — [developers.facebook.com](https://developers.facebook.com) → 내 앱
- [ ] `FACEBOOK_APP_SECRET` — 위와 동일

### 💰 수익화 (AdSense)

- [ ] `NEXT_PUBLIC_ADSENSE_CLIENT_ID` — Google AdSense → 계정 → `ca-pub-XXXXXXXXXX` 형식

### 🔍 에러 모니터링 (Sentry)

- [ ] `SENTRY_DSN` — [sentry.io](https://sentry.io) → 프로젝트 → Settings → DSN
- [ ] `NEXT_PUBLIC_SENTRY_DSN` — 위와 동일 (클라이언트 노출용)
- [ ] `SENTRY_AUTH_TOKEN` — Sentry → User Settings → Auth Tokens

---

## ✅ STEP 2 — Vercel 연동 및 배포

- [ ] **GitHub 저장소 연결**: [vercel.com/new](https://vercel.com/new) → GitHub 저장소 `Borbino/Kulture` import
- [ ] **Framework Preset**: `Next.js` 선택 확인
- [ ] **Root Directory**: 루트(`./`) 확인
- [ ] **Build Command**: `npm run build` (기본값)
- [ ] **Output Directory**: `.next` (기본값)
- [ ] **환경변수 주입**: STEP 1의 모든 키를 Vercel 환경변수에 입력 완료
- [ ] **첫 배포 실행**: Deploy 버튼 클릭 → 빌드 로그에서 오류 없음 확인
- [ ] **Preview URL 동작 확인**: Vercel이 발급한 `*.vercel.app` URL에서 홈페이지 정상 렌더 확인
- [ ] **빌드 성공 배지 확인**: GitHub 저장소 main 브랜치 최신 커밋에 ✅ 체크 표시

---

## ✅ STEP 3 — Vercel Cron Jobs 활성화

> `vercel.json`에 Cron 설정이 완료되어 있습니다. 아래 항목만 확인하세요.

- [ ] **Vercel 대시보드 → 프로젝트 → Settings → Cron Jobs** 메뉴 진입
- [ ] **`/api/cron/generate-content`** Cron이 목록에 표시되는지 확인 (매일 새벽 2시 UTC)
- [ ] **`/api/cron/self-maintenance`** Cron이 목록에 표시되는지 확인 (매주 일요일 자정 UTC)
- [ ] **수동 트리거 테스트**: Cron 항목 옆 "Run Now" 클릭 → HTTP 200 응답 확인
- [ ] **Vercel Pro 플랜 여부 확인**: Cron Jobs는 Hobby 플랜에서 1개, Pro 플랜에서 무제한

---

## ✅ STEP 4 — 도메인 연결 (kulture.net)

> 도메인 등록업체(가비아, Cloudflare, Namecheap 등)에서 DNS를 설정합니다.

- [ ] **Vercel 도메인 추가**: Vercel → 프로젝트 → Settings → Domains → `kulture.net` 입력 후 Add
- [ ] **A 레코드 추가** (도메인 등록업체 DNS 관리 페이지):
  ```
  타입: A
  호스트: @
  값: 76.76.21.21   (Vercel IP)
  TTL: 300
  ```
- [ ] **CNAME 레코드 추가** (www 서브도메인):
  ```
  타입: CNAME
  호스트: www
  값: cname.vercel-dns.com
  TTL: 300
  ```
- [ ] **DNS 전파 확인**: [whatsmydns.net](https://www.whatsmydns.net) 에서 `kulture.net` A 레코드가 Vercel IP로 전파됐는지 확인 (최대 24시간 소요)
- [ ] **SSL 인증서 자동 발급 확인**: Vercel 대시보드에서 도메인 옆 🔒 자물쇠 표시 확인 (자동 Let's Encrypt)
- [ ] **`https://kulture.net`** 에서 홈페이지 정상 로드 확인

---

## ✅ STEP 5 — Google AdSense 연동

- [ ] **AdSense 계정 생성**: [adsense.google.com](https://adsense.google.com) → 사이트 `kulture.net` 등록
- [ ] **사이트 인증 완료**: `_app.js`에 AdSense 스크립트 삽입 후 Google 검토 승인 대기 (1~3일)
- [ ] **승인 후 `adClient` 값 업데이트**: `components/AdPlacement.jsx`의 `adClient` prop에 실제 `ca-pub-XXXXXXXXXX` 값 전달
- [ ] **AdSense Auto Ads 활성화**: 자동 광고 배치 옵션 ON (AdPlacement 컴포넌트와 병행 운용)

---

## ✅ STEP 6 — Google Search Console & Analytics

- [ ] **Search Console 등록**: [search.google.com/search-console](https://search.google.com/search-console) → `kulture.net` 속성 추가
- [ ] **사이트맵 제출**: Search Console → Sitemaps → `https://kulture.net/sitemap.xml` 제출
- [ ] **Google Analytics 4 설정**: [analytics.google.com](https://analytics.google.com) → 스트림에 `kulture.net` 등록
- [ ] **GA4 측정 ID 환경변수 등록**: `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX`
- [ ] **색인 요청**: Search Console → URL 검사 → 홈페이지 URL 크롤링 요청

---

## ✅ STEP 7 — 런칭 후 즉시 점검

- [ ] **모바일 반응형 확인**: iPhone/Android 실기기에서 홈페이지, 기사 페이지 정상 렌더 확인
- [ ] **다국어 전환 확인**: 언어 스위처에서 EN → KO → JA → ES 전환 시 번역 정상 출력 확인
- [ ] **게이미피케이션 확인**: 데일리 미션 CLAIM 버튼 동작, EXP 증가 확인
- [ ] **광고 노출 확인**: 피드 및 기사 페이지에서 AdPlacement 컴포넌트 정상 렌더 확인
- [ ] **Sentry 에러 없음 확인**: [sentry.io](https://sentry.io) 대시보드에서 런칭 후 24시간 에러 0건 목표
- [ ] **Vercel Analytics 활성화**: Vercel 대시보드 → Analytics → Enable

---

## 🎉 런칭 선언

모든 체크박스를 완료했다면 아래를 실행하세요:

```bash
# 최종 배포 확인
git log --oneline -5

# 타임스탬프 확인
date
```

> **축하합니다. Kulture.net 제국이 공식 론칭되었습니다. 🚀**

---

*Generated by GitHub Copilot (Claude Sonnet 4.6) · Phase 11 · March 2026*
