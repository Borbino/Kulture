/**
 * [설명] 사이트 설정 관리 유틸리티
 * [일시] 2025-11-19 14:00 (KST)
 * [목적] Sanity CMS에서 사이트 설정을 조회하고 관리
 */

import { useState, useEffect } from 'react'
import client from './sanityClient'

/**
 * 기본 설정값 (Sanity 조회 실패 시 폴백)
 */
export const DEFAULT_SETTINGS = {
  contentRestriction: {
    enabled: true,
    visiblePercentage: 40,
    applyToText: true,
    applyToComments: true,
    applyToImages: true,
    freeImageCount: 2,
  },
  adWatchFeature: {
    enabled: true,
    adDuration: 30,
    sessionDuration: 60,
    adSenseClientId: 'ca-pub-xxxxxxxxxxxxxxxx',
    showAsOption: true,
  },
  comments: {
    enabled: true,
    requireLogin: true,
    moderationEnabled: false,
  },
  authentication: {
    allowSignup: true,
    requireEmailVerification: false,
    socialLoginEnabled: false,
  },
  translationSystem: {
    enabled: true,
    defaultLanguage: 'ko',
    qualityThreshold: 7,
    primaryProvider: 'openai',
    enableCache: true,
    autoDetectLanguage: true,
  },
  gamification: {
    enabled: true,
    dailyMissionsEnabled: true,
    levelSystemEnabled: true,
    badgesEnabled: true,
    pointMultiplier: 1.0,
    streakBonusEnabled: true,
    leaderboardEnabled: true,
  },
  trends: {
    enabled: true,
    trendWidgetEnabled: true,
    trendHubEnabled: true,
    vipMonitoringEnabled: true,
    hotIssueEnabled: true,
    updateFrequencyMinutes: 60,
    hotIssueMentionThreshold: 1000,
  },
  realTimeChat: {
    enabled: true,
    autoTranslate: true,
    messageHistoryCount: 50,
    typingIndicatorEnabled: true,
    requireLogin: true,
    maxRoomSize: 100,
  },
  aiContentGeneration: {
    enabled: true,
    contentTypes: ['article', 'guide', 'review', 'news', 'tutorial'],
    autoGenerationSchedule: ['09:00', '12:00', '15:00', '18:00'],
    requireCeoApproval: true,
    multilingualPublish: true,
  },
  socialFeatures: {
    followSystemEnabled: true,
    reactionsEnabled: true,
    enabledReactions: ['love', 'like', 'laugh', 'wow', 'sad', 'angry'],
    activityFeedEnabled: true,
    activityTypes: ['post_created', 'comment_added', 'post_liked', 'user_followed', 'badge_earned', 'level_up', 'reaction_added'],
    userProfilesEnabled: true,
  },
  general: {
    siteName: 'Kulture',
    maintenanceMode: false,
    maintenanceMessage: '사이트 점검 중입니다. 잠시 후 다시 이용해 주세요.',
  },
}

/**
 * Sanity에서 사이트 설정 조회
 * @returns {Promise<Object>} 사이트 설정 객체
 */
export async function getSiteSettings() {
  try {
    const query = `*[_type == "siteSettings"][0]`
    const settings = await client.fetch(query)

    if (!settings) {
      console.warn('[Settings] No settings found in Sanity, using defaults')
      return DEFAULT_SETTINGS
    }

    // 기본값과 병합 (누락된 필드 대비)
    return {
      contentRestriction: {
        ...DEFAULT_SETTINGS.contentRestriction,
        ...(settings.contentRestriction || {}),
      },
      adWatchFeature: {
        ...DEFAULT_SETTINGS.adWatchFeature,
        ...(settings.adWatchFeature || {}),
      },
      comments: {
        ...DEFAULT_SETTINGS.comments,
        ...(settings.comments || {}),
      },
      authentication: {
        ...DEFAULT_SETTINGS.authentication,
        ...(settings.authentication || {}),
      },
      translationSystem: {
        ...DEFAULT_SETTINGS.translationSystem,
        ...(settings.translationSystem || {}),
      },
      gamification: {
        ...DEFAULT_SETTINGS.gamification,
        ...(settings.gamification || {}),
      },
      trends: {
        ...DEFAULT_SETTINGS.trends,
        ...(settings.trends || {}),
      },
      realTimeChat: {
        ...DEFAULT_SETTINGS.realTimeChat,
        ...(settings.realTimeChat || {}),
      },
      aiContentGeneration: {
        ...DEFAULT_SETTINGS.aiContentGeneration,
        ...(settings.aiContentGeneration || {}),
      },
      socialFeatures: {
        ...DEFAULT_SETTINGS.socialFeatures,
        ...(settings.socialFeatures || {}),
      },
      general: {
        ...DEFAULT_SETTINGS.general,
        ...(settings.general || {}),
      },
    }
  } catch (error) {
    console.error('[Settings] Error fetching settings:', error)
    return DEFAULT_SETTINGS
  }
}

/**
 * Sanity에 사이트 설정 업데이트
 * @param {Object} updates - 업데이트할 설정 객체
 * @returns {Promise<Object>} 업데이트된 설정
 */
export async function updateSiteSettings(updates) {
  try {
    // 기존 설정 조회
    const query = `*[_type == "siteSettings"][0]`
    const existing = await client.fetch(query)

    if (existing) {
      // 업데이트
      const updated = await client
        .patch(existing._id)
        .set({
          ...updates,
          meta: {
            lastUpdated: new Date().toISOString(),
            updatedBy: 'CEO (Admin)',
          },
        })
        .commit()

      return updated
    } else {
      // 신규 생성
      const created = await client.create({
        _type: 'siteSettings',
        title: 'Kulture Site Settings',
        ...updates,
        meta: {
          lastUpdated: new Date().toISOString(),
          updatedBy: 'CEO (Admin)',
        },
      })

      return created
    }
  } catch (error) {
    console.error('[Settings] Error updating settings:', error)
    throw error
  }
}

/**
 * React Hook: 사이트 설정 조회 및 구독
 * @returns {Object} { settings, loading, error, refresh }
 */
export function useSiteSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getSiteSettings()
      setSettings(data)
    } catch (err) {
      setError(err)
      setSettings(DEFAULT_SETTINGS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return {
    settings,
    loading,
    error,
    refresh: fetchSettings,
  }
}

/**
 * 특정 기능의 활성화 여부 확인
 * @param {Object} settings - 사이트 설정
 * @param {string} feature - 기능 경로 (예: 'contentRestriction.enabled')
 * @returns {boolean}
 */
export function isFeatureEnabled(settings, feature) {
  const keys = feature.split('.')
  let value = settings

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key]
    } else {
      return false
    }
  }

  return value === true
}

/**
 * 설정 값 조회 헬퍼
 * @param {Object} settings - 사이트 설정
 * @param {string} path - 설정 경로 (예: 'contentRestriction.visiblePercentage')
 * @param {*} defaultValue - 기본값
 * @returns {*}
 */
export function getSettingValue(settings, path, defaultValue = null) {
  const keys = path.split('.')
  let value = settings

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key]
    } else {
      return defaultValue
    }
  }

  return value !== undefined ? value : defaultValue
}
