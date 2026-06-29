// [V15.1] Sanity user.js — 관리자(Admin) / 작성자(Author) 전용
// 일반 유저 UGC(points, level, badges, 활동 카운터 등)는 Supabase가 전담.
// 이 스키마는 시스템 관리자와 콘텐츠 에디터의 메타데이터만 관리한다.

export default {
  name: 'user',
  title: '관리자 / 작성자 (Admin / Author)',
  description:
    'Sanity는 시스템 관리자 및 콘텐츠 작성자 메타데이터만 관리한다. 일반 유저 활동(UGC) 데이터는 Supabase가 전담한다.',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: '이름',
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
      title: '프로필 이미지',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'bio',
      title: '소개 (Bio)',
      type: 'text',
      rows: 3,
    },
    {
      name: 'role',
      title: '역할',
      type: 'string',
      description:
        'Sanity는 에디터/관리자만 관리한다. 일반 유저(user)는 Supabase 관할.',
      options: {
        list: [
          { title: '✏️ Editor (콘텐츠 작성자)', value: 'editor' },
          { title: '👑 Admin (시스템 관리자)', value: 'admin' },
        ],
        layout: 'radio',
      },
      initialValue: 'editor',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'emailVerified',
      title: 'Email 인증 여부',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'createdAt',
      title: '가입일시',
      type: 'datetime',
    },
    {
      name: 'lastLoginAt',
      title: '마지막 로그인',
      type: 'datetime',
    },
    {
      name: 'isBanned',
      title: '차단 여부',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'banReason',
      title: '차단 사유',
      type: 'text',
    },
    {
      name: 'bannedUntil',
      title: '차단 만료일시',
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
      const roleEmoji = role === 'admin' ? '👑' : '✏️'
      return {
        title: `${roleEmoji} ${title}`,
        subtitle: subtitle,
      }
    },
  },
}
