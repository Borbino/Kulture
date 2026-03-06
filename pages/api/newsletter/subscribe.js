/**
 * [설명] 뉴스레터 구독 API
 * [목적] 이메일 옵트인 처리 (이중 옵트인 방식)
 * POST /api/newsletter/subscribe
 * GET  /api/newsletter/confirm?token=...
 * GET  /api/newsletter/unsubscribe?token=...
 */

import { withErrorHandler } from '../../../lib/apiErrorHandler';
import {
  subscribeToNewsletter,
  confirmSubscription,
  unsubscribeFromNewsletter,
} from '../../../lib/newsletter';
import { rateLimiter } from '../../../lib/rateLimiter';

async function handler(req, res) {
  if (req.method === 'POST') {
    // 레이트 리밋: IP당 분당 3회
    const rateKey = `newsletter_sub_${req.headers['x-forwarded-for'] || 'unknown'}`;
    const limited = await rateLimiter(rateKey, 3, 60);
    if (limited) {
      return res.status(429).json({ success: false, message: '잠시 후 다시 시도해주세요.' });
    }

    const { email, name, language, interests, source } = req.body;

    // 입력 검증
    if (!email || typeof email !== 'string' || email.length > 254) {
      return res.status(400).json({ success: false, message: '유효한 이메일을 입력해주세요.' });
    }
    if (name && typeof name !== 'string') {
      return res.status(400).json({ success: false, message: '이름 형식이 올바르지 않습니다.' });
    }

    const result = await subscribeToNewsletter({
      email: email.trim(),
      name: name?.trim()?.slice(0, 100) || '',
      language: ['ko', 'en', 'ja', 'zh', 'es', 'fr'].includes(language) ? language : 'en',
      interests: Array.isArray(interests) ? interests.slice(0, 5) : [],
      source: source?.slice(0, 50) || 'website',
    });

    if (!result.success) {
      const messages = {
        ALREADY_SUBSCRIBED: '이미 구독 중인 이메일입니다.',
        INVALID_EMAIL: '유효한 이메일 주소를 입력해주세요.',
      };
      return res.status(409).json({ success: false, message: messages[result.error] || result.error });
    }

    return res.status(201).json({
      success: true,
      message: '확인 이메일을 발송했습니다. 메일함을 확인해주세요.',
      action: result.action,
    });
  }

  if (req.method === 'GET') {
    const { action, token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, message: '유효하지 않은 요청입니다.' });
    }

    if (action === 'confirm') {
      const result = await confirmSubscription(token);
      if (!result.success) {
        return res.status(400).json({ success: false, message: '유효하지 않거나 만료된 토큰입니다.' });
      }
      // 확인 완료 → 감사 페이지로 리다이렉트
      return res.redirect(302, '/newsletter/confirmed');
    }

    if (action === 'unsubscribe') {
      const result = await unsubscribeFromNewsletter(token);
      if (!result.success) {
        return res.status(400).json({ success: false, message: '유효하지 않은 토큰입니다.' });
      }
      return res.redirect(302, '/newsletter/unsubscribed');
    }

    return res.status(400).json({ success: false, message: 'action 파라미터가 필요합니다.' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

export default withErrorHandler(handler);
