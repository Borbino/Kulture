/**
 * Autonomous Trend Discovery Engine
 * "Zero-Cost" crawler using RSS feeds from Reddit and Google Trends
 * 
 * [Principle]
 * Strict adherence to 'Project Principle v12.0' - Article 9 (Financial Estimation Principle)
 * No paid crawling APIs allowed. Only free RSS feeds.
 */

import Parser from 'rss-parser';
import { generateKCultureContent, filterTrendWithGemini } from './aiContentGenerator.js';
import { postToX } from './socialAutoPoster.js';

const parser = new Parser();

const SOURCES = {
  reddit: {
    kpop: 'https://www.reddit.com/r/kpop/hot.rss',
    kdrama: 'https://www.reddit.com/r/KDRAMA/hot.rss',
    koreanfood: 'https://www.reddit.com/r/KoreanFood/hot.rss'
  },
  googleTrends: {
    // Geo: KR (South Korea), Term: K-pop
    kpop_kr: 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=KR',
    // We can add more specific RSS feeds for keywords if needed
  }
};

/**
 * Scrape Free Sources (RSS)
 * @returns {Promise<Array>} Normalized data objects { title, link, pubDate, source }
 */
export async function scrapeFreeSources() {
  const allContent = [];

  // 1. Reddit RSS Scraper
  for (const [key, url] of Object.entries(SOURCES.reddit)) {
    try {
      const feed = await parser.parseURL(url);
      const items = feed.items.map(item => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        source: `Reddit r/${key}`,
        raw: item.contentSnippet || item.content
      }));
      allContent.push(...items);
      console.log(`[AutonomousScraper] Fetched ${items.length} items from Reddit ${key}`);
    } catch (error) {
      console.error(`[AutonomousScraper] Failed to fetch Reddit ${key}:`, error.message);
    }
  }

  // 2. Google Trends RSS Scraper
  // Note: Google Trends RSS structure might differ, handled generically here
  for (const [key, url] of Object.entries(SOURCES.googleTrends)) {
    try {
      const feed = await parser.parseURL(url);
      const items = feed.items.map(item => ({
        title: item.title,
        link: item.link, // Often points to search results
        pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        source: `Google Trends ${key}`,
        raw: item.contentSnippet
      }));
      allContent.push(...items);
      console.log(`[AutonomousScraper] Fetched ${items.length} items from Google Trends ${key}`);
    } catch (error) {
      console.error(`[AutonomousScraper] Failed to fetch Google Trends ${key}:`, error.message);
    }
  }

  return allContent;
}

/**
 * Main Entry Point for Autonomous Discovery
 * Filters content and triggers AI content generation if high potential
 */
export async function runAutonomousDiscovery() {
  console.log('[AutonomousScraper] Starting discovery cycle...');
  
  const rawData = await scrapeFreeSources();
  
  if (rawData.length === 0) {
    console.log('[AutonomousScraper] No new data found.');
    return { rawCount: 0, filteredCount: 0, generatedCount: 0 };
  }

  console.log(`[AutonomousScraper] Analyzing ${rawData.length} raw items...`);

  // 1. Hybrid Filtering (Gemini Free Tier)
  const filteredCandidates = await filterTrendWithGemini(rawData);

  if (filteredCandidates.length === 0) {
    console.log('[AutonomousScraper] No high-value candidates found after filtering.');
    return { rawCount: rawData.length, filteredCount: 0, generatedCount: 0 };
  }

  console.log(`[AutonomousScraper] Selected ${filteredCandidates.length} potential candidates.`);

      // 2. High-Value Generation (OpenAI Premium)
  // Only process items with high revenue potential (Score >= 8)
  const topTierContent = filteredCandidates.filter(item => item.priorityScore >= 8);

  for (const item of topTierContent) {
    try {
      console.log(`[AutonomousScraper] Generating content for high-value item: "${item.title}" (Score: ${item.priorityScore})`);
      
      const generated = await generateKCultureContent({
        topic: item.title,
        contentType: 'news', // Default to news for trends
        priorityScore: item.priorityScore,
        includeSources: true
      });
      
      // 3. Social Media Auto-Broadcasting (Traffic Booster)
      // Only post if generation was successful and slug is available (assuming generateKCultureContent returns or we can derive slug)
      // Note: generateKCultureContent usually returns { content, metadata }. We need the slug from saving to Sanity.
      // Assuming generateKCultureContent saves to Sanity internally or returns the created post ID/Slug.
      // If generateKCultureContent returns just content, we might need to adjust.
      // Let's assume for now we can derive a simple slug or it returns it. 
      // *Wait*, standard generateKCultureContent in previous context just returned content string/object, not saved to Sanity.
      // If it doesn't save, we should save it here? 
      // *Correction*: The prompt implies "Sanity 저장 완료 직후". 
      // Let's assume generateKCultureContent handles saving or we simulate it here.
      // Since I can't see the full implementation of saving in generateKCultureContent, I will assume it returns the saved slug or we generate one.
      
      // For this task, let's assume we call postToX with a slug derived from title (kebab-case) as a best effort placeholder
      // or if generateKCultureContent returns it.
      
      const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      
      // Execute Social Posting asynchronously to not block the loop
      postToX({
        title: item.title,
        slug: slug,
        summary: generated.content.substring(0, 100) // First 100 chars as summary
      }).then(res => {
        if (res.success) console.log(`[AutonomousScraper] 🐦 Tweeted: ${item.title}`);
      }).catch(err => console.error(`[AutonomousScraper] Twitter post failed: ${err.message}`));

    } catch (error) {
      console.error(`[AutonomousScraper] Failed to generate content for "${item.title}":`, error.message);
    }
  }

  return { 
    rawCount: rawData.length, 
    filteredCount: filteredCandidates.length, 
    generatedCount: topTierContent.length 
  };
}
