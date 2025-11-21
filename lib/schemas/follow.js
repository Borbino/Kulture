export default {
  name: 'follow',
  title: 'Follow',
  type: 'document',
  fields: [
    {
      name: 'follower',
      title: 'Follower',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'following',
      title: 'Following',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'createdAt',
      title: 'Followed At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    },
  ],
  preview: {
    select: {
      follower: 'follower.name',
      following: 'following.name',
    },
    prepare({ follower, following }) {
      return {
        title: `${follower} → ${following}`,
      };
    },
  },
};
