/**
 * Newsletter Service — Kulture v14.0
 *
 * [목적] 이메일 뉴스레터 구독 관리 + K-Culture 트렌드 뉴스레터 발송
 * [채널] SendGrid (EMAIL_API_KEY), 무료 100이메일/일
 * [수익] 구독자당 $0.002 RPM → 10,000명 × 2회/주 → 월 ~$160
 */

import { logger } from './logger.js';
import sanity from './sanityClient.js';
import crypto from 'crypto';

// ========== 설정 ==========

const FROM_EMAIL = process.env.EMAIL_FROM || 'newsletter@kulture.wiki';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'Kulture Newsletter';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://kulture.wiki';

// ========== 구독 관리 ==========

/**
 * 이메일 뉴스레터 구독 등록
 * @param {{ email, name, language, interests, source }} params
 */
export async function subscribeToNewsletter({ email, name = '', language = 'en', interests = [], source = 'website' }) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'INVALID_EMAIL' };
  }

  const normalizedEmail = email.toLowerCase().trim();

  // 중복 체크
  const existing = await sanity.fetch(
    `*[_type == "newsletterSubscriber" && email == $email][0]{ _id, status }`,
    { email: normalizedEmail }
  );

  if (existing) {
    if (existing.status === 'active') {
      return { success: false, error: 'ALREADY_SUBSCRIBED' };
    }
    // 수신거부 상태면 재활성화
    await sanity.patch(existing._id).set({
      status: 'pending',
      unsubscribedAt: null,
      subscribedAt: new Date().toISOString(),
      language,
      interests,
    }).commit();
    logger.info('[newsletter]', 'Reactivated subscription', { email: normalizedEmail });
    await sendConfirmationEmail(normalizedEmail, name);
    return { success: true, action: 'reactivated' };
  }

  const unsubscribeToken = crypto.randomBytes(32).toString('hex');

  await sanity.create({
    _type: 'newsletterSubscriber',
    email: normalizedEmail,
    name,
    language,
    interests,
    source,
    status: 'pending',
    unsubscribeToken,
    subscribedAt: new Date().toISOString(),
  });

  logger.info('[newsletter]', 'New subscriber registered', { email: normalizedEmail, source });

  // 이중 옵트인 확인 이메일 발송
  await sendConfirmationEmail(normalizedEmail, name, unsubscribeToken);

  return { success: true, action: 'subscribed' };
}

/**
 * 구독 이메일 확인 처리
 */
export async function confirmSubscription(token) {
  const subscriber = await sanity.fetch(
    `*[_type == "newsletterSubscriber" && unsubscribeToken == $token][0]{ _id, email, name }`,
    { token }
  );

  if (!subscriber) return { success: false, error: 'INVALID_TOKEN' };

  await sanity.patch(subscriber._id).set({
    status: 'active',
    confirmedAt: new Date().toISOString(),
  }).commit();

  logger.info('[newsletter]', 'Subscription confirmed', { email: subscriber.email });
  return { success: true, email: subscriber.email };
}

/**
 * 수신거부 처리
 */
export async function unsubscribeFromNewsletter(token) {
  const subscriber = await sanity.fetch(
    `*[_type == "newsletterSubscriber" && unsubscribeToken == $token][0]{ _id, email }`,
    { token }
  );

  if (!subscriber) return { success: false, error: 'INVALID_TOKEN' };

  await sanity.patch(subscriber._id).set({
    status: 'unsubscribed',
    unsubscribedAt: new Date().toISOString(),
  }).commit();

  logger.info('[newsletter]', 'Unsubscribed', { email: subscriber.email });
  return { success: true };
}

// ========== 이메일 발송 ==========

/**
 * SendGrid를 통한 이메일 발송
 */
async function sendEmail({ to, toName, subject, html, textContent }) {
  const apiKey = process.env.EMAIL_API_KEY;

  if (process.env.NODE_ENV !== 'production' || !apiKey) {
    logger.info('[newsletter]', 'Email send skipped (dev mode)', { to, subject });
    return { success: true, mode: 'skipped' };
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to, name: toName || '' }] }],
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject,
        content: [
          { type: 'text/html', value: html },
          ...(textContent ? [{ type: 'text/plain', value: textContent }] : []),
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`SendGrid error ${response.status}: ${body}`);
    }

    return { success: true };
  } catch (error) {
    logger.error('[newsletter]', 'Email send failed', { error: error.message, to });
    return { success: false, error: error.message };
  }
}

/**
 * 이중 옵트인 확인 이메일
 */
