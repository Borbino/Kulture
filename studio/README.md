# Kulture Sanity Studio

Sanity CMS 관리 인터페이스입니다.

## 🚀 빠른 시작

### 1. Sanity 프로젝트 생성

```bash
# Sanity CLI 로그인
npx sanity login

# 새 프로젝트 생성
npx sanity init --project-plan free --dataset production
```

프롬프트에서:
- Project name: `Kulture`
- Dataset: `production`
- Output path: 기본값 (현재 디렉토리)

### 2. 환경변수 설정

생성된 프로젝트 ID를 `.env.local`에 추가:

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=your-actual-project-id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your-api-token
```

### 3. Sanity Studio 실행

```bash
# Development 모드
npm run sanity:dev

# 배포
npm run sanity:deploy
```

Studio URL: `http://localhost:3333`

## 📋 스키마 구조

프로젝트에는 11개의 스키마가 정의되어 있습니다:

### Core Content
- **post** - 블로그 포스트
- **author** - 작성자 정보
- **category** - 카테고리
- **siteSettings** - 사이트 전역 설정

### Monitoring
- **hotIssue** - 핫 이슈
- **trendTracking** - 트렌드 추적
- **trendSnapshot** - 트렌드 스냅샷
- **vipMonitoring** - VIP 활동 모니터링

### Reports
- **dailyReport** - 일일 리포트
- **ceoFeedback** - CEO 피드백
- **performanceReport** - 성능 리포트

## 🔧 설정

모든 스키마는 `lib/schemas/` 디렉토리에 정의되어 있으며,
`sanity.config.js`에서 통합 관리됩니다.

## 📚 참고 문서

- [Sanity Documentation](https://www.sanity.io/docs)
- [Schema Types](https://www.sanity.io/docs/schema-types)
- [GROQ Query Language](https://www.sanity.io/docs/groq)
