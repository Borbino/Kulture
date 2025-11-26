/**
 * Translation Management API - Statistics
 * GET /api/translation/stats
 */

import { connectToDatabase } from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    
    const totalLanguages = 100;
    
    const totalTranslations = await db.collection('translations').countDocuments();
    const pendingTranslations = await db.collection('translations').countDocuments({ status: 'pending' });
    const approvedTranslations = await db.collection('translations').countDocuments({ status: 'approved' });
    const rejectedTranslations = await db.collection('translations').countDocuments({ status: 'rejected' });
    
    const completionRate = (approvedTranslations / (totalLanguages * 110)) * 100;
    
    const topContributors = await db.collection('translations')
      .aggregate([
        { $group: { _id: '$contributorId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            name: '$user.name',
            count: 1
          }
        }
      ])
      .toArray();
    
    res.status(200).json({
      totalLanguages,
      totalTranslations,
      pendingTranslations,
      approvedTranslations,
      rejectedTranslations,
      completionRate,
      topContributors,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
}
