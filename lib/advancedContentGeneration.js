/**
 * [설명] 고급 AI 2차 창작물 생성 시스템
 * [목적] 퀄리티 극대화 + 효율성 최적화
 * [특징]
 *   - 다중 AI 모델 앙상블 (Hugging Face + OpenRouter)
 *   - CEO 피드백 패턴 학습 강화
 *   - 자동 팩트체크 및 품질 검증 (contentReviewSystem 연동)
 *   - 저작권 안전성 검사 (copyrightChecker 연동)
 *   - SEO 최적화 자동 적용
 *   - 다양한 포맷 지원 (기사, 르포, 썰, 후일담, 인터뷰)
 */

import sanity from './sanityClient'
import { generateReviewReport } from './contentReviewSystem.js'
import { generateCopyrightNotice } from './copyrightChecker.js'
import { generateWithBestModel } from './aiModelManager.js'

// AI 모델은 aiModelManager.js가 동적으로 선택합니다 (하드코딩 없음)
// generateWithBestModel()이 Gemini Flash → Groq → HuggingFace → OpenRouter 순으로 자동 폴백

// ========== 콘텐츠 포맷 템플릿 ==========

const CONTENT_FORMATS = {
  article: {
    name: '기사 (Article)',
    structure: ['제목', '리드', '본문', '결론'],
    wordCount: [500, 800],
    tone: '객관적, 정보성',
    seoKeywords: 5,
  },
  reportage: {
    name: '르포 (Reportage)',
    structure: ['제목', '현장 묘사', '인터뷰', '분석', '전망'],
    wordCount: [800, 1200],
    tone: '생생한, 현장감',
    seoKeywords: 7,
  },
  story: {
    name: '썰 (Story)',
    structure: ['제목', '도입부', '전개', '클라이맥스', '결말'],
    wordCount: [600, 1000],
    tone: '친근한, 재미있는',
    seoKeywords: 4,
  },
  retrospective: {
    name: '후일담 (Retrospective)',
    structure: ['제목', '배경', '당시 상황', '그 후', '의미'],
    wordCount: [700, 1000],
    tone: '회고적, 감성적',
    seoKeywords: 5,
  },
  interview: {
    name: '인터뷰 (Interview)',
    structure: ['제목', '인물 소개', 'Q&A', '메시지'],
    wordCount: [600, 900],
    tone: '대화적, 친밀한',
    seoKeywords: 6,
  },
}

// ========== CEO 피드백 고급 분석 ==========

/**
 * CEO 피드백 패턴 딥러닝 분석
 */
