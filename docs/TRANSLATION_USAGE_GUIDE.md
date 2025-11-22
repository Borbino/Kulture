# AI Translation System - 사용 가이드

## 📋 목차

1. [개요](#개요)
2. [작동 원리](#작동-원리)
3. [사용 방법](#사용-방법)
4. [실전 예시](#실전-예시)
5. [API 레퍼런스](#api-레퍼런스)
6. [테스트 방법](#테스트-방법)

---

## 개요

Kulture는 **200개 이상의 언어**를 실시간으로 번역하는 극한 최적화된 AI 번역 시스템을 탑재하고 있습니다.

### ✨ 핵심 기능

- 🌍 **200+ 언어 지원**: 주요 언어부터 소수 언어까지 전세계 모든 언어
- ⚡ **초고속 응답**: 평균 < 500ms, 캐시 히트 시 < 100ms
- 🔄 **자동 폴백**: OpenAI → DeepL → Google Translate
- 💾 **스마트 캐싱**: Redis + 인메모리 LFU/LRU 혼합
- 📦 **배치 처리**: 최대 100개 동시 번역
- 🎯 **품질 보증**: AI 기반 번역 품질 평가

---

## 작동 원리

### 번역 플로우

```
1. 요청 수신
   ↓
2. 캐시 확인 (Redis → 메모리)
   ↓ (캐시 미스)
3. 언어 자동 감지 (필요시)
   ↓
4. 멀티 프로바이더 폴백 체인
   → OpenAI (GPT-4o-mini) [1순위]
   → DeepL [2순위]
   → Google Translate [3순위]
   ↓
5. 용어집 적용 (후처리)
   ↓
6. 품질 검증
   ↓
7. 캐시 저장
   ↓
8. 응답 반환
```

### 캐싱 전략

```javascript
// LFU + LRU 혼합 알고리즘
캐시 점수 = (사용 빈도 × 1000) - (현재시간 - 생성시간)

// 인기 있고 최근 번역일수록 높은 점수
// 하위 20% 자동 정리
```

---

## 사용 방법

### 1. 환경 변수 설정

```bash
# .env.local
OPENAI_API_KEY=sk-...                    # 필수
GOOGLE_TRANSLATE_API_KEY=AIza...         # 필수
DEEPL_API_KEY=...                        # 선택 (권장)
REDIS_URL=redis://localhost:6379         # 선택 (프로덕션 권장)
```

### 2. 프론트엔드에서 사용

#### React Hook 방식

```javascript
// hooks/useTranslation.js
import { useState } from 'react';

export function useTranslation() {
  const [isLoading, setIsLoading] = useState(false);

  const translate = async (text, targetLang, options = {}) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/translation/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLang,
          sourceLang: options.sourceLang || 'auto',
          context: options.context,
        }),
      });

      const data = await response.json();
      return data.translation;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // 실패 시 원본 반환
    } finally {
      setIsLoading(false);
    }
  };

  return { translate, isLoading };
}
```

#### 컴포넌트 사용 예시

```javascript
// components/TranslateButton.jsx
import { useTranslation } from '../hooks/useTranslation';
import { useState } from 'react';

export default function TranslateButton({ text, targetLang }) {
  const { translate, isLoading } = useTranslation();
  const [translated, setTranslated] = useState('');

  const handleTranslate = async () => {
    const result = await translate(text, targetLang);
    setTranslated(result);
  };

  return (
    <div>
      <button onClick={handleTranslate} disabled={isLoading}>
        {isLoading ? '번역 중...' : `${targetLang}로 번역`}
      </button>
      {translated && <p>{translated}</p>}
    </div>
  );
}
```

### 3. 백엔드/API에서 사용

```javascript
// pages/api/posts/[id].js
import aiTranslation from '../../../lib/aiTranslation';

export default async function handler(req, res) {
  const { id } = req.query;
  const { lang = 'ko' } = req.query;

  // 게시물 가져오기
  const post = await getPost(id);

  // 자동 번역 (요청 언어가 원본과 다를 경우)
  if (lang !== post.originalLang) {
    post.title = await aiTranslation.translate(post.title, lang, post.originalLang);
    post.content = await aiTranslation.translateLongText(post.content, lang, post.originalLang);
  }

  res.json(post);
}
```

---

## 실전 예시

### 예시 1: 단일 텍스트 번역

```javascript
// 영어 → 한국어
const response = await fetch('/api/translation/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Hello, world! Welcome to our platform.',
    targetLang: 'ko',
    sourceLang: 'en'
  })
});

const data = await response.json();
console.log(data.translation);
// 출력: "안녕하세요, 세계! 저희 플랫폼에 오신 것을 환영합니다."
```

### 예시 2: 배치 번역 (여러 텍스트 동시 처리)

```javascript
const response = await fetch('/api/translation/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    batch: [
      'Good morning',
      'Thank you',
      'See you later',
      'How are you?'
    ],
    targetLang: 'ja'
  })
});

const data = await response.json();
console.log(data.translations);
// 출력: ["おはようございます", "ありがとう", "また後で", "元気ですか？"]
```

### 예시 3: 언어 자동 감지

```javascript
const response = await fetch('/api/translation/detect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Bonjour, comment allez-vous?'
  })
});

const data = await response.json();
console.log(data);
// 출력: { language: 'fr', languageName: 'Français', confidence: 0.95 }
```

### 예시 4: 컨텍스트 기반 번역

```javascript
// 기술 문서 번역
const response = await fetch('/api/translation/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'The API returns a JSON response with status code 200.',
    targetLang: 'ko',
    context: 'technical-documentation'
  })
});

// 일상 대화 번역
const response2 = await fetch('/api/translation/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'The API returns a JSON response with status code 200.',
    targetLang: 'ko',
    context: 'casual-conversation'
  })
});
```

### 예시 5: 다중 언어 게시물 생성

```javascript
async function createMultilingualPost(title, content) {
  const targetLanguages = ['en', 'ja', 'zh-CN', 'es', 'fr'];
  
  const titleTranslations = await fetch('/api/translation/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      batch: targetLanguages.map(() => title),
      targetLang: 'multi', // 특수 처리
    })
  }).then(r => r.json());

  // 각 언어별 게시물 생성
  for (let i = 0; i < targetLanguages.length; i++) {
    await createPost({
      title: titleTranslations.translations[i],
      content: await translateLongContent(content, targetLanguages[i]),
      language: targetLanguages[i]
    });
  }
}
```

---

## API 레퍼런스

### POST /api/translation/translate

단일 또는 배치 번역 수행

**요청 (단일)**
```json
{
  "text": "Hello, world!",
  "targetLang": "ko",
  "sourceLang": "auto",
  "context": "greeting"
}
```

**요청 (배치)**
```json
{
  "batch": ["Hello", "World", "Welcome"],
  "targetLang": "ko",
  "sourceLang": "en"
}
```

**응답**
```json
{
  "translation": "안녕하세요, 세계!",
  "type": "single",
  "sourceLang": "en",
  "targetLang": "ko",
  "responseTime": 245,
  "cached": false
}
```

### POST /api/translation/detect

언어 자동 감지

**요청**
```json
{
  "text": "Bonjour le monde"
}
```

**응답**
```json
{
  "language": "fr",
  "languageName": "Français",
  "confidence": 0.95
}
```

### GET /api/translation/health

시스템 상태 확인

**응답**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-22T09:53:12.000Z",
  "providers": {
    "openai": { "status": "operational" },
    "google": { "status": "operational" },
    "deepl": { "status": "operational" }
  },
  "cache": {
    "memory": {
      "totalEntries": 1234,
      "validEntries": 1100,
      "cacheHitRate": "89.14%"
    },
    "redis": {
      "connected": true,
      "totalEntries": 45678
    }
  },
  "languages": {
    "total": 200,
    "list": ["en", "ko", "ja", ...]
  }
}
```

### GET /api/translation/cache (Admin)

캐시 통계 조회

### DELETE /api/translation/cache (Admin)

캐시 초기화

---

## 테스트 방법

### 1. 로컬 개발 서버 테스트

```bash
# 서버 실행
npm run dev

# 새 터미널에서 테스트
curl -X POST http://localhost:3000/api/translation/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello, world!","targetLang":"ko"}'
```

### 2. 다양한 언어 테스트

```bash
# 한국어
curl -X POST http://localhost:3000/api/translation/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"안녕하세요","targetLang":"en"}'

# 일본어
curl -X POST http://localhost:3000/api/translation/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"こんにちは","targetLang":"en"}'

# 아랍어
curl -X POST http://localhost:3000/api/translation/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"مرحبا","targetLang":"en"}'

# 스와힐리어
curl -X POST http://localhost:3000/api/translation/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Habari","targetLang":"en"}'
```

### 3. 성능 테스트

```bash
# 캐시 히트 테스트 (같은 요청 반복)
for i in {1..5}; do
  echo "Request $i:"
  time curl -s -X POST http://localhost:3000/api/translation/translate \
    -H "Content-Type: application/json" \
    -d '{"text":"Hello","targetLang":"ko"}' | jq '.responseTime'
done
```

### 4. 배치 처리 테스트

```bash
curl -X POST http://localhost:3000/api/translation/translate \
  -H "Content-Type: application/json" \
  -d '{
    "batch": ["Hello", "World", "Welcome", "Thank you", "Goodbye"],
    "targetLang": "ko"
  }' | jq
```

### 5. 시스템 상태 확인

```bash
curl http://localhost:3000/api/translation/health | jq
```

---

## 🎯 성능 지표

| 시나리오 | 평균 응답 시간 | 비고 |
|---------|--------------|------|
| 캐시 히트 | < 100ms | 이미 번역된 텍스트 |
| OpenAI 번역 | 200-400ms | 고품질 번역 |
| Google 폴백 | 150-300ms | 모든 언어 지원 |
| DeepL 번역 | 180-350ms | 유럽 언어 특화 |
| 배치 처리 (10개) | 800-1200ms | 병렬 처리 |
| 긴 텍스트 (5000자) | 2-4초 | 자동 청크 분할 |

## 🔧 트러블슈팅

### API 키 오류
```
Error: OpenAI API key not configured
```
→ `.env.local`에 `OPENAI_API_KEY` 추가

### Redis 연결 실패
```
Redis connection failed, using in-memory cache
```
→ 정상 동작 (인메모리 폴백), 프로덕션에서는 Redis 연결 권장

### Rate Limit 초과
```
429 Too Many Requests
```
→ 1분 후 재시도, 또는 배치 처리로 전환

---

## 📚 추가 리소스

- [환경 변수 가이드](./ENVIRONMENT_VARIABLES.md)
- [ReviseLog - RL-20251122-01](../ReviseLog.md)
- [README.md - AI Translation System](../README.md#16-ai-translation-system-200-languages)
