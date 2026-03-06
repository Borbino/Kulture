/**
 * [설명] 프리미엄 멤버십 구독 API
 * [목적] Stripe / Toss Payments 결제 세션 생성
 * POST /api/premium/subscribe
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { withErrorHandler } from '../../../lib/apiErrorHandler';
import { PLANS, createStripeCheckout, createTossPayment } from '../../../lib/premiumMembership';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://kulture.wiki';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
  }

  const { planId, provider = 'stripe' } = req.body;

  if (!['monthly', 'annual', 'lifetime'].includes(planId)) {
    return res.status(400).json({ success: false, message: '유효하지 않은 플랜입니다.' });
  }

  if (!['stripe', 'toss'].includes(provider)) {
    return res.status(400).json({ success: false, message: '유효하지 않은 결제 수단입니다.' });
  }

  const userId = session.user.id || session.user.email;
  const email = session.user.email;

  if (provider === 'stripe') {
    const checkout = await createStripeCheckout({
      userId,
      email,
      planId,
      successUrl: `${BASE_URL}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${BASE_URL}/premium`,
    });
    return res.status(200).json({ success: true, checkoutUrl: checkout.checkoutUrl });
  }

  if (provider === 'toss') {
    const orderId = `kulture_${userId}_${Date.now()}`;
    const params = await createTossPayment({ userId, email, planId, orderId });
    return res.status(200).json({ success: true, toss: params });
  }
}

export default withErrorHandler(handler);
