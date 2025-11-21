/**
 * Logger System
 * 
 * 환경별로 적절한 로깅을 제공하는 중앙화된 Logger 시스템
 * - Development: 콘솔에 상세 로그 출력
 * - Production: LogAggregator와 통합하여 중앙화된 로그 관리
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
}

class Logger {
  constructor() {
    this.logLevel = process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG
    this.logAggregator = null
  }

  /**
   * LogAggregator 인스턴스 설정 (서버 사이드에서만)
   */
  setLogAggregator(aggregator) {
    this.logAggregator = aggregator
  }

  /**
   * 포맷된 타임스탬프 반환
   */
  getTimestamp() {
    return new Date().toISOString()
  }

  /**
   * 로그 메시지 포맷팅
   */
  formatMessage(level, module, message, meta = {}) {
    return {
      timestamp: this.getTimestamp(),
      level,
      module,
      message,
      meta,
      env: process.env.NODE_ENV,
    }
  }

  /**
   * 콘솔 출력 (Development용)
   */
  logToConsole(level, module, message, meta) {
    const timestamp = this.getTimestamp()
    const prefix = `[${timestamp}] [${level}] [${module}]`

    switch (level) {
      case 'DEBUG':
        console.debug(prefix, message, meta)
        break
      case 'INFO':
        console.info(prefix, message, meta)
        break
      case 'WARN':
        console.warn(prefix, message, meta)
        break
      case 'ERROR':
        console.error(prefix, message, meta)
        break
    }
  }

  /**
   * LogAggregator에 로그 저장 (Production용)
   */
  logToAggregator(level, module, message, meta) {
    if (this.logAggregator && typeof this.logAggregator.addLog === 'function') {
      this.logAggregator.addLog({
        level,
        module,
        message,
        details: meta,
        timestamp: new Date(),
      })
    }
  }

  /**
   * 통합 로그 메서드
   */
  log(level, module, message, meta = {}) {
    const levelValue = LOG_LEVELS[level] || LOG_LEVELS.INFO

    if (levelValue < this.logLevel) {
      return
    }

    // Development: 콘솔 출력
    if (process.env.NODE_ENV !== 'production') {
      this.logToConsole(level, module, message, meta)
    }

    // Production: LogAggregator 사용
    if (process.env.NODE_ENV === 'production') {
      this.logToAggregator(level, module, message, meta)
    }
  }

  /**
   * DEBUG 레벨 로그
   */
  debug(module, message, meta = {}) {
    this.log('DEBUG', module, message, meta)
  }

  /**
   * INFO 레벨 로그
   */
  info(module, message, meta = {}) {
    this.log('INFO', module, message, meta)
  }

  /**
   * WARN 레벨 로그
   */
  warn(module, message, meta = {}) {
    this.log('WARN', module, message, meta)
  }

  /**
   * ERROR 레벨 로그
   */
  error(module, message, meta = {}) {
    this.log('ERROR', module, message, meta)
  }

  /**
   * API 요청 로그 (특수 포맷)
   */
  apiRequest(module, req, meta = {}) {
    this.info(module, 'API Request', {
      method: req.method,
      url: req.url,
      query: req.query,
      ...meta,
    })
  }

  /**
   * API 응답 로그 (특수 포맷)
   */
  apiResponse(module, req, res, duration, meta = {}) {
    const level = res.statusCode >= 400 ? 'ERROR' : 'INFO'
    this.log(level, module, 'API Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ...meta,
    })
  }

  /**
   * Cron Job 로그 (특수 포맷)
   */
  cronJob(module, jobName, status, meta = {}) {
    const level = status === 'success' ? 'INFO' : 'ERROR'
    this.log(level, module, `Cron Job: ${jobName}`, {
      status,
      ...meta,
    })
  }
}

// Singleton 인스턴스
const logger = new Logger()

// 서버 사이드에서만 LogAggregator 연동
if (typeof window === 'undefined') {
  try {
    // Dynamic import로 순환 참조 방지
    import('./logAggregator.js').then(module => {
      const { getLogAggregator } = module
      const aggregator = getLogAggregator()
      logger.setLogAggregator(aggregator)
    }).catch(() => {
      // LogAggregator 없으면 무시
    })
  } catch {
    // Import 실패 무시
  }
}

module.exports = { logger, Logger }
