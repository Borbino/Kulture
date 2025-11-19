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

### K-Culture 카테고리 (확장판)

| 카테고리 | 세부 분야 | 공식 소스 | 비공식 소스 |
|---------|----------|----------|------------|
| **K-Pop** | 아이돌, 솔로, 음반, 차트, 뮤비, 팬덤 | YouTube, Spotify, Melon, 공식 팬카페 | 디시인사이드 힙합갤/아이돌갤, Reddit r/kpop, Twitter 팬계정, 인스티즈, 더쿠 |
| **K-Drama** | 드라마, 예능, 웹드라마, 제작 소식 | 방송사 공식, Naver TV, TMDB | 디시 드라마갤, 네이트판, 루리웹, TheQoo |
| **K-Movie** | 영화, 단편, 다큐, 시사회 | 영화진흥위원회, CGV, KOBIS | 디시 영화갤, 씨네21 유저 리뷰, 왓챠피디아 |
| **K-Food** | 레시피, 맛집, 먹방, 쿡방, 음식 트렌드 | YouTube 공식 채널, 맛집 블로그 | 디시 요리갤, 맛집 인스타그램, 배달앱 리뷰 |
| **K-Beauty** | 화장품, 스킨케어, 메이크업, 뷰티 팁 | 공식 브랜드 사이트, 화해, 글로우픽 | 디시 화장품갤, Reddit r/AsianBeauty, 인스타 뷰티 인플루언서 |
| **K-Fashion** | 패션쇼, 브랜드, 스트릿 패션 | 서울패션위크, 무신사, 29CM | 디시 패션갤, 인스타그램 #OOTD, 스타일쉐어 |
| **K-Game** | 게임, e-스포츠, 스트리밍 | Steam, Nexon, Riot Games | 디시 게임갤, 인벤, Twitch 스트리머, AfreecaTV |
| **K-Webtoon** | 웹툰, 웹소설, 만화 | 네이버웹툰, 카카오페이지 | 디시 만화갤, 커뮤니티 팬아트, 리디북스 리뷰 |
| **K-Celeb** | 연예인, 아이돌, 배우 인터뷰 | 공식 매거진(Vogue, GQ), 언론사 | 팬카페, 팬 Twitter, Instagram 팬페이지 |
| **K-Travel** | 한국 여행, 관광지, 숙소 | 한국관광공사, Visit Korea | 디시 여행갤, TripAdvisor, Airbnb 리뷰 |
| **K-Tech** | 한국 스타트업, IT 뉴스 | TechCrunch Korea, ZDNet | 디시 프로그래밍갤, GeekNews, 블로그 |

### 수집 정보 유형 (확대)

1. **메타데이터**: 제목, 장르, 출시일, 평점, 태그
2. **요약 정보**: 줄거리, 리뷰 요약 (100~500자)
3. **공개 통계**: 조회수, 좋아요, 댓글 수, 순위
4. **공식 미디어**: 공개된 포스터, 티저, 공식 사진 (출처 명시)
5. **커뮤니티 반응**: 공개 댓글 요약 (개인정보 제거)
6. **소셜미디어 트렌드**: 해시태그, 멘션, 인기 게시물
7. **사용자 리뷰**: 별점, 평가, 추천 의견
8. **실시간 토론**: 커뮤니티 핫토픽, 논쟁거리
9. **팬 창작물**: 팬아트, 커버곡, 패러디 (저작자 표기)
10. **내부 정보**: 업계 소식, 제작 과정 (공개된 것만)

---

## 합법적 수집 방법

### 1순위: 무료 공식 API (50+ 목록)

#### 소셜미디어 & 커뮤니티

```javascript
// Twitter/X API (Free Tier)
// 월 10,000 트윗, K-Culture 해시태그 모니터링
const TWITTER_API = 'https://api.twitter.com/2/tweets/search/recent'

// Reddit API (무료)
// r/kpop, r/kdrama 등 서브레딧 수집
const REDDIT_API = 'https://www.reddit.com/r/kpop.json'

// Instagram Basic Display API (무료)
// 공개 프로필 및 게시물 수집
const INSTAGRAM_API = 'https://graph.instagram.com/me/media'

// Facebook Graph API (무료 티어)
// 공개 페이지 및 그룹 게시물
const FACEBOOK_API = 'https://graph.facebook.com/v18.0'

// Discord API (무료)
// K-Pop/K-Drama Discord 서버 공개 채널
const DISCORD_API = 'https://discord.com/api/v10'
```

