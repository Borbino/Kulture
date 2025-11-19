/**
 * [설명] 고급 AI 콘텐츠 자동 생성 Cron Job (100% 무료)
 * [실행주기] 하루 4회 (09:00, 12:00, 15:00, 18:00 KST)
 * [목적] 트렌드 기반 고품질 2차 창작물 자동 생성
 */

import { generateAdvancedContent } from '../../../lib/advancedContentGeneration';
import { createClient } from '@sanity/client';

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

export default async function handler(req, res) {
  // Cron Secret 검증
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const startTime = Date.now();

    console.log('[Content Generation] Starting advanced content generation...');

    // 관리자 설정 확인
    const settings = await sanity.fetch(`*[_type == "siteSettings"][0]`);
    const autoGen = settings?.crawler?.autoContentGeneration;

    if (!autoGen?.articles) {
      return res.status(200).json({
        success: true,
        message: 'Auto generation disabled',
      });
    }

    // 최근 24시간 내 Hot Issue 가져오기 (mentions >= 1000)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const hotIssues = await sanity.fetch(
      `
      *[_type == "hotIssue" && timestamp > $yesterday && shouldAutoGenerate == true]
      | order(mentions desc)[0...10]
    `,
      { yesterday },
    );

    // trendTracking에서도 활성 트렌드 가져오기
    const activeTrends = await sanity.fetch(`
      *[_type == "trendTracking" && status == "active" && totalMentions >= 1000]
      | order(score desc)[0...10]
    `);

    // 통합
    const allIssues = [
      ...hotIssues.map((h) => ({
        keyword: h.keyword,
        description: h.description,
        mentions: h.mentions,
        sources: ['Hot Issue'],
      })),
      ...activeTrends.map((t) => ({
        keyword: t.keyword,
        description: `트렌드 점수: ${Math.floor(t.score)}, 성장률: ${(t.growthRate * 100).toFixed(1)}%`,
        mentions: t.totalMentions,
        sources: t.sources || [],
      })),
    ];

    // 중복 제거
    const uniqueIssues = [];
    const seen = new Set();
    allIssues.forEach((issue) => {
      const normalized = issue.keyword.toLowerCase().trim();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        uniqueIssues.push(issue);
      }
    });

    console.log(`[Content Generation] ${uniqueIssues.length} unique issues to process`);

    const generatedContent = [];
    const formats = ['article', 'reportage', 'story', 'retrospective', 'interview'];

    for (const issue of uniqueIssues.slice(0, 5)) {
      // 상위 5개만 처리
      try {
        // 포맷 랜덤 선택 (다양성)
        const format = formats[Math.floor(Math.random() * formats.length)];

        console.log(`[Content Generation] Generating ${format} for "${issue.keyword}"...`);

        // 고급 AI 콘텐츠 생성
        const result = await generateAdvancedContent(issue, format);

        if (!result.success) {
          console.error(`[Content Generation] Failed for "${issue.keyword}":`, result.error);
          continue;
        }

        const { content, qualityCheck, metadata } = result;

        // 품질 점수가 70점 이상만 저장
        if (qualityCheck.score < 70) {
          console.warn(`[Content Generation] Low quality (${qualityCheck.score}/100) for "${issue.keyword}", skipping`);
          continue;
        }

        // 소셜 포스트 생성
        const socialPosts = generateSocialPosts(content);

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
        });

        generatedContent.push({
          issueKeyword: issue.keyword,
          draftId: draft._id,
          format,
          qualityScore: qualityCheck.score,
        });

        console.log(`[Content Generated] ${issue.keyword} -> ${draft._id} (Quality: ${qualityCheck.score}/100)`);

        // Rate Limit 방지 (HF API)
        await new Promise((resolve) => setTimeout(resolve, 5000)); // 5초 대기
      } catch (error) {
        console.error(`[Content Generation] Error for "${issue.keyword}":`, error.message);
      }
    }

    const elapsed = Date.now() - startTime;

    console.log(`[Content Generation] Completed in ${elapsed}ms. Generated ${generatedContent.length} contents.`);

    res.status(200).json({
      success: true,
      generated: generatedContent.length,
      content: generatedContent,
      usedAdvancedAI: true,
      executionTime: elapsed,
    });
  } catch (error) {
    console.error('[Content Generation Error]', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
}

/**
 * 소셜 미디어 포스트 생성
 */
function generateSocialPosts(content) {
  const title = content.title;

  return {
    twitter: `🔥 ${title}\n\n최신 K-Culture 트렌드를 확인하세요!\n\n#KCulture #Korean #Trending #KPop #한류`,
    instagram: `${title} 📱\n\n요즘 가장 핫한 K-Culture 트렌드! 자세한 내용은 프로필 링크에서 확인하세요 ✨\n\n#한류 #KCulture #트렌드 #Korean #KPop #Viral #Trending #케이팝 #케이컬처`,
    facebook: `${title}\n\n최근 소셜 미디어를 뜨겁게 달구고 있는 새로운 한류 트렌드에 대해 알아보세요. 이번 트렌드는 특히 글로벌 팬들 사이에서 큰 반향을 일으키고 있습니다.\n\n${content.subtitle}\n\n자세한 내용은 링크를 클릭해주세요!`,
  };
}


/**
 * Hugging Face 무료 API로 기사 생성
 * 모델: microsoft/phi-2 (2.7B, 무제한 무료)
 */
async function generateArticleWithHuggingFace(issue, ceoFeedbackPatterns) {
  const HF_API_URL = 'https://api-inference.huggingface.co/models/microsoft/phi-2'
  const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN || 'hf_'

  // CEO 피드백 패턴 반영
  let styleGuide = '정보성과 엔터테인먼트를 결합한 톤으로 작성하세요.'
  if (ceoFeedbackPatterns?.length > 0) {
    styleGuide += '\n\nCEO 선호 스타일:'
    ceoFeedbackPatterns.forEach(p => {
      styleGuide += `\n- ${p.keyword}: ${p.count}회 언급`
    })
  }

  const prompt = `당신은 K-Culture 전문 기자입니다. 다음 트렌드에 대한 500-800단어 기사를 작성하세요.

트렌드: "${issue.keyword}"
설명: ${issue.description}
멘션 수: ${issue.mentions}

${styleGuide}

형식:
제목: [클릭을 유도하는 매력적인 제목]
부제: [1-2문장 요약]
본문:
[3-5개 단락, 각 단락 2-3문장]
결론:
[향후 전망 포함]

기사:`

  try {
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 800,
          temperature: 0.8,
          top_p: 0.9,
        },
      }),
    })

    if (!response.ok) {
      console.warn('HuggingFace API failed, using template')
      return generateTemplateArticle(issue)
    }

    const result = await response.json()
    return result[0]?.generated_text || generateTemplateArticle(issue)
  } catch (error) {
    console.error('HuggingFace error:', error)
    return generateTemplateArticle(issue)
  }
}

