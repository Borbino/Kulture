/**
 * AI Model Catalog Crawler v1.0
 * Kulture Platform
 *
 * ─────────────────────────────────────────────────────────────────
 * [역할]
 *   AI 회사들의 공식 블로그/피드/API를 24시간 주기로 크롤링하여
 *   신규 모델 출시 여부를 감지하고, aiModelManager의 PROVIDER_REGISTRY에
 *   자동으로 prependModelToCatalog()를 통해 삽입합니다.
 *   관리자 개입 없이 완전 자율 운영됩니다.
 *
 * [지원 소스]
 *   - Google AI 블로그 RSS
 *   - Anthropic 뉴스 RSS
 *   - OpenAI 뉴스 페이지 HTML 파싱
 *   - Groq 공식 API 모델 목록
 *   - Hugging Face 인기 모델 API
 *   - OpenRouter 공개 모델 API
 *
 * [주기]
 *   CRAWL_INTERVAL_MS (기본 24시간)
 *   감지된 모델은 /tmp/kulture_new_models.json에 상태 기록
 * ─────────────────────────────────────────────────────────────────
 */

import { prependModelToCatalog } from './aiModelManager.js';
import logger from './logger.js';
import fs from 'fs';

const CRAWL_INTERVAL_MS = 24 * 60 * 60 * 1000;
const STATE_FILE = '/tmp/kulture_ai_model_catalog.json';

// ══════════════════════════════════════════════════════════════
// 모델명 패턴 파서
// ══════════════════════════════════════════════════════════════

const MODEL_PATTERNS = {
  google: [
    /gemini[-\s](\d+[.\d]*[-\s]?(?:flash|pro|ultra)?(?:[-\s]?exp)?(?:[-\s]?\d{3,})?)/gi,
  ],
  anthropic: [
    /claude[-\s](\d[.\d]*[-\s]?(?:opus|sonnet|haiku)?(?:[-\s]?\d{8})?)/gi,
  ],
  openai: [
    /gpt[-\s](\d[.\d]*(?:[-\s]?(?:turbo|mini|nano|o|preview))?(?:[-\s]?\d{4})?)/gi,
    /o(\d)(?:[-\s]?(?:mini|preview))?/gi,
  ],
  groq: null,
  huggingface: null,
  openrouter: null,
};

function normalizeModelId(raw, _providerId) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-.:/]/g, '');
}

// ══════════════════════════════════════════════════════════════
// 상태 저장/로드
// ══════════════════════════════════════════════════════════════

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch {
    // 무시
  }
  return { knownModels: {}, lastCrawlAt: null };
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    logger.warn('[AIModelCrawler]', '상태 저장 실패', err.message);
  }
}

// ══════════════════════════════════════════════════════════════
// 크롤러 — 제공자별
// ══════════════════════════════════════════════════════════════

async function fetchSafe(url, options = {}) {
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KultureBot/1.0; +https://kulture.wiki)',
        ...(options.headers || {}),
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp;
  } catch (err) {
    throw new Error(`fetchSafe(${url}): ${err.message}`);
  }
}

async function crawlGroq() {
  const key = process.env.GROQ_API_KEY;
  if (!key) return [];
  try {
    const resp = await fetchSafe('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
    });
    const data = await resp.json();
    return (data.data || [])
      .filter(m => m.id && m.active !== false)
      .map(m => ({
        providerId: 'groq',
        modelId: m.id,
        isFreeTier: true,
        rpm: m.rate_limit?.requests_per_minute || 30,
        detectedAt: new Date().toISOString(),
      }));
  } catch (err) {
    logger.warn('[AIModelCrawler]', `Groq 크롤링 실패: ${err.message}`);
    return [];
  }
}

async function crawlOpenRouter() {
  try {
    const resp = await fetchSafe('https://openrouter.ai/api/v1/models');
    const data = await resp.json();
    const freeModels = (data.data || [])
      .filter(m => m.id && (m.id.endsWith(':free') || m.pricing?.prompt === '0'))
      .map(m => ({
        providerId: 'openrouter',
        modelId: m.id,
        isFreeTier: true,
        contextLength: m.context_length || 8192,
        detectedAt: new Date().toISOString(),
      }));
    return freeModels;
  } catch (err) {
    logger.warn('[AIModelCrawler]', `OpenRouter 크롤링 실패: ${err.message}`);
    return [];
  }
}

