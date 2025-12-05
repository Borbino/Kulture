import { sanityClient } from '../../../lib/sanityClient'
import { getSession } from 'next-auth/react'

/**
 * Communities/Groups API
 * - GET: Fetch communities
 * - POST: Create new community
 * - PATCH: Update community
 */

export default async function handler(req, res) {
  const session = await getSession({ req })

  if (req.method === 'GET') {
    try {
      const { limit = 20, page = 1, memberOnly = false } = req.query

      let query = `*[_type == "community"`
      const params = {}

      if (memberOnly === 'true' && session) {
        query += ` && $userId in members[]._ref`
        const userId = await sanityClient.fetch(
          `*[_type == "user" && email == $email][0]._id`,
          { email: session.user.email }
        )
        params.userId = userId
      }

      query += `] | order(createdAt desc)`

      const start = (parseInt(page) - 1) * parseInt(limit)
      query += ` [${start}...${start + parseInt(limit)}]`

      query += ` {
        _id,
        name,
        description,
        image,
        owner->{name, image},
        "memberCount": count(members[]),
        "postCount": count(*[_type == "post" && community._ref == ^._id]),
        status,
        isPrivate,
        createdAt
      }`

      const communities = await sanityClient.fetch(query, params)

      let countQuery = `count(*[_type == "community"])`
      const total = await sanityClient.fetch(countQuery)

      return res.status(200).json({
        communities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      })
    } catch (error) {
      console.error('Error fetching communities:', error)
      return res.status(500).json({ error: 'Failed to fetch communities' })
    }
  }

  if (req.method === 'POST') {
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      const { name, description, image, isPrivate } = req.body

      if (!name) {
        return res.status(400).json({ error: 'Community name is required' })
      }

      const ownerRef = await sanityClient.fetch(
        `*[_type == "user" && email == $email][0]._id`,
        { email: session.user.email }
      )

      if (!ownerRef) {
        return res.status(404).json({ error: 'User not found' })
      }

      const community = await sanityClient.create({
        _type: 'community',
        name,
        description,
        image,
        owner: { _type: 'reference', _ref: ownerRef },
        members: [{ _type: 'reference', _ref: ownerRef }],
        isPrivate: isPrivate || false,
        status: 'active',
        createdAt: new Date().toISOString(),
      })

      return res.status(201).json({ community })
    } catch (error) {
      console.error('Error creating community:', error)
      return res.status(500).json({ error: 'Failed to create community' })
    }
  }

  if (req.method === 'PATCH') {
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      const { communityId, name, description, action, targetUserId } = req.body

      // Verify user is owner or admin
      const community = await sanityClient.fetch(
        `*[_type == "community" && _id == $id][0]`,
        { id: communityId }
      )

      const userRef = await sanityClient.fetch(
        `*[_type == "user" && email == $email][0]._id`,
        { email: session.user.email }
      )

      if (community.owner._ref !== userRef) {
        return res.status(403).json({ error: 'Not authorized' })
      }

      if (action === 'addMember') {
        const community = await sanityClient
          .patch(communityId)
          .append('members', [{ _type: 'reference', _ref: targetUserId }])
          .commit()

        return res.status(200).json({ community })
      } else if (action === 'removeMember') {
        const community = await sanityClient
          .patch(communityId)
          .unset([`members[_ref == "${targetUserId}"]`])
          .commit()

        return res.status(200).json({ community })
      } else {
        const community = await sanityClient
          .patch(communityId)
          .set({ name, description })
          .commit()

        return res.status(200).json({ community })
      }
    } catch (error) {
      console.error('Error updating community:', error)
      return res.status(500).json({ error: 'Failed to update community' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
