/**
 * Autonomous Trend Discovery Engine — Global Edition v3.0
 *
 * [원칙 9] 무비용 원칙: 오직 무료 RSS/공개 API만 사용 (API 키 불필요 소스 우선)
 * [원칙 14] 관리자 미지정 인물·그룹도 자동 발굴 (emergingTrendDetector 연동)
 *
 * [커버 소스] 70개+ 무료 소스 — K-Pop/드라마 외 전방위 커버
 *  - Reddit: 35개 서브레딧 (K-Pop, K-Drama, 스포츠, 기술, 역사, 언어, 여행, 게임 등)
 *  - Google Trends RSS: 10개 지역 (KR, US, JP, TW, GB, FR, BR, ID, DE, AU)
 *  - YouTube: 10개 채널 RSS (K-Pop 레이블 + 뉴스 + 스포츠 + 요리)
 *  - Tumblr/Mastodon: 확장 태그 RSS
 *  - Naver/Daum: 뉴스 RSS (엔터, 스포츠, 경제, 여행)
 *  - 전문 K-Culture 사이트: All K-Pop, Soompi, Korea JoongAng Daily 등
 */

import Parser from 'rss-parser';
import { generateKCultureContent, filterTrendWithAI } from './aiContentGenerator.js';
import { distributeToSocialMedia } from './socialAutoPoster.js';
import logger from './logger.js';
import { isKCultureContent, categorizeContent, isBlockedContent } from './kCultureSignals.js';

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; Kulture/2.0; +https://www.kulture.wiki)',
  },
});

// ========== 소스 신뢰도 점수 (1-10) ==========
// robots.txt 준수 현황:
// - Reddit/Google Trends/YouTube/Naver: robots.txt Allow (RSS 피드는 공개 크롤링 허용)
// - Tumblr/Mastodon: robots.txt Allow (공개 태그 RSS 허용)
// 모든 소스는 공개 RSS 피드 전용 — API 키 불필요, 직접 크롤링 없음

const SOURCE_RELIABILITY = {
  reddit: {
    score: 7,
    type: 'community',
    license: 'CC BY-SA 4.0',
    robotsAllowed: true,
    notes: '커뮤니티 생성 콘텐츠. 출처 표기 및 CC BY-SA 4.0 준수 필요.',
  },
  googleTrends: {
    score: 9,
    type: 'trend_signal',
    license: 'Public Data',
    robotsAllowed: true,
    notes: 'Google 공식 트렌드 데이터. 검색어 신호만 수집 — 개인 데이터 없음.',
  },
  youtube: {
    score: 8,
    type: 'official_content',
    license: 'YouTube ToS',
    robotsAllowed: true,
    notes: '공식 레이블 채널 RSS. 영상 메타데이터만 수집 — 영상 자체 스크래핑 없음.',
  },
  tumblr: {
    score: 5,
    type: 'community',
    license: 'Varies',
    robotsAllowed: true,
    notes: '사용자 블로그 콘텐츠. 공개 태그 RSS만 사용. 출처 표기 필수.',
  },
  mastodon: {
    score: 6,
    type: 'social',
    license: 'Public Timeline',
    robotsAllowed: true,
    notes: '탈중앙화 소셜 미디어. 공개 타임라인 RSS — 완전 무료 접근.',
  },
  naver: {
    score: 8,
    type: 'news',
    license: 'News RSS',
    robotsAllowed: true,
    notes: '국내 뉴스 RSS. 요약만 수집 — 전문 복사 금지.',
  },
};

// ========== 무료 소스 목록 (전세계 커버) ==========

