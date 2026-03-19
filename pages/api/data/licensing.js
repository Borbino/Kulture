/**
 * [설명] 데이터 라이선싱 B2B API
 * [목적] K-Culture 트렌드 데이터를 외부 기업에 판매
 * [수익] API 키당 월 $99-499 (플랜별 차등)
 *
 * GET  /api/data/licensing — 플랜 정보 + API 키 발급 안내
 * POST /api/data/licensing — API 키 발급 신청
 */

import { withErrorHandler } from '../../../lib/apiErrorHandler.js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import sanity from '../../../lib/sanityClient.js';
import crypto from 'crypto';
import { logger } from '../../../lib/logger.js';

// ========== B2B 플랜 정의 ==========

export const DATA_PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    priceUSD: 99,
    requestsPerMonth: 1000,
    endpointsAccess: ['trends', 'hotIssues'],
    rateLimit: '10 req/min',
    description: '소규모 리서치 및 개인 프로젝트',
    dataDelay: '1시간 지연 데이터',
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    priceUSD: 299,
    requestsPerMonth: 10000,
    endpointsAccess: ['trends', 'hotIssues', 'vip', 'emerging'],
    rateLimit: '60 req/min',
    description: '미디어, 에이전시, 중간 규모 서비스',
    dataDelay: '실시간',
    support: '이메일 지원',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    priceUSD: 499,
    requestsPerMonth: 100000,
    endpointsAccess: ['trends', 'hotIssues', 'vip', 'emerging', 'sentiment', 'forecast'],
    rateLimit: '300 req/min',
    description: '대기업, 방송사, 글로벌 미디어',
    dataDelay: '실시간 + 웹훅',
    support: '전용 슬랙 채널',
    extras: ['커스텀 웹훅', 'CSV 일괄 다운로드', '맞춤 리포트'],
  },
};

async function handler(req, res) {
  // ===== GET: 플랜 안내 =====
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      service: 'Kulture Data Licensing API',
      description: 'K-Culture 트렌드 실시간 데이터 B2B API',
      contact: process.env.B2B_CONTACT_EMAIL || 'b2b@kulture.wiki',
      plans: Object.values(DATA_PLANS),
      endpoints: [
        { path: '/api/data/export?type=trends', description: '실시간 트렌드 데이터' },
        { path: '/api/data/export?type=hotIssues', description: '핫이슈 목록' },
        { path: '/api/data/export?type=vip', description: 'VIP 모니터링 요약' },
        { path: '/api/data/export?type=emerging', description: '이머징 트렌드 (Professional+)' },
        { path: '/api/data/export?type=sentiment', description: '감성 분석 데이터 (Enterprise)' },
      ],
      authentication: 'X-Kulture-API-Key 헤더에 API 키 포함',
    });
  }

  // ===== POST: API 키 발급 신청 =====
  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }

    const { planId, companyName, useCase, website } = req.body;

    if (!DATA_PLANS[planId]) {
      return res.status(400).json({ success: false, message: '유효하지 않은 플랜입니다.' });
    }
    if (!companyName || typeof companyName !== 'string' || companyName.length > 200) {
      return res.status(400).json({ success: false, message: '기업명을 입력해주세요.' });
    }

    const userId = session.user.id || session.user.email;
    const apiKey = `kulture_${planId}_${crypto.randomBytes(20).toString('hex')}`;
    const plan = DATA_PLANS[planId];

    // Sanity에 API 키 신청 저장 (관리자 승인 후 활성화)
    await sanity.create({
      _type: 'dataLicensingRequest',
      userId,
      email: session.user.email,
      companyName,
      useCase: useCase?.slice(0, 500) || '',
      website: website?.slice(0, 200) || '',
      planId,
      planName: plan.name,
      monthlyFee: plan.priceUSD,
      apiKey,
      status: 'pending', // pending → approved → active → suspended
      requestedAt: new Date().toISOString(),
    });

    logger.info('[data/licensing]', 'B2B API key request', { userId, planId, companyName });

    return res.status(201).json({
      success: true,
      message: '신청이 접수되었습니다. 영업일 기준 1-2일 내 검토 후 이메일로 안내드립니다.',
      planId,
      planName: plan.name,
    });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

export default withErrorHandler(handler);
