/**
 * [설명] 번역 성능 모니터링 및 최적화 시스템
 * [일시] 2025-11-26 (KST)
 * [목적] 번역 API 성능 추적, 병목 지점 탐지, 자동 최적화
 */

import { logger } from './logger.js';

class TranslationPerformanceMonitor {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      providerStats: {
        openai: { requests: 0, avgTime: 0, failures: 0 },
        deepl: { requests: 0, avgTime: 0, failures: 0 },
        google: { requests: 0, avgTime: 0, failures: 0 },
      },
      languagePairStats: new Map(),
    };
    this.responseTimes = [];
  }

  /**
   * 번역 요청 시작 추적
   */
  startRequest(provider, sourceLang, targetLang) {
    const startTime = Date.now();
    return {
      provider,
      sourceLang,
      targetLang,
      startTime,
    };
  }

  /**
   * 번역 요청 완료 기록
   */
  endRequest(context, success = true, fromCache = false) {
    const endTime = Date.now();
    const duration = endTime - context.startTime;

    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
      this.metrics.providerStats[context.provider].failures++;
    }

    if (fromCache) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
      
      // 제공자별 통계 업데이트
      const providerStat = this.metrics.providerStats[context.provider];
      providerStat.requests++;
      providerStat.avgTime = (providerStat.avgTime * (providerStat.requests - 1) + duration) / providerStat.requests;
    }

    // 응답 시간 추적 (최근 100개)
    this.responseTimes.push(duration);
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }

    // 평균 응답 시간 계산
    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;

    // 언어 쌍 통계
    const pairKey = `${context.sourceLang}-${context.targetLang}`;
    const pairStat = this.languagePairStats.get(pairKey) || { requests: 0, avgTime: 0 };
    pairStat.requests++;
    pairStat.avgTime = (pairStat.avgTime * (pairStat.requests - 1) + duration) / pairStat.requests;
    this.metrics.languagePairStats.set(pairKey, pairStat);

    // 느린 요청 경고 (>5초)
    if (duration > 5000) {
      logger?.warn?.(`Slow translation detected: ${duration}ms (${context.provider}, ${pairKey})`);
    }
  }

  /**
   * 현재 성능 지표 반환
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.totalRequests > 0
        ? (this.metrics.cacheHits / this.metrics.totalRequests * 100).toFixed(2) + '%'
        : '0%',
      successRate: this.metrics.totalRequests > 0
        ? (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(2) + '%'
        : '0%',
      languagePairStats: Object.fromEntries(this.metrics.languagePairStats),
    };
  }

  /**
   * 성능 리포트 생성
   */
  generateReport() {
    const metrics = this.getMetrics();
    
    return {
      summary: {
        totalRequests: metrics.totalRequests,
        successRate: metrics.successRate,
        cacheHitRate: metrics.cacheHitRate,
        avgResponseTime: `${metrics.averageResponseTime.toFixed(0)}ms`,
      },
      providers: {
        openai: {
          requests: metrics.providerStats.openai.requests,
          avgTime: `${metrics.providerStats.openai.avgTime.toFixed(0)}ms`,
          failures: metrics.providerStats.openai.failures,
        },
        deepl: {
          requests: metrics.providerStats.deepl.requests,
          avgTime: `${metrics.providerStats.deepl.avgTime.toFixed(0)}ms`,
          failures: metrics.providerStats.deepl.failures,
        },
        google: {
          requests: metrics.providerStats.google.requests,
          avgTime: `${metrics.providerStats.google.avgTime.toFixed(0)}ms`,
          failures: metrics.providerStats.google.failures,
        },
      },
      topLanguagePairs: this.getTopLanguagePairs(5),
      recommendations: this.generateRecommendations(),
    };
  }

  /**
   * 상위 언어 쌍 통계
   */
  getTopLanguagePairs(limit = 5) {
    return Array.from(this.metrics.languagePairStats.entries())
      .sort((a, b) => b[1].requests - a[1].requests)
      .slice(0, limit)
      .map(([pair, stat]) => ({
        pair,
        requests: stat.requests,
        avgTime: `${stat.avgTime.toFixed(0)}ms`,
      }));
  }

  /**
   * 성능 개선 권장사항 생성
   */
  generateRecommendations() {
    const recommendations = [];
    const metrics = this.getMetrics();

    // 캐시 히트율 낮음
    if (parseFloat(metrics.cacheHitRate) < 50) {
      recommendations.push({
        type: 'cache',
        severity: 'high',
        message: `캐시 히트율이 낮습니다 (${metrics.cacheHitRate}). Redis 캐시 크기를 늘리거나 TTL을 연장하세요.`,
      });
    }

    // 제공자별 성능 이슈
    Object.entries(metrics.providerStats).forEach(([provider, stat]) => {
      if (stat.failures > stat.requests * 0.1) {
        recommendations.push({
          type: 'provider',
          severity: 'high',
          message: `${provider} 제공자의 실패율이 높습니다 (${(stat.failures / stat.requests * 100).toFixed(1)}%). API 키를 확인하세요.`,
        });
      }

      if (stat.avgTime > 3000) {
        recommendations.push({
          type: 'performance',
          severity: 'medium',
          message: `${provider} 제공자의 평균 응답 시간이 느립니다 (${stat.avgTime.toFixed(0)}ms). 다른 제공자 우선순위를 고려하세요.`,
        });
      }
    });

    // 전체 응답 시간
    if (metrics.averageResponseTime > 2000) {
      recommendations.push({
        type: 'performance',
        severity: 'medium',
        message: `전체 평균 응답 시간이 느립니다 (${metrics.averageResponseTime.toFixed(0)}ms). 배치 처리나 병렬 처리를 활용하세요.`,
      });
    }

    return recommendations;
  }

  /**
   * 통계 초기화
   */
  reset() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      providerStats: {
        openai: { requests: 0, avgTime: 0, failures: 0 },
        deepl: { requests: 0, avgTime: 0, failures: 0 },
        google: { requests: 0, avgTime: 0, failures: 0 },
      },
      languagePairStats: new Map(),
    };
    this.responseTimes = [];
  }
}

// 싱글톤 인스턴스
export const translationMonitor = new TranslationPerformanceMonitor();

export default translationMonitor;
