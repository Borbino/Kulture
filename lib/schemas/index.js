/**
 * [설명] Sanity 스키마 인덱스
 * [목적] 모든 스키마 통합 관리
 */

import author from './author.js'
import category from './category.js'
import post from './post.js'
import siteSettings from './siteSettings.js'
import vipMonitoring from './vipMonitoring.js'
import trendSnapshot from './trendSnapshot.js'
import trendTracking from './trendTracking.js'
import hotIssue from './hotIssue.js'
import dailyReport from './dailyReport.js'
import ceoFeedback from './ceoFeedback.js'
import performanceReport from './performanceReport.js'
import comment from './comment.js'
import user from './user.js'
import board from './board.js'
import report from './report.js'
import notification from './notification.js'
import message from './message.js'
import badge from './badge.js'
import follow from './follow.js'
import reaction from './reaction.js'
import activity from './activity.js'
import dailyMission from './dailyMission.js'
import userMission from './userMission.js'
import poll from './poll.js'
import pollVote from './pollVote.js'
import community from './community.js'
import event from './event.js'
import marketplaceProduct from './marketplaceProduct.js'
import marketplaceOrder from './marketplaceOrder.js'
import { emergingTrend, emergingAlert } from './emergingTrend.js'
import newsletterSubscriber from './newsletterSubscriber.js'
import premiumMember from './premiumMember.js'
import dataLicensingRequest from './dataLicensingRequest.js'

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

  // Emerging trend detection
  emergingTrend,
  emergingAlert,

  // Revenue — newsletter & premium
  newsletterSubscriber,
  premiumMember,

  // B2B Data Licensing
  dataLicensingRequest,
]

export default schemaTypes
