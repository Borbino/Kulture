/**
 * AI Content Generation — Dynamic Edition v3.0
 * 하드코딩된 AI 모델 없음 — 매 호출마다 최적의 무료 AI를 자동 선택
 */

import { translate } from './aiTranslation.js';
import { logger } from './logger.js';
import { getCostMonitor } from './costMonitor.js';
import { generateWithBestModel } from './aiModelManager.js';;

const CONTENT_TYPES = {
  article: {
    name: 'Article',
    prompt: 'Write a comprehensive article about',
    minWords: 500,
  },
  guide: {
    name: 'Guide',
    prompt: 'Create a step-by-step guide about',
    minWords: 300,
  },
  review: {
    name: 'Review',
    prompt: 'Write an in-depth review of',
    minWords: 400,
  },
  news: {
    name: 'News',
    prompt: 'Write a news article about the latest',
    minWords: 300,
  },
  tutorial: {
    name: 'Tutorial',
    prompt: 'Create a beginner-friendly tutorial on',
    minWords: 600,
  },
};

/**
 * [Zero-Cost Filtering] 한류 트렌드 필터
 * 원래 Gemini 하드코딩 → 지금은 aiModelManager가 최적 AI를 자동 선택
 *
 * @param {Array} rawItems - 수집된 아이템 리스트
 * @returns {Promise<Array>} 필터링된 아이템 (우선순위 점수 포함)
 */
export async function filterTrendWithAI(rawItems) {
  if (!rawItems || rawItems.length === 0) return [];

  try {
    const batch = rawItems.slice(0, 25).map((item, index) =>
      `${index + 1}. [${item.source}] ${item.title}`
    ).join('\n');

    const prompt = `Analyze these K-Culture headlines. Return a JSON array.
For each item that is related to Korean culture (K-pop, K-drama, food, beauty, sports, tech, history, travel, language, etc.), include:
{ "index": number, "score": 1-10, "reason": "short reason" }
Only include items with real K-Culture relevance. Skip irrelevant ones entirely.

Headlines:
${batch}`;

    const result = await generateWithBestModel(prompt, { task: 'filter', maxTokens: 1000 });
    if (!result || !result.text) return [];

    const jsonStr = result.text.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(jsonStr);

    const filteredItems = analysis.map(a => {
      const original = rawItems[a.index - 1];
      if (!original) return null;
      return { ...original, priorityScore: a.score, filterReason: a.reason, aiProvider: result.provider };
    }).filter(item => item !== null && item.priorityScore >= 1);

    logger.info(`[AI Filter] 처리 ${rawItems.length}개 → ${filteredItems.length}개 선택 (AI: ${result.provider || 'unknown'})`);
    return filteredItems;

  } catch (error) {
    logger.error('[AI Filter] 필터링 실패:', error.message);
    return [];
  }
}

// 하프버전 호환성 별칭 (autonomousScraper에서 이전 이름으로 호출 시 구버전 호나에서 가져오던 코드를위해)
export const filterTrendWithGemini = filterTrendWithAI;

/**
 * K-Culture 콘텐츠 생성
 * 원래 OpenAI GPT-4 하드코딩 → 지금은 aiModelManager가 최적 AI를 연동
 */
export async function generateKCultureContent(options = {}) {
  const {
    topic,
    contentType = 'article',
    tone = 'informative',
    targetAudience = 'general',
    includeSources = true,
    maxTokens = 2000,
    priorityScore = 5,
  } = options;

  try {
    const costMonitor = getCostMonitor();

    const contentConfig = CONTENT_TYPES[contentType] || CONTENT_TYPES.article;

    const systemPrompt = `You are an expert K-Culture content writer.
Create engaging, accurate, and culturally sensitive content about Korean culture, entertainment, food, traditions, sports, technology, history, and modern trends.
Style: ${tone}
Target Audience: ${targetAudience}
Content Type: ${contentConfig.name}
Return a valid JSON object with keys: "content" (string) and "pollData" (object with "question" (string) and "options" (array of 2 strings)).`;

    const userPrompt = `${contentConfig.prompt} "${topic}".

Requirements:
- Minimum ${contentConfig.minWords} words
- Include relevant facts and cultural context
- Use engaging storytelling
- Add practical information or tips where relevant
${includeSources ? '- Include credible sources or references' : ''}
- Format with clear sections and subheadings
- Make it accessible to international audiences
- Generate a controversial poll related to the content to increase dwell time.

Return strictly as a valid JSON object.`;

    const fullPrompt = systemPrompt + '\n\n' + userPrompt;

    logger.info('\uc804생성 요청', { topic, contentType, priorityScore });

    const result = await generateWithBestModel(fullPrompt, {
      task: 'generate',
      maxTokens,
      preferredProvider: priorityScore >= 7 ? null : 'groq',  // 저우선순위는 빠른 Groq 사용
    });

    if (!result || !result.text) throw new Error('AI 응답 없음');

    const jsonStr = result.text.replace(/```json|```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      // JSON 파싱 실패 시 평문으로 폴백
      parsed = { content: result.text, pollData: null };
    }

    const content = parsed.content || result.text;
    const pollData = parsed.pollData || null;

    costMonitor.trackRequest(result.provider || 'unknown', content.length, result.model || '');

    logger.info('AI 콘텐츠 생성 완료', {
      topic,
      contentType,
      provider: result.provider,
      model: result.model,
      contentLength: content.length,
    });

    return {
      content,
      pollData,
      metadata: {
        topic,
        contentType,
        tone,
        targetAudience,
        aiProvider: result.provider,
        aiModel: result.model,
        generatedAt: new Date().toISOString(),
        wordCount: content.split(/\s+/).length,
      },
    };
  } catch (error) {
    logger.error('콘텐츠 생성 실패', { error: error.message, topic, contentType });
    throw new Error(`콘텐츠 생성 실패: ${error.message}`);
  }
}

