/**
 * [설명] CEO 피드백 스키마
 * [목적] CEO의 승인/거절/보완 피드백을 학습 데이터로 저장
 */

export default {
  name: 'ceoFeedback',
  title: 'CEO Feedback',
  type: 'document',
  fields: [
    {
      name: 'action',
      title: 'Action',
      type: 'string',
      options: {
        list: [
          { title: 'Approve (승인)', value: 'approve' },
          { title: 'Reject (거절)', value: 'reject' },
          { title: 'Improve (보완)', value: 'improve' },
        ],
      },
      description: 'CEO의 액션',
    },
    {
      name: 'contentId',
      title: 'Content ID',
      type: 'string',
      description: '피드백 대상 콘텐츠 ID',
    },
    {
      name: 'feedback',
      title: 'Feedback',
      type: 'text',
      description: 'CEO의 구체적인 피드백 내용',
    },
    {
      name: 'contentSnapshot',
      title: 'Content Snapshot',
      type: 'object',
      fields: [
        { name: 'title', type: 'string', title: 'Title' },
        { name: 'bodyPreview', type: 'text', title: 'Body Preview' },
        { name: 'trustScore', type: 'number', title: 'Trust Score' },
        { name: 'sourceIssue', type: 'string', title: 'Source Issue' },
      ],
      description: '피드백 당시 콘텐츠 스냅샷',
    },
    {
      name: 'timestamp',
      title: 'Timestamp',
      type: 'datetime',
      description: '피드백 시각',
    },
  ],
  preview: {
    select: {
      action: 'action',
      feedback: 'feedback',
      timestamp: 'timestamp',
    },
    prepare({ action, feedback, timestamp }) {
      const icon = action === 'approve' ? '✅' : action === 'reject' ? '❌' : '✏️'
      return {
        title: `${icon} ${action.toUpperCase()}`,
        subtitle: `${feedback.substring(0, 60)}... (${new Date(timestamp).toLocaleString('ko-KR')})`,
      }
    },
  },
}