#### 뉴스 & 미디어

```javascript
// NewsAPI (무료 100 요청/일)
const NEWS_API = 'https://newsapi.org/v2/everything?q=K-Pop'

// Naver Search API (무료 25,000 요청/일)
const NAVER_SEARCH = 'https://openapi.naver.com/v1/search/news.json?query=한류'

// Daum Kakao API (무료)
const KAKAO_API = 'https://dapi.kakao.com/v2/search/web'

// RSS Hub (무료, 모든 사이트 RSS화)
const RSSHUB = 'https://rsshub.app/naver/news/entertainment'
```

#### 영상 & 음악

```javascript
// YouTube Data API v3 (무료 10,000 quota/일)
const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3'

// Spotify Web API (무료)
const SPOTIFY_API = 'https://api.spotify.com/v1'

// SoundCloud API (무료)
const SOUNDCLOUD_API = 'https://api.soundcloud.com'

// Vimeo API (무료)
const VIMEO_API = 'https://api.vimeo.com'

// Twitch API (무료)
const TWITCH_API = 'https://api.twitch.tv/helix'
```

#### 영화 & 드라마

```javascript
// TMDB API (무료)
const TMDB_API = 'https://api.themoviedb.org/3'

// OMDb API (무료 1,000 요청/일)
const OMDB_API = 'http://www.omdbapi.com'

// TVMaze API (무료)
const TVMAZE_API = 'https://api.tvmaze.com'

// MyDramaList API (비공식, 무료)
const MDL_API = 'https://api.mydramalist.com/v1'
```

#### 한국 정부/공공 API

```javascript
// 영화진흥위원회 KOBIS API (무료)
const KOBIS_API = 'http://www.kobis.or.kr/kobisopenapi/webservice/rest'

// 한국관광공사 Tour API (무료)
const TOUR_API = 'http://apis.data.go.kr/B551011/KorService1'

// 공공데이터포털 (무료, 5,000+ API)
const DATA_GO_KR = 'https://www.data.go.kr'

// 국립중앙도서관 API (무료)
const NL_API = 'https://www.nl.go.kr/seoji'
```

#### 게임 & e-스포츠

```javascript
// Steam Web API (무료)
const STEAM_API = 'https://api.steampowered.com'

// Riot Games API (무료)
// LoL, Valorant 데이터
const RIOT_API = 'https://kr.api.riotgames.com'

// Twitch API (무료)
const TWITCH_ESPORTS = 'https://api.twitch.tv/helix/streams?game_id=...'

// IGDB (게임 데이터베이스, 무료)
const IGDB_API = 'https://api.igdb.com/v4'
```

#### 쇼핑 & 리뷰

```javascript
// 네이버 쇼핑 API (무료)
const NAVER_SHOPPING = 'https://openapi.naver.com/v1/search/shop.json'

// 쿠팡 파트너스 API (무료)
const COUPANG_API = 'https://api-gateway.coupang.com'

// 알리익스프레스 API (무료)
const ALIEXPRESS_API = 'https://api-sg.aliexpress.com'
```

#### 커뮤니티 & 포럼

```javascript
// DC인사이드 (비공식 RSS)
const DCINSIDE_RSS = 'https://gall.dcinside.com/board/lists?id=idol&_dcbest=1'

// 인스티즈 (공개 게시판)
const INSTIZ_SCRAPE = 'https://www.instiz.net/pt?category=1'

// 더쿠 (공개 게시판)
const THEQOO_SCRAPE = 'https://theqoo.net'

// 루리웹 (공개 게시판)
const RULIWEB_SCRAPE = 'https://bbs.ruliweb.com'

// 네이트판 (공개 게시판)
const NATEPANN_SCRAPE = 'https://pann.nate.com'
```

**장점**:
- ✅ 법적으로 완벽히 안전
- ✅ 구조화된 데이터
- ✅ 50개 이상 무료 API 활용
- ✅ 공식 + 비공식 소스 모두 커버

**단점**:
- ❌ API 키 발급 필요 (대부분 무료)
- ❌ 일부 무료 티어 제한 (충분히 활용 가능)

