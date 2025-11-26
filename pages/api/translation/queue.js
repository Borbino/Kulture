/**
 * Translation Suggestion Queue API (Admin only)
 * Returns pending translation suggestions from MongoDB
 */

import { logger } from '../../../lib/logger.js'
import {
  getTranslationSuggestions,
  updateTranslationSuggestionStatus,
} from '../../../lib/translationSuggestions.js'
import { notifyTranslationSuggestionStatus } from '../../../lib/notificationSystem.js'

export default async function handler(req, res) {
  // Simple admin auth check (should be replaced with proper auth in production)
  const adminSecret = req.headers['x-admin-secret'] || req.query.secret
  if (adminSecret !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    try {
      const { status, targetLang, limit = 50, skip = 0 } = req.query

      const result = await getTranslationSuggestions(
        {},
        {
          status,
          targetLang,
          limit: parseInt(limit, 10),
          skip: parseInt(skip, 10),
        }
      )

      return res.status(200).json({
        total: result.total,
        suggestions: result.suggestions,
      })
    } catch (error) {
      logger.error('translation-queue', 'Failed to fetch suggestions', { error: error.message })
      return res.status(500).json({ error: 'Failed to fetch suggestions' })
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { id, status, reviewNote, reviewedBy } = req.body

      if (!id || !status) {
        return res.status(400).json({ error: 'Missing id or status' })
      }

      if (!['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' })
      }

      const suggestion = await updateTranslationSuggestionStatus(id, status, {
        reviewNote,
        reviewedBy,
      })

      // Notify submitter
      if (status !== 'pending') {
        await notifyTranslationSuggestionStatus(suggestion, status).catch((err) => {
          logger.error('translation-queue', 'Notification failed', { error: err.message })
        })
      }

      logger.info('translation-queue', 'Suggestion status updated', { id, status })

      return res.status(200).json({
        success: true,
        suggestion,
      })
    } catch (error) {
      logger.error('translation-queue', 'Failed to update suggestion', { error: error.message })
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