async function analyzeCEOFeedbackAdvanced() {
  const feedbacks = await sanity.fetch(`
    *[_type == "ceoFeedback"] | order(timestamp desc) [0...100] {
      action,
      feedback,
      postTitle,
      timestamp
    }
  `)

  const analysis = {
    preferredFormats: {},
    preferredTone: {},
    preferredLength: { short: 0, medium: 0, long: 0 },
    keyPhrases: {},
    avoidPhrases: {},
    structurePreferences: {},
    contentThemes: {},
  }

  feedbacks.forEach(fb => {
    const text = fb.feedback.toLowerCase()

    // 포맷 선호도
    if (text.includes('기사'))
      analysis.preferredFormats.article = (analysis.preferredFormats.article || 0) + 1
    if (text.includes('르포') || text.includes('현장'))
      analysis.preferredFormats.reportage = (analysis.preferredFormats.reportage || 0) + 1
    if (text.includes('썰') || text.includes('재미'))
      analysis.preferredFormats.story = (analysis.preferredFormats.story || 0) + 1

    // 톤 선호도
    if (text.includes('객관') || text.includes('중립'))
      analysis.preferredTone.objective = (analysis.preferredTone.objective || 0) + 1
    if (text.includes('재미') || text.includes('흥미'))
      analysis.preferredTone.entertaining = (analysis.preferredTone.entertaining || 0) + 1
    if (text.includes('감성') || text.includes('감동'))
      analysis.preferredTone.emotional = (analysis.preferredTone.emotional || 0) + 1

    // 길이 선호도
    if (text.includes('짧게') || text.includes('간결')) analysis.preferredLength.short++
    if (text.includes('길게') || text.includes('상세')) analysis.preferredLength.long++
    else analysis.preferredLength.medium++

    // 키 프레이즈 추출 (긍정 피드백)
    if (fb.action === 'approved' || text.includes('좋아') || text.includes('마음에 들')) {
      const words = text.match(/\b\w{3,}\b/g) || []
      words.forEach(word => {
        analysis.keyPhrases[word] = (analysis.keyPhrases[word] || 0) + 1
      })
    }

    // 회피 프레이즈 (부정 피드백)
    if (fb.action === 'rejected' || text.includes('별로') || text.includes('아쉽')) {
      const words = text.match(/\b\w{3,}\b/g) || []
      words.forEach(word => {
        analysis.avoidPhrases[word] = (analysis.avoidPhrases[word] || 0) + 1
      })
    }
  })

  // 상위 패턴 추출
  const topKeyPhrases = Object.entries(analysis.keyPhrases)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([phrase, count]) => ({ phrase, count }))

  const topAvoidPhrases = Object.entries(analysis.avoidPhrases)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([phrase, count]) => ({ phrase, count }))

  return {
    ...analysis,
    topKeyPhrases,
    topAvoidPhrases,
  }
}

// ========== 고급 프롬프트 엔지니어링 ==========

/**
 * CEO 피드백 기반 고급 프롬프트 생성
 */
function generateAdvancedPrompt(issue, format, ceoPreferences) {
  const formatConfig = CONTENT_FORMATS[format]
  const [minWords, maxWords] = formatConfig.wordCount

  // CEO 선호 톤 반영
  let toneGuidance = formatConfig.tone
  if (ceoPreferences.preferredTone.objective > ceoPreferences.preferredTone.entertaining) {
    toneGuidance += ', 객관적이고 팩트 중심'
  } else {
    toneGuidance += ', 흥미롭고 engaging'
  }

  // CEO 선호 키워드 삽입
  const keyPhrases = ceoPreferences.topKeyPhrases.slice(0, 5).map(p => p.phrase)
  const avoidPhrases = ceoPreferences.topAvoidPhrases.slice(0, 5).map(p => p.phrase)

  const prompt = `당신은 세계적인 K-Culture 전문 콘텐츠 크리에이터입니다. 
다음 트렌드에 대해 ${formatConfig.name} 형식의 고품질 2차 창작물을 작성하세요.

**트렌드 정보**:
- 키워드: "${issue.keyword}"
- 설명: ${issue.description || 'K-Culture 관련 최신 트렌드'}
- 언급 수: ${issue.mentions?.toLocaleString() || 'N/A'}회
- 출처: ${issue.sources?.join(', ') || '다양한 소셜 미디어'}

**콘텐츠 구성**:
${formatConfig.structure.map((s, i) => `${i + 1}. ${s}`).join('\n')}

**작성 가이드**:
- 분량: ${minWords}-${maxWords} 단어
- 톤: ${toneGuidance}
- SEO 키워드 ${formatConfig.seoKeywords}개 자연스럽게 포함
- 제목은 클릭을 유도하되 과장 금지
- 팩트와 분석을 균형있게 배치
- 독자의 궁금증을 유발하는 스토리텔링

**CEO 선호 스타일**:
✅ 이런 표현 적극 활용: ${keyPhrases.join(', ')}
❌ 이런 표현 피하기: ${avoidPhrases.join(', ')}

**구조화된 출력**:
# 제목
[매력적인 제목을 작성하세요]

## 부제
[1-2문장 요약]

## 본문
[${formatConfig.structure.join(', ')} 순서대로 작성]

## 결론
[핵심 메시지 및 전망]

## SEO 키워드
[${formatConfig.seoKeywords}개 키워드를 쉼표로 구분]

---
작성을 시작하세요:
`

  return prompt
}

