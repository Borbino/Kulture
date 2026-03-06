/**
 * [설명] 이머징 트렌드 Sanity 스키마
 * [목적] Zero-Prior-Knowledge 방식으로 자동 발굴된 신규 엔티티 저장
 */

import { defineField, defineType } from 'sanity'

export const emergingTrend = defineType({
  name: 'emergingTrend',
  title: 'Emerging Trend',
  type: 'document',
  fields: [
    defineField({
      name: 'entity',
      title: 'Entity Name',
      type: 'string',
      validation: Rule => Rule.required().min(1).max(100),
    }),
    defineField({
      name: 'entityType',
      title: 'Entity Type',
      type: 'string',
      options: {
        list: [
          { title: '아티스트 (솔로)', value: 'artist' },
          { title: '그룹', value: 'group' },
          { title: '해시태그', value: 'hashtag' },
          { title: '이슈/사건', value: 'issue' },
          { title: '미분류', value: 'unknown' },
        ],
      },
    }),
    defineField({
      name: 'velocityScore',
      title: 'Velocity Score',
      type: 'number',
      description: '속도 점수: 높을수록 급부상 중 (50+ 자동추적, 100+ 즉시 알림)',
    }),
    defineField({
      name: 'mentionCount',
      title: 'Mention Count',
      type: 'number',
    }),
    defineField({
      name: 'sourceDiversity',
      title: 'Source Diversity',
      type: 'number',
      description: '언급된 고유 소스 수 (다양할수록 신뢰도 높음)',
    }),
    defineField({
      name: 'sources',
      title: 'Detected Sources',
      type: 'array',
      of: [{ type: 'string' }],
      description: '해당 엔티티가 탐지된 소스 목록',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: '탐지됨', value: 'detected' },
          { title: '추적 중', value: 'tracking' },
          { title: 'VIP 승격됨', value: 'promoted_to_vip' },
          { title: '무시됨', value: 'dismissed' },
        ],
      },
      initialValue: 'detected',
    }),
    defineField({
      name: 'promotedToVip',
      title: 'Promoted to VIP',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'isKpopRelated',
      title: 'K-Pop Related',
      type: 'boolean',
    }),
    defineField({
      name: 'firstDetected',
      title: 'First Detected',
      type: 'datetime',
    }),
    defineField({
      name: 'lastSeen',
      title: 'Last Seen',
      type: 'datetime',
    }),
    defineField({
      name: 'sampleContent',
      title: 'Sample Content',
      type: 'array',
      of: [{ type: 'string' }],
      description: '탐지된 실제 텍스트 샘플 (최대 3개)',
    }),
    defineField({
      name: 'adminNote',
      title: 'Admin Note',
      type: 'text',
      description: '관리자 메모 (VIP 등록 검토 내용 등)',
    }),
  ],
  orderings: [
    {
      title: 'Velocity Score (높은 순)',
      name: 'velocityDesc',
      by: [{ field: 'velocityScore', direction: 'desc' }],
    },
    {
      title: '최신 탐지 순',
      name: 'firstDetectedDesc',
      by: [{ field: 'firstDetected', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'entity',
      subtitle: 'velocityScore',
      status: 'status',
    },
    prepare({ title, subtitle, status }) {
      const statusEmoji = { detected: '🔍', tracking: '👀', promoted_to_vip: '⭐', dismissed: '❌' }
      return {
        title: `${statusEmoji[status] || '🔍'} ${title}`,
        subtitle: `Velocity: ${subtitle || 0} | ${status || 'detected'}`,
      }
    },
  },
})

export const emergingAlert = defineType({
  name: 'emergingAlert',
  title: 'Emerging Alert',
  type: 'document',
  fields: [
    defineField({
      name: 'entity',
      title: 'Entity Name',
      type: 'string',
    }),
    defineField({
      name: 'velocityScore',
      title: 'Velocity Score',
      type: 'number',
    }),
    defineField({
      name: 'alertLevel',
      title: 'Alert Level',
      type: 'string',
      options: {
        list: [
          { title: '정보', value: 'info' },
          { title: '경보', value: 'warning' },
          { title: '긴급', value: 'critical' },
        ],
      },
    }),
    defineField({
      name: 'message',
      title: 'Alert Message',
      type: 'text',
    }),
    defineField({
      name: 'trend',
      title: 'Related Trend',
      type: 'reference',
      to: [{ type: 'emergingTrend' }],
      weak: true,
    }),
    defineField({
      name: 'resolved',
      title: 'Resolved',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'resolvedAt',
      title: 'Resolved At',
      type: 'datetime',
    }),
    defineField({
      name: 'resolvedBy',
      title: 'Resolved By',
      type: 'string',
    }),
    defineField({
      name: 'detectedAt',
      title: 'Detected At',
      type: 'datetime',
    }),
  ],
  orderings: [
    {
      title: '최신 순',
      name: 'detectedDesc',
      by: [{ field: 'detectedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'entity',
      alertLevel: 'alertLevel',
      resolved: 'resolved',
    },
    prepare({ title, alertLevel, resolved }) {
      const levelEmoji = { info: 'ℹ️', warning: '⚠️', critical: '🚨' }
      return {
        title: `${levelEmoji[alertLevel] || '🔔'} ${title}`,
        subtitle: resolved ? '✅ 해결됨' : '🔴 미해결',
      }
    },
  },
})

export default { emergingTrend, emergingAlert }
