export default {
  name: 'community',
  title: 'Community',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Community Name',
      type: 'string',
      validation: (Rule) => Rule.required().max(50),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      validation: (Rule) => Rule.required().max(500),
    },
    {
      name: 'image',
      title: 'Community Image',
      type: 'url',
      description: 'Community banner or logo image URL',
    },
    {
      name: 'owner',
      title: 'Owner',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
      description: 'The user who created and owns this community',
    },
    {
      name: 'members',
      title: 'Members',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'user' }] }],
      description: 'List of community members',
    },
    {
      name: 'isPrivate',
      title: 'Is Private',
      type: 'boolean',
      initialValue: false,
      description: 'If true, only members can view and post',
    },
    {
      name: 'memberCount',
      title: 'Member Count',
      type: 'number',
      initialValue: 0,
      readOnly: true,
    },
    {
      name: 'postCount',
      title: 'Post Count',
      type: 'number',
      initialValue: 0,
      readOnly: true,
    },
  ],
  preview: {
    select: {
      title: 'name',
      owner: 'owner.name',
      memberCount: 'memberCount',
      isPrivate: 'isPrivate',
    },
    prepare({ title, owner, memberCount, isPrivate }) {
      return {
        title,
        subtitle: `${memberCount || 0} members • ${owner || 'Unknown'} • ${isPrivate ? '🔒 Private' : '🌍 Public'}`,
      }
    },
  },
}