// ========== AI 모델 호출 (aiModelManager 위임) ==========

/**
 * AI 텍스트 생성 — aiModelManager에게 최적 모델 선택 위임
 * (callHuggingFace + callOpenRouter 대체)
 */
async function callBestAI(prompt) {
  const result = await generateWithBestModel(prompt, {
    task: 'generate',
    maxTokens: 1500,
  });
  if (!result || !result.text) throw new Error('사용 가능한 AI 가 없습니다');
  return { text: result.text, provider: result.provider, model: result.model };
}

// ========== 콘텐츠 파싱 및 구조화 ==========

/**
 * AI 생성 텍스트를 구조화된 포맷으로 파싱
 */
function parseGeneratedContent(rawText) {
  const lines = rawText.split('\n').filter(l => l.trim())

  const content = {
    title: '',
    subtitle: '',
    body: '',
    conclusion: '',
    seoKeywords: [],
  }

  let currentSection = 'title'

  for (const line of lines) {
    if (line.startsWith('# ')) {
      content.title = line.replace('# ', '').trim()
      currentSection = 'subtitle'
    } else if (line.startsWith('## 부제')) {
      currentSection = 'subtitle'
    } else if (line.startsWith('## 본문')) {
      currentSection = 'body'
    } else if (line.startsWith('## 결론')) {
      currentSection = 'conclusion'
    } else if (line.startsWith('## SEO')) {
      currentSection = 'seo'
    } else {
      if (currentSection === 'subtitle' && line.startsWith('##') === false) {
        content.subtitle += line + '\n'
      } else if (currentSection === 'body') {
        content.body += line + '\n'
      } else if (currentSection === 'conclusion') {
        content.conclusion += line + '\n'
      } else if (currentSection === 'seo') {
        const keywords = line.split(',').map(k => k.trim())
        content.seoKeywords.push(...keywords)
      }
    }
  }

  // 정제
  content.subtitle = content.subtitle.trim()
  content.body = content.body.trim()
  content.conclusion = content.conclusion.trim()
  content.seoKeywords = [...new Set(content.seoKeywords)].filter(k => k.length > 0)

  // 제목이 없으면 첫 줄을 제목으로
  if (!content.title && lines.length > 0) {
    content.title = lines[0].replace(/^#+\s*/, '')
  }

  return content
}

// ========== 자동 팩트체크 및 품질 검증 ==========

/**
 * 콘텐츠 품질 자동 검증
 */
function verifyContentQuality(content, issue) {
  const checks = {
    hasTitle: content.title.length > 5,
    hasBody: content.body.length >= 300,
    hasConclusion: content.conclusion.length >= 50,
    hasSEOKeywords: content.seoKeywords.length >= 3,
    mentionsKeyword: content.body.toLowerCase().includes(issue.keyword.toLowerCase()),
    wordCount: content.body.split(/\s+/).length,
    readability: calculateReadability(content.body),
    seoScore: calculateSEOScore(content),
  }

  checks.passed =
    checks.hasTitle &&
    checks.hasBody &&
    checks.hasConclusion &&
    checks.hasSEOKeywords &&
    checks.mentionsKeyword &&
    checks.wordCount >= 300 &&
    checks.readability >= 50 &&
    checks.seoScore >= 60

  checks.score = Math.floor(
    (checks.hasTitle ? 15 : 0) +
      (checks.hasBody ? 20 : 0) +
      (checks.hasConclusion ? 10 : 0) +
      (checks.hasSEOKeywords ? 10 : 0) +
      (checks.mentionsKeyword ? 15 : 0) +
      (checks.readability / 100) * 15 +
      (checks.seoScore / 100) * 15
  )

  return checks
}

/**
 * 가독성 점수 계산 (Flesch Reading Ease 간이 버전)
 */
function calculateReadability(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim())
  const words = text.split(/\s+/).filter(w => w.trim())
  const syllables = words.reduce((sum, word) => sum + estimateSyllables(word), 0)

  if (sentences.length === 0 || words.length === 0) return 0

  const avgWordsPerSentence = words.length / sentences.length
  const avgSyllablesPerWord = syllables / words.length

  // 간단한 가독성 공식 (0-100)
  const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord

  return Math.max(0, Math.min(100, score))
}

