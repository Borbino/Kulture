# K-Culture 콘텐츠 수집 정책 (Crawler Policy)

**[일시]** 2025-11-19 14:30 (KST)  
**[작성자]** GitHub Copilot Agent  
**[목적]** 합법적이고 윤리적인 K-Culture 콘텐츠 수집 시스템 구축

---

## ⚠️ 법적 고지 및 원칙

### 절대 금지 사항

❌ **저작권 침해**: 원문 전체 복사 및 무단 게시  
❌ **개인정보 수집**: 동의 없는 사용자 정보 수집  
❌ **VPN/프록시 우회**: 차단된 사이트 접근  
❌ **과도한 요청**: 타 사이트 서버에 부담 (DDoS 수준)  
❌ **robots.txt 무시**: 크롤링 금지 영역 접근  
❌ **User-Agent 위조**: 신원 은폐 목적의 가짜 정보

### 준수 원칙

✅ **Fair Use**: 비평, 연구, 뉴스 보도 목적  
✅ **출처 명시**: 모든 콘텐츠에 명확한 출처 및 원본 링크  
✅ **요약/재구성**: 원문 그대로가 아닌 정보 요약  
✅ **API 우선**: 공식 API가 있으면 반드시 사용  
✅ **Rate Limiting**: 1초당 1~2회 요청으로 제한  
✅ **즉시 삭제 대응**: 저작권자 요청 시 24시간 내 삭제

---

## 📋 목차

