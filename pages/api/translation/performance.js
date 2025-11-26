/**
 * [설명] 번역 성능 대시보드 API
 * [일시] 2025-11-26 (KST)
 * [목적] 관리자용 번역 성능 모니터링 데이터 제공
 */

import { translationMonitor } from '../../../lib/translationPerformanceMonitor.js';
import { withErrorHandler } from '../../../lib/apiErrorHandler.js';

async function handler(req, res) {
  if (req.method === 'GET') {
    // 성능 리포트 조회
    const report = translationMonitor.generateReport();
    return res.status(200).json(report);
  }

  if (req.method === 'POST' && req.body.action === 'reset') {
    // 통계 초기화 (관리자 전용)
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'kulture2025';
    
    if (req.body.password !== adminPassword) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    translationMonitor.reset();
    return res.status(200).json({ message: 'Statistics reset successfully' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withErrorHandler(handler);