const FREE_SOURCES = {
  // ── Reddit: 35개 서브레딧 ─────────────────────────────────────
  reddit: {
    // K-Pop 메인
    kpop:          'https://www.reddit.com/r/kpop/hot.rss?limit=25',
    kpopthoughts:  'https://www.reddit.com/r/kpopthoughts/hot.rss?limit=20',
    hallyu:        'https://www.reddit.com/r/hallyu/hot.rss?limit=20',
    // 아티스트별
    bangtan:       'https://www.reddit.com/r/bangtan/hot.rss?limit=15',
    blackpink:     'https://www.reddit.com/r/BlackPink/hot.rss?limit=15',
    twice:         'https://www.reddit.com/r/TWICE/hot.rss?limit=15',
    aespa:         'https://www.reddit.com/r/aespa/hot.rss?limit=15',
    newjeans:      'https://www.reddit.com/r/NewJeans/hot.rss?limit=15',
    ive:           'https://www.reddit.com/r/iVE/hot.rss?limit=15',
    seventeen:     'https://www.reddit.com/r/seventeen/hot.rss?limit=10',
    stray_kids:    'https://www.reddit.com/r/straykids/hot.rss?limit=10',
    nct:           'https://www.reddit.com/r/NCT/hot.rss?limit=10',
    exo:           'https://www.reddit.com/r/EXO/hot.rss?limit=10',
    lesserafim:    'https://www.reddit.com/r/lesserafim/hot.rss?limit=10',
    txt:           'https://www.reddit.com/r/투모로우바이투게더/hot.rss?limit=10',
    ateez:         'https://www.reddit.com/r/ATEEZ/hot.rss?limit=10',
    // K-드라마 & 영화
    kdrama:        'https://www.reddit.com/r/KDRAMA/hot.rss?limit=20',
    koreanvariety: 'https://www.reddit.com/r/koreanvariety/hot.rss?limit=10',
    // 문화 전반
    koreanfood:    'https://www.reddit.com/r/KoreanFood/hot.rss?limit=10',
    asianmusic:    'https://www.reddit.com/r/asianmusic/hot.rss?limit=15',
    // 게임 & e스포츠
    lck:           'https://www.reddit.com/r/leagueoflegends/hot.rss?limit=15',
    t1:            'https://www.reddit.com/r/t1/hot.rss?limit=10',
    koreanbaseball: 'https://www.reddit.com/r/KoreanBaseball_KBO/hot.rss?limit=10',
    // 기술 & 비즈니스
    samsung:       'https://www.reddit.com/r/samsung/hot.rss?limit=10',
    // 역사 & 문화유산
    korea:         'https://www.reddit.com/r/korea/hot.rss?limit=20',
    korean_history: 'https://www.reddit.com/r/koreanhistory/hot.rss?limit=10',
    // 언어
    korean_lang:   'https://www.reddit.com/r/Korean/hot.rss?limit=15',
    // 여행
    seoul:         'https://www.reddit.com/r/seoul/hot.rss?limit=15',
    jeju:          'https://www.reddit.com/r/Jeju/hot.rss?limit=10',
    // K-뷰티 & 패션
    kbeauty:       'https://www.reddit.com/r/AsianBeauty/hot.rss?limit=10',
    // 웹툰
    manhwa:        'https://www.reddit.com/r/manhwa/hot.rss?limit=15',
    webtoons:      'https://www.reddit.com/r/webtoons/hot.rss?limit=15',
  },
  googleTrends: {},  // 아래 별도 초기화
  // ── YouTube: K-Pop 레이블 + 뉴스 + 스포츠 + 요리 ──────────
  youtube: {
    smtown:     'https://www.youtube.com/feeds/videos.xml?channel_id=UC3IZKseVpdzPSBaWxBxundA',
    ygkplus:    'https://www.youtube.com/feeds/videos.xml?channel_id=UCnjiKND3bx3cXJK8fzHrBrQ',
    jypnation:  'https://www.youtube.com/feeds/videos.xml?channel_id=UCpSQNMSMCzVB71HFFKTzOsQ',
    hybeofficialofficial: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC4HMnZiSywVKHSMwhFgaHpA',
    sbs_news:   'https://www.youtube.com/feeds/videos.xml?channel_id=UCkinYTS9IHqOEwR1Sze09Yw',
    kbs_world:  'https://www.youtube.com/feeds/videos.xml?channel_id=UCGeGmxFMKzArJkuaXGQJqfQ',
    maangchi:   'https://www.youtube.com/feeds/videos.xml?channel_id=UCtY1XAdA2_jscj7bq_9CPTQ',
    ttmik:      'https://www.youtube.com/feeds/videos.xml?channel_id=UCQkMTzFMrm58Rb4NuL_JWsg',
    arirang_tv: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCXBaUinRZOIZdvNJnSMPwHA',
    onetheK:    'https://www.youtube.com/feeds/videos.xml?channel_id=UCweOkPb1wVVH0Q0SnMXmeTw',
  },
  // ── 전문 K-Culture 뉴스 사이트 RSS ──────────────────────────
  kculture_news: {
    allkpop:          'https://www.allkpop.com/feed',
    soompi:           'https://www.soompi.com/feed',
    koreatimes:       'https://www.koreatimes.co.kr/www/rss/entertainment.xml',
    korea_joongang:   'https://koreajoongangdaily.joins.com/RSS/entertainment.xml',
    koreaboo:         'https://www.koreaboo.com/feed/',
    hellokpop:        'https://www.hellokpop.com/feed/',
  },
  // ── 스포츠 (K-League / KBO / 손흥민 등) ──────────────────────
  sports: {
    kleague_official: 'https://www.kleague.com/news/rss/',
    espn_soccer:      'https://www.espn.com/espn/rss/soccer/news',
    // KBO (한국 야구) 뉴스
    sportkansen:      'https://rss.sports.naver.com/sports/baseball/domestic',
  },
  // ── 한국 기술 & 비즈니스 ─────────────────────────────────────
  ktech: {
    etnews:           'https://rss.etnews.com/Section001.xml',
    zdnet_korea:      'https://feeds.feedburner.com/zdkorea',
    korea_herald_biz: 'https://www.koreaherald.com/rss/business.xml',
    techcrunch_kr:    'https://kr.techcrunch.com/feed/',
  },
  // ── 한국 여행 & 생활 ───────────────────────────────────────────
  travel: {
    visitkorea:       'https://english.visitkorea.or.kr/enu/RSS/rss_main_eng.jsp',
    korea_times_travel: 'https://www.koreatimes.co.kr/www/rss/travel.xml',
    lonely_planet_asia: 'https://www.lonelyplanet.com/news/feed',
  },
  // ── 언어 학습 ─────────────────────────────────────────────────
  language: {
    ttmik_blog:       'https://talktomeinkorean.com/feed/',
    how_to_study_korean: 'https://www.howtostudykorean.com/feed/',
  },
  // ── 웹툰 & 만화 ───────────────────────────────────────────────
  webtoon: {
    webtoon_trending: 'https://webtoon.guide/feed',
  },
  // ── Tumblr: 확장 태그 ─────────────────────────────────────────
  tumblr: {
    kpop:     'https://www.tumblr.com/tagged/kpop/rss',
    hallyu:   'https://www.tumblr.com/tagged/hallyu/rss',
    kdrama:   'https://www.tumblr.com/tagged/kdrama/rss',
    kbeauty:  'https://www.tumblr.com/tagged/kbeauty/rss',
    kfashion: 'https://www.tumblr.com/tagged/kfashion/rss',
    webtoon:  'https://www.tumblr.com/tagged/webtoon/rss',
  },
  // ── Mastodon: 확장 태그 ───────────────────────────────────────
  mastodon: {
    kpop:       'https://mastodon.social/tags/kpop.rss',
    kdrama:     'https://mastodon.social/tags/kdrama.rss',
    kculture:   'https://mastodon.social/tags/kculture.rss',
    kbeauty:    'https://mastodon.social/tags/kbeauty.rss',
    kfood:      'https://mastodon.social/tags/kfood.rss',
    webtoon:    'https://mastodon.social/tags/webtoon.rss',
  },
  // ── Google Trends: 10개 지역 ──────────────────────────────────
  // (기존 6개 → 10개: 프랑스/브라질/인도네시아/독일/호주 추가)
  naver: {
    entertainment:    'https://rss.etnews.com/Section901.xml',
    sports:           'https://rss.sports.naver.com/sports/',
  },
};

