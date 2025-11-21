export default {
  name: 'notification',
  title: 'Notification',
  type: 'document',
  fields: [
    {
      name: 'recipient',
      title: 'Recipient',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'type',
      title: 'Notification Type',
      type: 'string',
      options: {
        list: [
          { title: 'Comment', value: 'comment' },
          { title: 'Reply', value: 'reply' },
          { title: 'Mention', value: 'mention' },
          { title: 'Like', value: 'like' },
          { title: 'Follow', value: 'follow' },
          { title: 'Message', value: 'message' },
          { title: 'System', value: 'system' },
        ],
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'sender',
      title: 'Sender',
      type: 'reference',
      to: [{ type: 'user' }],
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
      name: 'message',
      title: 'Message',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'link',
      title: 'Link',
      type: 'url',
    },
    {
      name: 'isRead',
      title: 'Is Read',
      type: 'boolean',
      initialValue: false,
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
      message: 'message',
      type: 'type',
      isRead: 'isRead',
    },
    prepare({ message, type, isRead }) {
      return {
        title: message,
        subtitle: `${type} - ${isRead ? 'Read' : 'Unread'}`,
      };
    },
  },
};
