/**
 * [설명] Hot Issue 스키마
 * [목적] 급부상 이슈 저장 (K-pop demon hunters, Huntrix 등)
 */

export default {
  name: 'hotIssue',
  title: 'Hot Issue',
  type: 'document',
  fields: [
    {
      name: 'keyword',
      title: 'Keyword',
      type: 'string',
      description: '이슈 키워드',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      description: '이슈 설명',
    },
    {
      name: 'mentions',
      title: 'Mentions',
      type: 'number',
      description: '멘션 수',
    },
    {
      name: 'sentiment',
      title: 'Sentiment',
      type: 'object',
      fields: [
        { name: 'positive', type: 'number', title: 'Positive' },
        { name: 'negative', type: 'number', title: 'Negative' },
        { name: 'neutral', type: 'number', title: 'Neutral' },
      ],
      description: '감정 분석 결과',
    },
    {
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'text', type: 'string', title: 'Text' },
            { name: 'source', type: 'string', title: 'Source' },
            { name: 'url', type: 'url', title: 'URL' },
            { name: 'timestamp', type: 'datetime', title: 'Timestamp' },
          ],
        },
      ],
      description: '수집된 콘텐츠 (상위 50개)',
    },
    {
      name: 'priority',
      title: 'Priority',
      type: 'string',
      options: {
        list: [
          { title: 'High', value: 'high' },
          { title: 'Medium', value: 'medium' },
          { title: 'Low', value: 'low' },
        ],
      },
    },
    {
      name: 'shouldAutoGenerate',
      title: 'Should Auto Generate',
      type: 'boolean',
      description: '자동 콘텐츠 생성 여부',
      initialValue: false,
    },
    {
      name: 'timestamp',
      title: 'Timestamp',
      type: 'datetime',
      description: '감지 시각',
    },
  ],
  preview: {
    select: {
      title: 'keyword',
      mentions: 'mentions',
      priority: 'priority',
    },
    prepare({ title, mentions, priority }) {
      const icon = priority === 'high' ? '🔥' : priority === 'medium' ? '⚡' : '💫'
      return {
        title: `${icon} ${title}`,
        subtitle: `${mentions.toLocaleString()} mentions`,
      }
    },
  },
}