### 2순위: RSS/Atom 피드 (무제한 무료)

```javascript
// 주요 언론사 K-Culture 섹션
const rssFeeds = [
  // 한국 언론
  'https://entertain.naver.com/rss/movie.xml',
  'https://rss.joins.com/joins_news_kculture.xml',
  'https://www.koreatimes.co.kr/www/rss/culture.xml',
  'https://www.hankyung.com/feed/entertainment',
  
  // 해외 언론
  'https://www.billboard.com/c/music/music-news/feed/',
  'https://www.allkpop.com/feed',
  'https://www.soompi.com/feed',
  
  // 블로그 & 매거진
  'https://medium.com/feed/tag/k-pop',
  'https://www.vogue.co.kr/feed',
  'https://www.gqkorea.co.kr/feed',
  
  // 커뮤니티 RSS (RSSHub 활용)
  'https://rsshub.app/dcinside/board/idol/best',
  'https://rsshub.app/theqoo/popular',
]
```

### 3순위: 합법적 웹 스크래핑 (공개 정보만)

#### 비공식 커뮤니티 수집 전략

**DC인사이드**:
```javascript
// robots.txt 확인 후 허용된 범위만 크롤링
const dcInsideGalleries = [
  'https://gall.dcinside.com/board/lists?id=idol',    // 아이돌갤
  'https://gall.dcinside.com/board/lists?id=drama',   // 드라마갤
  'https://gall.dcinside.com/board/lists?id=movie',   // 영화갤
  'https://gall.dcinside.com/board/lists?id=cooking', // 요리갤
]

// 수집 항목: 제목, 댓글 수, 조회수, 공개 내용 (개인정보 제외)
```

**인스티즈/더쿠/네이트판**:
```javascript
// 공개 게시판만 수집 (로그인 불필요)
const communities = [
  'https://www.instiz.net/pt',          // 인스티즈
  'https://theqoo.net',                  // 더쿠
  'https://pann.nate.com/talk',         // 네이트판
]

// 수집 정보: 실시간 인기글, 트렌딩 토픽, 여론
```

**소셜미디어 공개 게시물**:
```javascript
// Instagram 공개 프로필 (로그인 불필요)
const instagramProfiles = [
  'https://www.instagram.com/bts.bighitofficial/',
  'https://www.instagram.com/jennierubyjane/',
  // ... 공식 계정만
]

// Twitter 공개 트윗
const twitterAccounts = [
  'https://twitter.com/BTS_twt',
  'https://twitter.com/BLACKPINK',
]

// Facebook 공개 페이지
const facebookPages = [
  'https://www.facebook.com/officialpsy',
]
```

#### robots.txt 준수 코드

```javascript
import robotsParser from 'robots-parser'

const checkRobots = async (url) => {
  const robotsUrl = new URL('/robots.txt', url).href
  const robotsTxt = await fetch(robotsUrl).then(r => r.text())
  const robots = robotsParser(robotsUrl, robotsTxt)
  
  // KultureBot 크롤러 식별
  const isAllowed = robots.isAllowed(url, 'KultureBot/1.0')
  
  if (!isAllowed) {
    console.log(`❌ 크롤링 금지: ${url}`)
    return false
  }
  
  console.log(`✅ 크롤링 허용: ${url}`)
  return true
}
```

#### Rate Limiting (서버 부담 최소화)

```javascript
// 1초당 1회 요청 (과도한 크롤링 방지)
import pLimit from 'p-limit'
const limit = pLimit(1)

const crawlWithLimit = async (urls) => {
  return Promise.all(
    urls.map(url => 
      limit(() => {
        return new Promise(resolve => {
          setTimeout(async () => {
            const data = await fetchPage(url)
            resolve(data)
          }, 1000) // 1초 대기
        })
      })
    )
  )
}

// 각 사이트별 추가 제한
const rateLimits = {
  'dcinside.com': 2000,  // 2초당 1회
  'instiz.net': 3000,    // 3초당 1회
  'theqoo.net': 2000,    // 2초당 1회
}
```

#### User-Agent 명시 (신원 공개)

```javascript
const headers = {
  'User-Agent': 'KultureBot/1.0 (+https://kulture.wiki/bot-info; contact@kulture.wiki; 합법적 K-Culture 정보 수집)',
  'Accept': 'text/html,application/json',
  'Accept-Language': 'ko-KR,en-US',
  'Referer': 'https://kulture.wiki',
}
```

