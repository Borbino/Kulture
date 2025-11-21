# Sanity CMS 연동 가이드

## 📦 설치 완료

Sanity 패키지가 설치되고 설정 파일이 생성되었습니다:
- ✅ `sanity.config.js` - Studio 설정
- ✅ `.env.template` - 환경변수 템플릿
- ✅ `.env.local` - 로컬 환경변수
- ✅ `studio/README.md` - Studio 문서
- ✅ `package.json` - Sanity 스크립트 추가

## 🚀 다음 단계

### 1. Sanity 프로젝트 생성 (필수)

터미널에서 실행:

```bash
# Sanity 계정 로그인
npx sanity login

# 프로젝트 생성
npx sanity projects create
```

프롬프트:
- **Project name**: `Kulture`
- **Organization**: 개인 계정 선택
- **Dataset**: `production`
- **Project template**: `Clean project with no predefined schemas`

생성 후 **Project ID**를 받게 됩니다.

### 2. 환경변수 설정

생성된 Project ID를 `.env.local`에 입력:

```bash
# .env.local 파일 편집
NEXT_PUBLIC_SANITY_PROJECT_ID=실제-프로젝트-ID
NEXT_PUBLIC_SANITY_DATASET=production
```

### 3. API 토큰 생성

1. https://sanity.io/manage 접속
2. 프로젝트 선택
3. **API** → **Tokens** → **Add API token**
4. Name: `Kulture Backend`
5. Permissions: `Editor`
6. 토큰을 `.env.local`에 추가:

```bash
SANITY_API_TOKEN=생성된-토큰
```

### 4. Sanity Studio 실행

```bash
npm run sanity:dev
```

브라우저에서 `http://localhost:3333` 접속하여 Studio 확인

### 5. 스키마 배포

Studio에서 11개 스키마가 자동으로 로드됩니다:
- Post, Author, Category
- Hot Issue, Trend Tracking, VIP Monitoring
- Daily Report, CEO Feedback, Performance Report
- Site Settings

### 6. 샘플 데이터 생성

Studio에서 수동으로 생성하거나 아래 스크립트 실행:

```bash
# 샘플 데이터 생성 스크립트 (다음 단계에서 제공)
npm run seed:sample-data
```

## 📋 확인 사항

- [ ] Sanity 프로젝트 생성 완료
- [ ] Project ID 환경변수 설정
- [ ] API 토큰 생성 및 설정
- [ ] Studio 실행 확인
- [ ] 스키마 정상 로드 확인
- [ ] 샘플 데이터 생성

## 🔗 참고 링크

- [Sanity Management Console](https://sanity.io/manage)
- [Sanity Documentation](https://www.sanity.io/docs)
- [Next.js + Sanity Guide](https://www.sanity.io/guides/sanity-nextjs-guide)

---

**현재 상태**: 설정 파일 준비 완료 ✅  
**다음 작업**: Sanity 프로젝트 생성 및 환경변수 설정
