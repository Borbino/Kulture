/**
 * [설명] AI 콘텐츠 자동 생성 Cron Job
 * [실행주기] 하루 3회 (09:00, 15:00, 21:00 KST)
 * [목적] 트렌드 기반 2차 창작물 자동 생성
 */

import { autoGenerateContent } from '../../../lib/vipMonitoring'
import { createClient } from '@sanity/client'
import OpenAI from 'openai'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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
    
    // 최근 24시간 내 Hot Issue 가져오기 (mentions >= 1000)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const hotIssues = await sanity.fetch(`
      *[_type == "hotIssue" && timestamp > $yesterday && shouldAutoGenerate == true]
      | order(mentions desc)[0...10]
    `, { yesterday })
    
    const generatedContent = []
    
    for (const issue of hotIssues) {
      // GPT-4로 기사 생성
      const article = await openai.chat.completions.create({
        model: autoGen.aiModel || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `당신은 K-Culture 전문 기자입니다. 주어진 트렌드를 바탕으로 500-800단어의 흥미로운 기사를 작성하세요. 
            
            형식:
            - 제목: 클릭을 유도하는 매력적인 제목
            - 부제: 1-2문장 요약
            - 본문: 3-5개 단락 (각 단락 2-3문장)
            - 결론: 향후 전망 포함
            
            톤: 정보성 + 엔터테인먼트, 긍정적이고 흥미진진하게`,
          },
          {
            role: 'user',
            content: `트렌드: "${issue.keyword}"
            
            설명: ${issue.description}
            
            멘션 수: ${issue.mentions}
            
            최근 콘텐츠 예시:
            ${issue.content.slice(0, 5).map(c => `- ${c.text || c.title}`).join('\n')}
            
            이 트렌드에 대한 흥미로운 기사를 작성해주세요.`,
          },
        ],
        temperature: 0.8,
      })
      
      const articleText = article.choices[0].message.content
      
      // 이미지 생성 (옵션)
      let imageUrl = null
      if (autoGen.images && process.env.ENABLE_IMAGE_GENERATION === 'true') {
        const imagePrompt = `K-pop culture trending topic: ${issue.keyword}. 
        Style: vibrant, modern, eye-catching thumbnail for social media. 
        No text in image.`
        
        const image = await openai.images.generate({
          model: 'dall-e-3',
          prompt: imagePrompt,
          size: '1024x1024',
          quality: 'hd',
        })
        
        imageUrl = image.data[0].url
      }
      
      // 소셜 포스트 생성 (옵션)
      let socialPosts = null
      if (autoGen.socialPosts) {
        const social = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Generate social media posts in JSON format. Keep Twitter under 280 characters.',
            },
            {
              role: 'user',
              content: `Create social media posts for this K-Culture article:
              
              Title: ${articleText.split('\n')[0]}
              
              Generate:
              1. Twitter post (max 280 chars, include 2-3 hashtags)
              2. Instagram caption (engaging, 2-3 sentences, 5-7 hashtags)
              3. Facebook post (slightly longer, conversational)
              
              Return as JSON: { twitter: "...", instagram: "...", facebook: "..." }`,
            },
          ],
        })
        
        try {
          socialPosts = JSON.parse(social.choices[0].message.content)
        } catch (e) {
          console.warn('Failed to parse social posts:', e)
        }
      }
      
      // Sanity에 저장 (CEO 승인 대기)
      const draft = await sanity.create({
        _type: 'post',
        title: articleText.split('\n')[0],
        body: articleText,
        image: imageUrl ? { url: imageUrl } : null,
        socialPosts,
        metadata: {
          source: 'AI Generated',
          sourceIssue: issue.keyword,
          mentions: issue.mentions,
          trustScore: 85, // AI 생성 콘텐츠 기본 점수
          aiModel: autoGen.aiModel,
        },
        status: 'pending', // CEO 승인 대기
        createdAt: new Date().toISOString(),
      })
      
      generatedContent.push({
        issueKeyword: issue.keyword,
        draftId: draft._id,
      })
      
      console.log(`[Content Generated] ${issue.keyword} -> ${draft._id}`)
    }
    
    res.status(200).json({
      success: true,
      generated: generatedContent.length,
      content: generatedContent,
    })
  } catch (error) {
    console.error('[Content Generation Error]', error)
    res.status(500).json({ error: error.message })
  }
}
