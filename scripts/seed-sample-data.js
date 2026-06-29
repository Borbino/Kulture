/**
 * [설명] Sanity CMS 샘플 데이터 생성 스크립트
 * [목적] 개발 및 테스트를 위한 초기 데이터 생성
 */

const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-11-21',
  useCdn: false,
})

// 샘플 데이터
const sampleData = {
  // 카테고리
  categories: [
    {
      _type: 'category',
      _id: 'category-kpop',
      title: 'K-POP',
      slug: { current: 'kpop' },
      description: 'K-POP 아티스트, 앨범, 뮤직비디오 소식',
      color: '#FF0080',
    },
    {
      _type: 'category',
      _id: 'category-kdrama',
      title: 'K-Drama',
      slug: { current: 'kdrama' },
      description: '한국 드라마, 배우, 제작 소식',
      color: '#8000FF',
    },
    {
      _type: 'category',
      _id: 'category-kmovie',
      title: 'K-Movie',
      slug: { current: 'kmovie' },
      description: '한국 영화, 감독, 시상식 소식',
      color: '#0080FF',
    },
  ],

  // 작성자
  authors: [
    {
      _type: 'author',
      _id: 'author-system',
      name: 'Kulture AI',
      slug: { current: 'kulture-ai' },
      bio: [
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: 'AI 기반 콘텐츠 생성 시스템',
            },
          ],
        },
      ],
      role: 'AI Writer',
    },
    {
      _type: 'author',
      _id: 'author-admin',
      name: 'Admin',
      slug: { current: 'admin' },
      bio: [
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: 'Kulture 플랫폼 관리자',
            },
          ],
        },
      ],
      role: 'Editor',
    },
  ],

  // 포스트
  posts: [
    {
      _type: 'post',
      title: 'BTS 신곡, 빌보드 차트 1위 달성',
      slug: { current: 'bts-new-single-billboard-1' },
      author: { _type: 'reference', _ref: 'author-system' },
      mainImage: {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: 'image-placeholder-1',
        },
      },
      categories: [{ _type: 'reference', _ref: 'category-kpop' }],
      publishedAt: new Date().toISOString(),
      excerpt:
        'BTS의 최신 싱글이 빌보드 핫 100 차트에서 1위를 차지하며 다시 한 번 K-POP의 위상을 입증했습니다.',
      body: [
        {
          _type: 'block',
          style: 'normal',
          children: [
            {
              _type: 'span',
              text: 'BTS가 새롭게 발매한 싱글이 빌보드 핫 100 차트에서 1위에 올랐습니다. 이번 곡은 발매 첫 주에 500만 스트리밍을 기록하며 전 세계 팬들의 뜨거운 반응을 얻었습니다.',
            },
          ],
        },
        {
          _type: 'block',
          style: 'h2',
          children: [{ _type: 'span', text: '차트 성과' }],
        },
        {
          _type: 'block',
          style: 'normal',
          children: [
            {
              _type: 'span',
              text: '빌보드 핫 100 1위 외에도 글로벌 200 차트 1위, Spotify 글로벌 차트 1위를 동시에 달성하며 명실상부 글로벌 아티스트의 면모를 보여주었습니다.',
            },
          ],
        },
      ],
      tags: ['BTS', 'Billboard', 'K-POP', 'Chart'],
      views: 15234,
      likes: 892,
      comments: 145,
    },
    {
      _type: 'post',
      title: '기생충 감독 신작, 칸 영화제 초청',
      slug: { current: 'parasite-director-new-film-cannes' },
      author: { _type: 'reference', _ref: 'author-admin' },
      mainImage: {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: 'image-placeholder-2',
        },
      },
      categories: [{ _type: 'reference', _ref: 'category-kmovie' }],
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      excerpt:
        '봉준호 감독의 신작 영화가 제78회 칸 영화제 경쟁 부문에 공식 초청되었습니다.',
      body: [
        {
          _type: 'block',
          style: 'normal',
          children: [
            {
              _type: 'span',
              text: '아카데미 4관왕에 빛나는 기생충의 봉준호 감독이 3년 만에 신작으로 돌아옵니다. 이번 작품은 칸 영화제 경쟁 부문에 초청되며 황금종려상 수상 가능성에 관심이 쏠리고 있습니다.',
            },
          ],
        },
      ],
      tags: ['봉준호', '칸영화제', 'K-Movie'],
      views: 8921,
      likes: 524,
      comments: 87,
    },
    {
      _type: 'post',
      title: '넷플릭스 한국 드라마, 전 세계 1위 기록',
      slug: { current: 'netflix-korean-drama-worldwide-1' },
      author: { _type: 'reference', _ref: 'author-system' },
      mainImage: {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: 'image-placeholder-3',
        },
      },
      categories: [{ _type: 'reference', _ref: 'category-kdrama' }],
      publishedAt: new Date(Date.now() - 172800000).toISOString(),
      excerpt:
        '넷플릭스에서 공개된 한국 오리지널 드라마가 전 세계 90개국에서 1위를 차지했습니다.',
      body: [
        {
          _type: 'block',
          style: 'normal',
          children: [
            {
              _type: 'span',
              text: '넷플릭스를 통해 공개된 한국 드라마가 공개 첫 주 만에 전 세계 시청률 1위를 기록하며 K-Drama의 글로벌 영향력을 다시 한 번 증명했습니다.',
            },
          ],
        },
      ],
      tags: ['Netflix', 'K-Drama', '한국드라마'],
      views: 12456,
      likes: 731,
      comments: 203,
    },
  ],

  // Hot Issues
  hotIssues: [
    {
      _type: 'hotIssue',
      title: 'BTS 신곡 발매',
      description: 'BTS 새 앨범 타이틀곡 공개',
      sources: ['twitter', 'youtube', 'naver'],
      trendScore: 95.5,
      category: { _type: 'reference', _ref: 'category-kpop' },
      startDate: new Date().toISOString(),
      peakDate: new Date().toISOString(),
      status: 'active',
      keywords: ['BTS', '신곡', '컴백'],
      relatedPosts: [],
    },
  ],

  // Site Settings
  siteSettings: {
    _type: 'siteSettings',
    _id: 'siteSettings',
    title: 'Kulture - K-Culture 글로벌 플랫폼',
    description:
      'K-POP, K-Drama, K-Movie 등 한류 문화의 모든 것을 실시간으로 전달하는 글로벌 커뮤니티 플랫폼',
    keywords: ['K-POP', 'K-Drama', 'K-Movie', 'Korean Wave', 'Hallyu'],
    contactEmail: 'contact@kulture.wiki',
    socialLinks: {
      twitter: 'https://twitter.com/kulture',
      instagram: 'https://instagram.com/kulture',
      youtube: 'https://youtube.com/@kulture',
    },
  },
}