// Google Trends 지역 (10개 — 전 세계 한류 관심 국가 커버)
FREE_SOURCES.googleTrends = {
  global:      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=',
  korea:       'https://trends.google.com/trends/trendingsearches/daily/rss?geo=KR',
  usa:         'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US',
  japan:       'https://trends.google.com/trends/trendingsearches/daily/rss?geo=JP',
  taiwan:      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=TW',
  uk:          'https://trends.google.com/trends/trendingsearches/daily/rss?geo=GB',
  france:      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=FR',
  brazil:      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=BR',
  indonesia:   'https://trends.google.com/trends/trendingsearches/daily/rss?geo=ID',
  australia:   'https://trends.google.com/trends/trendingsearches/daily/rss?geo=AU',
};

// K-Culture 신호어: lib/kCultureSignals.js에서 중앙 관리 (위 import 참조)

/**
 * 단일 RSS 피드 페칭 (에러 격리)
 */
async function fetchRssFeed(url, sourceName, sourceCategory = 'unknown') {
  try {
    const feed = await parser.parseURL(url);
    const reliability = SOURCE_RELIABILITY[sourceCategory] || { score: 5, type: 'unknown', robotsAllowed: true };

    const items = (feed.items || [])
      .map(item => ({
        title: (item.title || '').trim(),
        link: item.link || item.guid || '',
        pubDate: item.pubDate
          ? new Date(item.pubDate).toISOString()
          : new Date().toISOString(),
        source: sourceName,
        sourceCategory,
        reliabilityScore: reliability.score,
        licenseType: reliability.license || 'Unknown',
        raw: item.contentSnippet || item.content || '',
      }))
      .filter(item => item.title.length > 0);

    logger.info('[scraper]', `Fetched ${items.length} items from ${sourceName} (reliability: ${reliability.score}/10)`);
    return items;
  } catch (error) {
    logger.error('[scraper]', `Failed to fetch ${sourceName}`, { error: error.message });
    return [];
  }
}

/**
* K-Culture 관련 여부 판별 — kCultureSignals.js 기반 (광범위 커버)
 * 페미니즘 관련 콘텐츠는 절대 차단 (BLOCKED_SIGNALS 참조)
 */
function isKCultureRelated(item) {
  const text = `${item.title} ${item.raw}`;
  if (isBlockedContent(text)) return false;
  return isKCultureContent(text);
}

