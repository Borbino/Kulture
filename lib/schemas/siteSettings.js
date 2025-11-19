/**
 * [설명] Kulture 관리자 설정 스키마
 * [일시] 2025-11-19 14:00 (KST)
 * [목적] CEO가 관리자 페이지에서 모든 기능을 On/Off하거나 조정할 수 있도록 함
 */

const siteSettingsSchema = {
  name: 'siteSettings',
  title: 'Site Settings (사이트 설정)',
  type: 'document',
  // 싱글톤 패턴: 오직 하나의 설정 문서만 존재
  __experimental_actions: ['update', 'publish' /* 'delete' 제거 */],
  fields: [
    {
      name: 'title',
      title: 'Settings Title',
      type: 'string',
      initialValue: 'Kulture Site Settings',
      hidden: true,
    },

    // ========== 콘텐츠 제한 설정 ==========
    {
      name: 'contentRestriction',
      title: '📄 Content Restriction (콘텐츠 제한)',
      type: 'object',
      fields: [
        {
          name: 'enabled',
          title: 'Enable Content Restriction',
          description: '비회원 콘텐츠 제한 기능 활성화/비활성화',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'visiblePercentage',
          title: 'Visible Content Percentage (%)',
          description: '비회원에게 보여줄 콘텐츠 비율 (10~100%)',
          type: 'number',
          validation: Rule => Rule.min(10).max(100),
          initialValue: 40,
        },
        {
          name: 'applyToText',
          title: 'Apply to Text Content',
          description: '본문 텍스트에 제한 적용',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'applyToComments',
          title: 'Apply to Comments',
          description: '댓글에 제한 적용',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'applyToImages',
          title: 'Apply to Images',
          description: '이미지에 제한 적용',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'freeImageCount',
          title: 'Free Images Count',
          description: '제한 없이 볼 수 있는 이미지 개수',
          type: 'number',
          validation: Rule => Rule.min(0).max(10),
          initialValue: 2,
        },
      ],
    },

    // ========== 광고 시청 설정 ==========
    {
      name: 'adWatchFeature',
      title: '📺 Ad Watch Feature (광고 시청)',
      type: 'object',
      fields: [
        {
          name: 'enabled',
          title: 'Enable Ad Watch Feature',
          description: '광고 시청으로 콘텐츠 잠금 해제 기능 활성화',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'adDuration',
          title: 'Ad Duration (seconds)',
          description: '광고 최소 시청 시간 (초)',
          type: 'number',
          validation: Rule => Rule.min(5).max(120),
          initialValue: 30,
        },
        {
          name: 'sessionDuration',
          title: 'Session Duration (minutes)',
          description: '광고 시청 후 콘텐츠 접근 가능 시간 (분)',
          type: 'number',
          validation: Rule => Rule.min(10).max(1440), // 최대 24시간
          initialValue: 60,
        },
        {
          name: 'adSenseClientId',
          title: 'Google AdSense Client ID',
          description: 'Google AdSense 클라이언트 ID (ca-pub-xxxxxxxxxx)',
          type: 'string',
          initialValue: 'ca-pub-xxxxxxxxxxxxxxxx',
        },
        {
          name: 'showAsOption',
          title: 'Show as Option',
          description: '로그인과 함께 옵션으로 제시 (false면 광고만 표시)',
          type: 'boolean',
          initialValue: true,
        },
      ],
    },

    // ========== 댓글 설정 ==========
    {
      name: 'comments',
      title: '💬 Comments (댓글)',
      type: 'object',
      fields: [
        {
          name: 'enabled',
          title: 'Enable Comments',
          description: '댓글 기능 전체 활성화/비활성화',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'requireLogin',
          title: 'Require Login to Comment',
          description: '댓글 작성에 로그인 필수',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'moderationEnabled',
          title: 'Enable Moderation',
          description: '댓글 승인 시스템 활성화',
          type: 'boolean',
          initialValue: false,
        },
      ],
    },

    // ========== 회원 관련 설정 ==========
    {
      name: 'authentication',
      title: '🔐 Authentication (인증)',
      type: 'object',
      fields: [
        {
          name: 'allowSignup',
          title: 'Allow User Signup',
          description: '신규 회원가입 허용',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'requireEmailVerification',
          title: 'Require Email Verification',
          description: '이메일 인증 필수',
          type: 'boolean',
          initialValue: false,
        },
        {
          name: 'socialLoginEnabled',
          title: 'Enable Social Login',
          description: '소셜 로그인 (Google, Naver, Kakao 등) 활성화',
          type: 'boolean',
          initialValue: false,
        },
      ],
    },

    // ========== 사이트 일반 설정 ==========
    {
      name: 'general',
      title: '⚙️ General Settings (일반 설정)',
      type: 'object',
      fields: [
        {
          name: 'siteName',
          title: 'Site Name',
          type: 'string',
          initialValue: 'Kulture',
        },
        {
          name: 'maintenanceMode',
          title: 'Maintenance Mode',
          description: '사이트 점검 모드 (활성화 시 모든 방문자에게 점검 페이지 표시)',
          type: 'boolean',
          initialValue: false,
        },
        {
          name: 'maintenanceMessage',
          title: 'Maintenance Message',
          description: '점검 중 표시할 메시지',
          type: 'text',
          initialValue: '사이트 점검 중입니다. 잠시 후 다시 이용해 주세요.',
        },
      ],
    },

    // ========== 메타 정보 ==========
    {
      name: 'meta',
      title: '📊 Meta Information',
      type: 'object',
      options: { collapsed: true },
      fields: [
        {
          name: 'lastUpdated',
          title: 'Last Updated',
          type: 'datetime',
          readOnly: true,
        },
        {
          name: 'updatedBy',
          title: 'Updated By',
          type: 'string',
          readOnly: true,
        },
      ],
    },
  ],

  // 미리보기
  preview: {
    select: {
      title: 'title',
    },
    prepare() {
      return {
        title: 'Kulture Site Settings',
        subtitle: 'Global site configuration',
      }
    },
  },
}

export default siteSettingsSchema
