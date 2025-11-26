/**
 * Community Translation Suggestion API
 * Accepts user-contributed translation improvements
 */

import { logger } from '../../../lib/logger.js'
import rateLimitMiddleware from '../../../lib/rateLimiter.js'

// In-memory queue (should be replaced with Sanity/DB in production)
const suggestionQueue = []

export default async function handler(req, res) {
  // Apply rate limiting
  const limiter = rateLimitMiddleware('api')
  limiter(req, res, () => {})
  if (res.headersSent) return

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      originalText,
      suggestedTranslation,
      targetLang,
      sourceLang = 'auto',
      context,
      reason,
      submitterEmail,
    } = req.body

    // Validation
    if (!originalText || !suggestedTranslation || !targetLang) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['originalText', 'suggestedTranslation', 'targetLang'],
      })
    }

    if (originalText.length > 5000 || suggestedTranslation.length > 5000) {
      return res.status(400).json({ error: 'Text too long (max 5000 characters)' })
    }

    const suggestion = {
      id: `sugg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalText,
      suggestedTranslation,
      targetLang,
      sourceLang,
      context,
      reason,
      submitterEmail,
      status: 'pending', // pending | approved | rejected
      submittedAt: new Date().toISOString(),
      ip: req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress,
    }

    // Store suggestion
    suggestionQueue.push(suggestion)

    // Keep only last 1000 suggestions in memory
    if (suggestionQueue.length > 1000) {
      suggestionQueue.shift()
    }

    logger.info('translation-suggest', 'New suggestion received', {
      id: suggestion.id,
      targetLang,
      sourceLang,
      textLength: originalText.length,
    })

    return res.status(201).json({
      success: true,
      message: 'Translation suggestion submitted for review',
      suggestionId: suggestion.id,
    })
  } catch (error) {
    logger.error('translation-suggest', 'Failed to process suggestion', { error: error.message })
    return res.status(500).json({ error: 'Failed to submit suggestion' })
  }
}

// Export queue for admin access
export { suggestionQueue }
