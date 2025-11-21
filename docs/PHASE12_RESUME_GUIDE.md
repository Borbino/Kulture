# Phase 12: 다국어 번역 시스템 구현 가이드 (보류 작업)

## 📌 현재 상태

**완료된 작업** (Git 커밋: 7abe040)
- ✅ i18n 패키지 설치 완료
- ✅ next-i18next.config.js 설정 완료
- ✅ 20개 언어 지원 준비 완료
- ✅ 브라우저 언어 자동 감지 설정

**보류된 작업** (다른 PC에서 재개 예정)
- ⏸️ 번역 파일 생성
- ⏸️ Next.js 설정 통합
- ⏸️ UI 다국어화
- ⏸️ 콘텐츠 번역 API
- ⏸️ 언어 선택 UI

---

## 🚀 재개 시 작업 순서

### 1단계: 번역 파일 생성 (30분)

```bash
# 디렉토리 구조 생성
mkdir -p public/locales/{ko,en,ja,zh-CN,zh-TW,es,fr,de,ru,pt,ar,hi,bn,id,vi,th,tr,it,pl,nl}

# 각 언어별 common.json 생성
# 예시: public/locales/ko/common.json
```

**common.json 구조 예시:**
```json
{
  "nav": {
    "home": "홈",
    "boards": "게시판",
    "trending": "트렌딩",
    "profile": "프로필",
    "settings": "설정",
    "logout": "로그아웃",
    "login": "로그인",
    "signup": "회원가입"
  },
  "post": {
    "title": "제목",
    "content": "내용",
    "author": "작성자",
    "createdAt": "작성일",
    "views": "조회수",
    "likes": "좋아요",
    "comments": "댓글",
    "edit": "수정",
    "delete": "삭제",
    "create": "작성하기",
    "anonymous": "익명"
  },
  "comment": {
    "write": "댓글 작성",
    "submit": "등록",
    "reply": "답글",
    "edit": "수정",
    "delete": "삭제"
  },
  "button": {
    "save": "저장",
    "cancel": "취소",
    "confirm": "확인",
    "submit": "제출",
    "back": "뒤로",
    "next": "다음"
  },
  "message": {
    "loading": "로딩 중...",
    "error": "오류가 발생했습니다",
    "success": "성공했습니다",
    "noData": "데이터가 없습니다"
  }
}
```

**필요한 번역 파일:**
- `common.json` - 공통 UI 텍스트
- `board.json` - 게시판 관련
- `auth.json` - 인증 관련
- `mission.json` - 일일 미션 관련
- `social.json` - 소셜 기능 관련

---

### 2단계: Next.js 설정 통합 (10분)

**파일: `next.config.js`**

```javascript
const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n,  // ← 추가
  reactStrictMode: true,
  images: {
    // ... 기존 설정
  },
  // ... 나머지 설정
}

module.exports = nextConfig;
```

---

### 3단계: _app.js 수정 (5분)

**파일: `pages/_app.js`**

```javascript
import { appWithTranslation } from 'next-i18next';
import { SessionProvider } from 'next-auth/react';
import '../styles/globals.css';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default appWithTranslation(MyApp);  // ← 변경
```

---

### 4단계: 언어 선택 컴포넌트 생성 (20분)

**파일: `components/LanguageSwitch.jsx`**

```jsx
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import styles from './LanguageSwitch.module.css';

const LANGUAGES = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
];

export default function LanguageSwitch() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);

  const currentLanguage = LANGUAGES.find(lang => lang.code === router.locale) || LANGUAGES[0];

  const changeLanguage = (locale) => {
    router.push(router.pathname, router.asPath, { locale });
    setShowDropdown(false);
  };

  return (
    <div className={styles.container}>
      <button 
        className={styles.button}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <span className={styles.flag}>{currentLanguage.flag}</span>
        <span className={styles.name}>{currentLanguage.name}</span>
        <span className={styles.arrow}>▼</span>
      </button>

      {showDropdown && (
        <div className={styles.dropdown}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              className={`${styles.option} ${router.locale === lang.code ? styles.active : ''}`}
              onClick={() => changeLanguage(lang.code)}
            >
              <span className={styles.flag}>{lang.flag}</span>
              <span className={styles.name}>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### 5단계: 기존 컴포넌트 다국어화 (1-2시간)

**예시: 게시글 컴포넌트**

```jsx
import { useTranslation } from 'next-i18next';