1. [수집 대상](#수집-대상)
2. [합법적 수집 방법](#합법적-수집-방법)
3. [카테고리별 수집 전략](#카테고리별-수집-전략)
4. [기술 구조](#기술-구조)
5. [2차 검증 시스템](#2차-검증-시스템)
6. [저작권 보호 프로세스](#저작권-보호-프로세스)

---

## 수집 대상

### K-Culture 카테고리

| 카테고리 | 세부 분야 | 주요 소스 |
|---------|----------|----------|
| **K-Pop** | 아이돌, 솔로, 음반, 차트, 뮤비 | YouTube, Spotify, Melon API |
| **K-Drama** | 드라마, 예능, 웹드라마 | TMDB API, Naver 뉴스 RSS |
| **K-Movie** | 영화, 단편, 다큐 | KMDB API, 영화진흥위원회 |
| **K-Food** | 레시피, 맛집, 쿡방 | YouTube, 블로그 RSS |
| **K-Beauty** | 화장품, 스킨케어, 메이크업 | 공식 브랜드 RSS, Instagram API |
| **K-Fashion** | 패션쇼, 브랜드, 스타일 | 패션위크 공식, Pinterest API |
| **K-Game** | 게임, e-스포츠 | Steam API, Twitch API |
| **K-Webtoon** | 웹툰, 웹소설 | 네이버/카카오 공식 API |

### 수집 정보 유형

1. **메타데이터**: 제목, 장르, 출시일, 평점
2. **요약 정보**: 줄거리, 리뷰 요약 (100~300자)
3. **공개 통계**: 조회수, 좋아요, 순위
4. **공식 미디어**: 공개된 포스터, 티저 (출처 명시)
5. **커뮤니티 반응**: 공개 댓글 요약 (개인정보 제거)

---

## 합법적 수집 방법

### 1순위: 공식 API 사용

#### 주요 API 목록

```javascript
// YouTube Data API v3
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const youtubeSearch = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=K-Pop&key=${YOUTUBE_API_KEY}`

// TMDB (The Movie Database) API
const TMDB_API_KEY = process.env.TMDB_API_KEY
const tmdbMovies = `https://api.themoviedb.org/3/discover/movie?with_original_language=ko&api_key=${TMDB_API_KEY}`

// Twitter API v2
const TWITTER_BEARER = process.env.TWITTER_BEARER_TOKEN
// K-Culture 해시태그 모니터링

// Spotify Web API
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
// K-Pop 차트 및 플레이리스트
```

**장점**:
- ✅ 법적으로 완벽히 안전
- ✅ 구조화된 데이터
- ✅ Rate Limit 명확

**단점**:
- ❌ API 키 발급 필요
- ❌ 무료 티어 제한
- ❌ 일부 정보 접근 불가

### 2순위: RSS/Atom 피드

```javascript
// RSS 피드 예시
const rssFeeds = [
  'https://entertain.naver.com/rss/movie.xml',
  'https://rss.joins.com/joins_news_kculture.xml',
  'https://www.koreatimes.co.kr/www/rss/culture.xml',
]

// RSS 파싱 라이브러리
import Parser from 'rss-parser'
const parser = new Parser()
const feed = await parser.parseURL(rssUrl)
```

**장점**:
- ✅ 공식적으로 제공되는 콘텐츠
- ✅ 인증 불필요
- ✅ 저작권 문제 최소화

**단점**:
- ❌ 정보 제한적
- ❌ 실시간성 낮음

### 3순위: 합법적 웹 스크래핑

#### robots.txt 준수

```javascript
// robots.txt 확인
import robotsParser from 'robots-parser'

const checkRobots = async (url) => {
  const robotsUrl = new URL('/robots.txt', url).href
  const robotsTxt = await fetch(robotsUrl).then(r => r.text())
  const robots = robotsParser(robotsUrl, robotsTxt)
  
  return robots.isAllowed(url, 'KultureBot/1.0')
}
```

#### Rate Limiting

```javascript
// 요청 제한: 1초당 1회
import pLimit from 'p-limit'
const limit = pLimit(1)

const crawlWithLimit = async (urls) => {
  return Promise.all(
    urls.map(url => 
      limit(() => {
        // 1초 대기
        return new Promise(resolve => {
          setTimeout(async () => {
            const data = await fetchPage(url)
            resolve(data)
          }, 1000)
        })
      })
    )
  )
}
```

#### User-Agent 명시

```javascript
const headers = {
  'User-Agent': 'KultureBot/1.0 (+https://kulture.wiki/bot-info; contact@kulture.wiki)',
  'Accept': 'text/html,application/json',
  'Accept-Language': 'ko-KR,en-US',
}
```

---

## 카테고리별 수집 전략

### K-Pop

**공식 소스**:
- YouTube Music API: 뮤직비디오, 음원
- Spotify API: 차트, 플레이리스트
- Melon API: 국내 차트 (제휴 필요)

**커뮤니티 소스** (합법적 범위):
- Reddit r/kpop RSS
- Twitter #KPop 해시태그 (Public API)

**수집 정보**:
- 신곡 발매 정보 (공식 발표 기반)
- 차트 순위 (공개 데이터)
- 뮤직비디오 링크 (YouTube 임베드)
- 팬 반응 요약 (개인정보 제거)

### K-Drama

**공식 소스**:
- TMDB API: 드라마 메타데이터
- Naver TV RSS: 공식 클립
- 방송사 공식 홈페이지 RSS

**수집 정보**:
- 방영 스케줄
- 출연진, 제작진
- 줄거리 요약 (100자 이내)
- 공식 포스터 (출처 명시)

### K-Movie

**공식 소스**:
- 영화진흥위원회 KOBIS API
- KMDB (한국영화데이터베이스) API
- CGV/롯데시네마 RSS

**수집 정보**:
- 개봉 정보
- 박스오피스 순위
- 예고편 링크
- 관람등급

---

## 기술 구조

### 시스템 아키텍처

```
┌─────────────────────┐
│  Crawler Scheduler  │ (Vercel Cron Jobs)
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   API Collectors    │
│  - YouTube API      │
│  - Twitter API      │
│  - RSS Parsers      │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Content Processor  │
│  - 요약 생성        │
│  - 개인정보 제거    │
│  - 출처 태깅        │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Fact Check System  │ (2차 검증)
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   Sanity CMS        │
│  - Post 저장        │
│  - 카테고리 분류    │
└─────────────────────┘
```

### 스케줄링

```javascript
// api/cron/collect-kpop.js
export default async function handler(req, res) {
  // Vercel Cron: 매일 오전 9시
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  try {
    // 1. YouTube API로 K-Pop 신곡 수집
    const newReleases = await collectYouTubeKPop()
    
    // 2. 콘텐츠 처리 (요약, 출처 태깅)
    const processed = await processContent(newReleases)
    
    // 3. 팩트체크
    const verified = await factCheck(processed)
    
    // 4. Sanity에 저장
    await saveToSanity(verified)
    
    res.status(200).json({ success: true, count: verified.length })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
```

---

## 2차 검증 시스템

### 팩트체크 프로세스

1. **출처 신뢰도 평가**
   - 공식 소스: 100점
   - 주요 언론: 90점
   - 커뮤니티: 50점

2. **크로스 체크**
   - 2개 이상 소스에서 확인된 정보만 게시

3. **시간 검증**
   - 오래된 정보 (6개월 이상) 경고 표시

4. **사용자 신고 시스템**
   - 잘못된 정보 신고 접수
   - 24시간 내 검토 및 수정/삭제

### AI 기반 요약 (저작권 침해 방지)

```javascript
// 원문 복사 대신 AI 요약 생성
import OpenAI from 'openai'

const summarizeContent = async (originalText) => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  
  const prompt = `
다음 K-Drama 정보를 100자 이내로 요약하세요.
저작권을 침해하지 않도록 원문을 그대로 복사하지 말고, 
핵심 정보만 재구성하세요.

원문: ${originalText}
  `
  
  const summary = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 200,
  })
  
  return summary.choices[0].message.content
}
```

---

## 저작권 보호 프로세스

### DMCA 대응 시스템

1. **저작권 신고 접수**
   - 이메일: dmca@kulture.wiki
   - 폼: `/dmca-takedown`

2. **24시간 내 검토**
   - 신고 내용 확인
   - 저작권자 신원 확인

3. **즉시 삭제 또는 수정**
   - 콘텐츠 비공개 처리
   - 출처 링크만 유지

4. **재발 방지**
   - 해당 소스 수집 대상에서 제외
   - 크롤러 정책 업데이트

### 콘텐츠 라이선스 표기

모든 게시물에 명확한 출처 표기:

```javascript
// Post 메타데이터
{
  title: "신규 K-Drama '하트시그널' 방영 예정",
  source: {
    name: "Naver 연예뉴스",
    url: "https://entertain.naver.com/article/123",
    favicon: "https://naver.com/favicon.ico",
  },
  contentType: "요약", // 원본 아님을 명시
  license: "Fair Use - 뉴스 보도 목적",
  originalAuthor: "기자명",
  publishedAt: "2025-11-19T10:00:00Z",
}
```

### 프론트엔드 표시

```jsx
// components/SourceAttribution.jsx
export default function SourceAttribution({ source }) {
  return (
    <div className={styles.attribution}>
      <img src={source.favicon} alt={source.name} />
      <span>출처: <a href={source.url} target="_blank">{source.name}</a></span>
      <a href={source.url} className={styles.readOriginal}>
        원문 보기 →
      </a>
    </div>
  )
}
```

---

## 관리자 설정 연동

모든 크롤러 기능은 관리자 페이지에서 제어 가능:

### Sanity 스키마 추가

```javascript
// lib/schemas/siteSettings.js에 추가
{
  name: 'crawler',
  title: '🤖 Crawler Settings',
  type: 'object',
  fields: [
    {
      name: 'enabled',
      title: 'Enable Crawler',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'categories',
      title: 'Active Categories',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'K-Pop', value: 'kpop' },
          { title: 'K-Drama', value: 'kdrama' },
          { title: 'K-Movie', value: 'kmovie' },
          { title: 'K-Food', value: 'kfood' },
          { title: 'K-Beauty', value: 'kbeauty' },
        ],
      },
    },
    {
      name: 'cronSchedule',
      title: 'Cron Schedule',
      type: 'string',
      initialValue: '0 9 * * *', // 매일 오전 9시
    },
    {
      name: 'rateLimitPerSecond',
      title: 'Rate Limit (requests/sec)',
      type: 'number',
      validation: Rule => Rule.min(0.1).max(5),
      initialValue: 1,
    },
  ],
},
```

---

## 환경변수 설정

```.env
# API Keys (공식 API 사용)
YOUTUBE_API_KEY=your_youtube_api_key
TMDB_API_KEY=your_tmdb_api_key
TWITTER_BEARER_TOKEN=your_twitter_bearer
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_secret

# Cron 보안
CRON_SECRET=your_random_secret_key

# AI 요약 (선택)
OPENAI_API_KEY=your_openai_key

# DMCA 연락처
DMCA_EMAIL=dmca@kulture.wiki
```

---

## 법적 안전장치 체크리스트

배포 전 반드시 확인:

- [ ] 모든 API가 공식 인증을 받았는가?
- [ ] robots.txt를 100% 준수하는가?
- [ ] Rate Limiting이 적용되어 있는가?
- [ ] User-Agent에 연락처가 명시되어 있는가?
- [ ] 모든 콘텐츠에 출처가 표기되는가?
- [ ] 원문 링크가 제공되는가?
- [ ] DMCA 신고 이메일이 작동하는가?
- [ ] 개인정보 수집 동의 프로세스가 있는가?
- [ ] 이용약관에 크롤링 정책이 명시되어 있는가?
- [ ] 저작권 보호 정책 페이지가 존재하는가?

---

## FAQ

### Q: "모든 정보를 수집"하라는 요청을 어떻게 해석해야 하나요?

**A**: "합법적으로 접근 가능한 공개 정보를 체계적으로 수집"하는 것으로 해석합니다. VPN 우회, 과도한 크롤링 등 불법적 방법은 절대 사용하지 않습니다.

### Q: 공식 API가 없는 소스는 어떻게 하나요?

**A**: 
1. RSS 피드가 있는지 확인
2. robots.txt에서 크롤링 허용 여부 확인
3. 허용된다면 Rate Limiting + 출처 명시로 수집
4. 불가능하다면 해당 소스 제외

### Q: 커뮤니티 게시물을 수집해도 되나요?

**A**: 공개 게시물의 메타데이터(제목, 작성일, 좋아요 수)는 가능하지만, 전체 내용 복사는 불가. 개인정보(이메일, 전화번호 등)는 반드시 제거.

### Q: "2차 검증"은 무엇인가요?

**A**: 수집된 정보의 신뢰도를 평가하는 시스템. 2개 이상 소스에서 확인되거나, 공식 소스의 정보만 게시합니다.

---

**[최종 수정]** 2025-11-19 14:30 (KST)  
**[ReviseLog]** RL-20251119-07  
**[관련 문서]** README.md, WORKGUIDE.md, COPYRIGHT_POLICY.md