### 수집 프로세스

1. **API 우선 확인**: 해당 사이트에 공식 API가 있는가?
2. **RSS 피드 확인**: RSS/Atom 피드를 제공하는가?
3. **robots.txt 확인**: 크롤링이 허용되는가?
4. **Rate Limit 적용**: 서버에 부담을 주지 않는가?
5. **출처 명시**: 모든 수집 데이터에 출처 태그 부착
6. **2차 검증 대기**: 즉시 게시하지 않고 검증 대기열에 추가

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

### 3단계 검증 프로세스

#### 1단계: 자동 필터링 (AI)

```javascript
// 불법/유해 콘텐츠 자동 감지
const autoFilter = async (content) => {
  const checks = {
    // 저작권 침해 의심
    copyrightViolation: detectFullTextCopy(content),
    
    // 개인정보 포함 여부
    personalInfo: detectPII(content), // 전화번호, 주민번호, 주소
    
    // 혐오/차별 표현
    hateS peech: detectHateSpeech(content),
    
    // 명예훼손 의심 표현
    defamation: detectDefamation(content),
    
    // 성인 콘텐츠
    adultContent: detectAdultContent(content),
  }
  
  // 하나라도 걸리면 자동 거부
  if (Object.values(checks).some(v => v === true)) {
    return { approved: false, reason: checks }
  }
  
  return { approved: true }
}
```

#### 2단계: 출처 신뢰도 평가

```javascript
const trustScores = {
  // 공식 소스 (90-100점)
  'youtube.com': 100,           // 공식 채널
  'instagram.com': 95,          // 공식 프로필
  'twitter.com': 95,            // 인증된 계정
  'naver.com': 100,             // 네이버 뉴스
  'kobis.or.kr': 100,           // 정부 기관
  
  // 주요 언론사 (80-90점)
  'joins.com': 90,              // 중앙일보
  'chosun.com': 90,             // 조선일보
  'koreatimes.co.kr': 85,       // 코리아타임즈
  'billboard.com': 90,          // 빌보드
  'soompi.com': 85,             // Soompi
  
  // 커뮤니티 (50-70점)
  'dcinside.com': 60,           // DC인사이드
  'reddit.com': 70,             // Reddit
  'instiz.net': 60,             // 인스티즈
  'theqoo.net': 60,             // 더쿠
  'pann.nate.com': 55,          // 네이트판
  
  // 개인 블로그/SNS (30-50점)
  'tistory.com': 40,            // 개인 블로그
  'medium.com': 50,             // Medium
  'blog.naver.com': 40,         // 네이버 블로그
}

const evaluateSource = (url) => {
  const domain = new URL(url).hostname.replace('www.', '')
  const score = trustScores[domain] || 30 // 기본 30점
  
  return {
    domain,
    score,
    tier: score >= 80 ? 'HIGH' : score >= 60 ? 'MEDIUM' : 'LOW'
  }
}
```

#### 3단계: 크로스 체크

```javascript
// 여러 소스에서 같은 정보 확인
const crossCheck = async (content) => {
  const similarSources = await findSimilarContent(content)
  
  if (similarSources.length === 0) {
    return {
      verified: false,
      reason: '단일 소스만 존재 (추가 확인 필요)'
    }
  }
  
  if (similarSources.length >= 2) {
    const officialSourceExists = similarSources.some(s => 
      evaluateSource(s.url).tier === 'HIGH'
    )
    
    return {
      verified: true,
      confidence: officialSourceExists ? 'HIGH' : 'MEDIUM',
      sources: similarSources
    }
  }
}
```

### CEO 승인 대시보드

