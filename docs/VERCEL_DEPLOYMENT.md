# Vercel 배포 가이드

## 📋 배포 전 체크리스트

### 1. 환경변수 설정 (Vercel Dashboard)

다음 환경변수들을 Vercel 프로젝트 설정에 추가해야 합니다:

#### 필수 환경변수

```bash
# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_admin_token

# Cron Job 보안
CRON_SECRET=your_secure_random_string

# API Keys
TWITTER_BEARER_TOKEN=your_twitter_token
YOUTUBE_API_KEY=your_youtube_key
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_secret
NAVER_CLIENT_ID=your_naver_id
NAVER_CLIENT_SECRET=your_naver_secret
HUGGINGFACE_API_KEY=your_huggingface_key

# OpenAI (콘텐츠 생성용)
OPENAI_API_KEY=your_openai_key
```

### 2. Vercel 배포 단계

#### Step 1: Vercel CLI 설치 (선택사항)
```bash
npm install -g vercel
```

#### Step 2: 프로젝트 연결
```bash
vercel login
vercel link
```

#### Step 3: 환경변수 추가
Vercel 대시보드에서:
1. 프로젝트 선택
2. Settings → Environment Variables
3. 위의 모든 환경변수 추가
4. Production, Preview, Development 환경 모두 체크

#### Step 4: 배포
```bash
# Git push로 자동 배포
git push origin main

# 또는 수동 배포
vercel --prod
```

### 3. Cron Jobs 검증

배포 후 다음 URL들이 정상 작동하는지 확인:

```bash
# Health Check (10분마다)
https://your-domain.vercel.app/api/health

# VIP 모니터링 (30분마다)
https://your-domain.vercel.app/api/cron/vip-monitoring

# 트렌드 감지 (2시간마다)
https://your-domain.vercel.app/api/cron/trend-detection

# 콘텐츠 생성 (일 4회)
https://your-domain.vercel.app/api/cron/content-generation

# 일일 리포트 (매일 22시)
https://your-domain.vercel.app/api/cron/daily-report

# 성능 리포트 (1시간마다)
https://your-domain.vercel.app/api/cron/performance-report
```

### 4. Cron 실행 로그 확인

Vercel 대시보드에서:
1. 프로젝트 선택
2. Deployments → Functions
3. 각 Cron Job 함수 선택
4. Logs 탭에서 실행 이력 확인

### 5. 보안 설정

#### CRON_SECRET 생성 방법
```bash
# 안전한 랜덤 문자열 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Cron Job 수동 테스트
```bash
# 로컬에서 CRON_SECRET과 함께 테스트
curl -X GET "http://localhost:3000/api/cron/vip-monitoring" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 6. 모니터링 설정

#### Vercel Analytics 활성화
1. Vercel 대시보드 → Analytics 탭
2. Enable Analytics 클릭

#### 로그 모니터링
- Vercel Logs: 실시간 로그 확인
- 커스텀 모니터링: `/admin/monitoring` 페이지 활용

### 7. 무료 플랜 최적화

현재 Cron 스케줄:
- VIP 모니터링: 30분마다 (48회/일)
- 트렌드 감지: 2시간마다 (12회/일)
- 콘텐츠 생성: 일 4회
- 일일 리포트: 일 1회
- 성능 리포트: 1시간마다 (24회/일)
- Health Check: 10분마다 (144회/일)

**총 실행 횟수**: 약 233회/일

Vercel Hobby 플랜 제한: 
- 함수 실행: 100GB-시간/월 (충분)
- Cron Jobs: 무제한 (단, 실행 시간 10초 제한)

### 8. 트러블슈팅

#### Cron이 실행되지 않을 때
1. vercel.json 파일 확인
2. 환경변수 설정 확인
3. 함수 타임아웃 확인 (10초 이내)
4. Vercel 대시보드에서 에러 로그 확인

#### API 키 에러
1. Vercel 환경변수에 모든 키가 등록되었는지 확인
2. 키 값에 공백이나 줄바꿈이 없는지 확인
3. Production 환경에 적용되었는지 확인

#### 성능 이슈
1. 함수 실행 시간 최적화 (10초 이내 유지)
2. 불필요한 API 호출 제거
3. 캐싱 활용

---

## 📊 배포 후 확인사항

- [ ] 모든 환경변수 설정 완료
- [ ] Cron Jobs 스케줄 동작 확인
- [ ] Health Check API 정상 응답
- [ ] Sanity 데이터 연동 확인
- [ ] 외부 API 연동 확인 (Twitter, YouTube 등)
- [ ] 에러 로그 모니터링 설정
- [ ] Analytics 활성화

---

**작성일**: 2025-11-21  
**최종 업데이트**: Phase 3 배포 준비  
**관련 문서**: [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md), [API_KEYS_GUIDE.md](./API_KEYS_GUIDE.md)
