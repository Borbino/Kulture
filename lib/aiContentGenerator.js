/**
 * AI Content Generation
 * GPT-4 based K-Culture content creation and multilingual publishing
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { translate } from './aiTranslation';
import logger from './logger';
import { getCostMonitor } from './costMonitor'; // Import Cost Monitor

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Gemini API (Free Tier)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || 'your-gemini-key');

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
 * [Zero-Cost Filtering] Filter trend data using Gemini API (Free Tier)
 * Analyzes raw items and returns only high-value K-Culture topics with revenue potential scores.
 *
 * @param {Array} rawItems - Array of raw trend items { title, source, raw }
 * @returns {Promise<Array>} Filtered items with scores { title, score, reason, originalItem }
 */
export async function filterTrendWithGemini(rawItems) {
  if (!rawItems || rawItems.length === 0) return [];

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Prepare batch input for Gemini (Max ~10-20 items to fit context window/rate limits)
    // We'll process the first 20 items for efficiency in this demo
    const batch = rawItems.slice(0, 20).map((item, index) =>
      `${index + 1}. [${item.source}] ${item.title}`
    ).join('\n');

    const prompt = `
Analyze the following news headlines/trends.
Select only items strictly related to K-POP, Korean Drama, Korean Food, or major K-Culture influencers.
For each selected item, evaluate its "Revenue Potential Score" (1-10) based on global virality and interest.
Return the result as a JSON array of objects with keys: "index" (number), "score" (number), "reason" (short string).

Items:
${batch}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from Gemini response (handle potential markdown formatting)
    const jsonStr = text.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(jsonStr);

    // Map back to original items
    const filteredItems = analysis.map(a => {
      const original = rawItems[a.index - 1]; // 1-based index to 0-based
      if (!original) return null;
      return {
        ...original,
        priorityScore: a.score,
        filterReason: a.reason
      };
    }).filter(item => item !== null && item.priorityScore >= 1); // Basic validity check

    logger.info(`[Gemini Filter] Processed ${rawItems.length} items, selected ${filteredItems.length} candidates.`);
    return filteredItems;

  } catch (error) {
    logger.error('[Gemini Filter] Failed to filter trends:', error.message);
    // Fallback: Return empty array to avoid polluting DB with unfiltered noise
    return [];
  }
}

/**
 * Generate K-Culture content using GPT-4
 */
export async function generateKCultureContent(options = {}) {
  const {
    topic,
    contentType = 'article',
    tone = 'informative',
    targetAudience = 'general',
    includeSources = true,
    maxTokens = 2000,
    priorityScore = 5, // Default priority
  } = options;

  try {
    const costMonitor = getCostMonitor();
    const isBudgetExceeded = costMonitor.checkDailyLimit();
    const isHighPriority = priorityScore >= 7;

    // Cost Balancer Logic: Determine model
    let model = 'gpt-4o'; // Default Premium
    if (isBudgetExceeded || !isHighPriority) {
      model = 'gpt-4o-mini'; // Cost Saving Mode
      logger.info('Using Cost Saving Mode (gpt-4o-mini)', { isBudgetExceeded, priorityScore });
    } else {
      logger.info('Using Premium Mode (gpt-4o)', { priorityScore });
    }

    const contentConfig = CONTENT_TYPES[contentType] || CONTENT_TYPES.article;

    const systemPrompt = `You are an expert K-Culture content writer.
Your goal is to create engaging, accurate, and culturally sensitive content about Korean culture, entertainment, food, traditions, and modern trends.
Style: ${tone}
Target Audience: ${targetAudience}
Content Type: ${contentConfig.name}`;

    const userPrompt = `${contentConfig.prompt} "${topic}".

Requirements:
- Minimum ${contentConfig.minWords} words
- Include relevant facts and cultural context
- Use engaging storytelling
- Add practical information or tips where relevant
${includeSources ? '- Include credible sources or references' : ''}
- Format with clear sections and subheadings
- Make it accessible to international audiences

Please write in a way that both educates and entertains readers.`;

    logger.info('Generating AI content', { topic, contentType, model });

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
        top_p: 0.9,
      });
    } catch (error) {
      // Fallback Logic
      if (model === 'gpt-4o') {
        logger.warn('Premium model failed, falling back to gpt-4o-mini', { error: error.message });
        completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: maxTokens,
          temperature: 0.7,
        });
        model = 'gpt-4o-mini';
      } else {
        throw error; // Rethrow if fallback fails or initial was already economy
      }
    }

    const content = completion.choices[0].message.content;
    const tokensUsed = completion.usage.total_tokens;

    // Track cost
    costMonitor.trackRequest('openai', content.length, model);

    logger.info('AI content generated', {
      topic,
      contentType,
      model,
      tokensUsed,
      contentLength: content.length,
    });

    return {
      content,
      metadata: {
        topic,
        contentType,
        tone,
        targetAudience,
        tokensUsed,
        generatedAt: new Date().toISOString(),
        wordCount: content.split(/\s+/).length,
      },
    };
  } catch (error) {
    logger.error('Content generation failed', {
      error: error.message,
      topic,
      contentType,
    });
    throw new Error(`Content generation failed: ${error.message}`);
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

Format as JSON array.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a K-Culture content strategist. Generate creative, engaging content ideas.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1000,
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const ideas = JSON.parse(completion.choices[0].message.content);

    logger.info('Content ideas generated', { category, count });

    return ideas;
  } catch (error) {
    logger.error('Content idea generation failed', {
      error: error.message,
      category,
    });
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

  const prompt = enhancements[enhancementType] || enhancements.improve;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a K-Culture content editor. Enhance the provided content while preserving its core message and cultural accuracy.',
        },
        {
          role: 'user',
          content: `${prompt}:\n\n${originalContent}`,
        },
      ],
      max_tokens: 2500,
      temperature: 0.6,
    });

    const enhancedContent = completion.choices[0].message.content;

    logger.info('Content enhanced', {
      enhancementType,
      originalLength: originalContent.length,
      enhancedLength: enhancedContent.length,
    });

    return {
      original: originalContent,
      enhanced: enhancedContent,
      enhancementType,
      metadata: {
        tokensUsed: completion.usage.total_tokens,
        enhancedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    logger.error('Content enhancement failed', {
      error: error.message,
      enhancementType,
    });
    throw error;
  }
}

export default {
  generateKCultureContent,
  generateMultilingualContent,
  generateContentIdeas,
  enhanceContent,
};