async function crawlHuggingFace() {
  try {
    const resp = await fetchSafe(
      'https://huggingface.co/api/models?sort=trending&limit=20&pipeline_tag=text-generation'
    );
    const data = await resp.json();
    return data
      .filter(m => m.modelId && m.gated === false)
      .map(m => ({
        providerId: 'huggingface',
        modelId: m.modelId,
        isFreeTier: true,
        downloads: m.downloads || 0,
        detectedAt: new Date().toISOString(),
      }));
  } catch (err) {
    logger.warn('[AIModelCrawler]', `HuggingFace 크롤링 실패: ${err.message}`);
    return [];
  }
}

/**
 * RSS/블로그 텍스트에서 모델명 추출 (구글, Anthropic, OpenAI용)
 */
async function crawlBlogRSS(url, providerId) {
  try {
    const resp = await fetchSafe(url);
    const text = await resp.text();
    const patterns = MODEL_PATTERNS[providerId];
    if (!patterns) return [];

    const found = new Set();
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        found.add(normalizeModelId(`${providerId}-${match[0]}`, providerId));
      }
    }
    return [...found].map(modelId => ({
      providerId,
      modelId,
      isFreeTier: true,
      source: 'blog',
      detectedAt: new Date().toISOString(),
    }));
  } catch (err) {
    logger.warn('[AIModelCrawler]', `블로그 크롤링 실패 (${providerId}): ${err.message}`);
    return [];
  }
}

// ══════════════════════════════════════════════════════════════
// 메인 크롤 루프
// ══════════════════════════════════════════════════════════════

async function runCrawl() {
  const state = loadState();
  if (!state.knownModels) state.knownModels = {};

  logger.info('[AIModelCrawler]', '모델 카탈로그 크롤링 시작');
  let newCount = 0;

  const sources = [
    crawlGroq(),
    crawlOpenRouter(),
    crawlHuggingFace(),
    crawlBlogRSS('https://blog.google/technology/ai/', 'google'),
    crawlBlogRSS('https://www.anthropic.com/news', 'anthropic'),
    crawlBlogRSS('https://openai.com/news/', 'openai'),
  ];

  const results = await Promise.allSettled(sources);
  const allModels = results.flatMap(r => r.value || []);

  for (const model of allModels) {
    const key = `${model.providerId}:${model.modelId}`;
    if (state.knownModels[key]) continue;

    const inserted = prependModelToCatalog(model.providerId, {
      id: model.modelId,
      isFreeTier: model.isFreeTier ?? true,
      rpm: model.rpm,
      contextLength: model.contextLength,
    });

    if (inserted) {
      state.knownModels[key] = {
        addedAt: model.detectedAt,
        source: model.source || 'api',
      };
      newCount++;
      logger.info('[AIModelCrawler]', `신규 모델 등록: ${model.providerId}/${model.modelId}`);
    } else {
      // 이미 등록됨 — known으로 표시
      state.knownModels[key] = state.knownModels[key] || { addedAt: model.detectedAt, existing: true };
    }
  }

  state.lastCrawlAt = new Date().toISOString();
  saveState(state);
  logger.info('[AIModelCrawler]', `크롤링 완료: ${newCount}개 신규 모델 추가됨`);
  return { newCount, totalKnown: Object.keys(state.knownModels).length };
}

// ══════════════════════════════════════════════════════════════
// 스케줄러 (싱글톤)
// ══════════════════════════════════════════════════════════════

let crawlerTimer = null;

export function startModelCrawler() {
  if (crawlerTimer) return;
  runCrawl().catch(err => logger.error('[AIModelCrawler]', '초기 크롤링 오류', err.message));
  crawlerTimer = setInterval(() => {
    runCrawl().catch(err => logger.error('[AIModelCrawler]', '주기 크롤링 오류', err.message));
  }, CRAWL_INTERVAL_MS);
  logger.info('[AIModelCrawler]', `스케줄러 시작 (주기: ${CRAWL_INTERVAL_MS / 3600000}시간)`);
}

export function stopModelCrawler() {
  if (crawlerTimer) {
    clearInterval(crawlerTimer);
    crawlerTimer = null;
    logger.info('[AIModelCrawler]', '스케줄러 중지');
  }
}

export async function crawlNow() {
  return runCrawl();
}

export function getCrawlerStatus() {
  const state = loadState();
  return {
    isRunning: !!crawlerTimer,
    lastCrawlAt: state.lastCrawlAt,
    knownModelsCount: Object.keys(state.knownModels || {}).length,
    intervalHours: CRAWL_INTERVAL_MS / 3600000,
  };
}
