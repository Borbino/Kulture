/**
 * Global Social Media Auto Poster
 * Automatically broadcasts new articles to Twitter/X to maximize traffic
 */

import { TwitterApi } from 'twitter-api-v2';
import OpenAI from 'openai';
import logger from './logger.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Twitter Client (ensure these env vars are set)
const twitterClient = new TwitterApi({
  appKey: process.env.X_API_KEY || 'DUMMY',
  appSecret: process.env.X_API_SECRET || 'DUMMY',
  accessToken: process.env.X_ACCESS_TOKEN || 'DUMMY',
  accessSecret: process.env.X_ACCESS_SECRET || 'DUMMY',
});

const rwClient = twitterClient.readWrite;

/**
 * Generate viral caption using OpenAI
 * @param {string} title - Article title
 * @param {string} summary - Brief summary or first paragraph
 * @returns {Promise<string>} Viral caption (under 280 chars)
 */
export async function generateViralCaption(title, summary) {
  try {
    const prompt = `
Create a highly engaging, click-worthy tweet for a K-Culture article.
Title: "${title}"
Summary: "${summary}"

Requirements:
- Must be under 200 characters (leaving room for link).
- Use a provocative or exciting hook (e.g., "You won't believe...", "BREAKING:").
- Include 3 relevant hashtags (e.g., #Kpop #Kdrama #Kculture).
- Do NOT include the link (it will be added separately).
- Tone: Viral, Fan-focused, Exciting.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use cheaper model for short text
      messages: [
        { role: 'system', content: 'You are a social media expert specializing in viral K-Pop content.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 150,
      temperature: 0.8,
    });

    let caption = completion.choices[0].message.content.trim();
    caption = caption.replace(/"/g, ''); // Remove surrounding quotes if any
    return caption;
  } catch (error) {
    logger.error('Failed to generate viral caption:', error.message);
    // Fallback caption
    return `🔥 ${title} #Kculture #Kpop #Korea`;
  }
}

/**
 * Post to X (Twitter)
 * @param {Object} postData - { title, slug, summary }
 * @returns {Promise<Object>} Twitter API response
 */
export async function postToX(postData) {
  const { title, slug, summary } = postData;
  const link = `https://kulture.net/posts/${slug}`;

  try {
    // 0. Skip if env vars not set (Dev/Test mode)
    if (!process.env.X_API_KEY || process.env.X_API_KEY === 'DUMMY') {
      logger.warn('[SocialAutoPoster] Twitter API keys missing. Skipping post.');
      return { success: false, reason: 'missing_keys' };
    }

    // 1. Generate Caption
    const caption = await generateViralCaption(title, summary);
    
    // 2. Compose Tweet
    const tweetText = `${caption}\n\n👇 Read more:\n${link}`;

    // 3. Post to Twitter
    const { data: createdTweet } = await rwClient.v2.tweet(tweetText);
    
    logger.info(`[SocialAutoPoster] Successfully posted to X: ${createdTweet.id}`);
    
    return { success: true, tweetId: createdTweet.id };
  } catch (error) {
    logger.error('[SocialAutoPoster] Failed to post to X:', error);
    // Do not throw error to prevent crashing main loop
    return { success: false, error: error.message };
  }
}

export default {
  postToX,
  generateViralCaption
};
