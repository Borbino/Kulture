/**
 * GET /api/admin/ai-status
 *
 * [역할] 현재 AI 모델 상태를 관리자가 한눈에 확인
 *  - 어떤 AI가 지금 작동 중인가
 *  - 어떤 AI가 실패/쿨다운 중인가
 *  - 총 API 호출 통계
 *
 * [보안] ADMIN_API_KEY 헤더 검증 필수
 */

import { getModelStatus } from '../../../lib/aiModelManager.js';
import { verifyAdmin } from '../../../lib/auth.js';

export default async function handler(req, res) {
  // GET 요청만 허용
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 관리자 세션 검증
  try {
    await verifyAdmin(req, res);
  } catch {
    return res.status(401).json({ error: '인증 실패 — 관리자 권한이 필요합니다.' });
  }

  try {
    const status = getModelStatus();

    // 응답 보강: 인간이 이해하기 쉬운 형태로 가공
    const summary = {
      // 현재 사용 가능한 AI
      available: status.providers
        .filter(p => p.available && !p.inCooldown)
        .map(p => ({
          name: p.name,
          successRate: p.successCount > 0
            ? `${Math.round((p.successCount / (p.successCount + p.failCount)) * 100)}%`
            : 'N/A',
          avgResponseMs: p.avgResponseMs ? `${Math.round(p.avgResponseMs)}ms` : 'N/A',
          remainingCalls: p.rateLimit
            ? `일 ${p.rateLimit.rpd}회 / 분 ${p.rateLimit.rpm}회`
            : '제한없음',
        })),

      // 쿨다운/실패 중인 AI
      unavailable: status.providers
        .filter(p => !p.available || p.inCooldown)
        .map(p => ({
          name: p.name,
          reason: p.inCooldown
            ? `쿨다운 중 (${p.cooldownRemainingSec}초 남음)`
            : p.available ? '정상' : '비활성화',
        })),

      // 전체 통계
      stats: {
        totalCalls: status.stats.totalCalls,
        successRate: status.stats.totalCalls > 0
          ? `${Math.round((status.stats.successfulCalls / status.stats.totalCalls) * 100)}%`
          : 'N/A',
        currentBestModel: status.currentBestModel || '자동 선택 중',
        lastUpdated: status.lastUpdated,
      },

      // 원시 데이터 (디버깅용)
      raw: status,
    };

    return res.status(200).json({
      ok: true,
      message: '✅ AI 모델 상태 조회 성공',
      summary,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: `상태 조회 실패: ${error.message}`,
    });
  }
}
