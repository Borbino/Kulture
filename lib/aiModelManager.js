/**
 * AI Model Manager — Graceful Degradation Engine v2.0
 * Kulture Platform
 *
 * ─────────────────────────────────────────────────────────────────
 * [핵심 철학]
 *   특정 AI 모델명을 코드에 박지 않습니다.
 *   각 회사(Google, Anthropic, OpenAI, Groq 등)의 모델을
 *   "최신·최고 성능 → 한 단계 낮춤 → 그 다음 낮춤" 순서로
 *   자동으로 시도하여 항상 사용 가능한 최선을 선택합니다.
 *
 * [동작 원리]
 *   1. 각 제공자(provider)는 ranked model catalog를 가집니다.
 *      예) Anthropic: [claude-opus-4.5, claude-3-7-sonnet, ...]
 *   2. 매 호출 시, 카탈로그 1번 모델부터 순서대로 시도합니다.
 *   3. 모델이 "모델 없음(404)" 오류 → 다음 버전으로 자동 하향
 *   4. 모델이 "요금 부족(402/429)" → 무료 버전이 있으면 시도
 *   5. 성공한 모델을 캐시하여 다음 요청 때 빠르게 재사용
 *   6. 백그라운드 크롤러(aiModelCrawler.js)가 신모델 발견 시
 *      prependModelToCatalog()로 카탈로그 앞에 자동 삽입
 *
 * [새 제공자 추가]
 *   PROVIDER_REGISTRY 배열에 항목 추가 → 자동 편입
 * ─────────────────────────────────────────────────────────────────
 */

import logger from './logger.js';

// ══════════════════════════════════════════════════════════════
// 제공자별 모델 카탈로그
// 배열 순서 = 시도 우선순위 (index 0 = 최신·최고 성능)
// isFreeTier: true → 무료 사용 가능 / false → 유료 전용
// ══════════════════════════════════════════════════════════════

