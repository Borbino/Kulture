/**
 * Log Aggregator
 * 에러 및 경고 로그 집계 및 패턴 분석
 */

/**
 * Log Aggregator 클래스
 */
export class LogAggregator {
  constructor() {
    this.errors = []
    this.warnings = []
    this.alertThreshold = 5 // 5개 이상 에러 시 알림
  }

  /**
   * 에러 로그 기록
   */
  logError(module, error, context = {}) {
    const errorEntry = {
      module,
      message: error.message || String(error),
      stack: error.stack || null,
      context,
      timestamp: new Date().toISOString(),
    }

    this.errors.push(errorEntry)

    // 임계값 도달 시 알림
    if (this.errors.length >= this.alertThreshold) {
      this.sendAlert('Multiple errors detected', this.errors.length)
    }

    return errorEntry
  }

  /**
   * 경고 로그 기록
   */
  logWarning(module, message, context = {}) {
    const warningEntry = {
      module,
      message,
      context,
      timestamp: new Date().toISOString(),
    }

    this.warnings.push(warningEntry)

    return warningEntry
  }

  /**
   * 에러 리포트 생성
   */
  generateErrorReport() {
    // 모듈별 에러 집계
    const grouped = this.errors.reduce((acc, err) => {
      acc[err.module] = (acc[err.module] || 0) + 1
      return acc
    }, {})

    // 에러 메시지 패턴 분석
    const messagePatterns = this.errors.reduce((acc, err) => {
      const key = err.message.substring(0, 50) // 첫 50자로 그룹화
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    return {
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      errorsByModule: grouped,
      messagePatterns,
      recentErrors: this.errors.slice(-10),
      recentWarnings: this.warnings.slice(-10),
      generatedAt: new Date().toISOString(),
    }
  }

  /**
   * 특정 모듈의 에러 조회
   */
  getErrorsByModule(module) {
    return this.errors.filter(err => err.module === module)
  }

  /**
   * 특정 기간 내 에러 조회
   */
  getErrorsByTimeRange(startTime, endTime) {
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()

    return this.errors.filter(err => {
      const errTime = new Date(err.timestamp).getTime()
      return errTime >= start && errTime <= end
    })
  }

  /**
   * 에러율 계산
   */
  getErrorRate(windowMinutes = 60) {
    const now = Date.now()
    const windowMs = windowMinutes * 60 * 1000

    const recentErrors = this.errors.filter(err => {
      const errTime = new Date(err.timestamp).getTime()
      return now - errTime <= windowMs
    })

    return {
      count: recentErrors.length,
      rate: recentErrors.length / windowMinutes, // 분당 에러 수
      window: windowMinutes,
    }
  }

  /**
   * 가장 빈번한 에러 조회
   */
  getMostFrequentErrors(limit = 5) {
    const grouped = this.errors.reduce((acc, err) => {
      const key = err.message
      if (!acc[key]) {
        acc[key] = {
          message: err.message,
          module: err.module,
          count: 0,
          lastOccurred: err.timestamp,
        }
      }
      acc[key].count++
      acc[key].lastOccurred = err.timestamp
      return acc
    }, {})

    return Object.values(grouped)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  /**
   * 알림 전송
   */
  sendAlert(message, errorCount) {
    console.error(`[Log Aggregator Alert] ${message} (${errorCount} errors)`)
    // 실제 환경에서는 Slack, Email 등으로 전송
  }

  /**
   * 로그 초기화
   */
  clear() {
    this.errors = []
    this.warnings = []
  }

  /**
   * 통계 조회
   */
  getStats() {
    return {
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      uniqueModules: [...new Set(this.errors.map(e => e.module))].length,
      oldestError: this.errors[0]?.timestamp || null,
      newestError: this.errors[this.errors.length - 1]?.timestamp || null,
    }
  }
}

// Singleton 인스턴스
let instance = null

export function getLogAggregator() {
  if (!instance) {
    instance = new LogAggregator()
  }
  return instance
}