```javascript
// 검증 대기열
const pendingQueue = {
  // 자동 승인 (신뢰도 90점 이상 + 공식 소스)
  autoApproved: [], 
  
  // CEO 검토 필요 (신뢰도 60-90점)
  needsReview: [],
  
  // 자동 거부 (불법/유해)
  autoRejected: [],
}

// CEO 대시보드 UI
export default function ContentReviewDashboard() {
  const { pendingContents } = usePendingContents()
  
  return (
    <div className={styles.dashboard}>
      <h2>📋 콘텐츠 검토 대기열</h2>
      
      {pendingContents.map(content => (
        <div key={content.id} className={styles.contentCard}>
          <h3>{content.title}</h3>
          <p>{content.summary}</p>
          
          <div className={styles.metadata}>
            <span>출처: {content.source}</span>
            <span>신뢰도: {content.trustScore}점</span>
            <span>검증 상태: {content.verificationStatus}</span>
          </div>
          
          <div className={styles.actions}>
            <button onClick={() => approveContent(content.id)}>
              ✅ 승인
            </button>
            <button onClick={() => rejectContent(content.id)}>
              ❌ 거부
            </button>
            <button onClick={() => editContent(content.id)}>
              ✏️ 수정 후 승인
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

### 자동 승인 규칙

CEO의 부담을 줄이기 위한 자동 승인 조건:

```javascript
const autoApprovalRules = {
  // 조건 1: 공식 소스 + 높은 신뢰도
  rule1: (content) => {
    return content.trustScore >= 90 && 
           content.sourceType === 'official'
  },
  
  // 조건 2: 3개 이상 소스에서 크로스 체크
  rule2: (content) => {
    return content.verifiedSources.length >= 3 &&
           content.verifiedSources.some(s => s.trustScore >= 80)
  },
  
  // 조건 3: 정부/공공기관 소스
  rule3: (content) => {
    const govDomains = ['go.kr', 'kobis.or.kr', 'data.go.kr']
    return govDomains.some(d => content.sourceUrl.includes(d))
  },
}

// 자동 승인 체크
const shouldAutoApprove = (content) => {
  return Object.values(autoApprovalRules).some(rule => rule(content))
}
```

### 팩트체크 AI

```javascript
import OpenAI from 'openai'

const factCheck = async (content) => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  
  const prompt = `
다음 K-Culture 정보의 팩트체크를 수행하세요:

제목: ${content.title}
내용: ${content.body}
출처: ${content.source}

다음 항목을 JSON 형식으로 반환:
1. accuracy: 정확도 (0-100)
2. concerns: 우려사항 배열
3. suggestions: 수정 제안
4. verdict: "APPROVED" | "NEEDS_REVIEW" | "REJECTED"
  `
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  })
  
  return JSON.parse(response.choices[0].message.content)
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
1. **RSS 피드 확인**: RSS/Atom 제공 여부 (RSSHub 활용 가능)
2. **robots.txt 확인**: 크롤링 허용 범위 체크
3. **공개 정보만 수집**: 로그인 불필요한 공개 게시판만
4. **Rate Limiting 적용**: 1초당 1회 이하
5. **출처 명시 + 원본 링크**: Fair Use 준수
6. **2차 검증 대기**: 즉시 게시하지 않고 검토

### Q: 커뮤니티 게시물을 수집해도 되나요?

**A**: 
- ✅ **가능**: 공개 게시판의 제목, 조회수, 댓글 수 등 메타데이터
- ✅ **가능**: 공개 게시물 요약 (원문 복사 아님, AI로 재구성)
- ✅ **가능**: 트렌드 분석, 여론 요약
- ❌ **불가**: 전체 내용 그대로 복사
- ❌ **불가**: 개인정보 (이메일, 전화번호, 주소 등)
- ❌ **불가**: 로그인 필요한 비공개 게시판

**예시**:
```javascript
// ✅ 허용: 메타데이터 + 요약
{
  title: "신규 K-Drama 반응 폭발",
  source: "디시인사이드 드라마갤",
  url: "원본 링크",
  summary: "커뮤니티 반응: 긍정 75%, 부정 10%, 중립 15%",
  topComments: ["연기 대박", "스토리 탄탄", "OST 좋음"] // 요약
}

// ❌ 금지: 전문 복사
{
  fullContent: "게시물 전체 내용을 그대로..." // 저작권 침해
}
```

### Q: "2차 검증"은 무엇인가요?

**A**: 
1. **자동 필터링 (AI)**: 불법/유해 콘텐츠 자동 감지
2. **출처 신뢰도 평가**: 공식 소스 100점, 커뮤니티 50-70점
3. **크로스 체크**: 2개 이상 소스에서 확인
4. **팩트체크 AI**: GPT-4로 정확도 검증
5. **CEO 최종 승인**: 의심 콘텐츠는 수동 검토

