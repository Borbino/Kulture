/**
 * [설명] 뉴스레터 구독자 Sanity 스키마
 * [목적] 이메일 뉴스레터 구독 관리
 */

import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'newsletterSubscriber',
  title: 'Newsletter Subscriber',
  type: 'document',
  fields: [
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: Rule => Rule.required().email(),
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
    }),
    defineField({
      name: 'language',
      title: 'Preferred Language',
      type: 'string',
      options: {
        list: ['ko', 'en', 'ja', 'zh', 'es', 'fr'],
      },
      initialValue: 'en',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: '활성', value: 'active' },
          { title: '수신거부', value: 'unsubscribed' },
          { title: '반송됨', value: 'bounced' },
          { title: '확인 대기', value: 'pending' },
        ],
      },
      initialValue: 'pending',
    }),
    defineField({
      name: 'interests',
      title: 'Interests',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: ['K-Pop', 'K-Drama', 'K-Beauty', 'K-Food', 'K-Entertainment'],
      },
    }),
    defineField({
      name: 'source',
      title: 'Subscription Source',
      type: 'string',
      description: '가입 경로 (footer, popup, article 등)',
    }),
    defineField({
      name: 'isPremium',
      title: 'Premium Member',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'unsubscribeToken',
      title: 'Unsubscribe Token',
      type: 'string',
      description: '수신거부 URL에 사용되는 고유 토큰',
    }),
    defineField({
      name: 'subscribedAt',
      title: 'Subscribed At',
      type: 'datetime',
    }),
    defineField({
      name: 'confirmedAt',
      title: 'Email Confirmed At',
      type: 'datetime',
    }),
    defineField({
      name: 'unsubscribedAt',
      title: 'Unsubscribed At',
      type: 'datetime',
    }),
  ],
  preview: {
    select: { title: 'email', subtitle: 'status' },
    prepare({ title, subtitle }) {
      const statusEmoji = { active: '✅', unsubscribed: '❌', bounced: '⚠️', pending: '⏳' }
      return { title, subtitle: `${statusEmoji[subtitle] || ''} ${subtitle}` }
    },
  },
})