const PROVIDER_REGISTRY = [

  // ── Google Gemini ────────────────────────────────────────────
  {
    providerId: 'google',
    name: 'Google Gemini',
    envKey: 'GOOGLE_GEMINI_API_KEY',
    priority: 1,
    models: [
      { id: 'gemini-2.0-flash-exp', isFreeTier: true,  rpm: 10, rpd: 1500 },
      { id: 'gemini-2.0-flash',     isFreeTier: true,  rpm: 15, rpd: 1500 },
      { id: 'gemini-1.5-flash',     isFreeTier: true,  rpm: 15, rpd: 1500 },
      { id: 'gemini-1.5-pro',       isFreeTier: true,  rpm: 2,  rpd: 50   },
      { id: 'gemini-pro',           isFreeTier: true,  rpm: 2,  rpd: 50   },
    ],
    call: async (modelId, prompt, options = {}) => {
      const key = process.env.GOOGLE_GEMINI_API_KEY;
      if (!key) throw new Error('No Gemini key');
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({
        model: modelId,
        generationConfig: { maxOutputTokens: options.maxTokens || 1500 },
      });
      const result = await model.generateContent(prompt);
      return result.response.text();
    },
  },

  // ── Groq (극속 LPU 추론, 무료 티어) ────────────────────────
  {
    providerId: 'groq',
    name: 'Groq',
    envKey: 'GROQ_API_KEY',
    priority: 2,
    models: [
      { id: 'llama-3.3-70b-versatile', isFreeTier: true, rpm: 30, rpd: 14400 },
      { id: 'llama-3.1-70b-versatile', isFreeTier: true, rpm: 30, rpd: 14400 },
      { id: 'llama-3.1-8b-instant',    isFreeTier: true, rpm: 30, rpd: 14400 },
      { id: 'mixtral-8x7b-32768',      isFreeTier: true, rpm: 30, rpd: 14400 },
      { id: 'gemma2-9b-it',            isFreeTier: true, rpm: 30, rpd: 14400 },
    ],
    call: async (modelId, prompt, options = {}) => {
      const key = process.env.GROQ_API_KEY;
      if (!key) throw new Error('No Groq key');
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options.maxTokens || 1500,
          temperature: 0.75,
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (!resp.ok) throw new Error(`Groq ${resp.status}`);
      const data = await resp.json();
      return data.choices?.[0]?.message?.content || '';
    },
  },

  // ── Anthropic Claude (최신 → 점진적 하향) ───────────────────
  {
    providerId: 'anthropic',
    name: 'Anthropic Claude',
    envKey: 'ANTHROPIC_API_KEY',
    priority: 3,
    models: [
      { id: 'claude-opus-4-5',              isFreeTier: false, costPer1k: 0.015 },
      { id: 'claude-3-7-sonnet-20250219',   isFreeTier: false, costPer1k: 0.003 },
      { id: 'claude-3-5-haiku-20241022',    isFreeTier: false, costPer1k: 0.0008 },
      { id: 'claude-3-haiku-20240307',      isFreeTier: false, costPer1k: 0.00025 },
    ],
    call: async (modelId, prompt, options = {}) => {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) throw new Error('No Anthropic key');
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId,
          max_tokens: options.maxTokens || 1500,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (!resp.ok) throw new Error(`Anthropic ${resp.status}`);
      const data = await resp.json();
      return data.content?.[0]?.text || '';
    },
  },

  // ── OpenRouter (다중 무료 모델 게이트웨이) ──────────────────
  {
    providerId: 'openrouter',
    name: 'OpenRouter',
    envKey: 'OPENROUTER_API_KEY',
    priority: 4,
    models: [
      { id: 'meta-llama/llama-3.3-70b-instruct:free', isFreeTier: true },
      { id: 'meta-llama/llama-3.1-70b-instruct:free', isFreeTier: true },
      { id: 'google/gemma-2-27b-it:free',              isFreeTier: true },
      { id: 'google/gemma-2-9b-it:free',               isFreeTier: true },
      { id: 'mistralai/mistral-7b-instruct:free',      isFreeTier: true },
      { id: 'qwen/qwen-2.5-72b-instruct:free',         isFreeTier: true },
    ],
    call: async (modelId, prompt, options = {}) => {
      const key = process.env.OPENROUTER_API_KEY;
      if (!key) throw new Error('No OpenRouter key');
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://kulture.wiki',
          'X-Title': 'Kulture',
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options.maxTokens || 1500,
          temperature: 0.75,
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (!resp.ok) throw new Error(`OpenRouter ${resp.status}`);
      const data = await resp.json();
      if (data.error) throw new Error(`OpenRouter: ${data.error.message}`);
      return data.choices?.[0]?.message?.content || '';
    },
  },

  // ── Hugging Face Inference API ──────────────────────────────
  {
    providerId: 'huggingface',
    name: 'Hugging Face',
    envKey: 'HUGGINGFACE_API_TOKEN',
    priority: 5,
    models: [
      { id: 'mistralai/Mistral-7B-Instruct-v0.3', isFreeTier: true },
      { id: 'microsoft/Phi-3-mini-4k-instruct',   isFreeTier: true },
      { id: 'HuggingFaceH4/zephyr-7b-beta',       isFreeTier: true },
      { id: 'tiiuae/falcon-7b-instruct',           isFreeTier: true },
    ],
    call: async (modelId, prompt, options = {}) => {
      const token = process.env.HUGGINGFACE_API_TOKEN;
      if (!token) throw new Error('No HF token');
      const resp = await fetch(
        `https://api-inference.huggingface.co/models/${modelId}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inputs: prompt,
            parameters: { max_new_tokens: options.maxTokens || 1200, temperature: 0.7 },
          }),
          signal: AbortSignal.timeout(45000),
        }
      );
      if (resp.status === 503) throw new Error('HF model loading (503)');
      if (!resp.ok) throw new Error(`HF ${resp.status}`);
      const data = await resp.json();
      return Array.isArray(data) ? (data[0]?.generated_text || '') : (data.generated_text || '');
    },
  },

  // ── Cohere ──────────────────────────────────────────────────
  {
    providerId: 'cohere',
    name: 'Cohere',
    envKey: 'COHERE_API_KEY',
    priority: 6,
    models: [
      { id: 'command-r-plus', isFreeTier: true, rpm: 5, rpd: 1000 },
      { id: 'command-r',      isFreeTier: true, rpm: 5, rpd: 1000 },
      { id: 'command',        isFreeTier: true, rpm: 5, rpd: 1000 },
    ],
    call: async (modelId, prompt) => {
      const key = process.env.COHERE_API_KEY;
      if (!key) throw new Error('No Cohere key');
      const resp = await fetch('https://api.cohere.com/v2/chat', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelId, messages: [{ role: 'user', content: prompt }] }),
        signal: AbortSignal.timeout(30000),
      });
      if (!resp.ok) throw new Error(`Cohere ${resp.status}`);
      const data = await resp.json();
      return data.message?.content?.[0]?.text || '';
    },
  },

  // ── OpenAI (최후 수단 — 유료지만 가장 안정적) ───────────────
  {
    providerId: 'openai',
    name: 'OpenAI',
    envKey: 'OPENAI_API_KEY',
    priority: 7,
    models: [
      { id: 'gpt-4.1',       isFreeTier: false, costPer1k: 0.002  },
      { id: 'gpt-4o',        isFreeTier: false, costPer1k: 0.005  },
      { id: 'gpt-4o-mini',   isFreeTier: false, costPer1k: 0.00015 },
      { id: 'gpt-3.5-turbo', isFreeTier: false, costPer1k: 0.0005  },
    ],
    call: async (modelId, prompt, options = {}) => {
      const key = process.env.OPENAI_API_KEY;
      if (!key) throw new Error('No OpenAI key');
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI({ apiKey: key });
      const completion = await client.chat.completions.create({
        model: modelId,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 1500,
        temperature: 0.7,
      });
      return completion.choices[0]?.message?.content || '';
    },
  },
];

// ══════════════════════════════════════════════════════════════
// 런타임 상태 (모델별 성공/실패 캐시 + 쿨다운)
// ══════════════════════════════════════════════════════════════

const workingModelCache = {};
const CACHE_TTL_MS = 30 * 60 * 1000;
const cooldownMap = {};
const callStats = { total: 0, success: 0, fail: 0, byProvider: {} };

function isInCooldown(providerId, modelId) {
  const until = cooldownMap[`${providerId}:${modelId}`];
  return !!(until && Date.now() < until);
}

function setCooldown(providerId, modelId, durationMs = 3 * 60 * 1000) {
  cooldownMap[`${providerId}:${modelId}`] = Date.now() + durationMs;
}

function isModelNotFound(msg) {
  const m = msg.toLowerCase();
  return m.includes('404') || m.includes('not found') ||
         m.includes('does not exist') || m.includes('invalid model') ||
         m.includes('model_not_found') || m.includes('no such model');
}

function isRateLimitOrQuota(msg) {
  const m = msg.toLowerCase();
  return m.includes('429') || m.includes('rate_limit') ||
         m.includes('quota') || m.includes('insufficient_quota') ||
         m.includes('too many requests');
}

// ══════════════════════════════════════════════════════════════
// 핵심 함수: 동적 모델 선택 + 점진적 하향
// ══════════════════════════════════════════════════════════════

/**
 * 현재 최선의 무료 AI 모델로 텍스트 생성
 * 최신 모델 → 실패 시 자동으로 한 단계 낮춰 재시도
 *
 * @param {string} prompt
 * @param {object} options - { preferFree, maxTokens, maxRetries }
 */
export async function generateWithBestModel(prompt, options = {}) {
  const { preferFree = true, maxRetries = 1 } = options;

  const activeProviders = PROVIDER_REGISTRY
    .filter(p => process.env[p.envKey])
    .sort((a, b) => a.priority - b.priority);

  if (activeProviders.length === 0) {
    throw new Error('[AIModelManager] 설정된 API 키가 없습니다.');
  }

  callStats.total++;
  const errors = [];

  for (const provider of activeProviders) {
    const cached = workingModelCache[provider.providerId];
    const startIndex = (cached && Date.now() < cached.until) ? cached.index : 0;

    const candidates = provider.models
      .map((m, i) => ({ ...m, originalIndex: i }))
      .filter(m => !preferFree || m.isFreeTier);

    const toTry = [
      ...candidates.filter(m => m.originalIndex >= startIndex),
      ...candidates.filter(m => m.originalIndex < startIndex),
    ];

    for (const modelMeta of toTry) {
      const modelId = modelMeta.id;
      if (isInCooldown(provider.providerId, modelId)) continue;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const startTime = Date.now();
        try {
          const text = await provider.call(modelId, prompt, options);
          if (!text || text.trim().length < 5) throw new Error('빈 응답');

          const latencyMs = Date.now() - startTime;
          workingModelCache[provider.providerId] = {
            index: modelMeta.originalIndex,
            until: Date.now() + CACHE_TTL_MS,
          };
          callStats.success++;
          callStats.byProvider[provider.providerId] =
            (callStats.byProvider[provider.providerId] || 0) + 1;

          logger.info('[AIModelManager]', `✅ ${provider.name}/${modelId} (${latencyMs}ms)`);
          return {
            text,
            model: modelId,
            modelId,
            provider: provider.providerId,
            providerName: provider.name,
            cost: modelMeta.costPer1k || 0,
            latencyMs,
            isFreeTier: modelMeta.isFreeTier,
          };
        } catch (err) {
          const msg = err.message || '';
          errors.push(`${provider.name}/${modelId}: ${msg}`);

          if (isModelNotFound(msg)) {
            logger.warn('[AIModelManager]', `모델 없음 → 하향: ${modelId}`);
            setCooldown(provider.providerId, modelId, 24 * 60 * 60 * 1000);
            break;
          } else if (isRateLimitOrQuota(msg)) {
            logger.warn('[AIModelManager]', `레이트 리밋 → 3분 쿨다운: ${modelId}`);
            setCooldown(provider.providerId, modelId, 3 * 60 * 1000);
            break;
          } else if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          }
        }
      }
    }
  }

  if (preferFree) {
    logger.warn('[AIModelManager]', '무료 제공자 모두 실패 → 유료 시도');
    return generateWithBestModel(prompt, { ...options, preferFree: false });
  }

  callStats.fail++;
  throw new Error(`[AIModelManager] 모든 AI 실패.\n${errors.slice(-5).join('\n')}`);
}

// ══════════════════════════════════════════════════════════════
// 유틸리티 함수들
// ══════════════════════════════════════════════════════════════

export function getModelStatus() {
  return {
    providers: PROVIDER_REGISTRY.map(p => ({
      id: p.providerId,
      name: p.name,
      available: !!process.env[p.envKey],
      priority: p.priority,
      models: p.models.map(m => ({
        id: m.id,
        isFreeTier: m.isFreeTier,
        inCooldown: isInCooldown(p.providerId, m.id),
        cooldownRemainingSec: (() => {
          const until = cooldownMap[`${p.providerId}:${m.id}`];
          return until && Date.now() < until ? Math.round((until - Date.now()) / 1000) : 0;
        })(),
      })),
      currentBestModelIndex: workingModelCache[p.providerId]?.index ?? 0,
    })),
    stats: {
      totalCalls: callStats.total,
      successfulCalls: callStats.success,
      failedCalls: callStats.fail,
      byProvider: callStats.byProvider,
    },
    currentBestModel: (() => {
      const best = PROVIDER_REGISTRY
        .filter(p => process.env[p.envKey])
        .sort((a, b) => a.priority - b.priority)[0];
      if (!best) return null;
      const idx = workingModelCache[best.providerId]?.index ?? 0;
      return `${best.name}/${best.models[idx]?.id}`;
    })(),
    lastUpdated: new Date().toISOString(),
  };
}

export function resetCooldown(providerId, modelId) {
  if (modelId) {
    delete cooldownMap[`${providerId}:${modelId}`];
  } else {
    for (const key of Object.keys(cooldownMap)) {
      if (key.startsWith(`${providerId}:`)) delete cooldownMap[key];
    }
    delete workingModelCache[providerId];
  }
  logger.info('[AIModelManager]', `쿨다운 초기화: ${providerId}${modelId ? `/${modelId}` : ''}`);
  return true;
}

export function getRecommendedProvider(task) {
  const preferMap = {
    fast:         ['groq', 'google'],
    quality:      ['anthropic', 'openai', 'google'],
    free:         ['google', 'groq', 'openrouter', 'huggingface'],
    multilingual: ['google', 'openai', 'anthropic'],
    translate:    ['google', 'openai', 'anthropic'],
  };
  const preferred = preferMap[task] || preferMap.free;
  return PROVIDER_REGISTRY
    .filter(p => process.env[p.envKey])
    .sort((a, b) => {
      const ai = preferred.indexOf(a.providerId);
      const bi = preferred.indexOf(b.providerId);
      if (ai === -1 && bi === -1) return a.priority - b.priority;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    })[0] || null;
}

/**
 * 크롤러에서 신규 모델 발견 시 카탈로그 최상위에 삽입
 */
export function prependModelToCatalog(providerId, modelMeta) {
  const provider = PROVIDER_REGISTRY.find(p => p.providerId === providerId);
  if (!provider) return false;
  if (provider.models.some(m => m.id === modelMeta.id)) return false;
  provider.models.unshift(modelMeta);
  delete workingModelCache[providerId];
  logger.info('[AIModelManager]', `신규 모델 카탈로그 추가: ${providerId}/${modelMeta.id}`);
  return true;
}

logger.info('[AIModelManager]', '동적 AI 선택 엔진 v2.0 초기화', {
  totalProviders: PROVIDER_REGISTRY.length,
  configuredProviders: PROVIDER_REGISTRY.filter(p => process.env[p.envKey]).length,
});
