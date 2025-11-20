/**
 * [설명] VIP 모니터링 결과 스키마
 * [목적] VIP 인물 멘션 데이터 저장
 */

const vipMonitoringSchema = {
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
      name: 'alertLevel',
      title: 'Alert Level',
      type: 'string',
      options: {
        list: [
          { title: 'Normal', value: 'normal' },
          { title: 'High', value: 'high' },
          { title: 'Critical', value: 'critical' },
        ],
      },
      description: '알림 레벨 (normal: 평상시, high: 급증, critical: 긴급)',
    },
    {
      name: 'trend',
      title: 'Trend',
      type: 'object',
      fields: [
        { name: 'previousMentions', type: 'number', title: 'Previous Mentions' },
        { name: 'changePercent', type: 'number', title: 'Change Percent' },
        { name: 'isRising', type: 'boolean', title: 'Is Rising' },
      ],
      description: '트렌드 분석 데이터',
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

export default vipMonitoringSchema
