/**
 * [설명] K-Culture 데이터 내보내기 API (B2B)
 * [목적] API 키 인증된 외부 기업에 트렌드 데이터 제공
 * GET /api/data/export?type=trends|hotIssues|vip|emerging|sentiment
 */

import { withErrorHandler } from '../../../lib/apiErrorHandler';
import sanity from '../../../lib/sanityClient';
import logger from '../../../lib/logger';
import { DATA_PLANS } from './licensing';

// 플랜별 접근 가능 엔드포인트 매핑
const PLAN_ENDPOINTS = {
  starter: ['trends', 'hotIssues'],
  professional: ['trends', 'hotIssues', 'vip', 'emerging'],
  enterprise: ['trends', 'hotIssues', 'vip', 'emerging', 'sentiment', 'forecast'],
};

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // API 키 인증
  const apiKey = req.headers['x-kulture-api-key'];
  if (!apiKey) {
    return res.status(401).json({ success: false, message: 'X-Kulture-API-Key 헤더가 필요합니다.' });
  }

  // API 키 유효성 + 플랜 확인
  const keyRecord = await sanity.fetch(
    `*[_type == "dataLicensingRequest" && apiKey == $apiKey && status == "active"][0]{
      _id, planId, requestsUsed, requestsLimit, monthlyResetAt, userId
    }`,
    { apiKey }
  );

  if (!keyRecord) {
    logger.warn('[data/export]', 'Invalid API key attempt', { apiKey: apiKey.slice(0, 20) + '...' });
    return res.status(403).json({ success: false, message: '유효하지 않거나 미승인된 API 키입니다.' });
  }

  const plan = DATA_PLANS[keyRecord.planId];
  if (!plan) {
    return res.status(403).json({ success: false, message: '플랜 정보를 찾을 수 없습니다.' });
  }

  // 월간 요청 한도 확인
  const monthlyReset = keyRecord.monthlyResetAt ? new Date(keyRecord.monthlyResetAt) : null;
  const now = new Date();
  let usedRequests = keyRecord.requestsUsed || 0;

  if (monthlyReset && now > monthlyReset) {
    // 월 초기화
    usedRequests = 0;
    await sanity.patch(keyRecord._id).set({
      requestsUsed: 0,
      monthlyResetAt: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
    }).commit();
  }

  if (usedRequests >= plan.requestsPerMonth) {
    return res.status(429).json({
      success: false,
      message: '월간 요청 한도를 초과했습니다.',
      limit: plan.requestsPerMonth,
      used: usedRequests,
    });
  }

  const { type = 'trends', limit = 20, since } = req.query;
  const allowedTypes = PLAN_ENDPOINTS[keyRecord.planId] || [];

  if (!allowedTypes.includes(type)) {
    return res.status(403).json({
      success: false,
      message: `'${type}' 데이터는 현재 플랜에서 접근 불가합니다.`,
      allowedTypes,
      upgradeUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://kulture.wiki'}/data-api`,
    });
  }

  // 레이트 리밋 헤더 추가
  res.setHeader('X-RateLimit-Limit', plan.requestsPerMonth);
  res.setHeader('X-RateLimit-Remaining', plan.requestsPerMonth - usedRequests - 1);
  res.setHeader('X-Plan', keyRecord.planId);

  // 사용량 증가 (비동기 — 응답 지연 방지)
  sanity.patch(keyRecord._id).inc({ requestsUsed: 1 }).commit().catch(() => {});

  const parsedLimit = Math.min(parseInt(limit) || 20, 100);
  const sinceFilter = since ? ` && timestamp > "${since}"` : '';

  let data;
  try {
    switch (type) {
      case 'trends':
        data = await sanity.fetch(
          `*[_type == "trendSnapshot"${sinceFilter}] | order(timestamp desc)[0...$limit]{
            trends[0...30], timestamp, _id
          }`,
          { limit: parsedLimit }
        );
        break;

      case 'hotIssues':
        data = await sanity.fetch(
          `*[_type == "hotIssue"${sinceFilter}] | order(mentions desc)[0...$limit]{
            keyword, description, mentions, priority, sentiment, timestamp
          }`,
          { limit: parsedLimit }
        );
        break;

      case 'vip':
        data = await sanity.fetch(
          `*[_type == "vipMonitoring"${sinceFilter}] | order(timestamp desc)[0...$limit]{
            vipId, vipName, mentions, alertLevel, trend, timestamp
          }`,
          { limit: parsedLimit }
        );
        break;

      case 'emerging':
        data = await sanity.fetch(
          `*[_type == "emergingTrend" && status in ["detected", "tracking"]${sinceFilter}] | order(velocityScore desc)[0...$limit]{
            entity, entityType, velocityScore, mentionCount, sourceDiversity, isKpopRelated, firstDetected
          }`,
          { limit: parsedLimit }
        );
        break;

      case 'sentiment':
        // Enterprise 전용: 최근 감성 분석 데이터 집계 (hotIssue sentiment 필드 활용)
        data = await sanity.fetch(
          `*[_type == "hotIssue" && defined(sentiment)${sinceFilter}] | order(timestamp desc)[0...$limit]{
            keyword, sentiment, mentions, timestamp
          }`,
          { limit: parsedLimit }
        );
        break;

      case 'forecast':
        // Enterprise 전용: 간단한 트렌드 예측 (최근 7일 velocity 기반)
        const recentTrends = await sanity.fetch(
          `*[_type == "hotIssue"] | order(timestamp desc)[0...100]{
            keyword, mentions, timestamp
          }`
        );
        // 키워드별 증가율 계산
        data = computeForecast(recentTrends);
        break;

      default:
        return res.status(400).json({ success: false, message: '알 수 없는 type입니다.' });
    }
  } catch (err) {
    logger.error('[data/export]', 'Data fetch failed', { type, error: err.message });
    return res.status(500).json({ success: false, message: '데이터 조회 중 오류가 발생했습니다.' });
  }

  logger.info('[data/export]', 'Data exported', { type, planId: keyRecord.planId, userId: keyRecord.userId, count: Array.isArray(data) ? data.length : 1 });

  return res.status(200).json({
    success: true,
    type,
    count: Array.isArray(data) ? data.length : (data ? 1 : 0),
    generatedAt: new Date().toISOString(),
    plan: keyRecord.planId,
    data: data || [],
  });
}

