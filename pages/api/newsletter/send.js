/**
 * [설명] 뉴스레터 발송 API (Cron 트리거)
 * [목적] K-Culture 트렌드 뉴스레터 배치 발송
 * POST /api/newsletter/send — 즉시 발송 (관리자 전용)
 * cron: 0 9 * * 1,4 (월·목 오전 9시, 주 2회)
 */

import { withCronAuth } from '../../../lib/cronMiddleware.js';
import { withErrorHandler } from '../../../lib/apiErrorHandler.js';
import { sendTrendNewsletter } from '../../../lib/newsletter.js';
import sanity from '../../../lib/sanityClient.js';
import { logger } from '../../../lib/logger.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { language = 'en', testMode = false } = req.body || {};

  // 최신 트렌드 + 핫이슈 Sanity에서 조회
  const [snapshot, hotIssues] = await Promise.all([
    sanity.fetch(`*[_type == "trendSnapshot"] | order(timestamp desc)[0]{ trends[0...10] }`),
    sanity.fetch(`*[_type == "hotIssue"] | order(mentions desc)[0...5]{ keyword, description, mentions }`),
  ]);

  const trends = snapshot?.trends || [];

  if (trends.length === 0) {
    logger.warn('[newsletter]', 'No trend data available for newsletter');
    return res.status(200).json({ success: true, sent: 0, reason: 'no_trends' });
  }

  if (testMode) {
    logger.info('[newsletter]', 'Test mode — newsletter not actually sent', { language });
    return res.status(200).json({ success: true, mode: 'test', trends: trends.length, hotIssues: hotIssues.length });
  }

  // 지원 언어 전체 발송
  const languages = Array.isArray(language) ? language : [language];
  const results = {};

  for (const lang of languages) {
    results[lang] = await sendTrendNewsletter({ trends, hotIssues, language: lang });
  }

  const totalSent = Object.values(results).reduce((sum, r) => sum + (r.sent || 0), 0);
  logger.info('[newsletter]', 'Batch newsletter complete', { results, totalSent });

  return res.status(200).json({ success: true, results, totalSent });
}

export default withCronAuth(withErrorHandler(handler));