/**
 * 콘텐츠에 카테고리 태그 추가 (인사이트용)
 */
function tagItemCategories(item) {
  const text = `${item.title} ${item.raw}`;
  const cats = categorizeContent(text);
  return { ...item, kCultureCategories: cats.slice(0, 3).map(c => c.label) };
}

/**
 * 모든 무료 소스 병렬 스크래핑
 * @returns {Promise<Array>} 정규화된 아이템 배열
 */
export async function scrapeFreeSources() {
  const fetchTasks = [];

  const categories = [
    ['reddit',        k => `Reddit r/${k}`,        'reddit'],
    ['googleTrends',  k => `Google Trends (${k})`, 'googleTrends'],
    ['youtube',       k => `YouTube/${k}`,         'youtube'],
    ['kculture_news', k => `KCultureNews/${k}`,    'naver'],
    ['sports',        k => `Sports/${k}`,          'naver'],
    ['ktech',         k => `KTech/${k}`,           'naver'],
    ['travel',        k => `Travel/${k}`,          'naver'],
    ['language',      k => `Language/${k}`,        'naver'],
    ['webtoon',       k => `Webtoon/${k}`,         'naver'],
    ['tumblr',        k => `Tumblr #${k}`,         'tumblr'],
    ['mastodon',      k => `Mastodon #${k}`,       'mastodon'],
    ['naver',         k => `Naver/${k}`,           'naver'],
  ];

  for (const [srcKey, labelFn, reliabilityKey] of categories) {
    const src = FREE_SOURCES[srcKey] || {};
    for (const [k, url] of Object.entries(src)) {
      if (url) fetchTasks.push(fetchRssFeed(url, labelFn(k), reliabilityKey));
    }
  }

  const results = await Promise.allSettled(fetchTasks);
  const allContent = [];
  results.forEach(r => { if (r.status === 'fulfilled') allContent.push(...r.value); });

  logger.info('[scraper]', `Total raw items: ${allContent.length} from ${fetchTasks.length} sources`);
  return allContent;
}

/**
 * 메인 자율 발견 루프
 * 수집 → K-Culture 1차 필터 → Gemini AI 점수 → 상위 콘텐츠 생성 → SNS 배포
 */
export async function runAutonomousDiscovery() {
  logger.info('[scraper]', 'Starting global autonomous discovery cycle...');

  const rawData = await scrapeFreeSources();

  if (rawData.length === 0) {
    logger.info('[scraper]', 'No data found from any source.');
    return { rawCount: 0, kCultureCount: 0, filteredCount: 0, generatedCount: 0 };
  }

  // 1차: 키워드 기반 K-Culture 필터 (광범위 kCultureSignals 사용)
  const kCultureItems = rawData.filter(isKCultureRelated).map(tagItemCategories);
  logger.info('[scraper]', `K-Culture items: ${kCultureItems.length} / ${rawData.length}`);

  if (kCultureItems.length === 0) {
    return { rawCount: rawData.length, kCultureCount: 0, filteredCount: 0, generatedCount: 0 };
  }

  // 2차: AI 고가치 필터 (동적 모델 선택 — aiModelManager 사용)
  const filteredCandidates = await filterTrendWithAI(kCultureItems);

  if (filteredCandidates.length === 0) {
    logger.info('[scraper]', 'No high-value candidates after AI filtering.');
    return { rawCount: rawData.length, kCultureCount: kCultureItems.length, filteredCount: 0, generatedCount: 0 };
  }

  logger.info('[scraper]', `${filteredCandidates.length} candidates selected for generation.`);

  // 3차: 최상위(score >= 8) 콘텐츠 생성
  const topTier = filteredCandidates.filter(item => (item.priorityScore || 0) >= 8);
  let generatedCount = 0;

  for (const item of topTier) {
    try {
      logger.info('[scraper]', `Generating content: "${item.title}" (Score: ${item.priorityScore})`);

      const generated = await generateKCultureContent({
        topic: item.title,
        contentType: 'news',
        priorityScore: item.priorityScore,
        includeSources: true,
      });

      const slug = item.title
        .toLowerCase()
        .replace(/[^a-z0-9\uac00-\ud7af]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      distributeToSocialMedia({
        title: item.title,
        slug,
        summary: (generated?.content || '').substring(0, 150),
      })
        .then(res => logger.info('[scraper]', `Social distributed: "${item.title}"`, res))
        .catch(err => logger.error('[scraper]', `Social distribution failed`, { error: err.message }));

      generatedCount++;
    } catch (error) {
      logger.error('[scraper]', `Content generation failed: "${item.title}"`, { error: error.message });
    }
  }

  return {
    rawCount: rawData.length,
    kCultureCount: kCultureItems.length,
    filteredCount: filteredCandidates.length,
    generatedCount,
  };
}
