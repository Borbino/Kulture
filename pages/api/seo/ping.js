/**
 * pages/api/seo/ping.js — Phase 12 · 실시간 색인 핑 엔드포인트
 *
 * POST /api/seo/ping
 *   – Sanity webhook 또는 직접 호출로 새 기사 URL을 받아
 *     Google Indexing API + Bing IndexNow 에 즉시 색인 요청을 보냅니다.
 *
 * GET /api/seo/ping
 *   – 헬스체크. 항상 200 + { status: 'ok' } 반환.
 *
 * 환경변수:
 *   GOOGLE_INDEXING_API_KEY   — Google Indexing API 키 (서비스 계정 키 기반)
 *   BING_INDEXNOW_KEY         — Bing IndexNow 전용 키 (없으면 GOOGLE_INDEXING_API_KEY 사용)
 *   SANITY_WEBHOOK_SECRET     — Sanity webhook 서명 검증용 시크릿 (선택)
 *   NEXT_PUBLIC_SITE_URL      — 사이트 기본 URL
 */

const GOOGLE_INDEXING_ENDPOINT =
  'https://indexing.googleapis.com/v3/urlNotifications:publish';
const BING_INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kulture.wiki';

// ── Google Indexing API 핑 ────────────────────────────────────────────────
async function pingGoogle(articleUrl, action) {
  const apiKey = process.env.GOOGLE_INDEXING_API_KEY;
  if (!apiKey) {
    console.warn('[SEO/ping] GOOGLE_INDEXING_API_KEY not set — skipping Google ping');
    return { skipped: true, reason: 'no_api_key' };
  }

  const endpoint = `${GOOGLE_INDEXING_ENDPOINT}?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: articleUrl,
      type: action === 'URL_DELETED' ? 'URL_DELETED' : 'URL_UPDATED',
    }),
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

// ── Bing IndexNow 핑 ─────────────────────────────────────────────────────
async function pingBing(articleUrl) {
  const key =
    process.env.BING_INDEXNOW_KEY || process.env.GOOGLE_INDEXING_API_KEY;
  if (!key) {
    console.warn('[SEO/ping] No IndexNow key found — skipping Bing ping');
    return { skipped: true, reason: 'no_api_key' };
  }

  const hostname = new URL(SITE_URL).hostname;
  const keyLocation = `${SITE_URL}/${key}.txt`;

  const res = await fetch(BING_INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: hostname,
      key,
      keyLocation,
      urlList: [articleUrl],
    }),
  });

  return { status: res.status, ok: res.ok };
}

// ── 메인 핸들러 ──────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS 허용 (Sanity 웹훅 다이렉트 호출 대응)
  res.setHeader('Access-Control-Allow-Origin', SITE_URL);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-sanity-webhook-secret');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // ── GET: 헬스체크 ──
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', service: 'seo-ping' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ── Sanity 웹훅 시크릿 검증 (환경변수 설정 시에만 강제) ──
  const webhookSecret = process.env.SANITY_WEBHOOK_SECRET;
  if (webhookSecret) {
    const incoming = req.headers['x-sanity-webhook-secret'];
    if (incoming !== webhookSecret) {
      return res.status(401).json({ error: 'Unauthorized: invalid webhook secret' });
    }
  }

  // ── 바디 파싱 ──
  const { slug, url, action = 'URL_UPDATED' } = req.body ?? {};

  if (!slug && !url) {
    return res.status(400).json({ error: 'slug 또는 url 파라미터가 필요합니다.' });
  }

  // 인코딩된 URL 금지 — 직접 입력 슬러그도 안전한 경로만 허용
  const safeSlug = slug ? String(slug).replace(/[^a-z0-9-_/]/gi, '') : null;
  const articleUrl = url
    ? String(url)
    : `${SITE_URL}/posts/${safeSlug}`;

  // 자사 도메인만 핑 허용 (SSRF 방어)
  try {
    const parsed = new URL(articleUrl);
    const allowedHost = new URL(SITE_URL).hostname;
    if (parsed.hostname !== allowedHost) {
      return res.status(400).json({ error: '외부 도메인 URL은 허용되지 않습니다.' });
    }
  } catch {
    return res.status(400).json({ error: '유효하지 않은 URL입니다.' });
  }

  // ── 핑 실행 ──
  const [googleResult, bingResult] = await Promise.allSettled([
    pingGoogle(articleUrl, action),
    pingBing(articleUrl),
  ]);

  const results = {
    google: googleResult.status === 'fulfilled' ? googleResult.value : { error: googleResult.reason?.message },
    bing:   bingResult.status  === 'fulfilled'  ? bingResult.value  : { error: bingResult.reason?.message },
  };

  const allOk =
    (results.google.ok || results.google.skipped) &&
    (results.bing.ok   || results.bing.skipped);

  console.info('[SEO/ping]', articleUrl, JSON.stringify(results));

  return res.status(allOk ? 200 : 207).json({
    pinged: articleUrl,
    action,
    results,
  });
}
