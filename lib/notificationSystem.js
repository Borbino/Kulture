/**
 * Translation Suggestion Notification System
 * Sends email/webhook notifications for new translation suggestions
 */

import { logger } from './logger.js';

/**
 * 이메일 알림 전송 (Vercel Email API 또는 SendGrid 사용)
 */
export async function sendEmailNotification(to, subject, html) {
  // 프로덕션 환경에서만 실제 전송
  if (process.env.NODE_ENV !== 'production' || !process.env.EMAIL_API_KEY) {
    logger.info('notification', 'Email notification skipped (dev mode)', { to, subject });
    return { success: true, mode: 'development' };
  }

  try {
    // SendGrid 예제
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: process.env.EMAIL_FROM || 'noreply@kulture.com' },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Email API error: ${response.statusText}`);
    }

    logger.info('notification', 'Email sent successfully', { to, subject });
    return { success: true };
  } catch (error) {
    logger.error('notification', 'Failed to send email', { error: error.message, to });
    return { success: false, error: error.message };
  }
}

/**
 * 슬랙/디스코드 웹훅 알림
 */
export async function sendWebhookNotification(url, message) {
  if (!url) {
    logger.warn('notification', 'Webhook URL not configured');
    return { success: false, error: 'No webhook URL' };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: message.text || message,
        ...(message.blocks && { blocks: message.blocks }),
        ...(message.attachments && { attachments: message.attachments }),
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.statusText}`);
    }

    logger.info('notification', 'Webhook sent successfully');
    return { success: true };
  } catch (error) {
    logger.error('notification', 'Failed to send webhook', { error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * 새 번역 제안 알림
 */
export async function notifyNewTranslationSuggestion(suggestion) {
  const { originalText, suggestedTranslation, targetLang, submitterEmail } = suggestion;

  // 이메일 알림
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    const emailHtml = `
      <h2>새로운 번역 제안이 도착했습니다</h2>
      <p><strong>언어:</strong> ${targetLang}</p>
      <p><strong>원문:</strong> ${originalText}</p>
      <p><strong>제안:</strong> ${suggestedTranslation}</p>
      <p><strong>제출자:</strong> ${submitterEmail || '익명'}</p>
      <br>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/translations" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
        관리자 대시보드에서 확인
      </a>
    `;

    await sendEmailNotification(
      adminEmail,
      `[Kulture] 새 번역 제안 (${targetLang})`,
      emailHtml
    );
  }

  // 슬랙 웹훅 알림
  const slackWebhook = process.env.SLACK_WEBHOOK_URL;
  if (slackWebhook) {
    const slackMessage = {
      text: '새로운 번역 제안',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🌐 새로운 번역 제안',
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*언어:*\n${targetLang}` },
            { type: 'mrkdwn', text: `*제출자:*\n${submitterEmail || '익명'}` },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*원문:*\n${originalText.substring(0, 200)}${originalText.length > 200 ? '...' : ''}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*제안:*\n${suggestedTranslation.substring(0, 200)}${suggestedTranslation.length > 200 ? '...' : ''}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: '관리자 대시보드' },
              url: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/translations`,
              style: 'primary',
            },
          ],
        },
      ],
    };

    await sendWebhookNotification(slackWebhook, slackMessage);
  }

  logger.info('notification', 'Translation suggestion notifications sent', {
    targetLang,
    hasEmail: !!adminEmail,
    hasWebhook: !!slackWebhook,
  });
}

/**
 * 번역 제안 승인/거부 알림 (제출자에게)
 */
export async function notifyTranslationSuggestionStatus(suggestion, status) {
  const { submitterEmail, originalText, suggestedTranslation, targetLang } = suggestion;

  if (!submitterEmail) return;

  const statusText = status === 'approved' ? '승인' : '거부';
  const statusColor = status === 'approved' ? '#28a745' : '#dc3545';

  const emailHtml = `
    <h2>번역 제안이 ${statusText}되었습니다</h2>
    <p><strong>언어:</strong> ${targetLang}</p>
    <p><strong>원문:</strong> ${originalText}</p>
    <p><strong>제안:</strong> ${suggestedTranslation}</p>
    <br>
    <p style="color: ${statusColor}; font-weight: bold;">상태: ${statusText.toUpperCase()}</p>
    <p>Kulture를 사용해 주셔서 감사합니다!</p>
  `;

  await sendEmailNotification(
    submitterEmail,
    `[Kulture] 번역 제안이 ${statusText}되었습니다`,
    emailHtml
  );

  logger.info('notification', 'Status notification sent to submitter', {
    email: submitterEmail,
    status,
  });
}
