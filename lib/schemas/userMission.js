export default {
  name: 'userMission',
  title: 'User Mission Progress',
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
      name: 'mission',
      title: 'Mission',
      type: 'reference',
      to: [{ type: 'dailyMission' }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'progress',
      title: 'Progress',
      type: 'number',
      initialValue: 0,
    },
    {
      name: 'isCompleted',
      title: 'Is Completed',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'completedAt',
      title: 'Completed At',
      type: 'datetime',
    },
    {
      name: 'date',
      title: 'Date',
      type: 'date',
      initialValue: () => new Date().toISOString().split('T')[0],
    },
  ],
  preview: {
    select: {
      user: 'user.name',
      mission: 'mission.title',
      progress: 'progress',
      completed: 'isCompleted',
    },
    prepare({ user, mission, progress, completed }) {
      return {
        title: `${user} - ${mission}`,
        subtitle: completed ? '✅ Completed' : `Progress: ${progress}`,
      };
    },
  },
};
