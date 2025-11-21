export default {
  name: 'user',
  title: 'User',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required().min(2).max(50),
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    },
    {
      name: 'password',
      title: 'Password Hash',
      type: 'string',
      description: '암호화된 비밀번호',
      hidden: true,
    },
    {
      name: 'image',
      title: 'Profile Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'bio',
      title: 'Bio',
      type: 'text',
      rows: 3,
    },
    {
      name: 'role',
      title: 'Role',
      type: 'string',
      options: {
        list: [
          { title: 'User', value: 'user' },
          { title: 'Editor', value: 'editor' },
          { title: 'Admin', value: 'admin' },
        ],
      },
      initialValue: 'user',
    },
    {
      name: 'emailVerified',
      title: 'Email Verified',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
    },
    {
      name: 'lastLoginAt',
      title: 'Last Login',
      type: 'datetime',
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'email',
      media: 'image',
      role: 'role',
    },
    prepare(selection) {
      const { title, subtitle, role } = selection
      const roleEmoji = role === 'admin' ? '��' : role === 'editor' ? '✏️' : '👤'
      return {
        title: `${roleEmoji} ${title}`,
        subtitle: subtitle,
      }
    },
  },
}
