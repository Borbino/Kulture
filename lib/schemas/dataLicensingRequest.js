/**
 * [설명] 데이터 라이선싱 요청 Sanity 스키마
 * [목적] B2B API 키 신청 및 承인 관리
 */

import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'dataLicensingRequest',
  title: 'Data Licensing Request',
  type: 'document',
  fields: [
    defineField({ name: 'userId', title: 'User ID', type: 'string' }),
    defineField({ name: 'email', title: 'Email', type: 'string' }),
    defineField({ name: 'companyName', title: 'Company Name', type: 'string' }),
    defineField({ name: 'useCase', title: 'Use Case', type: 'text' }),
    defineField({ name: 'website', title: 'Website', type: 'url' }),
    defineField({
      name: 'planId',
      title: 'Plan',
      type: 'string',
      options: { list: ['starter', 'professional', 'enterprise'] },
    }),
    defineField({ name: 'planName', title: 'Plan Name', type: 'string' }),
    defineField({ name: 'monthlyFee', title: 'Monthly Fee (USD)', type: 'number' }),
    defineField({ name: 'apiKey', title: 'API Key', type: 'string' }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: '검토 대기', value: 'pending' },
          { title: '승인됨', value: 'approved' },
          { title: '활성', value: 'active' },
          { title: '정지됨', value: 'suspended' },
          { title: '만료됨', value: 'expired' },
        ],
      },
      initialValue: 'pending',
    }),
    defineField({ name: 'requestsUsed', title: 'Requests Used (This Month)', type: 'number', initialValue: 0 }),
    defineField({ name: 'requestsLimit', title: 'Monthly Requests Limit', type: 'number' }),
    defineField({ name: 'monthlyResetAt', title: 'Monthly Reset Date', type: 'datetime' }),
    defineField({ name: 'requestedAt', title: 'Requested At', type: 'datetime' }),
    defineField({ name: 'approvedAt', title: 'Approved At', type: 'datetime' }),
    defineField({ name: 'adminNote', title: 'Admin Note', type: 'text' }),
  ],
  preview: {
    select: { title: 'companyName', plan: 'planId', status: 'status' },
    prepare({ title, plan, status }) {
      const statusEmoji = { pending: '⏳', approved: '✅', active: '🟢', suspended: '🔴', expired: '⏰' }
      return { title, subtitle: `${statusEmoji[status] || ''} ${plan} · ${status}` }
    },
  },
})
