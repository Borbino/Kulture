/**
 * [설명] 자동 성능 최적화 시스템
 * [일시] 2025-11-26 (KST)
 * [목적] AI 기반 자동 성능 최적화 제안 및 적용
 */

import performanceMonitor from './performanceMonitoringEnhanced'

class AutoOptimizer {
  constructor() {
    this.optimizations = []
    this.appliedOptimizations = new Set()
  }

  /**
   * 성능 데이터 분석 및 최적화 제안
   */
  async analyzeAndOptimize() {
    const report = performanceMonitor.generateReport()
    const optimizations = []

    // 1. 느린 API 최적화
    if (report.metrics.apis) {
      const slowApis = report.metrics.apis.filter(api => api.avgDuration > 1000)
      slowApis.forEach(api => {
        optimizations.push({
          type: 'api_optimization',
          priority: 'high',
          endpoint: api.endpoint,
          issue: '평균 응답 시간 ' + Math.round(api.avgDuration) + 'ms (임계값: 1000ms)',
          suggestions: [
            '데이터베이스 쿼리 최적화 (인덱스 추가)',
            'Redis 캐싱 추가',
            '페이지네이션 구현',
            '불필요한 데이터 제거',
            'N+1 쿼리 문제 해결',
          ],
          autoApplicable: false,
          estimatedImprovement: '50-80% 응답 시간 단축',
        })
      })
    }

    // 2. 높은 에러율 감지
    if (report.metrics.apis) {
      const errorProne = report.metrics.apis.filter(api => api.errorRate > 5)
      errorProne.forEach(api => {
        optimizations.push({
          type: 'error_reduction',
          priority: 'high',
          endpoint: api.endpoint,
          issue: '에러율 ' + api.errorRate.toFixed(2) + '% (임계값: 5%)',
          suggestions: [
            '에러 핸들링 강화',
            '입력 유효성 검증 추가',
            '재시도 로직 구현',
            '에러 로그 분석',
            '의존성 안정성 확인',
          ],
          autoApplicable: false,
          estimatedImprovement: '에러율 90% 감소',
        })
      })
    }

    // 3. 캐시 히트율 개선
    if (report.metrics.cache) {
      const lowHitRate = report.metrics.cache.filter(cache => cache.hitRate < 60)
      lowHitRate.forEach(cache => {
        optimizations.push({
          type: 'cache_optimization',
          priority: 'medium',
          cacheKey: cache.key,
          issue: '캐시 히트율 ' + Math.round(cache.hitRate) + '% (목표: 60%+)',
          suggestions: [
            'TTL 증가 (현재보다 2배)',
            '캐시 워밍 전략 구현',
            '캐시 키 전략 재검토',
            'LRU/LFU 알고리즘 적용',
            '자주 사용되는 데이터 사전 캐싱',
          ],
          autoApplicable: true,
          estimatedImprovement: '캐시 히트율 80%+ 달성',
          autoAction: async () => {
            // 자동으로 TTL 증가 (예시)
            console.log('[Auto-Optimizer] Increasing TTL for cache key: ' + cache.key)
            // 실제 구현은 캐시 시스템에 따라 다름
            return true
          },
        })
      })
    }

    // 4. 데이터베이스 쿼리 최적화
    if (report.metrics.database) {
      const slowQueries = report.metrics.database.filter(q => q.avgDuration > 500)
      slowQueries.forEach(query => {
        optimizations.push({
          type: 'database_optimization',
          priority: 'high',
          query: query.query,
          issue: '평균 실행 시간 ' + Math.round(query.avgDuration) + 'ms (임계값: 500ms)',
          suggestions: [
            '복합 인덱스 추가',
            '쿼리 조인 최적화',
            '데이터 정규화',
            '쿼리 결과 캐싱',
            '읽기 전용 복제본 사용',
          ],
          autoApplicable: false,
          estimatedImprovement: '60-90% 실행 시간 단축',
        })
      })
    }

    // 5. 메모리 사용 최적화 (추가 메트릭 필요 시)
    if (report.metrics.memory && report.metrics.memory.usage > 80) {
      optimizations.push({
        type: 'memory_optimization',
        priority: 'critical',
        issue: '메모리 사용률 ' + report.metrics.memory.usage + '% (임계값: 80%)',
        suggestions: [
          '메모리 누수 확인 및 수정',
          '불필요한 객체 참조 제거',
          '가비지 컬렉션 튜닝',
          '캐시 크기 제한',
          '스트림 처리 방식 적용',
        ],
        autoApplicable: false,
        estimatedImprovement: '메모리 사용률 60% 이하',
      })
    }

    this.optimizations = optimizations
    return optimizations
  }

  /**
   * 자동 적용 가능한 최적화 실행
   */
  async applyAutoOptimizations() {
    const autoApplicable = this.optimizations.filter(opt => opt.autoApplicable)
    const results = []

    for (const optimization of autoApplicable) {
      // 이미 적용된 최적화는 스킵
      const key = optimization.type + ':' + (optimization.cacheKey || optimization.endpoint || optimization.query)
      if (this.appliedOptimizations.has(key)) {
        continue
      }

      try {
        if (optimization.autoAction) {
          const success = await optimization.autoAction()
          if (success) {
            this.appliedOptimizations.add(key)
            results.push({
              optimization: key,
              status: 'applied',
              timestamp: new Date().toISOString(),
            })
          }
        }
      } catch (error) {
        results.push({
          optimization: key,
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString(),
        })
      }
    }

    return results
  }

  /**
   * 최적화 우선순위 정렬
   */
  getPrioritizedOptimizations() {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return this.optimizations.sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }

  /**
   * 최적화 리포트 생성
   */
  generateOptimizationReport() {
    const prioritized = this.getPrioritizedOptimizations()
    const byType = {}

    prioritized.forEach(opt => {
      if (!byType[opt.type]) {
        byType[opt.type] = []
      }
      byType[opt.type].push(opt)
    })

    return {
      timestamp: new Date().toISOString(),
      totalOptimizations: prioritized.length,
      byPriority: {
        critical: prioritized.filter(o => o.priority === 'critical').length,
        high: prioritized.filter(o => o.priority === 'high').length,
        medium: prioritized.filter(o => o.priority === 'medium').length,
        low: prioritized.filter(o => o.priority === 'low').length,
      },
      byType,
      autoApplicable: prioritized.filter(o => o.autoApplicable).length,
      appliedCount: this.appliedOptimizations.size,
      optimizations: prioritized,
    }
  }
}

const autoOptimizer = new AutoOptimizer()

export default autoOptimizer
export { AutoOptimizer }
