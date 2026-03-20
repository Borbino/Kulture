/**
 * Advanced Translation Cache System
 * Redis 지원 및 다층 캐싱 전략
 */

import { createHash } from 'crypto';
import { logger } from './logger.js';

// Redis 클라이언트 (선택적)
let redisClient = null;

// 인메모리 L1 캐시
const memoryCache = new Map();
const MEMORY_CACHE_TTL = 1 * 60 * 60 * 1000; // 1시간
const MAX_MEMORY_CACHE_SIZE = 5000;

// Redis L2 캐시 설정
const REDIS_CACHE_TTL = 7 * 24 * 60 * 60; // 7일 (초 단위)

/**
 * Redis 초기화 (선택적)
 */
export async function initializeRedis() {
  try {
    // Redis가 설정되어 있으면 사용
    if (process.env.REDIS_URL) {
      const { createClient } = await import('redis');
      redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) return new Error('Redis connection failed');
            return retries * 100;
          }
        }
      });

      redisClient.on('error', (err) => {
        logger.error('Redis Client Error:', err);
        redisClient = null; // Redis 실패 시 메모리 캐시로 폴백
      });

      await redisClient.connect();
      logger.info('Redis translation cache initialized');
      return true;
    }
  } catch (error) {
    logger.warn('Redis not available, using memory cache only:', error.message);
    redisClient = null;
  }
  return false;
}

/**
 * 캐시 키 생성
 */
function generateCacheKey(text, sourceLang, targetLang) {
  const textHash = Buffer.from(text).toString('base64').substring(0, 50);
  return `trans:${sourceLang}:${targetLang}:${textHash}`;
}

/**
 * L1 메모리 캐시에서 가져오기
 */
function getFromMemoryCache(key) {
  const cached = memoryCache.get(key);
  if (!cached) return null;

  // TTL 확인
  if (Date.now() - cached.timestamp > MEMORY_CACHE_TTL) {
    memoryCache.delete(key);
    return null;
  }

  return cached.translation;
}

/**
 * L1 메모리 캐시에 저장
 */
function setToMemoryCache(key, translation) {
  // 캐시 크기 제한
  if (memoryCache.size >= MAX_MEMORY_CACHE_SIZE) {
    const oldestKey = memoryCache.keys().next().value;
    memoryCache.delete(oldestKey);
  }

  memoryCache.set(key, {
    translation,
    timestamp: Date.now()
  });
}

/**
 * L2 Redis 캐시에서 가져오기
 */
async function getFromRedisCache(key) {
  if (!redisClient || !redisClient.isOpen) return null;

  try {
    const cached = await redisClient.get(key);
    if (cached) {
      const data = JSON.parse(cached);
      // 메모리 캐시에도 저장 (캐시 워밍)
      setToMemoryCache(key, data.translation);
      return data.translation;
    }
  } catch (error) {
    logger.error('Redis get error:', error);
  }
  return null;
}

/**
 * L2 Redis 캐시에 저장
 */
async function setToRedisCache(key, translation) {
  if (!redisClient || !redisClient.isOpen) return;

  try {
    const data = JSON.stringify({
      translation,
      timestamp: Date.now()
    });
    await redisClient.setEx(key, REDIS_CACHE_TTL, data);
  } catch (error) {
    logger.error('Redis set error:', error);
  }
}

/**
 * 다층 캐시에서 번역 가져오기
 */
export async function getCachedTranslation(text, sourceLang, targetLang) {
  const key = generateCacheKey(text, sourceLang, targetLang);

  // L1: 메모리 캐시 확인 (빠름)
  const memoryResult = getFromMemoryCache(key);
  if (memoryResult) {
    logger.debug(`Translation L1 cache hit: ${key}`);
    return memoryResult;
  }

  // L2: Redis 캐시 확인 (중간)
  const redisResult = await getFromRedisCache(key);
  if (redisResult) {
    logger.debug(`Translation L2 cache hit: ${key}`);
    return redisResult;
  }

  return null;
}

/**
 * 다층 캐시에 번역 저장
 */
export async function setCachedTranslation(text, sourceLang, targetLang, translation) {
  const key = generateCacheKey(text, sourceLang, targetLang);

  // L1: 메모리 캐시에 저장
  setToMemoryCache(key, translation);

  // L2: Redis 캐시에 저장 (비동기, 에러 무시)
  setToRedisCache(key, translation).catch(err => {
    logger.error('Failed to save to Redis cache:', err);
  });
}

/**
 * 배치 캐시 조회 (성능 최적화)
 */
export async function getCachedTranslationsBatch(items) {
  const results = [];

  for (const item of items) {
    const { text, sourceLang, targetLang } = item;
    const cached = await getCachedTranslation(text, sourceLang, targetLang);
    results.push({
      text,
      sourceLang,
      targetLang,
      cached,
      hit: cached !== null
    });
  }

  return results;
}

/**
 * 캐시 통계
 */
export async function getCacheStatistics() {
  const stats = {
    memory: {
      size: memoryCache.size,
      maxSize: MAX_MEMORY_CACHE_SIZE,
      ttl: MEMORY_CACHE_TTL,
      usage: ((memoryCache.size / MAX_MEMORY_CACHE_SIZE) * 100).toFixed(2) + '%'
    },
    redis: {
      enabled: redisClient !== null && redisClient?.isOpen,
      connected: redisClient?.isOpen || false
    }
  };

  // Redis 통계 추가
  if (redisClient && redisClient.isOpen) {
    try {
      const info = await redisClient.info('stats');
      const dbSize = await redisClient.dbSize();
      stats.redis.dbSize = dbSize;
      stats.redis.info = info;
    } catch (error) {
      logger.error('Failed to get Redis stats:', error);
    }
  }

  return stats;
}