/**
 * 음절 수 추정
 */
function estimateSyllables(word) {
  // 한글: 글자 수 = 음절 수
  const korean = word.match(/[가-힣]/g)
  if (korean) return korean.length

  // 영어: 모음 그룹 수 추정
  const vowels = word.toLowerCase().match(/[aeiouy]+/g)
  return vowels ? vowels.length : 1
}

/**
 * SEO 점수 계산
 */
function calculateSEOScore(content) {
  const checks = {
    titleLength: content.title.length >= 30 && content.title.length <= 60,
    hasSubtitle: content.subtitle.length > 0,
    keywordDensity: 0,
    hasConclusion: content.conclusion.length > 0,
    keywordInTitle: false,
    hasHeadings: content.body.includes('##') || content.body.includes('###'),
  }

  // 키워드 밀도 (1-3% 이상적)
  if (content.seoKeywords.length > 0) {
    const wordCount = content.body.split(/\s+/).length
    let keywordCount = 0
    content.seoKeywords.forEach(kw => {
      const regex = new RegExp(kw, 'gi')
      keywordCount += (content.body.match(regex) || []).length
    })
    checks.keywordDensity = (keywordCount / wordCount) * 100
    checks.keywordInTitle = content.seoKeywords.some(kw =>
      content.title.toLowerCase().includes(kw.toLowerCase())
    )
  }

  const score =
    (checks.titleLength ? 20 : 0) +
    (checks.hasSubtitle ? 15 : 0) +
    (checks.keywordDensity >= 1 && checks.keywordDensity <= 3 ? 20 : 0) +
    (checks.hasConclusion ? 15 : 0) +
    (checks.keywordInTitle ? 20 : 0) +
    (checks.hasHeadings ? 10 : 0)

  return score
}

// ========== 메인 생성 함수 ==========

/**
 * 고급 AI 2차 창작물 생성 (전체 프로세스)
 */
