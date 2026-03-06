/**
 * AI Model Manager — Dynamic Model Selection Engine
 * Kulture Platform v1.0
 *
 * ──────────────────────────────────────────────────────
 * [핵심 철학]
 *   Kulture는 특정 AI 모델에 종속되지 않습니다.
 *   AI는 도구일 뿐이며, 시간이 지남에 따라 더 좋고 무료인
 *   모델이 계속 등장합니다. 이 엔진은 매 호출 시점에
 *   현재 사용 가능한 최선의 무료 AI를 자동으로 선택합니다.
 *
 * [동작 원리]
 *   1. 등록된 AI 제공자 목록을 순위대로 순회
 *   2. 각 제공자의 환경변수(API 키) 존재 여부 확인
 *   3. 요금이 없거나 무료 티어 내인 모델 우선 선택
 *   4. 선택된 모델로 요청 → 실패 시 자동으로 다음 모델로 폴백
 *   5. 결과와 함께 어떤 모델이 사용됐는지 메타데이터 반환
 *
 * [새 AI 추가 방법]
 *   AI_PROVIDERS 배열에 항목 추가만 하면 자동으로 편입됨
 * ──────────────────────────────────────────────────────
 */

import logger from './logger.js';

// ══════════════════════════════════════════════════════
// AI 제공자 레지스트리 (우선순위 높은 순)
// cost: 0 = 완전무료, 0.001 = 거의무료, 1+ = 유료
// ══════════════════════════════════════════════════════
const AI_PROVIDERS = [
  // ── 1. Google Gemini (무료 티어 매우 넉넉) ──
  {
    id: 'gemini-flash',
    name: 'Google Gemini 2.0 Flash',
    provider: 'google',
    envKey: 'GOOGLE_GEMINI_API_KEY',
    cost: 0,
    tier: 'free',
    strength: ['fast', 'multilingual', 'korean'],
    rateLimit: { rpm: 15, rpd: 1500 },
    call: async (prompt, options = {}) => {
      const key = process.env.GOOGLE_GEMINI_API_KEY;
      if (!key) throw new Error('No Gemini key');
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(key);
      // 최신 Flash 모델 우선, 없으면 pro fallback
      const modelName = options.fast ? 'gemini-2.0-flash' : 'gemini-1.5-flash';
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    },
  },

  // ── 2. Google Gemini Pro (더 고품질, 무료 티어) ──
  {
    id: 'gemini-pro',
    name: 'Google Gemini 1.5 Pro',
    provider: 'google',
    envKey: 'GOOGLE_GEMINI_API_KEY',
    cost: 0,
    tier: 'free',
    strength: ['quality', 'reasoning', 'long_context'],
    rateLimit: { rpm: 2, rpd: 50 },
    call: async (prompt) => {
      const key = process.env.GOOGLE_GEMINI_API_KEY;
      if (!key) throw new Error('No Gemini key');
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const result = await model.generateContent(prompt);
      return result.response.text();
    },
  },

  // ── 3. Hugging Face Inference API (무료, 모델 선택 가능) ──
  {
    id: 'huggingface',
    name: 'Hugging Face Inference API',
    provider: 'huggingface',
    envKey: 'HUGGINGFACE_API_TOKEN',
    cost: 0,
    tier: 'free',
    strength: ['open_source', 'diverse_models'],
    rateLimit: { rpm: 30, rpd: 1000 },
    // 모델명은 HF에서 가장 최근 강력한 무료 모델 자동 탐색
    models: [
      'mistralai/Mistral-7B-Instruct-v0.3',
      'microsoft/Phi-3-mini-4k-instruct',
      'HuggingFaceH4/zephyr-7b-beta',
      'tiiuae/falcon-7b-instruct',
    ],
    call: async (prompt, options = {}) => {
      const token = process.env.HUGGINGFACE_API_TOKEN;
      if (!token) throw new Error('No HF token');
      const modelList = AI_PROVIDERS.find(p => p.id === 'huggingface').models;
      const model = options.hfModel || modelList[0];
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 1200, temperature: 0.7 } }),
          signal: AbortSignal.timeout(45000),
        }
      );
      if (!response.ok) throw new Error(`HF ${response.status}`);
      const data = await response.json();
      return Array.isArray(data) ? (data[0]?.generated_text || '') : (data.generated_text || '');
    },
  },

  // ── 4. OpenRouter — 무료 모델 집합 (Claude/Llama/Gemma 무료 티어) ──
  {
    id: 'openrouter-free',
    name: 'OpenRouter Free Models',
    provider: 'openrouter',
    envKey: 'OPENROUTER_API_KEY',
    cost: 0,
    tier: 'free',
    strength: ['variety', 'fallback'],
    rateLimit: { rpm: 20, rpd: 200 },
    // 무료 모델 목록 (OpenRouter에서 :free 접미사 = 완전무료)
    models: [
      'meta-llama/llama-3.2-3b-instruct:free',
      'google/gemma-2-9b-it:free',
      'mistralai/mistral-7b-instruct:free',
      'qwen/qwen-2-7b-instruct:free',
    ],
    call: async (prompt, options = {}) => {
      const key = process.env.OPENROUTER_API_KEY;
      if (!key) throw new Error('No OpenRouter key');
      const modelList = AI_PROVIDERS.find(p => p.id === 'openrouter-free').models;
      const model = options.orModel || modelList[0];
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://kulture.wiki',
          'X-Title': 'Kulture',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1200,
          temperature: 0.75,
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error(`OpenRouter ${response.status}`);
      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    },
  },

  // ── 5. Cohere Command R (무료 티어) ──
  {
    id: 'cohere',
    name: 'Cohere Command R',
    provider: 'cohere',
    envKey: 'COHERE_API_KEY',
    cost: 0,
    tier: 'free',
    strength: ['rag', 'retrieval', 'english'],
    rateLimit: { rpm: 5, rpd: 1000 },
    call: async (prompt) => {
      const key = process.env.COHERE_API_KEY;
      if (!key) throw new Error('No Cohere key');
      const response = await fetch('https://api.cohere.com/v2/chat', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'command-r',  // 무료 티어 모델
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error(`Cohere ${response.status}`);
      const data = await response.json();
      return data.message?.content?.[0]?.text || '';
    },
  },

  // ── 6. Groq (무료 티어, 초고속 추론) ──
  {
    id: 'groq',
    name: 'Groq LPU (Llama/Gemma)',
    provider: 'groq',
    envKey: 'GROQ_API_KEY',
    cost: 0,
    tier: 'free',
    strength: ['speed', 'llama', 'free_tier'],
    rateLimit: { rpm: 30, rpd: 14400 },
    call: async (prompt) => {
      const key = process.env.GROQ_API_KEY;
      if (!key) throw new Error('No Groq key');
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',  // Groq 무료 최고속 모델
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1200,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`Groq ${response.status}`);
      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    },
  },

  // ── 7. OpenAI (유료 — 최후 수단) ──
  {
    id: 'openai',
    name: 'OpenAI GPT-4o-mini',
    provider: 'openai',
    envKey: 'OPENAI_API_KEY',
    cost: 0.015,  // 유료지만 저렴
    tier: 'paid',
    strength: ['quality', 'json_mode', 'reliable'],
    rateLimit: { rpm: 500, rpd: 10000 },
    call: async (prompt, options = {}) => {
      const key = process.env.OPENAI_API_KEY;
      if (!key) throw new Error('No OpenAI key');
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI({ apiKey: key });
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 1200,
        temperature: 0.75,
      });
      return completion.choices[0]?.message?.content || '';
    },
  },
];