async function sendConfirmationEmail(email, name, token) {
  const confirmUrl = `${BASE_URL}/api/newsletter/confirm?token=${token}`;
  const unsubUrl = `${BASE_URL}/api/newsletter/unsubscribe?token=${token}`;

  return sendEmail({
    to: email,
    toName: name,
    subject: '📧 Kulture 뉴스레터 구독 확인',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e91e8c;">🎵 Kulture 뉴스레터에 오신 것을 환영합니다!</h2>
        <p>안녕하세요${name ? ` ${name}님` : ''}! K-Culture의 최신 트렌드를 가장 먼저 받아보세요.</p>
        <p>구독을 완료하려면 아래 버튼을 클릭해주세요:</p>
        <a href="${confirmUrl}" style="display: inline-block; background: #e91e8c; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
          ✅ 구독 확인하기
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          구독을 원하지 않으시면 <a href="${unsubUrl}">수신거부</a>를 클릭하세요.
        </p>
      </div>
    `,
  });
}

// ========== 뉴스레터 발송 ==========

/**
 * K-Culture 트렌드 뉴스레터 생성 + 전송
 * @param {{ trends, hotIssues, language }} content
 */
export async function sendTrendNewsletter({ trends = [], hotIssues = [], language = 'en' }) {
  // 활성 구독자 목록 조회
  const subscribers = await sanity.fetch(
    `*[_type == "newsletterSubscriber" && status == "active" && (language == $lang || language == null)][0...500]{ email, name, unsubscribeToken }`,
    { lang: language }
  );

  if (!subscribers?.length) {
    logger.info('[newsletter]', 'No active subscribers for language', { language });
    return { success: true, sent: 0 };
  }

  const subject = buildNewsletterSubject(trends, language);
  let sent = 0;
  let failed = 0;

  // 배치 발송 (100명씩 순차 처리 — SendGrid 무료 플랜 제한 준수)
  for (const subscriber of subscribers) {
    const html = buildNewsletterHtml({ trends, hotIssues, subscriber, language });
    const result = await sendEmail({
      to: subscriber.email,
      toName: subscriber.name,
      subject,
      html,
    });

    if (result.success) sent++;
    else failed++;

    // 레이트 리밋 보호 (100이메일/초 이하)
    await new Promise(r => setTimeout(r, 20));
  }

  logger.info('[newsletter]', 'Newsletter send complete', { language, sent, failed });
  return { success: true, sent, failed };
}

function buildNewsletterSubject(trends, language) {
  const topTrend = trends[0]?.keyword || 'K-Culture';
  const subjects = {
    ko: `🔥 지금 핫한 ${topTrend} — Kulture 트렌드 리포트`,
    en: `🔥 Trending Now: ${topTrend} — Kulture Weekly`,
    ja: `🔥 今話題: ${topTrend} — Kulture トレンドレポート`,
    zh: `🔥 热门: ${topTrend} — Kulture 趋势报告`,
  };
  return subjects[language] || subjects.en;
}

function buildNewsletterHtml({ trends, hotIssues, subscriber, _language }) {
  const unsubUrl = `${BASE_URL}/api/newsletter/unsubscribe?token=${subscriber.unsubscribeToken}`;
  const trendRows = trends.slice(0, 5).map((t, i) =>
    `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">${i + 1}</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${t.keyword}</td><td style="padding: 8px; border-bottom: 1px solid #eee; color: #e91e8c;">${t.mentions || ''}</td></tr>`
  ).join('');

  const hotRows = hotIssues.slice(0, 3).map(h =>
    `<li style="margin-bottom: 8px;"><strong>${h.keyword}</strong>${h.description ? ` — ${h.description}` : ''}</li>`
  ).join('');

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
      <div style="background: linear-gradient(135deg, #e91e8c 0%, #9c27b0 100%); padding: 30px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎵 Kulture</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">K-Culture Trend Report</p>
      </div>
      <div style="padding: 20px;">
        <h2 style="color: #333;">📈 Top Trending</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 8px; text-align: left;">#</th>
              <th style="padding: 8px; text-align: left;">Keyword</th>
              <th style="padding: 8px; text-align: left;">Mentions</th>
            </tr>
          </thead>
          <tbody>${trendRows}</tbody>
        </table>

        ${hotRows ? `<h2 style="color: #333; margin-top: 24px;">🔥 Hot Issues</h2><ul style="padding-left: 20px;">${hotRows}</ul>` : ''}

        <div style="margin-top: 24px; padding: 16px; background: #fce4f0; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; color: #666;">
            더 많은 K-Culture 트렌드를 보려면 <a href="${BASE_URL}" style="color: #e91e8c;">kulture.wiki</a>를 방문하세요!
          </p>
        </div>
      </div>
      <div style="padding: 16px; background: #f5f5f5; text-align: center; font-size: 12px; color: #999;">
        <a href="${unsubUrl}" style="color: #999;">수신거부 / Unsubscribe</a>
      </div>
    </div>
  `;
}
