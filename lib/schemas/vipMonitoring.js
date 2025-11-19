/**
 * [설명] VIP 모니터링 결과 스키마
 * [목적] VIP 인물 멘션 데이터 저장
 */

export default {
  name: 'vipMonitoring',
  title: 'VIP Monitoring',
  type: 'document',
  fields: [
    {
      name: 'vipId',
      title: 'VIP ID',
      type: 'string',
      description: 'VIP 인물 고유 ID (예: bts, aespa, psy)',
    },
    {
      name: 'vipName',
      title: 'VIP Name',
      type: 'string',
      description: 'VIP 인물 이름',
    },
    {
      name: 'mentions',
      title: 'Mentions',
      type: 'number',
      description: '해당 시점의 멘션 수',
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
      description: '수집된 콘텐츠 (상위 20개)',
    },
    {
      name: 'timestamp',
      title: 'Timestamp',
      type: 'datetime',
      description: '모니터링 시각',
    },
  ],
  preview: {
    select: {
      title: 'vipName',
      subtitle: 'mentions',
      timestamp: 'timestamp',
    },
    prepare({ title, subtitle, timestamp }) {
      return {
        title: `${title} - ${subtitle} mentions`,
        subtitle: new Date(timestamp).toLocaleString('ko-KR'),
      }
    },
  },
}
