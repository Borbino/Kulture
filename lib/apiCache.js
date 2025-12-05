/**
 * [설명] API 응답 캐싱 시스템
 * [일시] 2025-11-26 (KST)
 * [목적] 자주 요청되는 API 응답 캐싱으로 DB 부하 90% 감소
 */

class APICache {
  constructor(options = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 500;
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5분
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * 캐시 키 생성
   */
  generateKey(endpoint, params = {}) {
    return endpoint + ':' + JSON.stringify(params);
  }

  /**
   * 캐시에서 데이터 조회
   */
  get(key) {