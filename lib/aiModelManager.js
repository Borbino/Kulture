/**
 * AI Model Manager — Dynamic Discovery Engine v3.0
 * Kulture Platform
 *
 * ─────────────────────────────────────────────────────────────────
 * [핵심 철학 — v3.0 완전 개편]
 *   모델명을 코드에 하드코딩하지 않습니다.
 *
 *   gemini-11-flash 같은 미래 모델이 나와도 자동으로 발견됩니다.
 *
 *   동작 방식:
 *     1. AI를 호출하기 전, 각 제공자의 /models API를 실시간 조회
 *        → 현재 존재하는 모든 모델 목록을 가져옴
 *     2. 버전/크기/품질 키워드로 모델 성능 점수 자동 계산
 *     3. 점수 높은 순(최신·최고) → 낮은 순으로 자동 시도
 *     4. 실패하면 한 단계 낮춰 재시도 (Graceful Degradation)
 *     5. 성공 모델 30분 캐시 / 모델 목록 1시간 캐시
 *
 * [제공자별 발견 API]
 *   Google   : GET /v1beta/models (공개 API, 키 필요)
 *   Groq     : GET /openai/v1/models (키 필요)
 *   OpenRouter: GET /api/v1/models (무료 모델 자동 필터)
 *   Anthropic: OpenRouter를 통해 anthropic/* 모델 발견 후 직접 호출
 *   Cohere   : GET /v1/models (키 필요)
 *   HuggingFace: GET /api/models (트렌딩 텍스트 생성 모델)
 *   OpenAI   : GET /v1/models (키 필요)
 * ─────────────────────────────────────────────────────────────────
 */

import { logger } from './logger.js';

// ══════════════════════════════════════════════════════════════
// 모델 능력 점수 계산기
// 이름과 메타데이터만으로 "이 모델이 얼마나 강력한가" 추정
// 하드코딩된 순위 없음 — gemini-11, claude-5 같은 미래 모델도 자동 처리
// ══════════════════════════════════════════════════════════════

function scoreModelCapability(modelId, meta = {}) {
  const id = (modelId || '').toLowerCase();
  let score = 0;

  // 1. 버전 번호 추출 (2.0 > 1.5 > 1.0, 3.7 > 3.5 등)
  for (const m of id.matchAll(/(\d+)[._-](\d+)/g)) {
    score = Math.max(score, parseFloat(`${m[1]}.${m[2]}`) * 10);
  }
  // 단독 정수 버전 (claude-4, gemini-3 등 미래 모델 대비)
  const singleVer = id.match(/(?:[-_v])(\d{1,2})(?:[-_]|$)/);
  if (singleVer) score = Math.max(score, parseInt(singleVer[1]) * 8);

  // 2. 모델 크기 파라미터 (70B > 13B > 7B 등)
  const sizeM = id.match(/(\d+(?:\.\d+)?)[x-]?b\b/i);
  if (sizeM) score += Math.min(Math.log2(parseFloat(sizeM[1]) + 1) * 4, 28);

  // 3. 품질 계층 키워드 — 첫 번째 매칭만 적용
  const tierMap = [
    ['ultra', 35], ['max', 32], ['opus', 28], ['large', 22],
    ['pro', 18], ['plus', 15], ['sonnet', 12], ['standard', 8],
    ['flash', 6], ['haiku', 5], ['lite', 3],
    ['mini', -3], ['nano', -8], ['tiny', -12],
  ];
  for (const [kw, pts] of tierMap) {
    if (id.includes(kw)) { score += pts; break; }
  }

  // 4. 실험/최신 빌드 가산점
  if (id.includes('-exp') || id.includes('experimental')) score += 6;
  if (id.includes('preview')) score += 4;

  // 5. 날짜 접미사 (최신 날짜일수록 +점수)
  const dateM = id.match(/20(\d{2})\d{4}/);
  if (dateM) score += (parseInt(dateM[1]) - 22) * 5; // 2025→15, 2026→20 등

  // 6. 컨텍스트 창 크기 보너스
  const ctx = meta.contextLength || 0;
  if (ctx >= 1000000) score += 12;
  else if (ctx >= 200000) score += 8;
  else if (ctx >= 100000) score += 5;
  else if (ctx >= 32000) score += 2;

  // 7. 인기도 보너스 (HuggingFace 등)
  if (meta.downloads > 1000000) score += 15;
  else if (meta.downloads > 100000) score += 10;
  else if (meta.downloads > 10000) score += 5;

  // 8. 무료 보너스 (비용 효율)
  if (meta.isFreeTier) score += 20;

  return Math.round(score);
}

