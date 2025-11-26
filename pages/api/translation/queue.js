/**
 * Translation Suggestion Queue API (Admin only)
 * Returns pending translation suggestions
 */

import { logger } from '../../../lib/logger.js'
import { suggestionQueue } from './suggest.js'

export default async function handler(req, res) {
  // Simple admin auth check (should be replaced with proper auth in production)
  const adminSecret = req.headers['x-admin-secret'] || req.query.secret
  if (adminSecret !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    // Get all suggestions with optional filtering
    const { status, limit = 100 } = req.query
    let suggestions = [...suggestionQueue]

    if (status) {
      suggestions = suggestions.filter((s) => s.status === status)
    }

    suggestions = suggestions.slice(-parseInt(limit, 10))

    return res.status(200).json({
      total: suggestions.length,
      suggestions: suggestions.reverse(), // Most recent first
    })
  }

  if (req.method === 'PATCH') {
    // Update suggestion status
    const { id, status, reviewNote } = req.body

    if (!id || !status) {
      return res.status(400).json({ error: 'Missing id or status' })
    }

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const suggestion = suggestionQueue.find((s) => s.id === id)
    if (!suggestion) {
      return res.status(404).json({ error: 'Suggestion not found' })
    }

    suggestion.status = status
    suggestion.reviewNote = reviewNote
    suggestion.reviewedAt = new Date().toISOString()

    logger.info('translation-queue', 'Suggestion status updated', { id, status })

    return res.status(200).json({
      success: true,
      suggestion,
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
