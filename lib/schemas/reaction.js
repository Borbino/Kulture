export default {
  name: 'reaction',
  title: 'Reaction',
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
      name: 'targetType',
      title: 'Target Type',
      type: 'string',
      options: {
        list: [
          { title: 'Post', value: 'post' },
          { title: 'Comment', value: 'comment' },
        ],
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'targetPost',
      title: 'Target Post',
      type: 'reference',
      to: [{ type: 'post' }],
      hidden: ({ parent }) => parent?.targetType !== 'post',
    },
    {
      name: 'targetComment',
      title: 'Target Comment',
      type: 'reference',
      to: [{ type: 'comment' }],
      hidden: ({ parent }) => parent?.targetType !== 'comment',
    },
    {
      name: 'reactionType',
      title: 'Reaction Type',
      type: 'string',
      options: {
        list: [
          { title: '❤️ Love', value: 'love' },
          { title: '👍 Like', value: 'like' },
          { title: '😂 Laugh', value: 'laugh' },
          { title: '😮 Wow', value: 'wow' },
          { title: '😢 Sad', value: 'sad' },
          { title: '😡 Angry', value: 'angry' },
        ],
      },
      validation: (Rule) => Rule.required(),
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
      reaction: 'reactionType',
      type: 'targetType',
    },
    prepare({ user, reaction, type }) {
      const emoji = {
        love: '❤️',
        like: '👍',
        laugh: '😂',
        wow: '😮',
        sad: '😢',
        angry: '😡',
      };
      return {
        title: `${user} - ${emoji[reaction]} ${reaction}`,
        subtitle: type,
      };
    },
  },
};
