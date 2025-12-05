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
import board from './board'
import report from './report'
import notification from './notification'
import message from './message'
import badge from './badge'
import follow from './follow'
import reaction from './reaction'
import activity from './activity'
import dailyMission from './dailyMission'
import userMission from './userMission'
import poll from './poll'
import pollVote from './pollVote'
import community from './community'
import event from './event'
import marketplaceProduct from './marketplaceProduct'
import marketplaceOrder from './marketplaceOrder'

export const schemaTypes = [
  // Core schemas
  author,
  category,
  post,
  siteSettings,
  comment,
  user,
  
  // Community features
  board,
  report,
  notification,
  message,
  badge,
  
  // Social features
  follow,
  reaction,
  activity,
  
  // Gamification
  dailyMission,
  userMission,

  // Polls & Voting
  poll,
  pollVote,

  // Communities & Events
  community,
  event,

  // Marketplace
  marketplaceProduct,
  marketplaceOrder,

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
