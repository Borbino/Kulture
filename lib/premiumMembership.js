/**
 * Premium Membership Service — Kulture v14.0
 *
 * [목적] 프리미엄 멤버십 구독 관리
 * [플랜] 월간 $4.99 / 연간 $47.99 (20% 할인) / 평생 $149.99
 * [게이트웨이] Stripe (글로벌) + Toss Payments (한국)
 * [혜택] 조기 콘텐츠 접근, 광고 없음, 이머징 트렌드 알림, 전용 배지
 */

import { logger } from './logger.js';
import sanity from './sanityClient.js';

// ========== 플랜 설정 ==========

export const PLANS = {
  monthly: {
    id: 'monthly',
    name: '프리미엄 월간',
    priceUSD: 4.99,
    priceKRW: 6900,
    interval: 'month',
    stripeProductId: process.env.STRIPE_PRODUCT_MONTHLY || '',
    stripePriceId: process.env.STRIPE_PRICE_MONTHLY || '',
    tosspayProductId: process.env.TOSS_PRODUCT_MONTHLY || '',
    description: '광고 없는 K-Culture 트렌드 + 조기 콘텐츠 접근',
    features: ['광고 제거', '조기 콘텐츠 공개 (24h 앞)', '프리미엄 배지', '이머징 트렌드 알림'],
  },
  annual: {
    id: 'annual',
    name: '프리미엄 연간',
    priceUSD: 47.99,
    priceKRW: 65900,
    interval: 'year',
    discount: '20% 할인',
    stripeProductId: process.env.STRIPE_PRODUCT_ANNUAL || '',
    stripePriceId: process.env.STRIPE_PRICE_ANNUAL || '',
    tosspayProductId: process.env.TOSS_PRODUCT_ANNUAL || '',
    description: '연간 구독으로 2개월 무료 혜택',
    features: ['월간 모든 혜택 포함', '2개월 무료', 'API 접근권 (개인)', '전용 Discord 채널'],
  },
  lifetime: {
    id: 'lifetime',
    name: '평생 멤버십',
    priceUSD: 149.99,
    priceKRW: 199000,
    interval: 'once',
    stripePriceId: process.env.STRIPE_PRICE_LIFETIME || '',
    description: '한 번 결제로 영구 프리미엄',
    features: ['연간 모든 혜택 포함', '평생 무료 업그레이드', 'B2B 데이터 피드 (월 100건)', '운영자 직통 피드백'],
  },
};

// ========== 멤버십 확인 ==========

/**
 * 사용자의 프리미엄 상태 조회
 * @param {string} userId
 * @returns {{ isPremium, plan, expiresAt, features }}
 */
export async function getMembershipStatus(userId) {
  if (!userId) return { isPremium: false };

  const member = await sanity.fetch(
    `*[_type == "premiumMember" && userId == $userId && status in ["active", "trial"]] | order(createdAt desc)[0]{
      _id, plan, status, currentPeriodEnd, cancelAtPeriodEnd, trialEnd
    }`,
    { userId }
  );

  if (!member) return { isPremium: false };

  const now = new Date();
  const periodEnd = member.currentPeriodEnd ? new Date(member.currentPeriodEnd) : null;
  const trialEnd = member.trialEnd ? new Date(member.trialEnd) : null;

  // 기간 만료 확인
  if (member.plan !== 'lifetime' && periodEnd && periodEnd < now) {
    await sanity.patch(member._id).set({ status: 'expired' }).commit();
    return { isPremium: false };
  }

  const planConfig = PLANS[member.plan] || PLANS.monthly;

  return {
    isPremium: true,
    plan: member.plan,
    status: member.status,
    expiresAt: member.plan === 'lifetime' ? null : (periodEnd?.toISOString() || null),
    cancelAtPeriodEnd: member.cancelAtPeriodEnd || false,
    isTrial: member.status === 'trial',
    trialEndsAt: trialEnd?.toISOString() || null,
    features: planConfig.features,
  };
}

/**
 * 관리자용: userId가 프리미엄인지 빠른 확인
 */
export async function isPremiumUser(userId) {
  const status = await getMembershipStatus(userId);
  return status.isPremium;
}

// ========== Stripe 연동 ==========

/**
 * Stripe 결제 세션 생성 (리다이렉트 방식)
 * @param {{ userId, email, planId, successUrl, cancelUrl }}
 */
