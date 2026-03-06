/**
 * [설명] 프리미엄 멤버십 Sanity 스키마
 * [목적] 유료 멤버십 구독 상태 관리
 */

import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'premiumMember',
  title: 'Premium Member',
  type: 'document',
  fields: [
    defineField({
      name: 'userId',
      title: 'User ID',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
    }),
    defineField({
      name: 'plan',
      title: 'Plan',
      type: 'string',
      options: {
        list: [
          { title: '월간 ($4.99/월)', value: 'monthly' },
          { title: '연간 ($47.99/년 — 20% 할인)', value: 'annual' },
          { title: '평생 ($149.99)', value: 'lifetime' },
        ],
      },
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: '활성', value: 'active' },
          { title: '취소됨', value: 'cancelled' },
          { title: '만료됨', value: 'expired' },
          { title: '체험판', value: 'trial' },
          { title: '결제 실패', value: 'past_due' },
        ],
      },
    }),
    defineField({
      name: 'provider',
      title: 'Payment Provider',
      type: 'string',
      options: {
        list: ['stripe', 'toss', 'paypal', 'manual'],
      },
    }),
    defineField({
      name: 'subscriptionId',
      title: 'Subscription ID',
      type: 'string',
      description: '결제 게이트웨이의 구독 ID',
    }),
    defineField({
      name: 'customerId',
      title: 'Customer ID',
      type: 'string',
      description: '결제 게이트웨이의 고객 ID',
    }),
    defineField({
      name: 'currentPeriodStart',
      title: 'Period Start',
      type: 'datetime',
    }),
    defineField({
      name: 'currentPeriodEnd',
      title: 'Period End',
      type: 'datetime',
    }),
    defineField({
      name: 'cancelAtPeriodEnd',
      title: 'Cancel At Period End',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'trialEnd',
      title: 'Trial End Date',
      type: 'datetime',
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
    }),
  ],
  orderings: [
    {
      title: '최신 구독 순',
      name: 'createdDesc',
      by: [{ field: 'createdAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'email',
      plan: 'plan',
      status: 'status',
    },
    prepare({ title, plan, status }) {
      const statusEmoji = { active: '✅', cancelled: '🛑', expired: '⏰', trial: '🆓', past_due: '⚠️' }
      return {
        title: title || 'Unknown',
        subtitle: `${statusEmoji[status] || ''} ${plan || ''} · ${status || ''}`,
      }
    },
  },
})