// ══════════════════════════════════════════════════════════════
// 런타임 상태
// ══════════════════════════════════════════════════════════════

const discoveryCache = {};       // { [providerId]: { models: ScoredModel[], cachedAt: ms } }
const DISCOVERY_TTL_MS  = 60 * 60 * 1000;  // 1시간

const workingModelCache = {};    // { [providerId]: { modelId, until } }
const WORKING_TTL_MS    = 30 * 60 * 1000;  // 30분 (성공한 모델 재사용)

const cooldownMap  = {};         // "provider:modelId" → until_ms
const callStats = { total: 0, success: 0, fail: 0, byProvider: {} };

function getCachedDiscovery(providerId) {
  const e = discoveryCache[providerId];
  return (e && Date.now() - e.cachedAt < DISCOVERY_TTL_MS) ? e.models : null;
}

function setCachedDiscovery(providerId, models) {
  discoveryCache[providerId] = { models, cachedAt: Date.now() };
}

function isInCooldown(pId, mId) {
  const until = cooldownMap[`${pId}:${mId}`];
  return !!(until && Date.now() < until);
}

function setCooldown(pId, mId, ms = 3 * 60 * 1000) {
  cooldownMap[`${pId}:${mId}`] = Date.now() + ms;
}

function isModelNotFound(msg) {
  const m = (msg || '').toLowerCase();
  return m.includes('404') || m.includes('not found') ||
         m.includes('does not exist') || m.includes('invalid model') ||
         m.includes('model_not_found') || m.includes('no such model');
}

function isRateLimitOrQuota(msg) {
  const m = (msg || '').toLowerCase();
  return m.includes('429') || m.includes('rate_limit') ||
         m.includes('quota') || m.includes('insufficient_quota') ||
         m.includes('too many requests');
}

// ══════════════════════════════════════════════════════════════
// 제공자 레지스트리
// ★ 모델 목록을 하드코딩하지 않음
// ★ discover()가 제공자 API에서 실시간으로 가져옴
// ══════════════════════════════════════════════════════════════

