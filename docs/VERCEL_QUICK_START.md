# Vercel 빠른 배포 가이드

## ⚡ 5분 배포

### 1️⃣ Vercel 연결 (1분)

```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 프로젝트 연결
vercel link
```

### 2️⃣ 환경변수 설정 (2분)

```bash
# 필수 환경변수 설정
vercel env add NEXT_PUBLIC_SANITY_PROJECT_ID
vercel env add SANITY_API_TOKEN
vercel env add CRON_SECRET

# GA4 (선택)
vercel env add NEXT_PUBLIC_GA_MEASUREMENT_ID
```

값 입력 시:
- **NEXT_PUBLIC_SANITY_PROJECT_ID**: Sanity 프로젝트 ID
- **SANITY_API_TOKEN**: Sanity API 토큰
- **CRON_SECRET**: 32자 이상 랜덤 문자열 (예: `openssl rand -hex 32`)

### 3️⃣ 배포 실행 (2분)

```bash
# Production 배포
vercel --prod
```

완료! 🎉

배포 URL: `https://kulture-xxx.vercel.app`

## 🔍 배포 확인

```bash
# Health Check
curl https://your-domain.vercel.app/api/health

# Sitemap
curl https://your-domain.vercel.app/sitemap.xml
```

## 🎯 Cron Jobs 활성화

배포 후 자동으로 활성화됩니다:
- ✅ VIP Monitoring (30분마다)
- ✅ Trend Detection (2시간마다)
- ✅ Content Generation (하루 4회)
- ✅ Daily Report (매일 22시)
- ✅ Performance Report (1시간마다)
- ✅ Health Check (10분마다)

## 📊 대시보드 접근

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Sanity Studio**: https://your-project.sanity.studio
- **Admin Panel**: https://your-domain.vercel.app/admin/monitoring

---

**예상 소요 시간**: 5분  
**무료 플랜**: 가능 ✅
