/**
 * AI Content Generation API
 */

import {
  generateKCultureContent,
  generateMultilingualContent,
  generateContentIdeas,
  enhanceContent,
} from '../../../lib/aiContentGenerator';
import { verifyAdmin } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await verifyAdmin(req, res);

    const { action, ...params } = req.body;

    switch (action) {
      case 'generate':
        const content = await generateKCultureContent(params);
        return res.status(200).json({ ok: true, ...content });

      case 'generate-multilingual':
        const multiContent = await generateMultilingualContent(params);
        return res.status(200).json({ ok: true, ...multiContent });

      case 'ideas':
        const ideas = await generateContentIdeas(params.category, params.count);
        return res.status(200).json({ ok: true, ideas });

      case 'enhance':
        const enhanced = await enhanceContent(params.content, params.enhancementType);
        return res.status(200).json({ ok: true, ...enhanced });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('AI content generation error:', error);
    return res.status(500).json({ error: error.message });
  }
}
