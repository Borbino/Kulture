# 환경변수 및 시크릿 관리 가이드

## 목적

프로젝트의 민감정보(API 키, 토큰, DB 접속 정보 등)를 안전하게 관리하기 위한 가이드입니다.

## 기본 원칙

- 절대 금지: `.env` 파일을 Git에 커밋하지 않습니다.
- 필수: `.env.example`에 필요한 환경변수 목록을 기록합니다.
- 권장: 로컬 개발은 `.env.local`, 프로덕션은 Vercel/GitHub Secrets 사용.

## 환경변수 파일

- `.env.example`: 필요한 환경변수 목록(값 제외)
- `.env.local`: 로컬 개발용(Git에서 제외됨)
- `.env`: 일반적으로 사용하지 않음(로컬 테스트용)

## 필수 환경변수

### AI Translation System (200+ languages support)

```bash
# OpenAI API (Primary provider - 고품질 번역)
OPENAI_API_KEY=sk-...

# Google Translate API (Fallback provider - 모든 언어 지원)
GOOGLE_TRANSLATE_API_KEY=AIza...

# DeepL API (Optional - 유럽 언어 고품질)
DEEPL_API_KEY=...

# Redis (Optional - 프로덕션 캐시)
REDIS_URL=redis://...
```

### Other Services

```bash
# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=...

# Authentication
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
```

## 설정 방법

1. `.env.example`을 복사하여 `.env.local` 생성
2. 실제 값을 채워넣기
3. Next.js 서버 재시작

## Vercel 배포 시

1. Vercel 대시보드 → Settings → Environment Variables
2. 각 환경변수를 입력(Production/Preview/Development 선택)
3. 자동으로 빌드 시 주입됨

## Translation API 사용법

### 1. 단일 텍스트 번역

```javascript
const response = await fetch('/api/translation/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Hello, world!',
    targetLang: 'ko',
    sourceLang: 'auto', // 자동 감지
    context: 'greeting' // 선택사항
  })
});

const data = await response.json();
// { translation: '안녕하세요, 세계!', sourceLang: 'en', targetLang: 'ko', ... }
```

### 2. 배치 번역

```javascript
const response = await fetch('/api/translation/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    batch: ['Hello', 'World', 'Good morning'],
    targetLang: 'ja'
  })
});

const data = await response.json();
// { translations: ['こんにちは', '世界', 'おはよう'], ... }
```

### 3. 언어 감지

```javascript
const response = await fetch('/api/translation/detect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Bonjour le monde'
  })
});

const data = await response.json();
// { language: 'fr', languageName: 'Français', confidence: 0.95 }
```

### 4. 시스템 상태 확인

```javascript
const response = await fetch('/api/translation/health');
const data = await response.json();
// { status: 'healthy', providers: {...}, cache: {...}, languages: {...} }
```

## 주의사항

- `NEXT_PUBLIC_` 접두사가 붙은 변수는 클라이언트에 노출됩니다.
- 민감한 정보(API 토큰 등)는 절대 `NEXT_PUBLIC_` 사용 금지.
- 유출 시 즉시 키/토큰 재발급 및 ReviseLog 기록.

## 감사 로그

- 환경변수 변경 시 ReviseLog에 변경 이력 기록(값 제외).

