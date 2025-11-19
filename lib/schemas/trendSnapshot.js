/**
 * [설명] 트렌드 스냅샷 스키마
 * [목적] 시간별 트렌드 데이터 저장
 */

export default {
  name: 'trendSnapshot',
  title: 'Trend Snapshot',
  type: 'document',
  fields: [
    {
      name: 'trends',
      title: 'Trends',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'keyword', type: 'string', title: 'Keyword' },
            { name: 'mentions', type: 'number', title: 'Mentions' },
            { name: 'sources', type: 'array', of: [{ type: 'string' }], title: 'Sources' },
          ],
        },
      ],
      description: '상위 50개 트렌드',
    },
    {
      name: 'timestamp',
      title: 'Timestamp',
      type: 'datetime',
      description: '스냅샷 시각',
    },
  ],
  preview: {
    select: {
      trends: 'trends',
      timestamp: 'timestamp',
    },
    prepare({ trends, timestamp }) {
      return {
        title: `${trends?.length || 0} trends`,
        subtitle: new Date(timestamp).toLocaleString('ko-KR'),
      }
    },
  },
}
