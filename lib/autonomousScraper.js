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
      
      await generateKCultureContent({
        topic: item.title,
        contentType: 'news', // Default to news for trends
        priorityScore: item.priorityScore,
        includeSources: true
      });
      
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
