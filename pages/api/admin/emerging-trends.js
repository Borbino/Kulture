/**
 * [설명] 이머징 트렌드 관리자 API
 * [목적] 이머징 엔티티 조회 / 상태 변경 (VIP 승격, 무시, 알림 해결)
 * GET  /api/admin/emerging-trends
 * PATCH /api/admin/emerging-trends
 */

import { withErrorHandler } from '../../../lib/apiErrorHandler.js';
import { verifyAdmin } from '../../../lib/auth.js';
import sanity from '../../../lib/sanityClient.js';
import { logger } from '../../../lib/logger.js';

async function handler(req, res) {
  // 관리자 인증 확인 (role 또는 ADMIN_EMAILS 기반)
  let adminUser;
  try {
    adminUser = await verifyAdmin(req, res);
  } catch {
    return res.status(403).json({ success: false, message: '관리자 권한이 필요합니다.' });
  }

  // ===== GET: 목록 조회 =====
  if (req.method === 'GET') {
    const { status, type, limit = 100 } = req.query;

    // 알림 조회
    if (type === 'alerts') {
      const alerts = await sanity.fetch(
        `*[_type == "emergingAlert"] | order(detectedAt desc)[0...$limit]{
          _id, entity, velocityScore, alertLevel, message, resolved, resolvedAt, resolvedBy, detectedAt
        }`,
        { limit: parseInt(limit) }
      );
      return res.status(200).json({ success: true, alerts: alerts || [] });
    }

    // 트렌드 조회
    const filter = status
      ? `_type == "emergingTrend" && status == $status`
      : `_type == "emergingTrend"`;

    const trends = await sanity.fetch(
      `*[${filter}] | order(velocityScore desc)[0...$limit]{
        _id, entity, entityType, velocityScore, mentionCount, sourceDiversity,
        sources, status, promotedToVip, isKpopRelated, firstDetected, lastSeen,
        sampleContent, adminNote
      }`,
      { status: status || '', limit: parseInt(limit) }
    );

    return res.status(200).json({ success: true, trends: trends || [] });
  }

  // ===== PATCH: 상태 변경 =====
  if (req.method === 'PATCH') {
    const { trendId, alertId, action, adminNote, resolvedBy } = req.body;

    // 알림 해결 처리
    if (alertId && action === 'resolve_alert') {
      await sanity.patch(alertId).set({
        resolved: true,
        resolvedAt: new Date().toISOString(),
        resolvedBy: resolvedBy || adminUser.email,
      }).commit();
      logger.info('[admin]', 'Emerging alert resolved', { alertId, by: adminUser.email });
      return res.status(200).json({ success: true, action: 'alert_resolved' });
    }

    if (!trendId || !action) {
      return res.status(400).json({ success: false, message: 'trendId, action 필드가 필요합니다.' });
    }

    if (!['promote', 'dismiss', 'track'].includes(action)) {
      return res.status(400).json({ success: false, message: '유효하지 않은 action입니다.' });
    }

    if (action === 'promote') {
      // VIP 승격: emergingTrend 상태 변경 + 관리자 주의 필요 안내 로그
      await sanity.patch(trendId).set({
        status: 'promoted_to_vip',
        promotedToVip: true,
        adminNote: adminNote || `VIP 승격 by ${adminUser.email} at ${new Date().toISOString()}`,
      }).commit();
      logger.info('[admin]', 'Emerging entity promoted to VIP', { trendId, by: adminUser.email });
      // TODO: vipMonitoring.js VIP_MAP에 자동 추가 기능 (다음 Phase)
    } else if (action === 'dismiss') {
      await sanity.patch(trendId).set({
        status: 'dismissed',
        adminNote: adminNote || `Dismissed by ${adminUser.email} at ${new Date().toISOString()}`,
      }).commit();
      logger.info('[admin]', 'Emerging entity dismissed', { trendId, by: adminUser.email });
    } else if (action === 'track') {
      await sanity.patch(trendId).set({
        status: 'tracking',
        adminNote: adminNote || `Tracking started by ${adminUser.email}`,
      }).commit();
    }

    return res.status(200).json({ success: true, action });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

export default withErrorHandler(handler);
