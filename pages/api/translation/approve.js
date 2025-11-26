/**
 * Translation Management API - Approve Translation
 * POST /api/translation/approve
 */

import { connectToDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Translation ID is required' });
    }
    
    const { db } = await connectToDatabase();
    
    const result = await db.collection('translations').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: req.user?.id || 'admin', // Assume user from auth middleware
        },
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Translation not found' });
    }
    
    // Get the approved translation
    const translation = await db.collection('translations').findOne({ _id: new ObjectId(id) });
    
    // Update the translation file
    await updateTranslationFile(translation);
    
    res.status(200).json({ success: true, message: 'Translation approved' });
  } catch (error) {
    console.error('Approve API error:', error);
    res.status(500).json({ error: 'Failed to approve translation' });
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
    const content = await fs.readFile(filePath, 'utf8');
    const translations = JSON.parse(content);
    
    // Update the specific key (e.g., "common.welcome" -> translations.common.welcome)
    const keys = translation.key.split('.');
    let current = translations;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = translation.translated;
    
    await fs.writeFile(filePath, JSON.stringify(translations, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to update translation file:', error);
  }
}
