/**
 * [설명] 고급 AI 콘텐츠 자동 생성 Cron Job (100% 무료)
 * [실행주기] 하루 4회 (09:00, 12:00, 15:00, 18:00 KST)
 * [목적] 트렌드 기반 고품질 2차 창작물 자동 생성
 */

import { generateAdvancedContent } from '../../../lib/advancedContentGeneration'
import sanity from '../../../lib/sanityClient'
import { withCronAuth } from '../../../lib/cronMiddleware'

export default withCronAuth(async function contentGenerationHandler(req, res) {
  try {
    const startTime = Date.now()

    console.log('[Content Generation] Starting advanced content generation...')

    // 관리자 설정 확인
    const settings = await sanity.fetch(`*[_type == "siteSettings"][0]`)
    const autoGen = settings?.crawler?.autoContentGeneration

    if (!autoGen?.articles) {
      return res.status(200).json({
        success: true,
        message: 'Auto generation disabled',
      })
    }

    // 최근 24시간 내 Hot Issue 가져오기 (mentions >= 1000)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const hotIssues = await sanity.fetch(
      `
      *[_type == "hotIssue" && timestamp > $yesterday && shouldAutoGenerate == true]
      | order(mentions desc)[0...10]
    `,
      { yesterday }
    )

    // trendTracking에서도 활성 트렌드 가져오기
    const activeTrends = await sanity.fetch(`
      *[_type == "trendTracking" && status == "active" && totalMentions >= 1000]
      | order(score desc)[0...10]
    `)

    // 통합
    const allIssues = [
      ...hotIssues.map(h => ({
        keyword: h.keyword,
        description: h.description,
        mentions: h.mentions,
        sources: ['Hot Issue'],
      })),
      ...activeTrends.map(t => ({
        keyword: t.keyword,
        description: `트렌드 점수: ${Math.floor(t.score)}, 성장률: ${(t.growthRate * 100).toFixed(1)}%`,
        mentions: t.totalMentions,
        sources: t.sources || [],
      })),
    ]

    // 중복 제거
    const uniqueIssues = []
    const seen = new Set()
    allIssues.forEach(issue => {
      const normalized = issue.keyword.toLowerCase().trim()
      if (!seen.has(normalized)) {
        seen.add(normalized)
        uniqueIssues.push(issue)
      }
    })

    console.log(`[Content Generation] ${uniqueIssues.length} unique issues to process`)

    const generatedContent = []
    const formats = ['article', 'reportage', 'story', 'retrospective', 'interview']

    for (const issue of uniqueIssues.slice(0, 5)) {
      // 상위 5개만 처리
      try {
        // 포맷 랜덤 선택 (다양성)
        const format = formats[Math.floor(Math.random() * formats.length)]

        console.log(`[Content Generation] Generating ${format} for "${issue.keyword}"...`)

        // 고급 AI 콘텐츠 생성
        const result = await generateAdvancedContent(issue, format)

        if (!result.success) {
          console.error(`[Content Generation] Failed for "${issue.keyword}":`, result.error)
          continue
        }

        const { content, qualityCheck, metadata } = result

        // 품질 점수가 70점 이상만 저장
        if (qualityCheck.score < 70) {
          console.warn(
            `[Content Generation] Low quality (${qualityCheck.score}/100) for "${issue.keyword}", skipping`
          )
          continue
        }

        // 소셜 포스트 생성
        const socialPosts = generateSocialPosts(content)

        // Sanity에 저장 (CEO 승인 대기)
        const draft = await sanity.create({
          _type: 'post',
          title: content.title,
          body: `${content.subtitle}\n\n${content.body}\n\n${content.conclusion}`,
          socialPosts,
          metadata: {
            source: `AI Generated (${metadata.aiModel})`,
            sourceIssue: issue.keyword,
            mentions: issue.mentions,
            trustScore: qualityCheck.score,
            aiModel: metadata.aiModel,
            format,
            generationTime: metadata.generationTime,
            readability: qualityCheck.readability,
            seoScore: qualityCheck.seoScore,
            feedbackPatterns: metadata.ceoPreferences?.topKeyPhrases || [],
          },
          status: 'pending',
          createdAt: new Date().toISOString(),
        })

        generatedContent.push({
          issueKeyword: issue.keyword,
          draftId: draft._id,
          format,
          qualityScore: qualityCheck.score,
        })

        console.log(
          `[Content Generated] ${issue.keyword} -> ${draft._id} (Quality: ${qualityCheck.score}/100)`
        )

        // Rate Limit 방지 (HF API)
        await new Promise(resolve => setTimeout(resolve, 5000)) // 5초 대기
      } catch (error) {
        console.error(`[Content Generation] Error for "${issue.keyword}":`, error.message)
      }
    }

    const elapsed = Date.now() - startTime

    console.log(
      `[Content Generation] Completed in ${elapsed}ms. Generated ${generatedContent.length} contents.`
    )

    res.status(200).json({
      success: true,
      generated: generatedContent.length,
      content: generatedContent,
      usedAdvancedAI: true,
      executionTime: elapsed,
    })
  } catch (error) {
    console.error('[Content Generation Error]', error)
    res.status(500).json({ error: error.message, stack: error.stack })
  }
})

/**
 * 소셜 미디어 포스트 생성
 */
function generateSocialPosts(content) {
  const title = content.title

  return {
    twitter: `🔥 ${title}\n\n최신 K-Culture 트렌드를 확인하세요!\n\n#KCulture #Korean #Trending #KPop #한류`,
    instagram: `${title} 📱\n\n요즘 가장 핫한 K-Culture 트렌드! 자세한 내용은 프로필 링크에서 확인하세요 ✨\n\n#한류 #KCulture #트렌드 #Korean #KPop #Viral #Trending #케이팝 #케이컬처`,
    facebook: `${title}\n\n최근 소셜 미디어를 뜨겁게 달구고 있는 새로운 한류 트렌드에 대해 알아보세요. 이번 트렌드는 특히 글로벌 팬들 사이에서 큰 반향을 일으키고 있습니다.\n\n${content.subtitle}\n\n자세한 내용은 링크를 클릭해주세요!`,
  }
}