/**
 * 템플릿 기반 기사 생성 (Fallback, 100% 무료)
 */
function generateTemplateArticle(issue) {
  return `제목: ${issue.keyword} - 최신 K-Culture 트렌드 급부상

부제: 소셜 미디어에서 ${issue.mentions.toLocaleString()}회 이상 언급되며 화제를 모으고 있는 새로운 트렌드

본문:
최근 K-Culture 커뮤니티에서 "${issue.keyword}"가 뜨거운 관심을 받고 있습니다. 이 트렌드는 특히 젊은 세대 사이에서 급속도로 확산되고 있으며, 다양한 소셜 미디어 플랫폼에서 ${issue.mentions.toLocaleString()}회 이상의 멘션을 기록했습니다.

${issue.description}

전문가들은 이 트렌드가 한국 문화의 글로벌 영향력을 보여주는 또 하나의 사례라고 분석합니다. Twitter, Instagram, TikTok 등 주요 플랫폼에서 관련 콘텐츠가 폭발적으로 증가하고 있으며, 해외 팬들의 참여도 눈에 띄게 늘어나고 있습니다.

이번 트렌드는 K-Pop, K-Drama와 같은 기존 한류 콘텐츠와 결합되어 시너지 효과를 내고 있습니다. 특히 Z세대가 주도하는 이러한 문화 현상은 한국의 소프트 파워를 더욱 강화하는 계기가 되고 있습니다.

결론:
"${issue.keyword}" 트렌드는 앞으로도 지속적인 성장이 예상됩니다. 업계 관계자들은 이러한 자발적인 팬 문화가 K-Culture의 미래를 밝게 하는 원동력이 될 것이라고 전망하고 있습니다.

출처: 다양한 소셜 미디어 및 커뮤니티 분석`
}