async function seedData() {
  console.log('🌱 Sanity 샘플 데이터 생성 시작...\n')

  try {
    // 1. 카테고리 생성
    console.log('📁 카테고리 생성 중...')
    for (const category of sampleData.categories) {
      await client.createOrReplace(category)
      console.log(`  ✓ ${category.title}`)
    }

    // 2. 작성자 생성
    console.log('\n👤 작성자 생성 중...')
    for (const author of sampleData.authors) {
      await client.createOrReplace(author)
      console.log(`  ✓ ${author.name}`)
    }

    // 3. 포스트 생성
    console.log('\n📝 포스트 생성 중...')
    for (const post of sampleData.posts) {
      const postResult = await client.create(post)
      console.log(`  ✓ ${post.title} (ID: ${postResult._id})`)
    }

    // 4. Hot Issues 생성
    console.log('\n🔥 Hot Issues 생성 중...')
    for (const issue of sampleData.hotIssues) {
      const issueResult = await client.create(issue)
      console.log(`  ✓ ${issue.title} (ID: ${issueResult._id}, Score: ${issue.trendScore})`)
    }

    // 5. Site Settings 생성
    console.log('\n⚙️ Site Settings 생성 중...')
    await client.createOrReplace(sampleData.siteSettings)
    console.log(`  ✓ ${sampleData.siteSettings.title}`)

    console.log('\n✅ 샘플 데이터 생성 완료!')
    console.log('\n📊 생성된 데이터:')
    console.log(`  - 카테고리: ${sampleData.categories.length}개`)
    console.log(`  - 작성자: ${sampleData.authors.length}명`)
    console.log(`  - 포스트: ${sampleData.posts.length}개`)
    console.log(`  - Hot Issues: ${sampleData.hotIssues.length}개`)
    console.log(`  - Site Settings: 1개`)
    console.log('\n🎉 Sanity Studio에서 확인하세요: http://localhost:3333')
  } catch (error) {
    console.error('\n❌ 데이터 생성 실패:', error.message)
    process.exit(1)
  }
}

// 스크립트 실행
seedData()