**자동 승인 조건**:
- 공식 소스 + 신뢰도 90점 이상
- 3개 이상 소스에서 크로스 체크
- 정부/공공기관 소스

### Q: 비공식 커뮤니티(DC인사이드 등) 수집이 합법인가요?

**A**: ✅ **합법적으로 가능** (조건부)

**합법적 사유**:
1. **공개 정보**: 로그인 없이 누구나 볼 수 있는 게시판
2. **Fair Use**: 뉴스 보도, 비평, 연구 목적
3. **출처 명시**: 명확한 출처 표기 + 원본 링크
4. **요약/재구성**: 원문 그대로 복사하지 않음
5. **robots.txt 준수**: 크롤링 허용 범위만

**필수 조건**:
- ✅ 공개 게시판만 (비공개 X)
- ✅ 메타데이터 + 요약만 (전문 복사 X)
- ✅ 개인정보 제거 (이메일, 전화번호 등)
- ✅ Rate Limiting (서버 부담 최소화)
- ✅ 출처 명시 + 원본 링크

### Q: 수집량이 너무 많아지면 어떻게 하나요?

**A**: 
1. **우선순위 시스템**: 공식 소스 우선, 커뮤니티는 인기글만
2. **중복 제거**: 동일 내용은 하나만 저장
3. **자동 아카이빙**: 오래된 콘텐츠(3개월 이상) 자동 보관
4. **CEO 필터**: 카테고리별 수집 On/Off (관리자 페이지)
5. **Sanity 최적화**: CDN + 이미지 압축으로 비용 절감

### Q: API 키 발급 비용은 얼마나 드나요?

**A**: **대부분 무료!**

| API | 무료 티어 | 비용 (유료 시) |
|-----|---------|---------------|
| YouTube Data API | 10,000 quota/일 | 무료 충분 |
| Twitter API | 10,000 트윗/월 | $100/월 (필요 시) |
| TMDB API | 무제한 | 완전 무료 |
| Naver API | 25,000 요청/일 | 무료 충분 |
| Spotify API | 무제한 | 완전 무료 |
| KOBIS API | 무제한 | 완전 무료 |
| NewsAPI | 100 요청/일 | $449/월 (불필요) |

**전략**: 무료 API만으로도 하루 수만 건 수집 가능

### Q: 저작권 침해로 신고당하면 어떻게 되나요?

**A**: **DMCA 프로세스 준수**

1. **신고 접수**: dmca@kulture.wiki로 이메일
2. **24시간 내 검토**: 저작권자 신원 확인
3. **즉시 삭제**: 해당 콘텐츠 비공개 처리
4. **재발 방지**: 해당 소스 수집 대상 제외
5. **법적 대응**: 정당한 Fair Use라면 반론 제출

**예방책**:
- 원문 전체 복사 절대 금지
- 모든 콘텐츠에 출처 + 원본 링크
- "요약" 표시로 2차 창작물임을 명시
- 저작권자 요청 시 즉시 삭제 약속

### Q: 개인정보 수집으로 문제되지 않나요?

**A**: ✅ **안전** (개인정보 제외)

**수집하는 것** (공개 정보):
- 게시물 제목, 내용 요약
- 조회수, 좋아요, 댓글 수
- 공개 프로필 (아이디, 닉네임)
- 공개 해시태그, 트렌드

**절대 수집 안 함** (개인정보):
- ❌ 이메일 주소
- ❌ 전화번호
- ❌ 주민등록번호
- ❌ 실명 (공개 연예인 제외)
- ❌ 주소, 위치 정보
- ❌ IP 주소

**자동 제거 시스템**:
```javascript
const removePII = (text) => {
  // 이메일 제거
  text = text.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[이메일 제거]')
  
  // 전화번호 제거
  text = text.replace(/\d{2,3}-\d{3,4}-\d{4}/g, '[전화번호 제거]')
  
  // 주민번호 제거
  text = text.replace(/\d{6}-\d{7}/g, '[주민번호 제거]')
  
  return text
}
```

---

**[최종 수정]** 2025-11-19 14:30 (KST)  
**[ReviseLog]** RL-20251119-07  
**[관련 문서]** README.md, WORKGUIDE.md, COPYRIGHT_POLICY.md
