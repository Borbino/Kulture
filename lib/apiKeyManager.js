/**
 * API Key Manager
 * API Quota 추적 및 관리
 */

// API 일일 한도
const API_LIMITS = {
  twitter: 500000,
  youtube: 10000,
  reddit: 86400, // 60 requests/min * 24 hours
  naver: 25000,
  huggingface: 30000,
}

/**
 * API Key Manager 클래스
 */
export class APIKeyManager {
  constructor() {
    this.quotas = new Map()
    this.lastReset = new Map()
  }

  /**
   * API 사용량 추적
   */
  trackUsage(service, amount = 1) {
    const current = this.quotas.get(service) || 0
    this.quotas.set(service, current + amount)

    const limit = API_LIMITS[service]
    if (!limit) {
      console.warn(`[API Quota] Unknown service: ${service}`)
      return
    }

    // 90% 도달 시 경고
    if (current + amount > limit * 0.9) {
      console.warn(
        `[API Quota] ${service} is at ${Math.round(((current + amount) / limit) * 100)}% (${current + amount}/${limit})`
      )
    }

    // 100% 도달 시 알림
    if (current + amount >= limit) {
      console.error(`[API Quota] ${service} has reached its daily limit (${limit})`)
    }
  }

  /**
   * 현재 사용량 조회
   */
  getUsage(service) {
    return this.quotas.get(service) || 0
  }

  /**
   * 남은 Quota 조회
   */
  getRemainingQuota(service) {
    const limit = API_LIMITS[service] || 0
    const used = this.quotas.get(service) || 0
    return Math.max(0, limit - used)
  }

  /**
   * 사용률 조회
   */
  getUsagePercent(service) {
    const limit = API_LIMITS[service] || 1
    const used = this.quotas.get(service) || 0
    return Math.round((used / limit) * 100)
  }

  /**
   * Quota 리밋 도달 여부
   */
  isLimitReached(service) {
    const limit = API_LIMITS[service] || 0
    const used = this.quotas.get(service) || 0
    return used >= limit
  }

  /**
   * 일일 Quota 리셋
   */
  resetDailyQuotas() {
    this.quotas.clear()
    this.lastReset.set('daily', new Date().toISOString())
    console.log('[API Quota] Daily quotas reset')
  }

  /**
   * 모든 서비스의 사용 현황 조회
   */
  getAllUsage() {
    const usage = {}
    Object.keys(API_LIMITS).forEach(service => {
      usage[service] = {
        used: this.getUsage(service),
        limit: API_LIMITS[service],
        remaining: this.getRemainingQuota(service),
        percent: this.getUsagePercent(service),
        limitReached: this.isLimitReached(service),
      }
    })
    return usage
  }

  /**
   * 마지막 리셋 시간 조회
   */
  getLastResetTime() {
    return this.lastReset.get('daily') || null
  }
}

// Singleton 인스턴스
let instance = null

export function getAPIKeyManager() {
  if (!instance) {
    instance = new APIKeyManager()
  }
  return instance
}
