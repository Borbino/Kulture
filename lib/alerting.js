/**
 * Alerting — Slack / Discord 웹훅 통합
 * [목적] 이머징 트렌드 급상승, 시스템 오류, AdSense RPM 급락 등 운영 알림 발송
 *
 * 환경 변수:
 *   SLACK_WEBHOOK_URL    — Slack Incoming Webhook URL
 *   DISCORD_WEBHOOK_URL  — Discord Webhook URL
 *   ALERT_MIN_INTERVAL_MS — 동일 키 재발송 최소 간격 (기본 5분, 중복 방지)
 */

import logger from './logger.js';

const MIN_INTERVAL_MS = parseInt(process.env.ALERT_MIN_INTERVAL_MS || '300000', 10); // 5분

// 재발송 방지 인메모리 쿨다운 캐시 { key → lastSentAt(ms) }
const cooldownMap = new Map();

function isCoolingDown(key) {
  const last = cooldownMap.get(key);
  if (!last) return false;
  return Date.now() - last < MIN_INTERVAL_MS;
}

function markSent(key) {
  cooldownMap.set(key, Date.now());
}

// ──────────────────────────────────────────────
// 플랫폼별 발송 함수
// ──────────────────────────────────────────────

/**
 * Slack에 메시지 발송 (Block Kit 형식)
 */
async function sendSlack(payload) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return false;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    logger.error('[alerting]', 'Slack send failed', { error: e.message });
    return false;
  }
}

/**
 * Discord에 메시지 발송 (Embed 형식)
 */
async function sendDiscord(payload) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return false;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    logger.error('[alerting]', 'Discord send failed', { error: e.message });
    return false;
  }
}

// ──────────────────────────────────────────────
// 공통 알림 발송 (Slack + Discord 둘 다)
// ──────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {string} opts.key        - 쿨다운 키 (같은 이벤트 중복 방지)
 * @param {string} opts.title      - 알림 제목
 * @param {string} opts.body       - 알림 본문
 * @param {'info'|'warning'|'critical'} opts.level - 심각도
 * @param {object} [opts.fields]   - 추가 데이터 {label: value}
 * @param {boolean} [opts.force]   - 쿨다운 무시 강제 발송
 */
export async function sendAlert({ key, title, body, level = 'info', fields = {}, force = false }) {
  if (!force && isCoolingDown(key)) {
    logger.info('[alerting]', `Alert suppressed (cooldown): ${key}`);
    return { suppressed: true };
  }

  const COLORS = { info: '#36a64f', warning: '#ffa500', critical: '#e63946' };
  const EMOJIS = { info: 'ℹ️', warning: '⚠️', critical: '🚨' };
  const color = COLORS[level] || COLORS.info;
  const emoji = EMOJIS[level] || EMOJIS.info;
  const timestamp = new Date().toISOString()

  // ── Slack Block Kit Payload ──
  const slackFieldsBlocks = Object.entries(fields).map(([label, value]) => ({
    type: 'mrkdwn',
    text: `*${label}*\n${value}`,
  }))

  const slackPayload = {
    text: `${emoji} *[Kulture] ${title}*`,
    attachments: [
      {
        color,
        blocks: [
          {
            type: 'section',
            text: { type: 'mrkdwn', text: body },
          },
          ...(slackFieldsBlocks.length > 0
            ? [
                {
                  type: 'section',
                  fields: slackFieldsBlocks.slice(0, 10),
                },
              ]
            : []),
          {
            type: 'context',
            elements: [
              { type: 'mrkdwn', text: `🕐 ${timestamp} | Kulture 운영 알림` },
            ],
          },
        ],
      },
    ],
  }

  // ── Discord Embed Payload ──
  const discordEmbedFields = Object.entries(fields).map(([name, value]) => ({
    name,
    value: String(value).slice(0, 1024),
    inline: true,
  }))

  const discordPayload = {
    username: 'Kulture Bot',
    avatar_url: 'https://kulture.app/icons/icon-192x192.png',
    embeds: [
      {
        title: `${emoji} ${title}`,
        description: body,
        color: parseInt(color.replace('#', ''), 16),
        fields: discordEmbedFields.slice(0, 25),
        timestamp,
        footer: { text: 'Kulture 운영 알림' },
      },
    ],
  }

  const [slackOk, discordOk] = await Promise.all([
    sendSlack(slackPayload),
    sendDiscord(discordPayload),
  ])

  if (slackOk || discordOk) {
    markSent(key)
    logger.info('[alerting]', `Alert sent: "${title}" (slack=${slackOk}, discord=${discordOk})`)
  }

  return { slack: slackOk, discord: discordOk }
}

// ──────────────────────────────────────────────
// 특화 알림 헬퍼
// ──────────────────────────────────────────────

/**
 * 이머징 엔티티 급상승 알림
 */
export async function alertEmergingEntity(entity) {
  return sendAlert({
    key: `emerging:${entity.entity}`,
    title: `🔥 신규 이머징 엔티티 급상승`,
    body: `*"${entity.entity}"* 가 여러 소스에서 급격히 언급량이 증가하고 있습니다.\n관리자 대시보드에서 VIP 승격 여부를 검토해주세요.`,
    level: 'warning',
    fields: {
      '엔티티': entity.entity,
      '속도 점수': entity.velocityScore,
      '소스 수': entity.sourceCount,
      '최근 1시간 언급': entity.recentCount,
      'K-Pop 지표': entity.hasKpopIndicator ? '있음' : '없음',
      '첫 감지': entity.firstSeen || 'N/A',
    },
  })
}

/**
 * 시스템 오류 알림
 */
export async function alertSystemError(module, error, context = {}) {
  return sendAlert({
    key: `error:${module}:${error.slice(0, 30)}`,
    title: `시스템 오류 — ${module}`,
    body: `\`${error}\``,
    level: 'critical',
    fields: context,
  })
}

/**
 * 스크래핑 완료 요약 알림 (성공/처리량)
 */
export async function alertScrapingSummary(stats) {
  return sendAlert({
    key: 'scraping:daily-summary',
    title: '📊 일일 스크래핑 완료',
    body: `${stats.sources}개 소스에서 ${stats.items}개 항목을 수집했습니다.`,
    level: 'info',
    fields: {
      '수집 항목': stats.items,
      '소스 수': stats.sources,
      '이머징 감지': stats.emerging || 0,
      'VIP 알림': stats.vipAlerts || 0,
    },
  })
}
