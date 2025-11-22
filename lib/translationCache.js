/**
 * Advanced Translation Cache System
 * Redis 지원 및 다층 캐싱 전략
 */

import logger from './logger';

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