export default function PostCard({ post }) {
  const { t } = useTranslation('common');

  return (
    <div>
      <h2>{post.title}</h2>
      <div>
        <span>{t('post.author')}: {post.author}</span>
        <span>{t('post.views')}: {post.views}</span>
        <span>{t('post.likes')}: {post.likes}</span>
      </div>
      <button>{t('post.edit')}</button>
      <button>{t('post.delete')}</button>
    </div>
  );
}
```

**변경 필요 컴포넌트 목록:**
- ✅ `components/ReactionButton.jsx`
- ✅ `components/DailyMissions.jsx`
- ✅ `components/ActivityFeed.jsx`
- ✅ `components/FollowButton.jsx`
- ✅ `components/RecommendationWidget.jsx`
- ✅ `components/InfiniteScrollPosts.jsx`
- ✅ `components/CommentSection.jsx`
- ✅ `components/BoardList.jsx`
- ✅ `components/PostEditor.jsx`
- ✅ `pages/index.jsx`
- ✅ `pages/posts/[slug].jsx`
- ✅ 기타 모든 UI 컴포넌트

---

### 6단계: 서버사이드 번역 설정 (30분)

**각 페이지에 getStaticProps 또는 getServerSideProps 추가**

```javascript
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'board', 'auth'])),
    },
  };
}
```

**적용 필요 페이지:**
- `pages/index.jsx`
- `pages/posts/[slug].jsx`
- `pages/boards/[id].jsx`
- `pages/admin/settings.jsx`
- `pages/admin/content-review.jsx`
- 모든 동적 페이지

---

### 7단계: 콘텐츠 번역 API 구현 (1-2시간)

**파일: `pages/api/translate.js`**

```javascript
import { translateText } from '@/lib/translationService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, sourceLang, targetLang, type } = req.body;

    // 캐시 확인
    const cacheKey = `${sourceLang}-${targetLang}-${hashText(text)}`;
    const cached = await getCachedTranslation(cacheKey);
    if (cached) {
      return res.status(200).json({ translation: cached });
    }

    // Google Translate API 또는 DeepL API 호출
    const translation = await translateText(text, targetLang, sourceLang);

    // 캐시 저장
    await cacheTranslation(cacheKey, translation);

    return res.status(200).json({ translation });
  } catch (error) {
    console.error('Translation error:', error);
    return res.status(500).json({ error: 'Translation failed' });
  }
}
```

**파일: `lib/translationService.js`**

```javascript
// Google Translate API 또는 DeepL API 통합
export async function translateText(text, targetLang, sourceLang = 'ko') {
  // 방법 1: Google Cloud Translation API
  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text',
      }),
    }
  );

  const data = await response.json();
  return data.data.translations[0].translatedText;
}

// 캐싱 함수 (Redis 또는 메모리)
const translationCache = new Map();

export async function getCachedTranslation(key) {
  return translationCache.get(key);
}

export async function cacheTranslation(key, value) {
  translationCache.set(key, value);
}
```

---

### 8단계: 게시글/댓글 번역 버튼 추가 (30분)

**게시글에 번역 버튼 추가:**

```jsx
import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';

