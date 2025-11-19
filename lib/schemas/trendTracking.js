/**
 * [설명] 트렌드 추적 스키마
 * [목적] 동적 트렌드 생명주기 관리
 */

export default {
  name: 'trendTracking',
  title: 'Trend Tracking (트렌드 추적)',
  type: 'document',
  fields: [
    {
      name: 'keyword',
      title: 'Keyword',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'originalKeywords',
      title: 'Original Keywords (Variations)',
      type: 'array',
      of: [{ type: 'string' }],
    },
    {
      name: 'totalMentions',
      title: 'Total Mentions',
      type: 'number',
    },
    {
      name: 'dailyMentions',
      title: 'Daily Mentions',
      type: 'number',
    },
    {
      name: 'sources',
      title: 'Sources',
      type: 'array',
      of: [{ type: 'string' }],
    },
    {
      name: 'uniqueSources',
      title: 'Unique Sources Count',
      type: 'number',
    },
    {
      name: 'avgReliability',
      title: 'Average Reliability',
      type: 'number',
    },
    {
      name: 'score',
      title: 'Trend Score',
      type: 'number',
    },
    {
      name: 'growthRate',
      title: 'Growth Rate',
      type: 'number',
    },
    {
      name: 'peakMentions',
      title: 'Peak Mentions',
      type: 'number',
    },
    {
      name: 'daysWithoutGrowth',
      title: 'Days Without Growth',
      type: 'number',
    },
    {
      name: 'firstSeen',
      title: 'First Seen',
      type: 'datetime',
    },
    {
      name: 'lastUpdate',
      title: 'Last Update',
      type: 'datetime',
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'Declining', value: 'declining' },
          { title: 'Archived', value: 'archived' },
        ],
      },
    },
  ],
  preview: {
    select: {
      title: 'keyword',
      mentions: 'totalMentions',
      growth: 'growthRate',
      status: 'status',
    },
    prepare({ title, mentions, growth, status }) {
      const statusEmoji = {
        active: '🔥',
        declining: '📉',
        archived: '📦',
      }
      const growthPercent = growth ? `${(growth * 100).toFixed(1)}%` : '0%'
      return {
        title: `${statusEmoji[status] || '📊'} ${title}`,
        subtitle: `${mentions?.toLocaleString() || 0} mentions | Growth: ${growthPercent}`,
      }
    },
  },
}
