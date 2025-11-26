/**
 * Translation Contribution API
 * POST /api/translation/contribute
 */

import { translateHighQuality, evaluateTranslationQuality } from '../../../lib/highQualityTranslation';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { key, original, translated, targetLanguage, feedback } = req.body;

    if (!key || !original || !translated || !targetLanguage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Evaluate translation quality using AI
    let qualityScore = null;
    let qualityFeedback = '';
    
    try {
      const evaluation = await evaluateTranslationQuality(original, translated, targetLanguage);
      qualityScore = evaluation.score;
      qualityFeedback = evaluation.feedback;
    } catch (error) {
      console.error('Quality evaluation failed:', error);
    }

    // Store in database
    const { connectToDatabase } = await import('../../../lib/mongodb');
    const { db } = await connectToDatabase();

    const contribution = {
      key,
      original,
      translated,
      targetLanguage,
      feedback: feedback || '',
      qualityScore,
      qualityFeedback,
      status: 'pending',
      contributorId: req.user?.id || null,
      contributorIp: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      createdAt: new Date(),
    };

    const result = await db.collection('translations').insertOne(contribution);

    // Auto-approve high-quality translations (score >= 9)
    if (qualityScore >= 9) {
      await db.collection('translations').updateOne(
        { _id: result.insertedId },
        {
          $set: {
            status: 'approved',
            approvedAt: new Date(),
            approvedBy: 'auto',
          },
        }
      );

      // Update translation file immediately
      await updateTranslationFile({
        ...contribution,
        _id: result.insertedId,
      });

      return res.status(201).json({
        success: true,
        message: 'Translation submitted and auto-approved',
        qualityScore,
        autoApproved: true,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Translation submitted for review',
      qualityScore,
      autoApproved: false,
    });
  } catch (error) {
    console.error('Contribute API error:', error);
    res.status(500).json({ error: 'Failed to submit translation' });
  }
}

async function updateTranslationFile(translation) {
  const fs = require('fs').promises;
  const path = require('path');

  const filePath = path.join(
    process.cwd(),
    'public',
    'locales',
    translation.targetLanguage,
    'common.json'
  );

  try {
    let translations = {};
    try {
      const content = await fs.readFile(filePath, 'utf8');
      translations = JSON.parse(content);
    } catch (error) {
      // File doesn't exist, start fresh
      translations = {};
    }

    // Update the specific key
    const keys = translation.key.split('.');
    let current = translations;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = translation.translated;

    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Write file
    await fs.writeFile(filePath, JSON.stringify(translations, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to update translation file:', error);
    throw error;
  }
}