/**
 * 간단한 트렌드 예측 (Enterprise 전용)
 * 최근 데이터의 언급 추세 기반 상승/하락 예측
 */
function computeForecast(items) {
  const keywordStats = {};
  const now = Date.now();

  items.forEach(item => {
    const age = (now - new Date(item.timestamp).getTime()) / (1000 * 60 * 60); // 시간
    const key = item.keyword;
    if (!keywordStats[key]) keywordStats[key] = { recent: 0, older: 0, mentions: 0 };
    if (age < 24) keywordStats[key].recent += item.mentions || 1;
    else if (age < 168) keywordStats[key].older += item.mentions || 1;
    keywordStats[key].mentions += item.mentions || 1;
  });

  return Object.entries(keywordStats)
    .map(([keyword, stats]) => {
      const velocity = stats.older > 0 ? stats.recent / stats.older : stats.recent;
      return {
        keyword,
        totalMentions: stats.mentions,
        trend: velocity > 1.5 ? 'rising' : velocity < 0.5 ? 'falling' : 'stable',
        velocityRatio: parseFloat(velocity.toFixed(2)),
        forecast: velocity > 2 ? 'breakout' : velocity > 1.2 ? 'growing' : velocity < 0.4 ? 'declining' : 'neutral',
      };
    })
    .sort((a, b) => b.velocityRatio - a.velocityRatio)
    .slice(0, 20);
}

export default withErrorHandler(handler);
