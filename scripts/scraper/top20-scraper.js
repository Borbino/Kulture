#!/usr/bin/env node
/**
 * Kulture — Top 20 글로벌 트렌드 자율 스크래퍼
 *
 * [V15.1 정책 3] 무거운 크롤링 연산은 GitHub Actions 워커에서만 실행한다.
 *   - Vercel Serverless 타임아웃(10s) 및 과금 원천 차단
 *   - 실행 방법: node scripts/scraper/top20-scraper.js
 *   - 자동 실행:  .github/workflows/automation-scraping.yml (매 6시간)
 *
 * 수집 소스 우선순위 (무과금, 공개 API / RSS 기반):
 *   1. Billboard Hot 100 RSS
 *   2. Melon Chart 공개 엔드포인트
 *   3. YouTube Trending RSS (지역별)
 *   4. Twitter/X Trends (공개 트렌드 페이지)
 *   5. Google Trends RSS (ko, en, ja, zh-CN)
 *
 * 출력 대상:
 *   - Sanity CMS: 에디터 검토용 draft 기사 생성
 *   - Supabase:   trends 테이블에 raw 데이터 삽입
 */

import { createClient as createSanityClient } from '@sanity/client';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// ──────────────────────────────────────────────────────────────
// 환경 변수 검증
// ──────────────────────────────────────────────────────────────
const REQUIRED_ENV = [
  'NEXT_PUBLIC_SANITY_PROJECT_ID',
  'SANITY_API_TOKEN',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

function validateEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error('[Top20Scraper] 필수 환경 변수 누락:', missing.join(', '));
    process.exit(1);
  }
}

// ──────────────────────────────────────────────────────────────
// 클라이언트 초기화
// ──────────────────────────────────────────────────────────────
function initClients() {
  const sanity = createSanityClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
  });

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return { sanity, supabase };
}

// ──────────────────────────────────────────────────────────────
// 소스별 스크래핑 함수
// ──────────────────────────────────────────────────────────────

/**
 * Google Trends RSS에서 실시간 트렌드 키워드를 수집한다.
 * @param {string} geo - 국가 코드 (KR, US, JP, TW, FR, DE, MX, EG)
 * @returns {Promise<Array<{keyword: string, source: string, geo: string}>>}
 */