export default function PostContent({ post }) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [translatedContent, setTranslatedContent] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    if (translatedContent) {
      setTranslatedContent(null);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `${post.title}\n\n${post.body}`,
          sourceLang: 'ko',
          targetLang: router.locale,
        }),
      });
      const data = await res.json();
      setTranslatedContent(data.translation);
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>{translatedContent ? translatedContent.split('\n\n')[0] : post.title}</h1>
      <p>{translatedContent ? translatedContent.split('\n\n')[1] : post.body}</p>
      
      <button onClick={handleTranslate} disabled={loading}>
        {loading ? t('message.loading') : translatedContent ? t('post.showOriginal') : t('post.translate')}
      </button>
    </div>
  );
}
```

---

## 🔧 환경 변수 추가 필요

**파일: `.env.local`**

```env
# Google Translate API (선택 1)
GOOGLE_TRANSLATE_API_KEY=your_api_key_here

# DeepL API (선택 2 - 더 정확)
DEEPL_API_KEY=your_api_key_here

# Translation Cache (선택)
REDIS_URL=your_redis_url_here
```

---

## 📊 예상 작업 시간

| 작업 | 시간 | 우선순위 |
|------|------|----------|
| 번역 파일 생성 (20개 언어) | 30분 - 1시간 | 높음 |
| Next.js 설정 통합 | 10분 | 높음 |
| _app.js 수정 | 5분 | 높음 |
| 언어 선택 컴포넌트 | 20분 | 중간 |
| 기존 컴포넌트 다국어화 | 1-2시간 | 높음 |
| 서버사이드 번역 설정 | 30분 | 중간 |
| 콘텐츠 번역 API | 1-2시간 | 낮음 |
| 번역 버튼 추가 | 30분 | 낮음 |

**총 예상 시간: 4-6시간**

---

## ⚠️ 주의사항

1. **번역 API 비용**
   - Google Translate API: 월 $20 (무료 크레딧 후)
   - DeepL API: 월 500,000자 무료
   - 번역 결과 캐싱 필수

2. **SEO 고려**
   - 각 언어별 URL 구조: `/ko/posts/123`, `/en/posts/123`
   - `hreflang` 태그 추가 필요
   - 다국어 sitemap 생성

3. **RTL 언어 지원** (아랍어)
   - CSS `direction: rtl` 추가
   - 레이아웃 조정 필요

4. **폰트 지원**
   - 아랍어, 힌디어, 태국어 등 특수 폰트 필요
   - Google Fonts Noto Sans 시리즈 권장

---

## 🧪 테스트 체크리스트

- [ ] 브라우저 언어 자동 감지 테스트
- [ ] 언어 전환 시 페이지 리로드 확인
- [ ] 모든 UI 텍스트 번역 확인
- [ ] 게시글/댓글 번역 기능 테스트
- [ ] 번역 캐싱 동작 확인
- [ ] RTL 레이아웃 테스트 (아랍어)
- [ ] SEO 메타 태그 확인
- [ ] 성능 테스트 (번역 로딩 시간)

---

## 📚 참고 문서

- [next-i18next 공식 문서](https://github.com/i18next/next-i18next)
- [i18next 공식 문서](https://www.i18next.com/)
- [Google Cloud Translation API](https://cloud.google.com/translate/docs)
- [DeepL API](https://www.deepl.com/docs-api)
- [Next.js i18n 라우팅](https://nextjs.org/docs/advanced-features/i18n-routing)

---

## 💾 설치된 패키지 정보

```json
{
  "i18next": "^25.6.3",
  "i18next-browser-languagedetector": "^8.2.0",
  "next-i18next": "^15.4.2",
  "react-i18next": "^16.3.5"
}
```

---

## ✅ 완료 후 검증

```bash
# 빌드 테스트
npm run build

# 개발 서버 실행
npm run dev

# 브라우저에서 테스트
# 1. http://localhost:3000 접속
# 2. 언어 선택 드롭다운 확인
# 3. 각 언어로 전환 테스트
# 4. 게시글 번역 버튼 테스트
```

---

**작성일**: 2025-11-21  
**Git 커밋**: 7abe040  
**다음 작업 시작 위치**: 1단계 - 번역 파일 생성