export async function createStripeCheckout({ userId, email, planId, successUrl, cancelUrl }) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    logger.error('[premium]', 'STRIPE_SECRET_KEY not configured');
    throw new Error('Payment gateway not configured');
  }

  const plan = PLANS[planId];
  if (!plan?.stripePriceId) {
    throw new Error(`Invalid plan or Stripe price not configured: ${planId}`);
  }

  const isRecurring = plan.interval !== 'once';

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      'payment_method_types[]': 'card',
      mode: isRecurring ? 'subscription' : 'payment',
      [`line_items[0][price]`]: plan.stripePriceId,
      [`line_items[0][quantity]`]: '1',
      customer_email: email,
      success_url: successUrl,
      cancel_url: cancelUrl,
      [`metadata[userId]`]: userId,
      [`metadata[planId]`]: planId,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    logger.error('[premium]', 'Stripe checkout session failed', { error: err });
    throw new Error(err.error?.message || 'Failed to create checkout session');
  }

  const session = await response.json();
  logger.info('[premium]', 'Stripe checkout created', { userId, planId, sessionId: session.id });
  return { checkoutUrl: session.url, sessionId: session.id };
}

/**
 * Stripe Webhook 처리 (결제 완료 시)
 */
export async function handleStripeWebhook(event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      await activateMembership({
        userId: session.metadata?.userId,
        email: session.customer_email,
        planId: session.metadata?.planId,
        provider: 'stripe',
        subscriptionId: session.subscription || session.id,
        customerId: session.customer,
      });
      break;
    }
    case 'customer.subscription.deleted':
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      await updateMembershipBySubscriptionId(sub.id, {
        status: sub.status === 'active' ? 'active' : (sub.status === 'canceled' ? 'cancelled' : sub.status),
        currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      });
      break;
    }
    default:
      logger.info('[premium]', 'Unhandled Stripe event type', { type: event.type });
  }
}

// ========== Toss Payments 연동 (한국 전용) ==========

/**
 * Toss Payments 결제 준비
 */
export async function createTossPayment({ userId, email, planId, orderId }) {
  const tossSecretKey = process.env.TOSS_SECRET_KEY;
  if (!tossSecretKey) throw new Error('Toss Payments not configured');

  const plan = PLANS[planId];
  if (!plan) throw new Error(`Invalid plan: ${planId}`);

  logger.info('[premium]', 'Toss payment initiated', { userId, planId, orderId });

  // Toss는 프론트엔드에서 SDK를 사용하므로 여기서는 필요한 파라미터 반환
  return {
    clientKey: process.env.TOSS_CLIENT_KEY || '',
    orderId,
    orderName: plan.name,
    amount: plan.priceKRW,
    customerEmail: email,
    planId,
  };
}

/**
 * Toss Payments 승인 처리
 */
export async function confirmTossPayment({ paymentKey, orderId, amount, userId, planId }) {
  const tossSecretKey = process.env.TOSS_SECRET_KEY;
  if (!tossSecretKey) throw new Error('Toss Payments not configured');

  const credentials = Buffer.from(`${tossSecretKey}:`).toString('base64');
  const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Toss payment confirmation failed');
  }

  const payment = await response.json();

  await activateMembership({
    userId,
    planId,
    provider: 'toss',
    subscriptionId: payment.paymentKey,
    customerId: null,
  });

  logger.info('[premium]', 'Toss payment confirmed', { userId, planId, paymentKey });
  return { success: true, payment };
}

// ========== 내부 헬퍼 ==========

async function activateMembership({ userId, email, planId, provider, subscriptionId, customerId }) {
  const plan = PLANS[planId] || PLANS.monthly;
  const now = new Date();

  let periodEnd;
  if (plan.interval === 'month') {
    periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else if (plan.interval === 'year') {
    periodEnd = new Date(now);
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  // 기존 멤버십 취소
  const existing = await sanity.fetch(
    `*[_type == "premiumMember" && userId == $userId && status == "active"][0]{ _id }`,
    { userId }
  );
  if (existing) {
    await sanity.patch(existing._id).set({ status: 'cancelled' }).commit();
  }

  await sanity.create({
    _type: 'premiumMember',
    userId,
    email,
    plan: planId,
    status: 'active',
    provider,
    subscriptionId,
    customerId,
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: periodEnd?.toISOString() || null,
    cancelAtPeriodEnd: false,
    createdAt: now.toISOString(),
  });

  logger.info('[premium]', 'Membership activated', { userId, planId, provider });
}

async function updateMembershipBySubscriptionId(subscriptionId, updates) {
  const member = await sanity.fetch(
    `*[_type == "premiumMember" && subscriptionId == $sid][0]{ _id }`,
    { sid: subscriptionId }
  );
  if (!member) return;
  await sanity.patch(member._id).set(updates).commit();
  logger.info('[premium]', 'Membership updated', { subscriptionId, ...updates });
}
