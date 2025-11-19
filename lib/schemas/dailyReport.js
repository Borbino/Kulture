/**
 * [설명] 일일 리포트 스키마
 * [목적] CEO 일일 요약 저장
 */

const dailyReportSchema = {
  name: 'dailyReport',
  title: 'Daily Report',
  type: 'document',
  fields: [
    {
      name: 'date',
      title: 'Date',
      type: 'string',
      description: '리포트 날짜 (YYYY-MM-DD)',
    },
    {
      name: 'report',
      title: 'Report',
      type: 'object',
      fields: [
        {
          name: 'vip',
          type: 'object',
          fields: [
            { name: 'monitored', type: 'number', title: 'Monitored' },
            {
              name: 'topMentions',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    { name: 'name', type: 'string', title: 'Name' },
                    { name: 'mentions', type: 'number', title: 'Mentions' },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'trends',
          type: 'object',
          fields: [
            { name: 'detected', type: 'number', title: 'Detected' },
            {
              name: 'top5',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    { name: 'keyword', type: 'string', title: 'Keyword' },
                    { name: 'mentions', type: 'number', title: 'Mentions' },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'content',
          type: 'object',
          fields: [
            { name: 'generated', type: 'number', title: 'Generated' },
            { name: 'approved', type: 'number', title: 'Approved' },
            { name: 'pendingReview', type: 'number', title: 'Pending Review' },
          ],
        },
      ],
      description: '리포트 데이터',
    },
    {
      name: 'timestamp',
      title: 'Timestamp',
      type: 'datetime',
      description: '생성 시각',
    },
  ],
  preview: {
    select: {
      date: 'date',
      report: 'report',
    },
    prepare({ date, report }) {
      return {
        title: `Daily Report - ${date}`,
        subtitle: `${report?.content?.generated || 0} generated, ${report?.content?.approved || 0} approved`,
      }
    },
  },
}

export default dailyReportSchema
