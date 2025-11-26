import { sanityClient } from '../../lib/sanityClient';
import { getSession } from 'next-auth/react';

/**
 * Reports API
 * - GET: Fetch reports (admin only)
 * - POST: Create new report
 * - PATCH: Update report status (admin only)
 */

export default async function handler(req, res) {
  const session = await getSession({ req });

  if (req.method === 'GET') {
    if (!session || session.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      const { status, type, page = 1, limit = 20 } = req.query;

      let query = `*[_type == "report"`;
      const params = {};

      if (status) {
        query += ` && status == $status`;
        params.status = status;
      }

      if (type) {
        query += ` && type == $type`;
        params.type = type;
      }

      query += `] | order(createdAt desc)`;

      const start = (parseInt(page) - 1) * parseInt(limit);
      query += ` [${start}...${start + parseInt(limit)}]`;

      query += ` {
        _id,
        type,
        targetPost->{_id, title, user->{name}},
        targetComment->{_id, content, user->{name}},
        targetUser->{_id, name, email},
        reporter->{name, email},
        reason,
        description,
        status,
        action,
        reviewer->{name},
        reviewNote,
        createdAt,
        reviewedAt
      }`;

      const reports = await sanityClient.fetch(query, params);

      let countQuery = `count(*[_type == "report"`;
      if (status) countQuery += ` && status == $status`;
      if (type) countQuery += ` && type == $type`;
      countQuery += `])`;

      const total = await sanityClient.fetch(countQuery, params);

      return res.status(200).json({
        reports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      return res.status(500).json({ error: 'Failed to fetch reports' });
    }
  }

  if (req.method === 'POST') {
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { type, targetId, reason, description } = req.body;

      if (!type || !targetId || !reason) {
        return res.status(400).json({ error: 'Type, target ID, and reason are required' });
      }

      // Get reporter reference
      const reporterRef = await sanityClient.fetch(
        `*[_type == "user" && email == $email][0]._id`,
        { email: session.user.email }
      );

      if (!reporterRef) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Create report
      const reportData = {
        _type: 'report',
        type,
        reporter: { _type: 'reference', _ref: reporterRef },
        reason,
        description: description || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      // Add target reference based on type
      if (type === 'post') {
        reportData.targetPost = { _type: 'reference', _ref: targetId };
      } else if (type === 'comment') {
        reportData.targetComment = { _type: 'reference', _ref: targetId };
      } else if (type === 'user') {
        reportData.targetUser = { _type: 'reference', _ref: targetId };
      } else {
        return res.status(400).json({ error: 'Invalid report type' });
      }

      const report = await sanityClient.create(reportData);

      return res.status(201).json({ report });
    } catch (error) {
      console.error('Error creating report:', error);
      return res.status(500).json({ error: 'Failed to create report' });
    }
  }

  if (req.method === 'PATCH') {
    if (!session || session.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      const { reportId, status, action, reviewNote } = req.body;

      if (!reportId || !status) {
        return res.status(400).json({ error: 'Report ID and status are required' });
      }

      // Get report
      const report = await sanityClient.fetch(
        `*[_type == "report" && _id == $reportId][0]{
          _id, type, targetPost->{_id}, targetComment->{_id}, targetUser->{_id}
        }`,
        { reportId }
      );

      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      // Get reviewer reference
      const reviewerRef = await sanityClient.fetch(
        `*[_type == "user" && email == $email][0]._id`,
        { email: session.user.email }
      );

      // Update report
      const updates = {
        status,
        reviewedAt: new Date().toISOString(),
        reviewer: { _type: 'reference', _ref: reviewerRef },
      };

      if (action) updates.action = action;
      if (reviewNote) updates.reviewNote = reviewNote;

      const updatedReport = await sanityClient
        .patch(reportId)
        .set(updates)
        .commit();

      // Take action based on the action type
      if (action === 'hidden' || action === 'deleted') {
        if (report.type === 'post' && report.targetPost?._id) {
          if (action === 'hidden') {
            await sanityClient
              .patch(report.targetPost._id)
              .set({ isHidden: true })
              .commit();
          } else if (action === 'deleted') {
            await sanityClient.delete(report.targetPost._id);
          }
        } else if (report.type === 'comment' && report.targetComment?._id) {
          if (action === 'hidden') {
            await sanityClient
              .patch(report.targetComment._id)
              .set({ isHidden: true })
              .commit();
          } else if (action === 'deleted') {
            await sanityClient.delete(report.targetComment._id);
          }
        }
      }

      if ((action === 'warned' || action === 'banned') && report.type === 'user' && report.targetUser?._id) {
        const reason = report.reason || 'Multiple violations';
        const banUpdates = { isBanned: true };
        if (action === 'banned') {
          // Ban for 7 days by default
          const bannedUntil = new Date();
          bannedUntil.setDate(bannedUntil.getDate() + 7);
          banUpdates.bannedUntil = bannedUntil.toISOString();
          banUpdates.banReason = reviewNote || reason;
        }
        await sanityClient
          .patch(report.targetUser._id)
          .set(banUpdates)
          .commit();
      }

      return res.status(200).json({ report: updatedReport });
    } catch (error) {
      console.error('Error updating report:', error);
      return res.status(500).json({ error: 'Failed to update report' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
