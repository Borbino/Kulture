export default {
  name: 'poll',
  title: 'Poll',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Poll Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'board',
      title: 'Board',
      type: 'reference',
      to: [{ type: 'board' }],
      description: 'The board this poll belongs to',
    },
    {
      name: 'post',
      title: 'Post',
      type: 'reference',
      to: [{ type: 'post' }],
      description: 'Optional post associated with this poll',
    },
    {
      name: 'options',
      title: 'Poll Options',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'key',
              title: 'Option Key',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'text',
              title: 'Option Text',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
          ],
        },
      ],
      validation: (Rule) => Rule.required().min(2),
    },
    {
      name: 'creator',
      title: 'Creator',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'endDate',
      title: 'End Date',
      type: 'datetime',
      description: 'When the poll closes',
    },
    {
      name: 'allowMultiple',
      title: 'Allow Multiple Votes',
      type: 'boolean',
      initialValue: false,
    },
  ],
  preview: {
    select: {
      title: 'title',
      creator: 'creator.name',
    },
    prepare({ title, creator }) {
      return {
        title,
        subtitle: `Created by ${creator || 'Unknown'}`,
      }
    },
  },
}
