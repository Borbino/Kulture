/**
 * Translation Management API - Approve Translation
 * POST /api/translation/approve
 */

import { logger } from '../../../lib/logger.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Translation ID is required' });
    }

    // TODO: Migrate to Supabase — MongoDB dependency removed
    logger.info('[TranslationApprove]', `Approve requested for id: ${id}`);
    await updateTranslationFile({ id });

    res.status(200).json({ success: true, message: 'Translation approved' });
  } catch (error) {
    logger.error('[TranslationApprove]', `API error: ${error.message}`);
    res.status(500).json({ error: 'Failed to approve translation' });
  }
}

async function updateTranslationFile(translation) {
  const { promises: fs } = await import('fs');
  const { join } = await import('path');
  
  const filePath = join(
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
    logger.error('[TranslationApprove]', `Failed to update translation file: ${error.message}`);
  }
}
