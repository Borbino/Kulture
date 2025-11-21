import { getSession } from 'next-auth/react';
import { analyzeSentiment, detectSpam, analyzeCommentQuality, analyzePostQuality } from '../../../lib/aiSentiment';

/**
 * AI 감정/품질 분석 API
 * - POST: 텍스트 감정 분석, 스팸 감지, 품질 분석
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { text, type = 'sentiment', title, content, tags, postContent } = req.body;

    if (!text && !title && !content) {
      return res.status(400).json({ error: 'Text or title/content is required' });
    }

    let result = {};

    switch (type) {
      case 'sentiment':
        result = analyzeSentiment(text);
        break;

      case 'spam':
        result = detectSpam(text);
        break;

      case 'comment':
        result = analyzeCommentQuality(text, postContent);
        break;

      case 'post':
        result = analyzePostQuality(title, content, tags);
        break;

      default:
        return res.status(400).json({ error: 'Invalid analysis type' });
    }

    return res.status(200).json({
      type,
      analysis: result,
    });
  } catch (error) {
    console.error('Error analyzing content:', error);
    return res.status(500).json({ error: 'Failed to analyze content' });
  }
}
