export default {
  name: 'badge',
  title: 'Badge',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Badge Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
    },
    {
      name: 'icon',
      title: 'Icon',
      type: 'string',
      description: 'Icon name or emoji',
    },
    {
      name: 'color',
      title: 'Color',
      type: 'string',
      description: 'Hex color code',
    },
    {
      name: 'type',
      title: 'Badge Type',
      type: 'string',
      options: {
        list: [
          { title: 'Achievement', value: 'achievement' },
          { title: 'Rank', value: 'rank' },
          { title: 'Event', value: 'event' },
          { title: 'Special', value: 'special' },
        ],
      },
    },
    {
      name: 'requirement',
      title: 'Requirement',
      type: 'object',
      fields: [
        { name: 'posts', title: 'Number of Posts', type: 'number' },
        { name: 'comments', title: 'Number of Comments', type: 'number' },
        { name: 'likes', title: 'Number of Likes', type: 'number' },
        { name: 'points', title: 'Points Required', type: 'number' },
        { name: 'level', title: 'Level Required', type: 'number' },
      ],
    },
    {
      name: 'isActive',
      title: 'Is Active',
      type: 'boolean',
      initialValue: true,
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'type',
      icon: 'icon',
    },
  },
};