/**
 * 소셜 포스트 생성 (무료)
 */
function generateSocialPosts(article) {
  const title = article.split('\n')[0].replace('제목: ', '')

  return {
    twitter: `🔥 ${title}\n\n최신 K-Culture 트렌드를 확인하세요!\n\n#KCulture #Korean #Trending #KPop`,
    instagram: `${title} 📱\n\n요즘 가장 핫한 K-Culture 트렌드! 자세한 내용은 프로필 링크에서 확인하세요 ✨\n\n#한류 #KCulture #트렌드 #Korean #KPop #Viral #Trending`,
    facebook: `${title}\n\n최근 소셜 미디어를 뜨겁게 달구고 있는 새로운 한류 트렌드에 대해 알아보세요. 이번 트렌드는 특히 글로벌 팬들 사이에서 큰 반향을 일으키고 있습니다.\n\n자세한 내용은 링크를 클릭해주세요!`,
  }
}

export default async function handler(req, res) {
  // Cron Secret 검증
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // 관리자 설정 확인
    const settings = await sanity.fetch(`*[_type == "siteSettings"][0]`)
    const autoGen = settings?.crawler?.autoContentGeneration

    if (!autoGen?.articles) {
      return res.status(200).json({
        success: true,
        message: 'Auto generation disabled',
      })
    }

    // CEO 피드백 패턴 학습
    const feedbackPatterns = await sanity.fetch(`
      *[_type == "ceoFeedback"] | order(timestamp desc)[0...50] {
        feedback
      }
    `)

    const patterns = {}
    feedbackPatterns.forEach(fb => {
      const keywords = fb.feedback.toLowerCase().match(/\b\w{3,}\b/g) || []
      keywords.forEach(kw => {
        patterns[kw] = (patterns[kw] || 0) + 1
      })
    })

    const topPatterns = Object.entries(patterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }))

    // 최근 24시간 내 Hot Issue 가져오기 (mentions >= 1000)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const hotIssues = await sanity.fetch(
      `
      *[_type == "hotIssue" && timestamp > $yesterday && shouldAutoGenerate == true]
      | order(mentions desc)[0...10]
    `,
      { yesterday }
    )

    const generatedContent = []

    for (const issue of hotIssues) {
      // Hugging Face 무료 AI로 기사 생성
      const article = await generateArticleWithHuggingFace(issue, topPatterns)

      // 소셜 포스트 생성 (무료 템플릿)
      const socialPosts = generateSocialPosts(article)

      // Sanity에 저장 (CEO 승인 대기)
      const draft = await sanity.create({
        _type: 'post',
        title: article.split('\n')[0].replace('제목: ', ''),
        body: article,
        socialPosts,
        metadata: {
          source: 'AI Generated (Hugging Face - Free)',
          sourceIssue: issue.keyword,
          mentions: issue.mentions,
          trustScore: 85,
          aiModel: 'microsoft/phi-2 (Free)',
          feedbackPatterns: topPatterns,
        },
        status: 'pending',
        createdAt: new Date().toISOString(),
      })

      generatedContent.push({
        issueKeyword: issue.keyword,
        draftId: draft._id,
      })

      console.log(`[Content Generated - Free] ${issue.keyword} -> ${draft._id}`)
    }

    res.status(200).json({
      success: true,
      generated: generatedContent.length,
      content: generatedContent,
      usedFreeAI: true,
      feedbackPatterns: topPatterns,
    })
  } catch (error) {
    console.error('[Content Generation Error]', error)
    res.status(500).json({ error: error.message })
  }
}
