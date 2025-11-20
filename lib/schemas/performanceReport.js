/**
 * [설명] 성능 리포트 스키마
 * [목적] 시간별 성능 지표 저장 및 추이 분석
 */

const performanceReportSchema = {
  name: 'performanceReport',
  title: 'Performance Report (성능 리포트)',
  type: 'document',
  fields: [
    // 기간 정보
    {
      name: 'period',
      title: 'Period',
      type: 'object',
      fields: [
        {
          name: 'start',
          title: 'Start Time',
          type: 'datetime',
        },
        {
          name: 'end',
          title: 'End Time',
          type: 'datetime',
        },
        {
          name: 'durationMinutes',
          title: 'Duration (minutes)',
          type: 'number',
        },
      ],
    },

    // 요약 통계
    {
      name: 'summary',
      title: 'Summary',
      type: 'object',
      fields: [
        {
          name: 'totalApiCalls',
          title: 'Total API Calls',
          type: 'number',
        },
        {
          name: 'totalErrors',
          title: 'Total Errors',
          type: 'number',
        },
        {
          name: 'avgCacheHitRate',
          title: 'Average Cache Hit Rate (%)',
          type: 'number',
        },
      ],
    },

    // API별 통계
    {
      name: 'apis',
      title: 'API Statistics',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'api', type: 'string', title: 'API Name' },
            {
              name: 'calls',
              type: 'object',
              fields: [
                { name: 'total', type: 'number', title: 'Total' },
                { name: 'success', type: 'number', title: 'Success' },
                { name: 'failed', type: 'number', title: 'Failed' },
              ],
            },
            {
              name: 'responseTime',
              type: 'object',
              fields: [
                { name: 'avg', type: 'number', title: 'Average (ms)' },
                { name: 'p50', type: 'number', title: 'p50 (ms)' },
                { name: 'p95', type: 'number', title: 'p95 (ms)' },
                { name: 'p99', type: 'number', title: 'p99 (ms)' },
              ],
            },
            { name: 'errorRate', type: 'number', title: 'Error Rate (%)' },
          ],
        },
      ],
    },

    // 캐시 통계
    {
      name: 'caches',
      title: 'Cache Statistics',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'cache', type: 'string', title: 'Cache Name' },
            { name: 'hits', type: 'number', title: 'Hits' },
            { name: 'misses', type: 'number', title: 'Misses' },
            { name: 'hitRate', type: 'number', title: 'Hit Rate (%)' },
            { name: 'total', type: 'number', title: 'Total Accesses' },
          ],
        },
      ],
    },

    // 에러 통계
    {
      name: 'errors',
      title: 'Error Statistics',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'source', type: 'string', title: 'Source' },
            { name: 'count', type: 'number', title: 'Count' },
            {
              name: 'recentErrors',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    { name: 'message', type: 'string', title: 'Message' },
                    { name: 'timestamp', type: 'datetime', title: 'Timestamp' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },

    // 타임스탬프
    {
      name: 'timestamp',
      title: 'Timestamp',
      type: 'datetime',
      description: '리포트 생성 시각',
    },
  ],

  preview: {
    select: {
      period: 'period',
      summary: 'summary',
      timestamp: 'timestamp',
    },
    prepare({ summary, timestamp }) {
      const time = new Date(timestamp).toLocaleString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      return {
        title: `Performance Report - ${time}`,
        subtitle: `${summary?.totalApiCalls || 0} API calls, ${summary?.avgCacheHitRate || 0}% cache hit rate`,
      }
    },
  },
}

export default performanceReportSchema
