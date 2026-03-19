/**
 * [설명] Stripe Webhook 처리 API
 * [목적] Stripe 결제 이벤트 수신 → 멤버십 자동 활성화/취소
 * POST /api/premium/webhook
 */

import { withErrorHandler } from '../../../lib/apiErrorHandler.js';
import { handleStripeWebhook } from '../../../lib/premiumMembership.js';
import { logger } from '../../../lib/logger.js';

export const config = { api: { bodyParser: false } };

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeWebhookSecret) {
    logger.error('[premium/webhook]', 'STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ success: false });
  }

  // Raw body 읽기 (서명 검증에 필요)
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString('utf8');

  const signature = req.headers['stripe-signature'];
  if (!signature) {
    return res.status(400).json({ success: false, message: 'Missing stripe-signature header' });
  }

  // Stripe 서명 검증 (타이밍 공격 방어)
  let event;
  try {
    // stripe 패키지 없이 직접 검증
    const computedSig = await verifyStripeSignature(rawBody, signature, stripeWebhookSecret);
    if (!computedSig) {
      logger.warn('[premium/webhook]', 'Invalid Stripe signature');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }
    event = JSON.parse(rawBody);
  } catch (error) {
    logger.error('[premium/webhook]', 'Webhook signature verification failed', { error: error.message });
    return res.status(400).json({ success: false });
  }

  try {
    await handleStripeWebhook(event);
    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error('[premium/webhook]', 'Webhook handler error', { error: error.message, type: event?.type });
    return res.status(500).json({ success: false });
  }
}

/**
 * Stripe 웹훅 서명 검증 (stripe npm 없이 crypto 활용)
 */
async function verifyStripeSignature(payload, sigHeader, secret) {
  const { createHmac, timingSafeEqual } = await import('crypto');
  const parts = sigHeader.split(',');
  const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1];
  const signature = parts.find(p => p.startsWith('v1='))?.split('=')[1];

  if (!timestamp || !signature) return false;

  // 리플레이 공격 방어: 5분 이내
  const tolerance = 300;
  if (Math.abs(Date.now() / 1000 - parseInt(timestamp)) > tolerance) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expected = createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');

  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
}

export default withErrorHandler(handler);
