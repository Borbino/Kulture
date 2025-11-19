# Kulture 프로젝트 설치 및 실행 가이드

## 사전 요구사항

- Node.js 18.x 이상
- npm 또는 yarn
- Git

## 1. 저장소 클론

```bash
git clone https://github.com/Borbino/Kulture.git
cd Kulture
```

## 2. 의존성 설치

```bash
npm install
# 또는
yarn install
```

## 3. 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일을 열어 필요한 값을 입력하세요.

## 4. 개발 서버 실행

```bash
npm run dev
# 또는
yarn dev
```

브라우저에서 http://localhost:3000 접속

## 5. 빌드 및 프로덕션 실행

```bash
npm run build
npm start
```

## 6. 테스트 실행

```bash
npm test
```

## 7. 코드 포맷팅

```bash
npm run format
```

## Sanity CMS 설정 (별도 진행 필요)

1. Sanity 계정 생성: https://www.sanity.io
2. 새 프로젝트 생성
3. 프로젝트 ID를 `.env.local`에 입력
4. Sanity Studio 설정은 추후 진행

## 문제 해결

- Node 버전 확인: `node -v`
- 캐시 삭제: `rm -rf node_modules package-lock.json && npm install`

---

작성일: 2025-11-19