// ══════════════════════════════════════════════════════
// 런타임 상태 추적 (실패/성공 통계, 레이트 리밋 회피)
// ══════════════════════════════════════════════════════
const modelStats = {};
AI_PROVIDERS.forEach(p => {
  modelStats[p.id] = {
    successCount: 0,
    failCount: 0,
    lastSuccess: null,
    lastFail: null,
    coolingUntil: null,  // 레이트 리밋 쿨다운
    avgLatencyMs: 0,
  };
});

// ══════════════════════════════════════════════════════
// 핵심 함수: 자동 모델 선택 + 폴백 실행
// ══════════════════════════════════════════════════════

/**
 * 현재 시점에서 최선의 AI 모델로 텍스트 생성
 *
 * @param {string} prompt - AI에게 보낼 프롬프트
 * @param {object} options - { preferFree: true, task: 'filter'|'generate'|'translate', maxRetries: 3 }
 * @returns {Promise<{ text: string, model: string, provider: string, cost: number, latencyMs: number }>}
 */
export async function generateWithBestModel(prompt, options = {}) {
  const { preferFree = true, task = 'generate', maxRetries = 2 } = options;

  // 사용 가능한 제공자 선택 (환경변수 있는 것 + 쿨다운 아닌 것)
  const candidates = AI_PROVIDERS.filter(p => {
    if (!process.env[p.envKey]) return false;
    if (preferFree && p.tier === 'paid') return false;
    const stats = modelStats[p.id];
    if (stats.coolingUntil && Date.now() < stats.coolingUntil) return false;
    return true;
  });

  // 무료 제공자 없으면 유료도 허용
  const pool = candidates.length > 0 ? candidates : AI_PROVIDERS.filter(p => process.env[p.envKey]);

  if (pool.length === 0) {
    throw new Error('[AIModelManager] 사용 가능한 AI 제공자 없음. 환경변수를 확인하세요.');
  }

  let lastError = null;

  for (const provider of pool) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const startTime = Date.now();
      try {
        logger.info('[AIModelManager]', `Trying ${provider.name} (attempt ${attempt + 1})`);
        const text = await provider.call(prompt, options);

        if (!text || text.trim().length < 10) {
          throw new Error('Empty response from model');
        }

        const latencyMs = Date.now() - startTime;
        modelStats[provider.id].successCount++;
        modelStats[provider.id].lastSuccess = new Date().toISOString();
        modelStats[provider.id].avgLatencyMs = Math.round(
          (modelStats[provider.id].avgLatencyMs * 0.7) + (latencyMs * 0.3)
        );

        logger.info('[AIModelManager]', `✅ ${provider.name} succeeded (${latencyMs}ms, ${text.length} chars)`);

        return {
          text,
          model: provider.name,
          modelId: provider.id,
          provider: provider.provider,
          cost: provider.cost,
          latencyMs,
          tier: provider.tier,
        };
      } catch (err) {
        lastError = err;
        modelStats[provider.id].failCount++;
        modelStats[provider.id].lastFail = new Date().toISOString();

        // 레이트 리밋이면 3분 쿨다운
        if (err.message.includes('429') || err.message.includes('rate')) {
          modelStats[provider.id].coolingUntil = Date.now() + 3 * 60 * 1000;
          logger.warn('[AIModelManager]', `Rate limit hit for ${provider.name}, cooling 3min`);
          break; // 이 제공자 건너뜀
        }

        // 인증 오류면 이 제공자 건너뜀
        if (err.message.includes('401') || err.message.includes('auth') || err.message.includes('key')) {
          logger.warn('[AIModelManager]', `Auth error for ${provider.name}, skipping`);
          break;
        }

        // 일시적 오류면 잠시 대기 후 재시도
        if (attempt < maxRetries) {
          const delay = 1000 * Math.pow(2, attempt);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    logger.warn('[AIModelManager]', `${provider.name} failed, trying next...`);
  }

  throw new Error(`[AIModelManager] All AI providers failed. Last error: ${lastError?.message}`);
}

/**
 * 태스크 목적에 맞는 최적 모델 선택 (생성/필터링/번역 각각 다른 기준)
 *
 * @param {string} task - 'generate' | 'filter' | 'translate' | 'summarize'
 * @returns {object} 추천 provider 정보
 */
export function getRecommendedProvider(task) {
  const strengthMap = {
    generate: ['quality', 'multilingual', 'korean'],
    filter: ['fast', 'reasoning'],
    translate: ['multilingual', 'korean'],
    summarize: ['fast', 'long_context'],
  };

  const desired = strengthMap[task] || ['quality'];

  const scored = AI_PROVIDERS
    .filter(p => process.env[p.envKey])  // 키가 있는 것만
    .map(p => ({
      ...p,
      matchScore: p.strength?.filter(s => desired.includes(s)).length || 0,
    }))
    .sort((a, b) => {
      // 무료 우선 + 매칭 점수 우선
      if (a.cost !== b.cost) return a.cost - b.cost;
      return b.matchScore - a.matchScore;
    });

  return scored[0] || null;
}

/**
 * 현재 AI 제공자 상태 대시보드용 스냅샷
 */
export function getModelStatus() {
  return AI_PROVIDERS.map(p => ({
    id: p.id,
    name: p.name,
    tier: p.tier,
    cost: p.cost,
    hasKey: !!process.env[p.envKey],
    stats: modelStats[p.id],
    isCooling: modelStats[p.id].coolingUntil
      ? Date.now() < modelStats[p.id].coolingUntil
      : false,
  }));
}

/**
 * 특정 제공자 쿨다운 강제 해제 (관리자 수동 리셋)
 */
export function resetCooldown(modelId) {
  if (modelStats[modelId]) {
    modelStats[modelId].coolingUntil = null;
    logger.info('[AIModelManager]', `Cooldown reset for ${modelId}`);
    return true;
  }
  return false;
}

logger.info('[AIModelManager]', 'Dynamic AI Model Manager initialized', {
  totalProviders: AI_PROVIDERS.length,
  freeProviders: AI_PROVIDERS.filter(p => p.tier === 'free').length,
  configuredProviders: AI_PROVIDERS.filter(p => process.env[p.envKey]).length,
});
