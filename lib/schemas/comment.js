/**
 * [설명] 댓글 스키마
 * [목적] 포스트 댓글 관리
 */

export default {
  name: 'comment',
  title: 'Comment',
  type: 'document',
  fields: [
    {
      name: 'post',
      title: 'Post',
      type: 'reference',
      to: [{ type: 'post' }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'author',
      title: 'Author Name',
      type: 'string',
      validation: (Rule) => Rule.required().min(2).max(50),
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.email(),
    },
    {
      name: 'content',
      title: 'Content',
      type: 'text',
      validation: (Rule) => Rule.required().min(10).max(1000),
    },
    {
      name: 'approved',
      title: 'Approved',
      type: 'boolean',
      description: '승인된 댓글만 표시됩니다',
      initialValue: false,
    },
    {
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    },
    {
      name: 'parentComment',
      title: 'Parent Comment',
      type: 'reference',
      to: [{ type: 'comment' }],
      description: '대댓글인 경우 부모 댓글',
    },
    {
      name: 'likes',
      title: 'Likes',
      type: 'number',
      initialValue: 0,
    },
  ],
  preview: {
    select: {
      title: 'author',
      subtitle: 'content',
      approved: 'approved',
    },
    prepare(selection) {
      const { title, subtitle, approved } = selection
      return {
        title: `${title} ${approved ? '✓' : '⏳'}`,
        subtitle: subtitle.substring(0, 60) + '...',
      }
    },
  },
}
