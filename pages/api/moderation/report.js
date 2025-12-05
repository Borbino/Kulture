import { sanityClient } from '../../../lib/sanityClient'
import { getSession } from 'next-auth/react'

/**
 * Moderation Reports API
 * - GET: Fetch reports (admin only)
 * - POST: Create new report
 * - PATCH: Update report status (admin only)
 */

export default async function handler(req, res) {
  const session = await getSession({ req })

  if (req.method === 'GET') {
    if (!session || session.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    try {
      const { status = 'pending', limit = 20, page = 1 } = req.query

      let query = `*[_type == "report"`
      const params = {}

      if (status) {
        query += ` && status == $status`
        params.status = status
      }

      query += `] | order(createdAt desc)`

      const start = (parseInt(page) - 1) * parseInt(limit)
      query += ` [${start}...${start + parseInt(limit)}]`

      query += ` {
        _id,
        type,
        reason,
        status,
        targetPost->{_id, title, author->{name}},
        targetComment->{_id, content, author->{name}},
        targetUser->{_id, name, email},
        reporter->{name, email},
        resolution,
        createdAt,
        resolvedAt
      }`

      const reports = await sanityClient.fetch(query, params)

      let countQuery = `count(*[_type == "report"`
      if (status) countQuery += ` && status == $status`
      countQuery += `])`

      const total = await sanityClient.fetch(countQuery, params)

      return res.status(200).json({
        reports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      })
    } catch (error) {
      console.error('Error fetching reports:', error)
      return res.status(500).json({ error: 'Failed to fetch reports' })
    }
  }

  if (req.method === 'POST') {
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      const { type, reason, targetPostId, targetCommentId, targetUserId } = req.body

      if (!type || !reason) {
        return res.status(400).json({ error: 'Type and reason are required' })
      }

      const reporterRef = await sanityClient.fetch(
        `*[_type == "user" && email == $email][0]._id`,
        { email: session.user.email }
      )

      if (!reporterRef) {
        return res.status(404).json({ error: 'User not found' })
      }

      const reportData = {
        _type: 'report',
        type,
        reason,
        status: 'pending',
        reporter: { _type: 'reference', _ref: reporterRef },
        createdAt: new Date().toISOString(),
      }

      if (targetPostId) {
        reportData.targetPost = { _type: 'reference', _ref: targetPostId }
      }
      if (targetCommentId) {
        reportData.targetComment = { _type: 'reference', _ref: targetCommentId }
      }
      if (targetUserId) {
        reportData.targetUser = { _type: 'reference', _ref: targetUserId }
      }

      const report = await sanityClient.create(reportData)

      return res.status(201).json({ report })
    } catch (error) {
      console.error('Error creating report:', error)
      return res.status(500).json({ error: 'Failed to create report' })
    }
  }

  if (req.method === 'PATCH') {
    if (!session || session.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    try {
      const { reportId, status, resolution, action } = req.body

      if (!reportId || !status) {
        return res.status(400).json({ error: 'reportId and status are required' })
      }

      const updateData = {
        status,
        resolution,
        resolvedAt: new Date().toISOString(),
      }

      const report = await sanityClient.patch(reportId).set(updateData).commit()

      // If action is required (remove post, ban user, etc.)
      if (action === 'removePost' && report.targetPost?._ref) {
        await sanityClient.patch(report.targetPost._ref).set({ isHidden: true }).commit()
      } else if (action === 'banUser' && report.targetUser?._ref) {
        await sanityClient.patch(report.targetUser._ref).set({ isBanned: true }).commit()
      }

      return res.status(200).json({ report })
    } catch (error) {
      console.error('Error updating report:', error)
      return res.status(500).json({ error: 'Failed to update report' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
