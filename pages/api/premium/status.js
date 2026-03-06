/**
 * [설명] 프리미엄 멤버십 상태 조회 API
 * [목적] 현재 로그인 사용자의 멤버십 상태 + 플랜 정보 반환
 * GET /api/premium/status
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { withErrorHandler } from '../../../lib/apiErrorHandler';
import { getMembershipStatus, PLANS } from '../../../lib/premiumMembership';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(200).json({ isPremium: false, plans: Object.values(PLANS) });
  }

  const userId = session.user.id || session.user.email;
  const status = await getMembershipStatus(userId);

  return res.status(200).json({
    ...status,
    plans: Object.values(PLANS).map(p => ({
      id: p.id,
      name: p.name,
      priceUSD: p.priceUSD,
      priceKRW: p.priceKRW,
      interval: p.interval,
      discount: p.discount,
      description: p.description,
      features: p.features,
    })),
  });
}

export default withErrorHandler(handler);
