/**
 * [설명] 이머징 트렌드 자동 발굴 Cron Job
 * [실행주기] 3시간마다 (일 8회)
 * [목적] 관리자 미지정 신규 인물·그룹·이슈를 글로벌 소스에서 자동 탐지
 * [원칙 14] VIP 미지정이어도 트래픽·SNS 기반 급부상 엔티티 자동 등록
 */

import { scrapeFreeSources } from '../../../lib/autonomousScraper.js';
import { runEmergingTrendScan } from '../../../lib/emergingTrendDetector.js';
import { withCronAuth } from '../../../lib/cronMiddleware.js';
import sanity from '../../../lib/sanityClient.js';
import { logger } from '../../../lib/logger.js';

export default withCronAuth(async function emergingTrendScanHandler(req, res) {
  const startTime = Date.now();

  try {
    logger.info('[cron]', '[Emerging Trend Scan] Starting global emerging trend discovery...');

    // 1. 전체 글로벌 소스 수집 (31개 무료 소스)
    const rawItems = await scrapeFreeSources();
    logger.info('[cron]', `[Emerging Trend Scan] Collected ${rawItems.length} raw items`);

    // 2. 이머징 트렌드 발굴 (Zero-prior-knowledge)
    const result = await runEmergingTrendScan(rawItems);

    // 3. 알림 레벨 엔티티 긴급 저장 (관리자 즉시 확인용)
    if (result.alerted > 0 && result.topEntities) {
      const alertEntities = result.topEntities.filter(e => e.shouldAlert);
      for (const entity of alertEntities) {
        await sanity.createOrReplace({
          _id: `alert-emerging-${entity.entity.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          _type: 'emergingAlert',
          entity: entity.entity,
          velocityScore: entity.velocityScore,
          sourceCount: entity.sources,
          status: 'unreviewed',
          detectedAt: new Date().toISOString(),
        });
        logger.warn('[cron]', `[EMERGING ALERT] "${entity.entity}" (score: ${entity.velocityScore}, ${entity.sources} sources)`);
      }
    }

    const elapsed = Date.now() - startTime;
    logger.info('[cron]', `[Emerging Trend Scan] Completed in ${elapsed}ms`, result);

    return res.status(200).json({
      success: true,
      elapsed,
      rawItemsCollected: rawItems.length,
      ...result,
    });
  } catch (error) {
    logger.error('[cron]', '[Emerging Trend Scan] Fatal error', { error: error.message });
    return res.status(500).json({ error: error.message });
  }
});
