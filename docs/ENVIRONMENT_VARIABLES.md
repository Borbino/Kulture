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

### High-Quality Translation System (100+ languages support)

```bash
# DeepL API (Primary - 최고 품질 번역)
# 가장 자연스러운 번역 제공, 유럽 언어 특화
# 지원 언어: 30+개 (영어, 독일어, 프랑스어, 스페인어, 일본어, 한국어, 중국어 등)
DEEPL_API_KEY=...

# OpenAI API (Secondary - 문맥 인식 번역)
# GPT-4 Turbo 사용, 문맥과 뉘앙스 이해
# 지원 언어: 100+개, 모든 언어 지원
OPENAI_API_KEY=sk-...

# Google Translate API (Fallback - 속도 및 범용성)
# 가장 빠른 번역, 가장 많은 언어 지원
# 지원 언어: 130+개
GOOGLE_TRANSLATE_API_KEY=AIza...

# Redis (Optional - 프로덕션 캐시)
# 번역 결과 캐싱으로 성능 향상 및 API 비용 절감
REDIS_URL=redis://...
```

### Translation Provider 선택 가이드

1. **DeepL** (최우선): 가장 자연스럽고 정확한 번역
   - 유럽 언어(독일어, 프랑스어, 스페인어, 이탈리아어 등)
   - 동아시아 언어(일본어, 한국어, 중국어)
   - formality 설정 지원 (격식체/반말)

2. **OpenAI GPT-4** (보조): 문맥 이해가 중요한 경우
   - 긴 문장, 복잡한 문맥
   - 전문 용어, 기술 문서
   - 소수 언어, 방언

3. **Google Translate** (백업): 속도와 범용성
   - 빠른 응답 필요 시
   - DeepL/OpenAI 지원하지 않는 언어
   - 대량 번역 (배치 처리)

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

### 1. 고품질 단일 텍스트 번역 (DeepL 우선)

```javascript
const { translateHighQuality } = require('./lib/highQualityTranslation');

const result = await translateHighQuality(
  'Hello, world!',
  'ko', // 목표 언어
  'en', // 원본 언어 ('auto'로 자동 감지 가능)
  {
    context: 'greeting', // 문맥 정보 (선택)
    formality: 'formal', // 'formal' | 'informal' | 'default' (선택)
    preserveFormatting: true // HTML 태그 보존 (선택)
  }
);

console.log(result);
// {
//   text: '안녕하세요, 세계!',
//   provider: 'deepl', // 사용된 번역 제공자
//   quality: 'highest', // 번역 품질
//   detectedSourceLang: 'en' // 감지된 원본 언어
// }
```

### 2. 배치 번역 (여러 텍스트 한번에)

```javascript
const { translateBatch } = require('./lib/highQualityTranslation');

const results = await translateBatch(
  ['Hello', 'World', 'Good morning'],
  'ja', // 목표 언어
  'auto', // 자동 언어 감지
  { preserveFormatting: true }
);

console.log(results);
// [
//   { text: 'こんにちは', provider: 'deepl', quality: 'highest' },
//   { text: '世界', provider: 'deepl', quality: 'highest' },
//   { text: 'おはようございます', provider: 'deepl', quality: 'highest' }
// ]
```

### 3. 언어 자동 감지

```javascript
const { detectLanguage } = require('./lib/highQualityTranslation');

const result = await detectLanguage('Bonjour le monde');

console.log(result);
// {
//   language: 'fr',
//   confidence: 1,
//   provider: 'deepl'
// }
```

### 4. 번역 품질 평가 (OpenAI GPT-4)

```javascript
const { evaluateTranslationQuality } = require('./lib/highQualityTranslation');

const evaluation = await evaluateTranslationQuality(
  'Hello, world!', // 원본
  '안녕하세요, 세계!', // 번역
  'ko' // 목표 언어
);

console.log(evaluation);
// {
//   score: 9,
//   feedback: 'Natural and accurate translation. Appropriate formality level.'
// }
```

### 5. API 엔드포인트 사용 (기존 시스템)

```javascript
// 단일 번역
const response = await fetch('/api/translation/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Hello, world!',
    targetLang: 'ko',
    sourceLang: 'auto'
  })
});

// 배치 번역
const response = await fetch('/api/translation/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    batch: ['Hello', 'World', 'Good morning'],
    targetLang: 'ja'
  })
});

// 언어 감지
const response = await fetch('/api/translation/detect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Bonjour le monde'
  })
});
```

### 6. 시스템 상태 확인

```javascript
const response = await fetch('/api/translation/health');
const data = await response.json();
// {
//   status: 'healthy',
//   providers: {
//     deepl: 'available',
//     openai: 'available',
//     google: 'available'
//   },
//   cache: { hitRate: 0.95, size: 15234 },
//   languages: { supported: 100, active: 11 }
// }
```

### 지원 언어 목록 (100+개)

- **동아시아**: 한국어(ko), 일본어(ja), 중국어 간체(zh-CN), 중국어 번체(zh-TW)
- **서유럽**: 영어(en), 프랑스어(fr), 독일어(de), 스페인어(es), 이탈리아어(it), 포르투갈어(pt)
- **동유럽**: 러시아어(ru), 폴란드어(pl), 우크라이나어(uk), 체코어(cs)
- **중동**: 아랍어(ar), 히브리어(he), 페르시아어(fa), 터키어(tr)
- **남아시아**: 힌디어(hi), 벵골어(bn), 우르두어(ur), 타밀어(ta)
- **동남아시아**: 베트남어(vi), 태국어(th), 인도네시아어(id), 말레이어(ms)
- **기타 90+개 언어** 지원

## 주의사항

- `NEXT_PUBLIC_` 접두사가 붙은 변수는 클라이언트에 노출됩니다.
- 민감한 정보(API 토큰 등)는 절대 `NEXT_PUBLIC_` 사용 금지.
- 유출 시 즉시 키/토큰 재발급 및 ReviseLog 기록.

## 감사 로그

- 환경변수 변경 시 ReviseLog에 변경 이력 기록(값 제외).

