// [수익화 스키마] Kulture.net — 애드센스 수익 극대화 및 SEO 자동화 기사 문서
// [재작성] 2026-03-27 — 커뮤니티 게시판 구조 전면 제거, 수익화 명세 기반 재구성

const postSchema = {
  name: 'post',
  title: '기사 (Post)',
  type: 'document',

  fields: [
    // ─────────────────────────────────────────────────
    // 1. 기본 식별 필드
    // ─────────────────────────────────────────────────
    {
      name: 'title',
      title: '제목',
      type: 'string',
      validation: Rule =>
        Rule.required()
          .min(10)
          .max(70)
          .error('제목은 10자 이상 70자 이하여야 합니다.'),
    },
    {
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: Rule => Rule.required().error('Slug는 필수입니다.'),
    },

    // ─────────────────────────────────────────────────
    // 2. 발행 제어 — AdSense 보호
    // ─────────────────────────────────────────────────
    {
      name: 'status',
      title: '발행 상태',
      type: 'string',
      description: 'AdSense 정책 보호: 검토 전 기사는 반드시 draft 상태 유지',
      options: {
        list: [
          { title: '📝 Draft (초안 — 기본값)', value: 'draft' },
          { title: '🌐 Published (게시됨)', value: 'published' },
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
      validation: Rule =>
        Rule.required()
          .valid('draft', 'published')
          .error('draft 또는 published 중 하나를 선택하세요.'),
    },
    {
      name: 'language',
      title: '언어 (ISO 639-1)',
      type: 'string',
      description: '예: ko, en, ja, zh',
      validation: Rule =>
        Rule.required()
          .min(2)
          .max(2)
          .error('ISO 639-1 2자리 언어 코드를 입력하세요 (예: ko).'),
    },
    {
      name: 'publishedAt',
      title: '발행 일시',
      type: 'datetime',
    },

    // ─────────────────────────────────────────────────
    // 3. 미디어
    // ─────────────────────────────────────────────────
    {
      name: 'mainImage',
      title: '대표 이미지',
      type: 'image',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          title: 'Alt 텍스트 (SEO 필수)',
          type: 'string',
          validation: Rule =>
            Rule.required().error(
              'Alt 텍스트는 SEO 및 접근성을 위해 반드시 입력하세요.'
            ),
        },
      ],
    },

    // ─────────────────────────────────────────────────
    // 4. 요약 — SEO 메타 디스크립션 소스
    // ─────────────────────────────────────────────────
    {
      name: 'excerpt',
      title: '요약 (Excerpt)',
      type: 'text',
      rows: 3,
      description: 'SEO 메타 디스크립션 및 소셜 공유용 요약 (최대 160자)',
      validation: Rule =>
        Rule.max(160).error('요약은 160자를 초과할 수 없습니다.'),
    },

    // ─────────────────────────────────────────────────
    // 5. 본문 — 리치 콘텐츠 블록
    // ─────────────────────────────────────────────────
    {
      name: 'body',
      title: '본문',
      type: 'array',
      of: [
        // 기본 블록 텍스트
        { type: 'block' },
        // 인라인 이미지
        {
          type: 'image',
          options: { hotspot: true },
        },
        // 커스텀: YouTube 임베드
        {
          type: 'object',
          name: 'youtube',
          title: 'YouTube 영상',
          fields: [
            {
              name: 'url',
              title: 'YouTube URL',
              type: 'url',
              validation: Rule =>
                Rule.required()
                  .uri({ scheme: ['https'] })
                  .error(
                    '유효한 YouTube HTTPS URL을 입력하세요.'
                  ),
            },
          ],
          preview: {
            select: { url: 'url' },
            prepare({ url }) {
              return { title: '▶ YouTube', subtitle: url }
            },
          },
        },
        // 커스텀: 알림 박스 (AdSense 품질 콘텐츠 보강)
        {
          type: 'object',
          name: 'alertBox',
          title: '알림 박스',
          fields: [
            {
              name: 'type',
              title: '박스 유형',
              type: 'string',
              options: {
                list: [
                  { title: 'ℹ️ Info', value: 'info' },
                  { title: '⚠️ Warning', value: 'warning' },
                  { title: '✅ Success', value: 'success' },
                ],
                layout: 'radio',
              },
              validation: Rule => Rule.required(),
            },
            {
              name: 'text',
              title: '알림 내용',
              type: 'text',
              rows: 3,
              validation: Rule => Rule.required(),
            },
          ],
          preview: {
            select: { type: 'type', text: 'text' },
            prepare({ type, text }) {
              const icon = { info: 'ℹ️', warning: '⚠️', success: '✅' }
              return {
                title: `${icon[type] || '📌'} AlertBox`,
                subtitle: text,
              }
            },
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────
    // 6. 수익화 블록 — 제휴 배너 / HTML 삽입
    // ─────────────────────────────────────────────────
    {
      name: 'monetizationBlock',
      title: '수익화 블록',
      description: 'CEO 제휴 배너/HTML 삽입용 — AdSense 외 직접 광고 영역',
      type: 'array',
      of: [
        // 리치 텍스트 (CTA 문구 등)
        { type: 'block' },
        // 배너 이미지
        {
          type: 'image',
          options: { hotspot: true },
        },
        // 원시 HTML 임베드 (제휴 스크립트 삽입)
        {
          type: 'object',
          name: 'htmlEmbed',
          title: 'HTML 임베드',
          fields: [
            {
              name: 'code',
              title: 'HTML 코드',
              type: 'text',
              rows: 6,
              description:
                '제휴 배너, 스크립트, iFrame 등 원시 HTML — 반드시 검토 후 삽입',
              validation: Rule =>
                Rule.required().error('HTML 코드를 입력하세요.'),
            },
          ],
          preview: {
            select: { code: 'code' },
            prepare({ code }) {
              return {
                title: '🔌 HTML 임베드',
                subtitle: (code || '').slice(0, 60),
              }
            },
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────
    // 7. SEO 구조화 데이터
    // ─────────────────────────────────────────────────
    {
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        {
          name: 'seoTitle',
          title: 'SEO 제목',
          type: 'string',
          description: '브라우저 탭 및 검색 결과 표시 제목 (최대 60자)',
          validation: Rule =>
            Rule.max(60).error('SEO 제목은 60자를 초과할 수 없습니다.'),
        },
        {
          name: 'jsonLd',
          title: 'JSON-LD 구조화 데이터',
          type: 'text',
          rows: 8,
          description:
            'Article / BreadcrumbList 등 JSON-LD 직접 입력 (Google 리치 결과용)',
        },
      ],
    },
  ],

  // ─────────────────────────────────────────────────
  // Sanity Studio 리스트 미리보기
  // ─────────────────────────────────────────────────
  preview: {
    select: {
      title: 'title',
      status: 'status',
      language: 'language',
      media: 'mainImage',
    },
    prepare({ title, status, language, media }) {
      const statusEmoji = {
        draft: '📝',
        published: '🌐',
      }
      return {
        title: `${statusEmoji[status] ?? '❓'} ${title ?? '(제목 없음)'}`,
        subtitle: `[${(language ?? '??').toUpperCase()}] ${status ?? 'draft'}`,
        media,
      }
    },
  },
}

export default postSchema
