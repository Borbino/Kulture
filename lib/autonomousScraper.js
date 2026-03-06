/**
 * Autonomous Trend Discovery Engine — Global Edition v2.0
 *
 * [원칙 9] 무비용 원칙: 오직 무료 RSS/공개 API만 사용 (API 키 불필요 소스 우선)
 * [원칙 14] 관리자 미지정 인물·그룹도 자동 발굴 (emergingTrendDetector 연동)
 *
 * [커버 소스] 31개 무료 소스
 *  - Reddit: 18개 K-Culture 서브레딧 (kpop, hallyu, bangtan, blackpink, TWICE, aespa 등)
 *  - Google Trends RSS: global, KR, US, JP, TW, GB 6개 지역
 *  - YouTube: 채널 RSS (API 키 불필요)
 *  - Tumblr: kpop/hallyu/kdrama 태그 RSS (무료)
 *  - Mastodon: #kpop/#kdrama/#kculture 공개 타임라인 RSS (완전 무료)
 *  - Naver: 엔터테인먼트 뉴스 RSS
 */

import Parser from 'rss-parser';
import { generateKCultureContent, filterTrendWithGemini } from './aiContentGenerator.js';
import { distributeToSocialMedia } from './socialAutoPoster.js';
import logger from './logger.js';

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
  reddit: {
    kpop:          'https://www.reddit.com/r/kpop/hot.rss?limit=25',
    kpopthoughts:  'https://www.reddit.com/r/kpopthoughts/hot.rss?limit=20',
    hallyu:        'https://www.reddit.com/r/hallyu/hot.rss?limit=20',
    bangtan:       'https://www.reddit.com/r/bangtan/hot.rss?limit=15',
    blackpink:     'https://www.reddit.com/r/BlackPink/hot.rss?limit=15',
    twice:         'https://www.reddit.com/r/TWICE/hot.rss?limit=15',
    aespa:         'https://www.reddit.com/r/aespa/hot.rss?limit=15',
    newjeans:      'https://www.reddit.com/r/NewJeans/hot.rss?limit=15',
    ive:           'https://www.reddit.com/r/iVE/hot.rss?limit=15',
    seventeen:     'https://www.reddit.com/r/seventeen/hot.rss?limit=10',
    stray_kids:    'https://www.reddit.com/r/straykids/hot.rss?limit=10',
    nct:           'https://www.reddit.com/r/NCT/hot.rss?limit=10',
    kdrama:        'https://www.reddit.com/r/KDRAMA/hot.rss?limit=20',
    koreanfood:    'https://www.reddit.com/r/KoreanFood/hot.rss?limit=10',
    asianmusic:    'https://www.reddit.com/r/asianmusic/hot.rss?limit=15',
    koreanvariety: 'https://www.reddit.com/r/koreanvariety/hot.rss?limit=10',
    exo:           'https://www.reddit.com/r/EXO/hot.rss?limit=10',
    lesserafim:    'https://www.reddit.com/r/lesserafim/hot.rss?limit=10',
  },
  googleTrends: {
    global: 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=',
    korea:  'https://trends.google.com/trends/trendingsearches/daily/rss?geo=KR',
    usa:    'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US',
    japan:  'https://trends.google.com/trends/trendingsearches/daily/rss?geo=JP',
    taiwan: 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=TW',
    uk:     'https://trends.google.com/trends/trendingsearches/daily/rss?geo=GB',
  },
  youtube: {
    smtown:   'https://www.youtube.com/feeds/videos.xml?channel_id=UC3IZKseVpdzPSBaWxBxundA',
    ygkplus:  'https://www.youtube.com/feeds/videos.xml?channel_id=UCnjiKND3bx3cXJK8fzHrBrQ',
    jypnation:'https://www.youtube.com/feeds/videos.xml?channel_id=UCpSQNMSMCzVB71HFFKTzOsQ',
  },
  tumblr: {
    kpop:   'https://www.tumblr.com/tagged/kpop/rss',
    hallyu: 'https://www.tumblr.com/tagged/hallyu/rss',
    kdrama: 'https://www.tumblr.com/tagged/kdrama/rss',
  },
  mastodon: {
    kpop:     'https://mastodon.social/tags/kpop.rss',
    kdrama:   'https://mastodon.social/tags/kdrama.rss',
    kculture: 'https://mastodon.social/tags/kculture.rss',
  },
  naver: {
    kpop_news:  'https://rss.etnews.com/Section901.xml',
  },
};

// K-Culture 관련 신호어 (대소문자 무관)
const K_CULTURE_SIGNALS = [
  'k-pop', 'kpop', 'k-drama', 'kdrama', 'korean', '한류', '케이팝',
  'idol', 'comeback', '컴백', 'debut', '데뷔', 'mv', 'fancam',
  'bts', 'blackpink', 'aespa', 'newjeans', 'twice', 'ive', 'exo',
  'seventeen', 'nct', 'stray kids', 'le sserafim', 'mamamoo',
  'itzy', 'red velvet', 'got7', 'day6', 'monsta x',
  'sm entertainment', 'yg entertainment', 'hybe', 'jyp',
  'webtoon', 'k-beauty', 'melon chart', 'gaon',
  'squid game', 'parasite', '기생충', '드라마', 'netflix korea',
];

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
 * K-Culture 관련 여부 빠른 판별
 */
function isKCultureRelated(item) {
  const text = `${item.title} ${item.raw}`.toLowerCase();
  return K_CULTURE_SIGNALS.some(signal => text.includes(signal));
}

/**
 * 모든 무료 소스 병렬 스크래핑
 * @returns {Promise<Array>} 정규화된 아이템 배열
 */
export async function scrapeFreeSources() {
  const fetchTasks = [];

  for (const [key, url] of Object.entries(FREE_SOURCES.reddit)) {
    fetchTasks.push(fetchRssFeed(url, `Reddit r/${key}`, 'reddit'));
  }
  for (const [region, url] of Object.entries(FREE_SOURCES.googleTrends)) {
    fetchTasks.push(fetchRssFeed(url, `Google Trends (${region})`, 'googleTrends'));
  }
  for (const [channel, url] of Object.entries(FREE_SOURCES.youtube)) {
    fetchTasks.push(fetchRssFeed(url, `YouTube/${channel}`, 'youtube'));
  }
  for (const [tag, url] of Object.entries(FREE_SOURCES.tumblr)) {
    fetchTasks.push(fetchRssFeed(url, `Tumblr #${tag}`, 'tumblr'));
  }
  for (const [tag, url] of Object.entries(FREE_SOURCES.mastodon)) {
    fetchTasks.push(fetchRssFeed(url, `Mastodon #${tag}`, 'mastodon'));
  }
  for (const [key, url] of Object.entries(FREE_SOURCES.naver)) {
    fetchTasks.push(fetchRssFeed(url, `Naver/${key}`, 'naver'));
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

  // 1차: 키워드 기반 K-Culture 필터
  const kCultureItems = rawData.filter(isKCultureRelated);
  logger.info('[scraper]', `K-Culture items: ${kCultureItems.length} / ${rawData.length}`);

  if (kCultureItems.length === 0) {
    return { rawCount: rawData.length, kCultureCount: 0, filteredCount: 0, generatedCount: 0 };
  }

  // 2차: Gemini AI 고가치 필터 (무료 티어)
  const filteredCandidates = await filterTrendWithGemini(kCultureItems);

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