const PROVIDER_REGISTRY = [

  // ── Google Gemini ─────────────────────────────────────────────────────────
  {
    providerId: 'google',
    name: 'Google Gemini',
    envKey: 'GOOGLE_GEMINI_API_KEY',
    priority: 1,

    async discover() {
      const key = process.env.GOOGLE_GEMINI_API_KEY;
      if (!key) return [];
      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}&pageSize=100`,
          { signal: AbortSignal.timeout(10000) }
        );
        if (!resp.ok) return [];
        const data = await resp.json();
        return (data.models || [])
          .filter(m =>
            m.supportedGenerationMethods?.includes('generateContent') &&
            !m.name.includes('embedding') &&
            !m.name.includes('vision-only') &&
            !m.name.includes('aqa')
          )
          .map(m => ({
            id: m.name.replace('models/', ''),
            isFreeTier: true,
            contextLength: m.inputTokenLimit || 0,
          }));
      } catch {
        return [];
      }
    },

    async call(modelId, prompt, options = {}) {
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

  // ── Groq ──────────────────────────────────────────────────────────────────
  {
    providerId: 'groq',
    name: 'Groq',
    envKey: 'GROQ_API_KEY',
    priority: 2,

    async discover() {
      const key = process.env.GROQ_API_KEY;
      if (!key) return [];
      try {
        const resp = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
          signal: AbortSignal.timeout(10000),
        });
        if (!resp.ok) return [];
        const data = await resp.json();
        return (data.data || [])
          .filter(m => m.id && m.active !== false && !m.id.includes('whisper'))
          .map(m => ({
            id: m.id,
            isFreeTier: true,
            contextLength: m.context_window || 0,
          }));
      } catch {
        return [];
      }
    },

    async call(modelId, prompt, options = {}) {
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

  // ── OpenRouter (Claude 포함 다중 제공자 무료 게이트웨이) ─────────────────
  {
    providerId: 'openrouter',
    name: 'OpenRouter',
    envKey: 'OPENROUTER_API_KEY',
    priority: 3,

    async discover() {
      // OpenRouter 모델 목록은 인증 없이도 조회 가능
      try {
        const resp = await fetch('https://openrouter.ai/api/v1/models', {
          signal: AbortSignal.timeout(12000),
        });
        if (!resp.ok) return [];
        const data = await resp.json();
        return (data.data || [])
          .filter(m =>
            m.id &&
            // 무료 모델만
            (m.id.endsWith(':free') || parseFloat(m.pricing?.prompt || '1') === 0) &&
            // 텍스트 생성 모델만 (이미지/오디오 제외)
            !m.id.match(/stable-diffusion|dall-e|whisper|tts|embedding|image-/i)
          )
          .map(m => ({
            id: m.id,
            isFreeTier: true,
            contextLength: m.context_length || 0,
          }));
      } catch {
        return [];
      }
    },

    async call(modelId, prompt, options = {}) {
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

  // ── Anthropic Claude (OpenRouter에서 발견, 네이티브 API로 호출) ───────────
  // Anthropic은 공개 모델 목록 API가 없음
  // → OpenRouter의 anthropic/* 항목을 발견 소스로 사용
  {
    providerId: 'anthropic',
    name: 'Anthropic Claude',
    envKey: 'ANTHROPIC_API_KEY',
    priority: 4,

    async discover() {
      try {
        const resp = await fetch('https://openrouter.ai/api/v1/models', {
          signal: AbortSignal.timeout(12000),
        });
        if (!resp.ok) return [];
        const data = await resp.json();
        // OpenRouter에 등록된 Anthropic 모델 발견 → 네이티브 ID 변환
        return (data.data || [])
          .filter(m => m.id?.startsWith('anthropic/') || m.id?.includes('claude'))
          .map(m => {
            // "anthropic/claude-opus-4-5" → "claude-opus-4-5"
            const nativeId = m.id.replace(/^anthropic\//, '').replace(/:free$/, '');
            return {
              id: nativeId,
              isFreeTier: false, // Anthropic 네이티브 API는 유료
              contextLength: m.context_length || 0,
            };
          })
          .filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i); // 중복 제거
      } catch {
        return [];
      }
    },

    async call(modelId, prompt, options = {}) {
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

  // ── Cohere ────────────────────────────────────────────────────────────────
  {
    providerId: 'cohere',
    name: 'Cohere',
    envKey: 'COHERE_API_KEY',
    priority: 5,

    async discover() {
      const key = process.env.COHERE_API_KEY;
      if (!key) return [];
      try {
        const resp = await fetch('https://api.cohere.com/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
          signal: AbortSignal.timeout(10000),
        });
        if (!resp.ok) return [];
        const data = await resp.json();
        return (data.models || [])
          .filter(m =>
            m.name &&
            (m.endpoints?.includes('chat') || m.endpoints?.includes('generate'))
          )
          .map(m => ({
            id: m.name,
            isFreeTier: true,
            contextLength: m.context_length || 0,
          }));
      } catch {
        return [];
      }
    },

    async call(modelId, prompt) {
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

  // ── Hugging Face (트렌딩 텍스트 생성 모델 자동 발견) ─────────────────────
  {
    providerId: 'huggingface',
    name: 'Hugging Face',
    envKey: 'HUGGINGFACE_API_TOKEN',
    priority: 6,

    async discover() {
      try {
        const resp = await fetch(
          'https://huggingface.co/api/models?pipeline_tag=text-generation&sort=trending&limit=30&library=transformers',
          {
            headers: { 'User-Agent': 'KultureBot/1.0' },
            signal: AbortSignal.timeout(10000),
          }
        );
        if (!resp.ok) return [];
        const data = await resp.json();
        return data
          .filter(m => !m.gated && m.modelId && m.downloads > 5000)
          .map(m => ({
            id: m.modelId,
            isFreeTier: true,
            downloads: m.downloads || 0,
            likes: m.likes || 0,
          }));
      } catch {
        return [];
      }
    },

    async call(modelId, prompt, options = {}) {
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

  // ── OpenAI ────────────────────────────────────────────────────────────────
  {
    providerId: 'openai',
    name: 'OpenAI',
    envKey: 'OPENAI_API_KEY',
    priority: 7,

    async discover() {
      const key = process.env.OPENAI_API_KEY;
      if (!key) return [];
      try {
        const resp = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
          signal: AbortSignal.timeout(10000),
        });
        if (!resp.ok) return [];
        const data = await resp.json();
        return (data.data || [])
          .filter(m =>
            // 채팅/텍스트 생성 모델만
            /^(gpt-|o\d|chatgpt)/i.test(m.id) &&
            !m.id.includes('audio') &&
            !m.id.includes('realtime') &&
            !m.id.includes('instruct') &&
            !m.id.includes('vision-preview')
          )
          .map(m => ({
            id: m.id,
            isFreeTier: false,
            contextLength: 0,
          }));
      } catch {
        return [];
      }
    },

    async call(modelId, prompt, options = {}) {
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
// 모델 발견 + 점수 정렬 (1시간 캐시)
// ══════════════════════════════════════════════════════════════

async function discoverAndRankModels(provider, preferFree = true) {
  const cached = getCachedDiscovery(provider.providerId);
  if (cached) {
    return preferFree ? cached.filter(m => m.isFreeTier) : cached;
  }

  logger.info('[AIModelManager]', `모델 목록 실시간 조회: ${provider.name}`);

  let models = [];
  try {
    models = await provider.discover();
  } catch (err) {
    logger.warn('[AIModelManager]', `모델 발견 실패 (${provider.name}): ${err.message}`);
  }

  if (models.length === 0) {
    logger.warn('[AIModelManager]', `${provider.name}: 발견된 모델 없음`);
    return [];
  }

  // 점수 계산 → 내림차순 정렬 (최신·최고 성능 우선)
  const scored = models
    .map(m => ({ ...m, _score: scoreModelCapability(m.id, m) }))
    .sort((a, b) => b._score - a._score);

  setCachedDiscovery(provider.providerId, scored);
  logger.info(
    '[AIModelManager]',
    `${provider.name}: ${scored.length}개 모델 발견 | 최고: ${scored[0]?.id} (score=${scored[0]?._score})`
  );

  return preferFree ? scored.filter(m => m.isFreeTier) : scored;
}

// ══════════════════════════════════════════════════════════════
// 핵심 함수: 동적 발견 + 점진적 하향
// ══════════════════════════════════════════════════════════════

/**
 * 실시간으로 발견한 최신·최고 AI 모델로 텍스트 생성
 *
 * 1. 각 제공자의 /models API를 조회 (1시간 캐시 활용)
 * 2. 성능 점수 기준 정렬 → 최고 모델부터 시도
 * 3. 실패 시 자동 하향 (404→24h 쿨다운, 429→3분 쿨다운)
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
    // 실시간 발견 + 점수 정렬된 모델 목록
    const rankedModels = await discoverAndRankModels(provider, preferFree);
    if (rankedModels.length === 0) continue;

    // 이전 성공 모델이 있으면 캐시에서 먼저 시도
    const cached = workingModelCache[provider.providerId];
    let modelsToTry = rankedModels;
    if (cached && Date.now() < cached.until) {
      const idx = rankedModels.findIndex(m => m.id === cached.modelId);
      if (idx > 0) {
        modelsToTry = [
          rankedModels[idx],
          ...rankedModels.slice(0, idx),
          ...rankedModels.slice(idx + 1),
        ];
      }
    }

    for (const modelMeta of modelsToTry) {
      const modelId = modelMeta.id;
      if (isInCooldown(provider.providerId, modelId)) continue;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const startTime = Date.now();
        try {
          const text = await provider.call(modelId, prompt, options);
          if (!text || text.trim().length < 5) throw new Error('빈 응답');

          const latencyMs = Date.now() - startTime;
          workingModelCache[provider.providerId] = {
            modelId,
            until: Date.now() + WORKING_TTL_MS,
          };
          callStats.success++;
          callStats.byProvider[provider.providerId] =
            (callStats.byProvider[provider.providerId] || 0) + 1;

          logger.info(
            '[AIModelManager]',
            `✅ ${provider.name}/${modelId} (${latencyMs}ms | score=${modelMeta._score})`
          );
          return {
            text,
            model: modelId,
            modelId,
            provider: provider.providerId,
            providerName: provider.name,
            cost: modelMeta.costPer1k || 0,
            latencyMs,
            isFreeTier: modelMeta.isFreeTier,
            score: modelMeta._score,
          };
        } catch (err) {
          const msg = err.message || '';
          errors.push(`${provider.name}/${modelId}: ${msg}`);

          if (isModelNotFound(msg)) {
            logger.warn('[AIModelManager]', `모델 없음 → 목록 제거: ${modelId}`);
            setCooldown(provider.providerId, modelId, 24 * 60 * 60 * 1000);
            // 발견 캐시에서도 즉시 제거
            if (discoveryCache[provider.providerId]) {
              discoveryCache[provider.providerId].models =
                discoveryCache[provider.providerId].models.filter(m => m.id !== modelId);
            }
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

  // 무료 전용 모두 실패 → 유료 포함 재시도
  if (preferFree) {
    logger.warn('[AIModelManager]', '무료 모델 전부 실패 → 유료 포함 재시도');
    return generateWithBestModel(prompt, { ...options, preferFree: false });
  }

  callStats.fail++;
  throw new Error(`[AIModelManager] 모든 AI 실패.\n${errors.slice(-5).join('\n')}`);
}

// ══════════════════════════════════════════════════════════════
// 유틸리티 함수
// ══════════════════════════════════════════════════════════════

export function getModelStatus() {
  return {
    providers: PROVIDER_REGISTRY.map(p => {
      const cached = getCachedDiscovery(p.providerId);
      return {
        id: p.providerId,
        name: p.name,
        available: !!process.env[p.envKey],
        priority: p.priority,
        discoveredModels: cached?.length || 0,
        topModel: cached?.[0]?.id || '미발견 (다음 호출 시 조회됨)',
        topModelScore: cached?.[0]?._score || 0,
        lastDiscoveryAt: discoveryCache[p.providerId]?.cachedAt
          ? new Date(discoveryCache[p.providerId].cachedAt).toISOString()
          : null,
        currentWorkingModel: workingModelCache[p.providerId]?.modelId || null,
      };
    }),
    stats: {
      totalCalls: callStats.total,
      successfulCalls: callStats.success,
      failedCalls: callStats.fail,
      byProvider: callStats.byProvider,
    },
    note: '모델 목록은 각 AI 제공자 API에서 실시간 발견됩니다 (1시간 캐시)',
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
    delete discoveryCache[providerId]; // 재발견 강제
  }
  logger.info('[AIModelManager]', `캐시 초기화: ${providerId}${modelId ? `/${modelId}` : ''}`);
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
 * 발견 캐시를 즉시 무효화 → 다음 generateWithBestModel() 호출 시 재발견
 * aiModelCrawler.js에서 새 모델 감지 시 호출합니다.
 */
export function invalidateDiscoveryCache(providerId) {
  if (providerId) {
    delete discoveryCache[providerId];
  } else {
    for (const key of Object.keys(discoveryCache)) delete discoveryCache[key];
  }
  logger.info('[AIModelManager]', `발견 캐시 무효화: ${providerId || '전체'}`);
}

/**
 * 수동으로 발견 캐시에 모델 삽입 (크롤러 호환용)
 * 점수 재계산 후 정렬 위치에 삽입됩니다.
 */
export function prependModelToCatalog(providerId, modelMeta) {
  const cache = discoveryCache[providerId];
  if (!cache) return false;
  if (cache.models.some(m => m.id === modelMeta.id)) return false;
  const scored = { ...modelMeta, _score: scoreModelCapability(modelMeta.id, modelMeta) };
  cache.models.push(scored);
  cache.models.sort((a, b) => (b._score || 0) - (a._score || 0));
  delete workingModelCache[providerId];
  logger.info('[AIModelManager]', `모델 수동 삽입: ${providerId}/${modelMeta.id} (score=${scored._score})`);
  return true;
}

logger.info('[AIModelManager]', '동적 발견 엔진 v3.0 초기화', {
  totalProviders: PROVIDER_REGISTRY.length,
  configuredProviders: PROVIDER_REGISTRY.filter(p => process.env[p.envKey]).length,
  note: '하드코딩된 모델명 없음 — 미래 모델도 자동 발견됩니다',
});
