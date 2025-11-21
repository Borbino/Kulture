/**
 * [설명] Sanity 스키마 인덱스
 * [목적] 모든 스키마 통합 관리
 */

import author from './author'
import category from './category'
import post from './post'
import siteSettings from './siteSettings'
import vipMonitoring from './vipMonitoring'
import trendSnapshot from './trendSnapshot'
import trendTracking from './trendTracking'
import hotIssue from './hotIssue'
import dailyReport from './dailyReport'
import ceoFeedback from './ceoFeedback'
import performanceReport from './performanceReport'
import comment from './comment'
import user from './user'

export const schemaTypes = [
  // Core schemas
  author,
  category,
  post,
  siteSettings,
  comment,
  user,

  // VIP & Trend monitoring schemas
  vipMonitoring,
  trendSnapshot,
  trendTracking,
  hotIssue,
  dailyReport,

  // CEO feedback & learning
  ceoFeedback,

  // Performance monitoring
  performanceReport,
]

export default schemaTypes
