export default {
  name: 'report',
  title: 'Report',
  type: 'document',
  fields: [
    {
      name: 'type',
      title: 'Report Type',
      type: 'string',
      options: {
        list: [
          { title: 'Post', value: 'post' },
          { title: 'Comment', value: 'comment' },
          { title: 'User', value: 'user' },
        ],
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'targetPost',
      title: 'Target Post',
      type: 'reference',
      to: [{ type: 'post' }],
      hidden: ({ parent }) => parent?.type !== 'post',
    },
    {
      name: 'targetComment',
      title: 'Target Comment',
      type: 'reference',
      to: [{ type: 'comment' }],
      hidden: ({ parent }) => parent?.type !== 'comment',
    },
    {
      name: 'targetUser',
      title: 'Target User',
      type: 'reference',
      to: [{ type: 'user' }],
      hidden: ({ parent }) => parent?.type !== 'user',
    },
    {
      name: 'reporter',
      title: 'Reporter',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'reason',
      title: 'Reason',
      type: 'string',
      options: {
        list: [
          { title: 'Spam', value: 'spam' },
          { title: 'Harassment', value: 'harassment' },
          { title: 'Hate Speech', value: 'hate_speech' },
          { title: 'Violence', value: 'violence' },
          { title: 'Pornography', value: 'pornography' },
          { title: 'Copyright Violation', value: 'copyright' },
          { title: 'Misinformation', value: 'misinformation' },
          { title: 'Other', value: 'other' },
        ],
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending', value: 'pending' },
          { title: 'Reviewing', value: 'reviewing' },
          { title: 'Resolved', value: 'resolved' },
          { title: 'Rejected', value: 'rejected' },
        ],
      },
      initialValue: 'pending',
    },
    {
      name: 'action',
      title: 'Action Taken',
      type: 'string',
      options: {
        list: [
          { title: 'None', value: 'none' },
          { title: 'Content Hidden', value: 'hidden' },
          { title: 'Content Deleted', value: 'deleted' },
          { title: 'User Warned', value: 'warned' },
          { title: 'User Banned', value: 'banned' },
        ],
      },
    },
    {
      name: 'reviewer',
      title: 'Reviewed By',
      type: 'reference',
      to: [{ type: 'user' }],
    },
    {
      name: 'reviewNote',
      title: 'Review Note',
      type: 'text',
    },
    {
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    },
    {
      name: 'reviewedAt',
      title: 'Reviewed At',
      type: 'datetime',
    },
  ],
  preview: {
    select: {
      type: 'type',
      reason: 'reason',
      status: 'status',
    },
    prepare({ type, reason, status }) {
      return {
        title: `${type} - ${reason}`,
        subtitle: status,
      };
    },
  },
};