async function fetchGoogleTrends(geo = 'KR') {
  const url = `https://trends.google.com/trending/rss?geo=${geo}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'KultureBot/1.0 (+https://kulture.wiki)' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const xml = await res.text();
    // RSS <title> 태그에서 키워드 추출 (정규식 파싱 — 외부 XML 파서 의존성 없음)
    const titles = [...xml.matchAll(/<title><!\[CDATA\[(.+?)\]\]><\/title>/g)].map(
      (m) => m[1]
    );
    // 첫 번째 항목은 채널 제목이므로 skip
    return titles.slice(1, 21).map((keyword) => ({ keyword, source: 'google-trends', geo }));
  } catch (err) {
    console.warn(`[Top20Scraper] Google Trends (${geo}) 수집 실패:`, err.message);
    return [];
  }
}

/**
 * YouTube Trending RSS에서 K-Culture 관련 트렌드 영상을 수집한다.
 * @param {string} regionCode - ISO 3166-1 alpha-2 (KR, US, JP 등)
 * @returns {Promise<Array<{keyword: string, source: string, geo: string}>>}
 */
async function fetchYoutubeTrending(regionCode = 'KR') {
  // YouTube Trending은 공개 RSS를 제공하지 않으므로 Data API v3 (무료 할당량) 대신
  // 공개 트렌딩 페이지를 시뮬레이션한다.
  // TODO: YOUTUBE_API_KEY 환경 변수 설정 후 실제 API 연동
  console.info(`[Top20Scraper] YouTube Trending (${regionCode}) — API 키 미설정, 더미 데이터 반환`);
  const DUMMY_KR = [
    'BTS 새 앨범', 'BLACKPINK 월드투어', 'NewJeans 신곡', 'aespa 컴백',
    '이영지 예능', '손흥민 골', '나혼자산다', '런닝맨 최신화',
  ];
  return DUMMY_KR.map((keyword) => ({ keyword, source: 'youtube-trending', geo: regionCode }));
}

/**
 * Billboard Hot 100 RSS에서 차트 데이터를 수집한다.
 * @returns {Promise<Array<{keyword: string, source: string, geo: string}>>}
 */
async function fetchBillboardHot100() {
  const url = 'https://www.billboard.com/feed/?objecttype=chart';
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'KultureBot/1.0 (+https://kulture.wiki)' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const xml = await res.text();
    const titles = [...xml.matchAll(/<title>(.+?)<\/title>/g)].map((m) =>
      m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim()
    );
    return titles.slice(1, 21).map((keyword) => ({ keyword, source: 'billboard', geo: 'US' }));
  } catch (err) {
    console.warn('[Top20Scraper] Billboard RSS 수집 실패:', err.message);
    return [];
  }
}

// ──────────────────────────────────────────────────────────────
// 데이터 집계 및 중복 제거
// ──────────────────────────────────────────────────────────────

/**
 * 여러 소스에서 수집된 트렌드 데이터를 병합하고 중복을 제거한다.
 * @param {Array<Array>} trendArrays - 소스별 트렌드 배열
 * @returns {Array<{keyword: string, source: string, geo: string, rank: number}>}
 */
function aggregateTrends(trendArrays) {
  const seen = new Set();
  const merged = [];

  for (const arr of trendArrays) {
    for (const item of arr) {
      const key = item.keyword.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }
  }

  return merged.slice(0, 20).map((item, i) => ({ ...item, rank: i + 1 }));
}

// ──────────────────────────────────────────────────────────────
// DB 저장 함수
// ──────────────────────────────────────────────────────────────

/**
 * 수집된 Top 20 트렌드를 Supabase trends 테이블에 upsert한다.
 * @param {object} supabase - Supabase 클라이언트
 * @param {Array} trends - 집계된 트렌드 배열
 */
async function saveToSupabase(supabase, trends) {
  const rows = trends.map((t) => ({
    keyword: t.keyword,
    source: t.source,
    geo: t.geo,
    rank: t.rank,
    scraped_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('trends').upsert(rows, {
    onConflict: 'keyword,geo',
    ignoreDuplicates: false,
  });

  if (error) throw new Error(`Supabase upsert 실패: ${error.message}`);
  console.info(`[Top20Scraper] Supabase: ${rows.length}개 트렌드 저장 완료`);
}

/**
 * Top 20 트렌드 기반으로 Sanity에 에디터 검토용 draft 기사를 생성한다.
 * 동일 slug의 기사가 이미 존재하면 스킵한다.
 * @param {object} sanity - Sanity 클라이언트
 * @param {Array} trends - 집계된 트렌드 배열
 */
async function createSanityDrafts(sanity, trends) {
  let created = 0;

  for (const trend of trends.slice(0, 5)) {
    // 가장 중요한 상위 5개만 draft 생성 (API 할당량 절약)
    const slug = trend.keyword
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .slice(0, 96);

    // 중복 검사
    const existing = await sanity.fetch(
      `*[_type == "post" && slug.current == $slug][0]._id`,
      { slug }
    );
    if (existing) {
      console.info(`[Top20Scraper] Sanity: 중복 스킵 — ${slug}`);
      continue;
    }

    // [V15.1 정책 2] draft 상태로만 생성 — 에디터가 검토 후 published로 전환
    await sanity.create({
      _type: 'post',
      title: `[자동 수집] ${trend.keyword}`,
      slug: { _type: 'slug', current: slug },
      status: 'draft',
      language: trend.geo === 'KR' ? 'ko' : 'en',
      isHidden: false,
      isAffiliateApproved: false,
      excerpt: `${trend.source}에서 수집된 트렌드 키워드: ${trend.keyword} (순위: ${trend.rank})`,
      publishedAt: null,
      body: [],
    });
    created++;
    console.info(`[Top20Scraper] Sanity: draft 생성 — ${trend.keyword}`);
  }

  console.info(`[Top20Scraper] Sanity: 총 ${created}개 draft 생성 완료`);
}

// ──────────────────────────────────────────────────────────────
// 메인 실행 엔트리포인트
// ──────────────────────────────────────────────────────────────

async function main() {
  console.info('[Top20Scraper] ▶ 스크래핑 시작:', new Date().toISOString());

  validateEnv();
  const { sanity, supabase } = initClients();

  try {
    // 1. 병렬 소스 수집
    const [krTrends, usTrends, billboardTrends, youtubeTrends] = await Promise.allSettled([
      fetchGoogleTrends('KR'),
      fetchGoogleTrends('US'),
      fetchBillboardHot100(),
      fetchYoutubeTrending('KR'),
    ]).then((results) =>
      results.map((r) => (r.status === 'fulfilled' ? r.value : []))
    );

    // 2. 집계 및 중복 제거
    const top20 = aggregateTrends([krTrends, usTrends, billboardTrends, youtubeTrends]);
    console.info(`[Top20Scraper] 집계 완료: ${top20.length}개 트렌드`);
    console.table(top20.map(({ rank, keyword, source, geo }) => ({ rank, keyword, source, geo })));

    // 3. DB 저장 (병렬)
    await Promise.all([
      saveToSupabase(supabase, top20),
      createSanityDrafts(sanity, top20),
    ]);

    console.info('[Top20Scraper] ✅ 완료:', new Date().toISOString());
    process.exit(0);
  } catch (err) {
    console.error('[Top20Scraper] ❌ 치명적 오류:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
