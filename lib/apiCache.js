/**
 * API 응답 캐싱 시스템 — Upstash Redis (서버리스 호환)
 * [일시] 2026-03-06 (KST)
 * [목적] Vercel 서버리스 재시작에도 유지되는 Redis 기반 캐시
 *        환경 변수 미설정 시 in-memory Map() 자동 폴백 (개발 환경 호환)
 *
 * 환경 변수:
 *   UPSTASH_REDIS_REST_URL   — Upstash REST 엔드포인트
 *   UPSTASH_REDIS_REST_TOKEN — Upstash REST 토큰
 */

import { logger } from './logger.js';

// ──────────────────────────────────────────────
// Redis 클라이언트 초기화 (지연 로딩)
// ──────────────────────────────────────────────
let _redisClient = null;

async function getRedisClient() {
  if (_redisClient) return _redisClient;
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    try {
      const { Redis } = await import('@upstash/redis');
      _redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      logger.info('[cache]', 'Upstash Redis client initialized');
      return _redisClient;
    } catch (e) {
      logger.warn('[cache]', 'Upstash Redis init failed — falling back to in-memory', { error: e.message });
    }
  }
  return null; // 인메모리 폴백
}

// ──────────────────────────────────────────────
// In-memory 폴백 (개발 환경 / Redis 미설정)
// ──────────────────────────────────────────────
const memoryStore = new Map(); // { key → { value, expiresAt } }

function memGet(key) {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

function memSet(key, value, ttlSeconds) {
  memoryStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function memDel(key) {
  memoryStore.delete(key);
}

// ──────────────────────────────────────────────
// APICache 공개 인터페이스
// ──────────────────────────────────────────────
class APICache {
  constructor(options = {}) {
    this.defaultTTL = Math.floor((options.defaultTTL || 5 * 60 * 1000) / 1000); // ms → seconds
    this.prefix = options.prefix || 'kulture:cache:';
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * 캐시 키 생성
   */
  generateKey(endpoint, params = {}) {
    const paramStr = Object.keys(params).length > 0 ? ':' + JSON.stringify(params) : '';
    return `${this.prefix}${endpoint}${paramStr}`;
  }

  /**
   * 캐시에서 데이터 조회
   */
  async get(key) {
    try {
      const redis = await getRedisClient();
      let value;
      if (redis) {
        value = await redis.get(key);
      } else {
        value = memGet(key);
      }
      if (value !== null && value !== undefined) {
        this.hits++;
        return typeof value === 'string' ? JSON.parse(value) : value;
      }
    } catch (e) {
      logger.warn('[cache]', `get() error for key "${key}"`, { error: e.message });
    }
    this.misses++;
    return null;
  }

  /**
   * 캐시에 데이터 저장
   * @param {string} key
   * @param {*} value
   * @param {number} [ttl] - TTL (초). 미지정 시 defaultTTL 사용
   */
  async set(key, value, ttl) {
    const ttlSeconds = ttl ?? this.defaultTTL;
    try {
      const redis = await getRedisClient();
      if (redis) {
        await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
      } else {
        memSet(key, value, ttlSeconds);
      }
    } catch (e) {
      logger.warn('[cache]', `set() error for key "${key}"`, { error: e.message });
    }
  }

  /**
   * 캐시 키 삭제
   */
  async delete(key) {
    try {
      const redis = await getRedisClient();
      if (redis) {
        await redis.del(key);
      } else {
        memDel(key);
      }
    } catch (e) {
      logger.warn('[cache]', `delete() error for key "${key}"`, { error: e.message });
    }
  }

  /**
   * 패턴으로 다수 키 삭제 (Redis만 지원, 폴백 시 무시)
   */
  async invalidatePattern(pattern) {
    try {
      const redis = await getRedisClient();
      if (!redis) return;
      const keys = await redis.keys(`${this.prefix}${pattern}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info('[cache]', `Invalidated ${keys.length} keys matching "${pattern}"`);
      }
    } catch (e) {
      logger.warn('[cache]', `invalidatePattern() error`, { error: e.message });
    }
  }

  /**
   * Cache-aside 헬퍼: 캐시 미스 시 fetcher 실행 후 저장
   * @param {string} key
   * @param {Function} fetcher - async () => data
   * @param {number} [ttl] - 초
   */
  async getOrFetch(key, fetcher, ttl) {
    const cached = await this.get(key);
    if (cached !== null) return cached;

    const fresh = await fetcher();
    if (fresh !== null && fresh !== undefined) {
      await this.set(key, fresh, ttl);
    }
    return fresh;
  }

  /**
   * 캐시 통계
   */
  getStats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total * 100).toFixed(1) + '%' : 'N/A',
      backend: _redisClient ? 'upstash-redis' : 'in-memory',
    };
  }
}

// 싱글톤 인스턴스
export const apiCache = new APICache({
  defaultTTL: 5 * 60 * 1000, // 5분
  prefix: 'kulture:cache:',
});

// TTL 단축키 상수 (초)
export const TTL = {
  PREMIUM_STATUS: 30,        // 멤버십 상태 (빠른 갱신 필요)
  TRENDS_SNAPSHOT: 5 * 60,   // 트렌드 스냅샷 5분
  VIP_TOP_LIST: 3 * 60,      // VIP 상위 목록 3분
  FEED: 2 * 60,              // 피드 2분
  LEADERBOARD: 10 * 60,      // 리더보드 10분
  SITE_SETTINGS: 30 * 60,    // 사이트 설정 30분
};

export default APICache;

// 하위 호환: 기존 코드가 new APICache() 로 인스턴스 생성하는 경우를 위해 클래스도 export

  get(key) {