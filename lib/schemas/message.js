export default {
  name: 'message',
  title: 'Direct Message',
  type: 'document',
  fields: [
    {
      name: 'sender',
      title: 'Sender',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'recipient',
      title: 'Recipient',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'subject',
      title: 'Subject',
      type: 'string',
    },
    {
      name: 'content',
      title: 'Content',
      type: 'text',
      validation: (Rule) => Rule.required().max(5000),
    },
    {
      name: 'isRead',
      title: 'Is Read',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'parentMessage',
      title: 'Parent Message',
      type: 'reference',
      to: [{ type: 'message' }],
      description: 'For threaded conversations',
    },
    {
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    },
    {
      name: 'readAt',
      title: 'Read At',
      type: 'datetime',
    },
  ],
  preview: {
    select: {
      subject: 'subject',
      content: 'content',
      isRead: 'isRead',
    },
    prepare({ subject, content, isRead }) {
      return {
        title: subject || content?.substring(0, 50) || 'No subject',
        subtitle: isRead ? 'Read' : 'Unread',
      };
    },
  },
};
