export default {
  name: 'activity',
  title: 'Activity Feed',
  type: 'document',
  fields: [
    {
      name: 'user',
      title: 'User',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'activityType',
      title: 'Activity Type',
      type: 'string',
      options: {
        list: [
          { title: 'Post Created', value: 'post_created' },
          { title: 'Comment Added', value: 'comment_added' },
          { title: 'Post Liked', value: 'post_liked' },
          { title: 'User Followed', value: 'user_followed' },
          { title: 'Badge Earned', value: 'badge_earned' },
          { title: 'Level Up', value: 'level_up' },
        ],
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'post',
      title: 'Related Post',
      type: 'reference',
      to: [{ type: 'post' }],
    },
    {
      name: 'comment',
      title: 'Related Comment',
      type: 'reference',
      to: [{ type: 'comment' }],
    },
    {
      name: 'targetUser',
      title: 'Target User',
      type: 'reference',
      to: [{ type: 'user' }],
    },
    {
      name: 'badge',
      title: 'Earned Badge',
      type: 'reference',
      to: [{ type: 'badge' }],
    },
    {
      name: 'metadata',
      title: 'Metadata',
      type: 'object',
      fields: [
        { name: 'oldLevel', title: 'Old Level', type: 'number' },
        { name: 'newLevel', title: 'New Level', type: 'number' },
        { name: 'points', title: 'Points Earned', type: 'number' },
      ],
    },
    {
      name: 'isPublic',
      title: 'Is Public',
      type: 'boolean',
      initialValue: true,
      description: 'Show in public activity feed',
    },
    {
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    },
  ],
  preview: {
    select: {
      user: 'user.name',
      type: 'activityType',
      createdAt: 'createdAt',
    },
    prepare({ user, type, createdAt }) {
      return {
        title: `${user} - ${type}`,
        subtitle: new Date(createdAt).toLocaleString(),
      };
    },
  },
};