/**
 * 메모리 캐시 초기화
 */
export function clearMemoryCache() {
  const size = memoryCache.size;
  memoryCache.clear();
  logger.info(`Memory cache cleared: ${size} entries removed`);
  return { cleared: size };
}

/**
 * Redis 캐시 초기화
 */
export async function clearRedisCache() {
  if (!redisClient || !redisClient.isOpen) {
    return { cleared: 0, message: 'Redis not available' };
  }

  try {
    // 번역 캐시 키만 삭제 (trans:* 패턴)
    const keys = await redisClient.keys('trans:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`Redis cache cleared: ${keys.length} entries removed`);
      return { cleared: keys.length };
    }
    return { cleared: 0 };
  } catch (error) {
    logger.error('Failed to clear Redis cache:', error);
    return { cleared: 0, error: error.message };
  }
}

/**
 * 모든 캐시 초기화
 */
export async function clearAllCaches() {
  const memoryResult = clearMemoryCache();
  const redisResult = await clearRedisCache();
  
  return {
    memory: memoryResult,
    redis: redisResult
  };
}

/**
 * 정리 및 종료
 */
export async function closeCache() {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
}

// ════════════════════════════════════════════════════════════════
// ZERO-COST CACHE GATE  (Phase 8-02)
// ════════════════════════════════════════════════════════════════
// 동일 원문 + 목표 언어에 대한 번역 요청 시
// DeepL 포함 모든 외부 API 호출을 완전히 생략 → 비용 $0
//
// 캐시 키 설계: SHA-256(targetLang + "|​" + text)
//   → sourceLang 제외 (동일 원문은 소스 언어와 무관하게 번역 결과가 같음)
// ════════════════════════════════════════════════════════════════

const ZC_TTL_MS    = 30 * 24 * 60 * 60 * 1000; // 30일
const ZC_MAX       = 100_000;
const COST_PER_CHAR = 0.00002; // DeepL Free Tier 초과분 단가 $/글자

/** @type {Map<string, {translation:string,provider:string,sourceLang:string,cachedAt:number,hits:number}>} */
const _zcStore = new Map();
const _zcStats = { hits: 0, misses: 0, savedChars: 0 };

function _zcKey(text, targetLang) {
  return createHash('sha256').update(`${targetLang}|${text}`).digest('hex');
}

function _zcEvict() {
  if (_zcStore.size < ZC_MAX) return;
  const evictCount = Math.floor(_zcStore.size * 0.1);
  let n = 0;
  for (const k of _zcStore.keys()) {
    if (n >= evictCount) break;
    _zcStore.delete(k);
    n++;
  }
  logger.info(`[TranslationCache:ZeroCost] LRU eviction: ${n} entries removed`);
}

/**
 * Zero-Cost 캐시 조회
 * translate() 최상단에서 호출하여 모든 API 호출 전에 캐시를 먼저 확인
 *
 * @param {string} text
 * @param {string} targetLang
 * @returns {{ translation:string, provider:string, cachedAt:number }|null}
 */
export function getCached(text, targetLang) {
  const key = _zcKey(text, targetLang);
  const entry = _zcStore.get(key);

  if (!entry) {
    _zcStats.misses++;
    return null;
  }
  if (Date.now() - entry.cachedAt > ZC_TTL_MS) {
    _zcStore.delete(key);
    _zcStats.misses++;
    return null;
  }

  _zcStats.hits++;
  _zcStats.savedChars += text.length;
  entry.hits = (entry.hits || 0) + 1;
  logger.info(`[TranslationCache:ZeroCost] CACHE HIT — ${targetLang}, ${text.length}글자 API 호출 생략`);
  return entry;
}

/**
 * Zero-Cost 캐시 저장
 *
 * @param {string} text
 * @param {string} targetLang
 * @param {string} translation
 * @param {{ sourceLang?:string, provider?:string }} [meta]
 */
export function setCached(text, targetLang, translation, meta = {}) {
  _zcEvict();
  _zcStore.set(_zcKey(text, targetLang), {
    translation,
    provider:   meta.provider   || 'unknown',
    sourceLang: meta.sourceLang || 'auto',
    cachedAt:   Date.now(),
    hits:       0,
  });
}

/**
 * Zero-Cost 캐시 통계 (어드민 / 모니터링용)
 *
 * @returns {{ hits:number, misses:number, hitRate:string, size:number, estimatedSavedApiCalls:number, estimatedSavedUsd:string }}
 */
export function getCacheStats() {
  const total = _zcStats.hits + _zcStats.misses;
  return {
    hits:                  _zcStats.hits,
    misses:                _zcStats.misses,
    hitRate:               total > 0 ? ((_zcStats.hits / total) * 100).toFixed(1) + '%' : '0%',
    size:                  _zcStore.size,
    estimatedSavedApiCalls: _zcStats.hits,
    estimatedSavedUsd:     (_zcStats.savedChars * COST_PER_CHAR).toFixed(4),
  };
}

/**
 * Zero-Cost 캐시 전체 초기화 (테스트 / 강제 갱신용)
 */
export function clearCache() {
  _zcStore.clear();
  _zcStats.hits = 0;
  _zcStats.misses = 0;
  _zcStats.savedChars = 0;
  logger.info('[TranslationCache:ZeroCost] Cache cleared');
}

export default {
  initializeRedis,
  getCachedTranslation,
  setCachedTranslation,
  getCachedTranslationsBatch,
  getCacheStatistics,
  clearMemoryCache,
  clearRedisCache,
  clearAllCaches,
  closeCache,
};