/**
 * Generate and translate content to multiple languages
 */
export async function generateMultilingualContent(options = {}) {
  const {
    topic,
    targetLanguages = ['ko', 'ja', 'zh', 'es', 'fr'],
    ...generationOptions
  } = options;

  try {
    // Generate original content in English
    const { content: originalContent, metadata } = await generateKCultureContent({
      topic,
      ...generationOptions,
    });

    // Translate to target languages
    const translations = {};
    const translationPromises = targetLanguages.map(async (lang) => {
      if (lang === 'en') {
        translations[lang] = originalContent;
        return;
      }

      try {
        const result = await translate(originalContent, lang, 'en', {
          context: `K-Culture ${metadata.contentType} about ${topic}`,
          preserveFormatting: true,
        });
        translations[lang] = result.translatedText;

        logger.info('Content translated', {
          topic,
          language: lang,
          provider: result.provider,
        });
      } catch (error) {
        logger.error(`Translation failed for ${lang}`, { error: error.message });
        translations[lang] = null; // Mark as failed
      }
    });

    await Promise.all(translationPromises);

    // Count successful translations
    const successfulTranslations = Object.values(translations).filter(t => t !== null).length;

    return {
      originalContent,
      translations,
      metadata: {
        ...metadata,
        originalLanguage: 'en',
        targetLanguages,
        successfulTranslations,
        totalLanguages: targetLanguages.length,
      },
    };
  } catch (error) {
    logger.error('Multilingual content generation failed', {
      error: error.message,
      topic,
    });
    throw error;
  }
}

/**
 * Generate content ideas based on trending topics
 */
export async function generateContentIdeas(category = 'kpop', count = 5) {
  try {
    const prompt = `Generate ${count} engaging content ideas for a K-Culture website in the category: ${category}.

For each idea, provide:
1. Title (catchy and SEO-friendly)
2. Brief description (1-2 sentences)
3. Target audience
4. Content type (article, guide, review, etc.)

Respond with a JSON array only.`;

    const result = await generateWithBestModel(prompt, { task: 'generate', maxTokens: 1000 });
    if (!result || !result.text) throw new Error('AI 응답 없음');
    const jsonStr = result.text.replace(/```json|```/g, '').trim();
    const ideas = JSON.parse(jsonStr);

    logger.info('Content ideas generated', { category, count, provider: result.provider });
    return ideas;
  } catch (error) {
    logger.error('Content idea generation failed', { error: error.message, category });
    throw error;
  }
}

/**
 * Enhance existing content with AI
 */
export async function enhanceContent(originalContent, enhancementType = 'improve') {
  const enhancements = {
    improve: 'Improve this content by making it more engaging, clear, and informative',
    expand: 'Expand this content with additional details, examples, and context',
    simplify: 'Simplify this content to make it more accessible to beginners',
    seo: 'Optimize this content for SEO while maintaining quality and readability',
  };

  const instruction = enhancements[enhancementType] || enhancements.improve;
  const fullPrompt = `You are a K-Culture content editor. Preserve the core message and cultural accuracy.\n\n${instruction}:\n\n${originalContent}`;

  try {
    const result = await generateWithBestModel(fullPrompt, { maxTokens: 2500 });
    if (!result || !result.text) throw new Error('AI 응답 없음');
    const enhancedContent = result.text;

    logger.info('Content enhanced', {
      enhancementType,
      originalLength: originalContent.length,
      enhancedLength: enhancedContent.length,
      provider: result.provider,
    });

    return {
      original: originalContent,
      enhanced: enhancedContent,
      enhancementType,
      metadata: {
        aiProvider: result.provider,
        aiModel: result.model,
        enhancedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    logger.error('Content enhancement failed', { error: error.message, enhancementType });
    throw error;
  }
}

export default {
  generateKCultureContent,
  generateMultilingualContent,
  generateContentIdeas,
  enhanceContent,
};
