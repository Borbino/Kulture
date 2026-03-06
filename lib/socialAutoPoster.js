/**
 * Global Social Media Auto Poster
 * Automatically broadcasts new articles to Twitter/X to maximize traffic
 */

import { TwitterApi } from 'twitter-api-v2';
import { generateWithBestModel } from './aiModelManager.js';
import logger from './logger.js';
import axios from 'axios';

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
 * @param {string} platform - Target platform ('twitter' or 'facebook')
 * @returns {Promise<string>} Viral caption
 */
export async function generateViralCaption(title, summary, platform = 'twitter') {
  try {
    const isFacebook = platform === 'facebook';
    const charLimit = isFacebook ? 1000 : 200;

    const result = await generateWithBestModel(
      `Create a highly engaging, click-worthy social media post for a K-Culture article.\nPlatform: ${isFacebook ? 'Facebook (Engaging, slightly longer, community focused)' : 'Twitter/X (Short, punchy, viral)'}\nTitle: "${title}"\nSummary: "${summary}"\n\nRequirements:\n- Must be under ${charLimit} characters.\n- Use a provocative or exciting hook (e.g., "You won't believe...", "BREAKING:").\n- Include 3-5 relevant hashtags (e.g., #Kpop #Kdrama #Kculture).\n- Do NOT include the link (it will be added separately).\n- Tone: Viral, Fan-focused, Exciting.\n- Respond with ONLY the caption text, no explanation.`,
      { maxTokens: isFacebook ? 300 : 150, preferFree: true }
    );

    let caption = result.text.trim();
    caption = caption.replace(/"/g, '');
    return caption;
  } catch (error) {
    logger.error('Failed to generate viral caption:', error.message);
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
  const link = `https://www.kulture.wiki/posts/${slug}`;

  try {
    if (!process.env.X_API_KEY || process.env.X_API_KEY === 'DUMMY') {
      logger.warn('[SocialAutoPoster] Twitter API keys missing. Skipping post.');
      return { success: false, reason: 'missing_keys' };
    }

    const caption = await generateViralCaption(title, summary, 'twitter');
    const tweetText = `${caption}\n\n👇 Read more:\n${link}`;

    const { data: createdTweet } = await rwClient.v2.tweet(tweetText);
    
    logger.info(`[SocialAutoPoster] Successfully posted to X: ${createdTweet.id}`);
    
    return { success: true, tweetId: createdTweet.id };
  } catch (error) {
    logger.error('[SocialAutoPoster] Failed to post to X:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Post to Facebook Page
 * @param {Object} postData - { title, slug, summary }
 * @returns {Promise<Object>} Facebook API response
 */
export async function postToFacebook(postData) {
  const { title, slug, summary } = postData;
  const link = `https://www.kulture.wiki/posts/${slug}`;
  const pageId = process.env.FB_PAGE_ID;
  const accessToken = process.env.FB_PAGE_ACCESS_TOKEN;

  try {
    if (!pageId || !accessToken) {
      logger.warn('[SocialAutoPoster] Facebook API keys missing. Skipping post.');
      return { success: false, reason: 'missing_keys' };
    }

    const caption = await generateViralCaption(title, summary, 'facebook');
    
    const response = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      message: caption,
      link: link,
      access_token: accessToken
    });

    logger.info(`[SocialAutoPoster] Successfully posted to Facebook: ${response.data.id}`);
    return { success: true, postId: response.data.id };

  } catch (error) {
    logger.error('[SocialAutoPoster] Failed to post to Facebook:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Distribute content to all configured social media channels
 * @param {Object} postData - { title, slug, summary }
 * @returns {Promise<Object>} Summary of distribution results
 */
export async function distributeToSocialMedia(postData) {
  logger.info(`[SocialAutoPoster] Starting distribution for: ${postData.title}`);
  
  const results = await Promise.allSettled([
    postToX(postData),
    postToFacebook(postData)
  ]);

  const [twitterResult, facebookResult] = results;

  return {
    twitter: twitterResult.status === 'fulfilled' ? twitterResult.value : { success: false, error: twitterResult.reason },
    facebook: facebookResult.status === 'fulfilled' ? facebookResult.value : { success: false, error: facebookResult.reason }
  };
}

export default {
  distributeToSocialMedia,
  postToX,
  postToFacebook,
  generateViralCaption
};

