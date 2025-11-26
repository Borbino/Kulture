/**
 * Translation Management API - List Translations
 * GET /api/translation/list?lang=ko&filter=all
 */

import { connectToDatabase } from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lang = 'ko', filter = 'all', page = 1, limit = 50 } = req.query;
    
    const { db } = await connectToDatabase();
    
    const query = { targetLanguage: lang };
    if (filter !== 'all') {
      query.status = filter;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const translations = await db.collection('translations')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();
    
    const total = await db.collection('translations').countDocuments(query);
    
    // Populate contributor information
    const translationsWithContributors = await Promise.all(
      translations.map(async (trans) => {
        if (trans.contributorId) {
          const contributor = await db.collection('users').findOne(
            { _id: trans.contributorId },
            { projection: { name: 1, email: 1 } }
          );
          return { ...trans, contributor };
        }
        return trans;
      })
    );
    
    res.status(200).json({
      translations: translationsWithContributors,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('List API error:', error);
    res.status(500).json({ error: 'Failed to fetch translations' });
  }
}
