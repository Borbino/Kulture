// [설명] Post 스키마 - K-Culture 콘텐츠(드라마, K-Pop, 영화 등) 게시글
// [일시] 2025-11-19 13:00 (KST)
// [업데이트] 2025-11-19 - AI 자동 생성 콘텐츠 관리 필드 추가

const postSchema = {
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: Rule => Rule.required(),
    },
    {
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: { type: 'author' },
    },
    {
      name: 'user',
      title: 'User Author',
      type: 'reference',
      to: { type: 'user' },
      description: 'User who created this post (for community posts)',
    },
    {
      name: 'board',
      title: 'Board',
      type: 'reference',
      to: { type: 'board' },
      description: 'Which board this post belongs to',
    },
    {
      name: 'isAnonymous',
      title: 'Is Anonymous',
      type: 'boolean',
      initialValue: false,
      description: 'Whether this post is anonymous',
    },
    {
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'images',
      title: 'Additional Images',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
      description: 'Gallery images',
    },
    {
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'reference', to: { type: 'category' } }],
    },
    {
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
    },
    {
      name: 'body',
      title: 'Body',
      type: 'text',
      rows: 20,
    },
    {
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    },
    {
      name: 'views',
      title: 'Views',
      type: 'number',
      initialValue: 0,
      readOnly: true,
    },
    {
      name: 'likes',
      title: 'Likes',
      type: 'number',
      initialValue: 0,
      readOnly: true,
    },
    {
      name: 'likedBy',
      title: 'Liked By',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'user' }] }],
      hidden: true,
    },
    {
      name: 'commentCount',
      title: 'Comment Count',
      type: 'number',
      initialValue: 0,
      readOnly: true,
    },
    {
      name: 'isPinned',
      title: 'Is Pinned',
      type: 'boolean',
      initialValue: false,
      description: 'Pin to top of board',
    },
    {
      name: 'isBest',
      title: 'Is Best Post',
      type: 'boolean',
      initialValue: false,
      description: 'Featured in best board',
    },
    {
      name: 'isHidden',
      title: 'Is Hidden',
      type: 'boolean',
      initialValue: false,
      description: 'Hidden due to reports',
    },

    // ========== AI 자동 생성 콘텐츠 관리 ==========
    {
      name: 'status',
      title: 'Status',
      description: 'CEO 승인 상태 (pending: 대기, approved: 승인, rejected: 거부)',
      type: 'string',
      options: {
        list: [
          { title: '⏳ Pending (CEO 승인 대기)', value: 'pending' },
          { title: '✅ Approved (게시됨)', value: 'approved' },
          { title: '❌ Rejected (거부됨)', value: 'rejected' },
          { title: '📝 Draft (초안)', value: 'draft' },
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
    },
    {
      name: 'socialPosts',
      title: 'Social Media Posts',
      description: 'AI 생성 소셜 미디어 포스트',
      type: 'object',
      fields: [
        {
          name: 'twitter',
          title: 'Twitter Post',
          type: 'text',
          rows: 3,
        },
        {
          name: 'instagram',
          title: 'Instagram Caption',
          type: 'text',
          rows: 4,
        },
        {
          name: 'facebook',
          title: 'Facebook Post',
          type: 'text',
          rows: 4,
        },
      ],
    },
    {
      name: 'metadata',
      title: 'Metadata',
      description: 'AI 생성 정보 및 출처',
      type: 'object',
      fields: [
        {
          name: 'source',
          title: 'Source',
          description: '콘텐츠 출처 (AI Generated / Manual / Community)',
          type: 'string',
        },
        {
          name: 'sourceIssue',
          title: 'Source Issue',
          description: '기반 이슈/트렌드 키워드',
          type: 'string',
        },
        {
          name: 'mentions',
          title: 'Mentions Count',
          description: '소셜 미디어 멘션 수',
          type: 'number',
        },
        {
          name: 'trustScore',
          title: 'Trust Score',
          description: '신뢰도 점수 (0-100)',
          type: 'number',
          validation: Rule => Rule.min(0).max(100),
        },
        {
          name: 'aiModel',
          title: 'AI Model',
          description: '사용된 AI 모델',
          type: 'string',
        },
        {
          name: 'improved',
          title: 'Improved by CEO',
          description: 'CEO 피드백으로 개선되었는지 여부',
          type: 'boolean',
          initialValue: false,
        },
        {
          name: 'improvementCount',
          title: 'Improvement Count',
          description: 'CEO 피드백 개선 횟수',
          type: 'number',
          initialValue: 0,
        },
        {
          name: 'lastImprovement',
          title: 'Last Improvement Date',
          description: '마지막 개선 날짜',
          type: 'datetime',
        },
        {
          name: 'feedbackPatterns',
          title: 'Feedback Patterns',
          description: 'CEO 피드백 학습 패턴',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                { name: 'keyword', type: 'string' },
                { name: 'count', type: 'number' },
              ],
            },
          ],
        },
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'mainImage',
      status: 'status',
      source: 'metadata.source',
    },
    prepare({ title, author, media, status, source }) {
      const statusEmoji = {
        pending: '⏳',
        approved: '✅',
        rejected: '❌',
        draft: '📝',
      }
      return {
        title: `${statusEmoji[status] || '📄'} ${title}`,
        subtitle: `${author || 'AI Generated'} | ${source || 'Unknown'}`,
        media,
      }
    },
  },
}

export default postSchema