export async function generateAdvancedContent(issue, format = 'article') {
  console.log(`[Advanced Content] Starting generation for "${issue.keyword}" (${format})`)

  const startTime = Date.now()

  try {
    // 1. CEO 피드백 패턴 분석
    const ceoPreferences = await analyzeCEOFeedbackAdvanced()

    // 2. 고급 프롬프트 생성
    const prompt = generateAdvancedPrompt(issue, format, ceoPreferences)

    // 3. AI 모델 호출 (aiModelManager가 자동으로 최적 무료 AI 선택)
    let rawText = ''
    let aiProvider = 'unknown'
    let aiModelName = 'unknown'
    try {
      const aiResult = await callBestAI(prompt)
      rawText = aiResult.text
      aiProvider = aiResult.provider || 'unknown'
      aiModelName = aiResult.model || 'unknown'
    } catch (aiError) {
      console.warn('[Advanced Content] AI 호출 실패, 템플릿으로 폴백...', aiError.message)
      rawText = generateTemplateContent(issue, format)
      aiProvider = 'template'
      aiModelName = 'built-in-template'
    }

    // 4. 콘텐츠 파싱 및 구조화
    const content = parseGeneratedContent(rawText)

    // 5. 기존 품질 검증 (SEO, 가독성, 키워드)
    const qualityCheck = verifyContentQuality(content, issue)

    // 6. 저작권 안전성 + 팩트체크 + 표절 검사 (contentReviewSystem 연동)
    const sourceMeta = issue.sources
      ? issue.sources.map((url, i) => ({ name: `Source ${i + 1}`, url, platform: 'rss' }))
      : []
    const reviewReport = await generateReviewReport(
      { title: content.title, body: content.body, sources: sourceMeta },
      []  // 기존 발행 콘텐츠 비교는 필요 시 외부에서 전달
    )

    // 출처 표기 자동 부착 (생성 콘텐츠 body에 추가)
    if (sourceMeta.length > 0 && reviewReport.attribution.text) {
      content.body = content.body + reviewReport.attribution.text
    }

    // 저작권 고지 생성
    content.copyrightNotice = generateCopyrightNotice({
      title: content.title,
      isAIGenerated: true,
      sources: sourceMeta,
    })

    // 7. 재생성 시도 (품질 미달 시)
    if (!qualityCheck.passed && qualityCheck.score < 70) {
      console.warn('[Advanced Content] Quality check failed, regenerating...')
      // 간단한 템플릿 사용
      const fallbackContent = generateTemplateContent(issue, format)
      const fallbackParsed = parseGeneratedContent(fallbackContent)
      const fallbackCheck = verifyContentQuality(fallbackParsed, issue)

      const elapsed = Date.now() - startTime
      return {
        success: true,
        content: fallbackParsed,
        qualityCheck: fallbackCheck,
        metadata: {
          aiModel: 'Template Fallback',
          format,
          ceoPreferences,
          generationTime: elapsed,
          retries: 1,
        },
      }
    }

    const elapsed = Date.now() - startTime

    console.log(
      `[Advanced Content] 컴플리트 in ${elapsed}ms (Quality Score: ${qualityCheck.score}/100, AI: ${aiProvider}/${aiModelName}, Review: ${reviewReport.status})`
    )

    return {
      success: true,
      content,
      qualityCheck,
      reviewReport,
      metadata: {
        aiProvider,
        aiModel: aiModelName,
        format,
        ceoPreferences,
        generationTime: elapsed,
        retries: 0,
        publishable: reviewReport.status !== 'rejected',
      },
    }
  } catch (error) {
    console.error('[Advanced Content] Generation failed:', error.message)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * 템플릿 기반 콘텐츠 생성 (Fallback)
 */
function generateTemplateContent(issue, format = 'article') {
  const formatConfig = CONTENT_FORMATS[format] || CONTENT_FORMATS.article

  return `# ${issue.keyword} - 최신 K-Culture 트렌드 분석

## 부제
${issue.keyword}가 소셜 미디어에서 ${issue.mentions?.toLocaleString() || 'N/A'}회 이상 언급되며 화제를 모으고 있습니다.

## 본문
최근 K-Culture 커뮤니티에서 "${issue.keyword}"가 뜨거운 관심을 받고 있습니다. 이 트렌드는 특히 젊은 세대 사이에서 급속도로 확산되고 있으며, 다양한 소셜 미디어 플랫폼에서 큰 반향을 일으키고 있습니다.

${issue.description || '이 트렌드는 K-Pop, K-Drama와 같은 기존 한류 콘텐츠와 결합되어 시너지 효과를 내고 있습니다.'}

전문가들은 이 트렌드가 한국 문화의 글로벌 영향력을 보여주는 또 하나의 사례라고 분석합니다. Twitter, Instagram, TikTok 등 주요 플랫폼에서 관련 콘텐츠가 폭발적으로 증가하고 있으며, 해외 팬들의 참여도 눈에 띄게 늘어나고 있습니다.

특히 Z세대가 주도하는 이러한 문화 현상은 한국의 소프트 파워를 더욱 강화하는 계기가 되고 있습니다. 업계 관계자들은 이 트렌드가 향후 K-Culture의 새로운 방향을 제시할 것으로 기대하고 있습니다.

## 결론
"${issue.keyword}" 트렌드는 앞으로도 지속적인 성장이 예상됩니다. 이러한 자발적인 팬 문화가 K-Culture의 미래를 밝게 하는 원동력이 될 것입니다.

## SEO 키워드
${issue.keyword}, K-Culture, 한류, ${formatConfig.name}, 소셜미디어`
}

export default generateAdvancedContent
