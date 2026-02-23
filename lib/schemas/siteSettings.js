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

    // ========== 수익 가중치(RPM) 설정 ==========
    {
      name: 'revenueWeights',
      title: '지역별 수익 가중치(RPM)',
      type: 'object',
      fields: [
        {
          name: 'northAmericaWeight',
          title: '북미/유럽',
          description: '기본값 1.5',
          type: 'number',
          validation: Rule => Rule.min(0).max(5),
          initialValue: 1.5,
        },
        {
          name: 'eastAsiaWeight',
          title: '한/중/일',
          description: '기본값 1.0',
          type: 'number',
          validation: Rule => Rule.min(0).max(5),
          initialValue: 1.0,
        },
        {
          name: 'southeastAsiaWeight',
          title: '동남아시아',
          description: '기본값 0.5',
          type: 'number',
          validation: Rule => Rule.min(0).max(5),
          initialValue: 0.5,
        },
        {
          name: 'globalRestWeight',
          title: '기타 지역',
          description: '기본값 0.3',
          type: 'number',
          validation: Rule => Rule.min(0).max(5),
          initialValue: 0.3,
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

    // ========== 번역 시스템 설정 ==========
    {
      name: 'translationSystem',
      title: '🌐 Translation System (번역 시스템)',
      type: 'object',
      fields: [
        {
          name: 'enabled',
          title: 'Enable Translation System',
          description: '200+ 언어 자동 번역 기능 활성화',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'defaultLanguage',
          title: 'Default Language',
          description: '기본 언어 설정',
          type: 'string',
          options: {
            list: [
              { title: '한국어', value: 'ko' },
              { title: 'English', value: 'en' },
              { title: '日本語', value: 'ja' },
              { title: '中文', value: 'zh' },
              { title: 'Español', value: 'es' },
              { title: 'Français', value: 'fr' },
            ],
          },
          initialValue: 'ko',
        },
        {
          name: 'qualityThreshold',
          title: 'Quality Threshold (1-10)',
          description: '번역 품질 최소 기준 (7 이상 권장)',
          type: 'number',
          validation: Rule => Rule.min(1).max(10),
          initialValue: 7,
        },
        {
          name: 'primaryProvider',
          title: 'Primary Translation Provider',
          description: '우선 사용할 번역 제공자',
          type: 'string',
          options: {
            list: [
              { title: 'OpenAI (권장)', value: 'openai' },
              { title: 'DeepL (고품질)', value: 'deepl' },
              { title: 'Google Translate', value: 'google' },
            ],
          },
          initialValue: 'openai',
        },
        {
          name: 'enableCache',
          title: 'Enable Translation Cache',
          description: 'Redis 캐시 활성화 (성능 향상)',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'autoDetectLanguage',
          title: 'Auto-Detect Language',
          description: '언어 자동 감지 활성화',
          type: 'boolean',
          initialValue: true,
        },
      ],
    },

    // ========== 게임화 시스템 설정 ==========
    {
      name: 'gamification',
      title: '🎮 Gamification (게임화)',
      type: 'object',
      fields: [
        {
          name: 'enabled',
          title: 'Enable Gamification',
          description: '게임화 시스템 전체 활성화',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'dailyMissionsEnabled',
          title: 'Enable Daily Missions',
          description: '일일 미션 시스템 활성화',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'levelSystemEnabled',
          title: 'Enable Level System',
          description: '레벨 시스템 활성화 (0-10 레벨)',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'badgesEnabled',
          title: 'Enable Badges',
          description: '뱃지 시스템 활성화',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'pointMultiplier',
          title: 'Point Multiplier',
          description: '포인트 배율 조정 (1.0 = 기본)',
          type: 'number',
          validation: Rule => Rule.min(0.1).max(10.0),
          initialValue: 1.0,
        },
        {
          name: 'streakBonusEnabled',
          title: 'Enable Streak Bonus',
          description: '연속 활동 보너스 활성화',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'leaderboardEnabled',
          title: 'Enable Leaderboard',
          description: '리더보드 표시 활성화',
          type: 'boolean',
          initialValue: true,
        },
      ],
    },

    // ========== 트렌드 및 VIP 모니터링 설정 ==========
    {
      name: 'trends',
      title: '📈 Trends & VIP Monitoring (트렌드 및 VIP 모니터링)',
      type: 'object',
      fields: [
        {
          name: 'enabled',
          title: 'Enable Trends Feature',
          description: '트렌드 기능 전체 활성화',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'trendWidgetEnabled',
          title: 'Enable Trend Widget',
          description: '홈페이지 트렌드 위젯 표시',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'trendHubEnabled',
          title: 'Enable Trend Hub Page',
          description: '/trends 페이지 활성화',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'vipMonitoringEnabled',
          title: 'Enable VIP Monitoring',
          description: 'VIP 인물 멘션 추적 기능 활성화',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'hotIssueEnabled',
          title: 'Enable Hot Issues',
          description: '급상승 이슈 표시 활성화',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'updateInterval',
          title: 'Update Interval (minutes)',
          description: '트렌드 데이터 갱신 주기 (분)',
          type: 'number',
          validation: Rule => Rule.min(5).max(1440),
          initialValue: 30,
        },
        {
          name: 'maxTrendsPerSnapshot',
          title: 'Max Trends Per Snapshot',
          description: '스냅샷당 최대 트렌드 수',
          type: 'number',
          validation: Rule => Rule.min(10).max(200),
          initialValue: 50,
        },
        {
          name: 'trackingCategories',
          title: 'Tracking Categories',
          description: '모니터링할 K-문화 카테고리',
          type: 'array',
          of: [{ type: 'string' }],
          options: {
            list: [
              { title: 'K-Pop', value: 'kpop' },
              { title: 'K-Drama', value: 'kdrama' },
              { title: 'K-Movie', value: 'kmovie' },
              { title: 'K-Fashion', value: 'kfashion' },
              { title: 'K-Beauty', value: 'kbeauty' },
              { title: 'K-Food', value: 'kfood' },
              { title: 'K-Gaming', value: 'kgaming' },
              { title: 'K-Art', value: 'kart' },
            ],
          },
          initialValue: ['kpop', 'kdrama', 'kmovie', 'kfashion', 'kbeauty', 'kfood', 'kgaming', 'kart'],
        },
      ],
    },

    // ========== 실시간 채팅 설정 ==========
    {
      name: 'realTimeChat',
      title: '💬 Real-time Chat (실시간 채팅)',
      type: 'object',
      fields: [
        {
          name: 'enabled',
          title: 'Enable Real-time Chat',
          description: 'WebSocket 기반 실시간 채팅 활성화',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'autoTranslate',
          title: 'Auto-translate Messages',
          description: '메시지 자동 번역 (사용자 언어로)',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'messageHistoryCount',
          title: 'Message History Count',
          description: '저장할 메시지 히스토리 개수',
          type: 'number',
          validation: Rule => Rule.min(10).max(200),
          initialValue: 50,
        },
        {
          name: 'typingIndicatorEnabled',
          title: 'Enable Typing Indicator',
          description: '타이핑 중 표시 활성화',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'requireLogin',
          title: 'Require Login for Chat',
          description: '채팅 사용에 로그인 필수',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'maxRoomSize',
          title: 'Max Room Size',
          description: '채팅방 최대 인원',
          type: 'number',
          validation: Rule => Rule.min(2).max(1000),
          initialValue: 100,
        },
      ],
    },

    // ========== AI 콘텐츠 생성 설정 ==========
    {
      name: 'aiContentGeneration',
      title: '🤖 AI Content Generation (AI 콘텐츠 생성)',
      type: 'object',
      fields: [
        {
          name: 'enabled',
          title: 'Enable AI Content Generation',
          description: 'AI 기반 콘텐츠 자동 생성 활성화',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'contentTypes',
          title: 'Enabled Content Types',
          description: '생성 가능한 콘텐츠 타입',
          type: 'array',
          of: [{ type: 'string' }],
          options: {
            list: [
              { title: 'Article (기사)', value: 'article' },
              { title: 'Guide (가이드)', value: 'guide' },
              { title: 'Review (리뷰)', value: 'review' },
              { title: 'News (뉴스)', value: 'news' },
              { title: 'Tutorial (튜토리얼)', value: 'tutorial' },
            ],
          },
          initialValue: ['article', 'guide', 'review', 'news', 'tutorial'],
        },
        {
          name: 'autoGenerationSchedule',
          title: 'Auto-generation Schedule',
          description: '자동 생성 주기 (시간)',
          type: 'array',
          of: [{ type: 'string' }],
          options: {
            list: [
              { title: '09:00 KST', value: '09:00' },
              { title: '12:00 KST', value: '12:00' },
              { title: '15:00 KST', value: '15:00' },
              { title: '18:00 KST', value: '18:00' },
            ],
          },
          initialValue: ['09:00', '12:00', '15:00', '18:00'],
        },
        {
          name: 'requireCeoApproval',
          title: 'Require CEO Approval',
          description: '생성된 콘텐츠 CEO 승인 필수',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'multilingualPublish',
          title: 'Enable Multilingual Publishing',
          description: '다국어 동시 발행 (200+ 언어)',
          type: 'boolean',
          initialValue: true,
        },
      ],
    },

    // ========== 소셜 기능 설정 ==========
    {
      name: 'socialFeatures',
      title: '👥 Social Features (소셜 기능)',
      type: 'object',
      fields: [
        {
          name: 'followSystemEnabled',
          title: 'Enable Follow System',
          description: '팔로우/언팔로우 기능 활성화',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'reactionsEnabled',
          title: 'Enable Reactions',
          description: '이모지 반응 기능 활성화',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'enabledReactions',
          title: 'Enabled Reaction Types',
          description: '사용 가능한 반응 타입',
          type: 'array',
          of: [{ type: 'string' }],
          options: {
            list: [
              { title: '❤️ Love', value: 'love' },
              { title: '👍 Like', value: 'like' },
              { title: '😂 Laugh', value: 'laugh' },
              { title: '😮 Wow', value: 'wow' },
              { title: '😢 Sad', value: 'sad' },
              { title: '😡 Angry', value: 'angry' },
            ],
          },
          initialValue: ['love', 'like', 'laugh', 'wow', 'sad', 'angry'],
        },
        {
          name: 'activityFeedEnabled',
          title: 'Enable Activity Feed',
          description: '활동 피드 표시 활성화',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'activityTypes',
          title: 'Activity Types to Show',
          description: '표시할 활동 타입',
          type: 'array',
          of: [{ type: 'string' }],
          options: {
            list: [
              { title: 'Post Created', value: 'post_created' },
              { title: 'Comment Added', value: 'comment_added' },
              { title: 'Post Liked', value: 'post_liked' },
              { title: 'User Followed', value: 'user_followed' },
              { title: 'Badge Earned', value: 'badge_earned' },
              { title: 'Level Up', value: 'level_up' },
              { title: 'Reaction Added', value: 'reaction_added' },
            ],
          },
          initialValue: ['post_created', 'comment_added', 'post_liked', 'user_followed', 'badge_earned', 'level_up', 'reaction_added'],
        },
        {
          name: 'userProfilesEnabled',
          title: 'Enable User Profiles',
          description: '사용자 프로필 페이지 활성화',
          type: 'boolean',
          initialValue: true,
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
