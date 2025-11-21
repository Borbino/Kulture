export default {
  name: 'dailyMission',
  title: 'Daily Mission',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Mission Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
    },
    {
      name: 'missionType',
      title: 'Mission Type',
      type: 'string',
      options: {
        list: [
          { title: 'Daily Login', value: 'daily_login' },
          { title: 'Create Post', value: 'create_post' },
          { title: 'Write Comment', value: 'write_comment' },
          { title: 'Like Posts', value: 'like_posts' },
          { title: 'View Posts', value: 'view_posts' },
          { title: 'Share Content', value: 'share_content' },
        ],
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'targetCount',
      title: 'Target Count',
      type: 'number',
      initialValue: 1,
      description: 'Number of times action must be performed',
    },
    {
      name: 'rewardPoints',
      title: 'Reward Points',
      type: 'number',
      initialValue: 10,
    },
    {
      name: 'rewardBadge',
      title: 'Reward Badge',
      type: 'reference',
      to: [{ type: 'badge' }],
    },
    {
      name: 'icon',
      title: 'Icon',
      type: 'string',
      description: 'Emoji or icon name',
    },
    {
      name: 'difficulty',
      title: 'Difficulty',
      type: 'string',
      options: {
        list: [
          { title: 'Easy', value: 'easy' },
          { title: 'Medium', value: 'medium' },
          { title: 'Hard', value: 'hard' },
        ],
      },
      initialValue: 'easy',
    },
    {
      name: 'isActive',
      title: 'Is Active',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'startDate',
      title: 'Start Date',
      type: 'date',
    },
    {
      name: 'endDate',
      title: 'End Date',
      type: 'date',
    },
  ],
  preview: {
    select: {
      title: 'title',
      type: 'missionType',
      points: 'rewardPoints',
    },
    prepare({ title, type, points }) {
      return {
        title,
        subtitle: `${type} - ${points}pts`,
      };
    },
  },
};
