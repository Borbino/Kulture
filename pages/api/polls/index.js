import { sanityClient } from '../../../lib/sanityClient'
import { getSession } from 'next-auth/react'

/**
 * Polls API
 * - GET: Fetch polls (with filters)
 * - POST: Create new poll
 * - PATCH: Vote on poll
 */

export default async function handler(req, res) {
  const session = await getSession({ req })

  if (req.method === 'GET') {
    try {
      const { boardId, limit = 20, page = 1 } = req.query

      let query = `*[_type == "poll" && status == "active"`
      const params = {}

      if (boardId) {
        query += ` && board._ref == $boardId`
        params.boardId = boardId
      }

      query += `] | order(createdAt desc)`

      const start = (parseInt(page) - 1) * parseInt(limit)
      query += ` [${start}...${start + parseInt(limit)}]`

      query += ` {
        _id,
        title,
        description,
        options[] {
          _key,
          title,
          "voteCount": count(*[_type == "pollVote" && poll._ref == ^._id && option == ^._key])
        },
        board->{name, slug},
        author->{name, image},
        status,
        startsAt,
        endsAt,
        createdAt,
        "totalVotes": count(*[_type == "pollVote" && poll._ref == ^._id]),
        "userVoted": count(*[_type == "pollVote" && poll._ref == ^._id && voter._ref == $userId]) > 0
      }`

      let userIdRef = null
      if (session) {
        userIdRef = await sanityClient.fetch(
          `*[_type == "user" && email == $email][0]._id`,
          { email: session.user.email }
        )
      }
      params.userId = userIdRef || 'none'

      const polls = await sanityClient.fetch(query, params)

      // Get total count
      let countQuery = `count(*[_type == "poll" && status == "active"`
      if (boardId) countQuery += ` && board._ref == $boardId`
      countQuery += `])`

      const total = await sanityClient.fetch(countQuery, params)

      return res.status(200).json({
        polls,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      })
    } catch (error) {
      console.error('Error fetching polls:', error)
      return res.status(500).json({ error: 'Failed to fetch polls' })
    }
  }

  if (req.method === 'POST') {
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      const { title, description, options, boardId, endsAt } = req.body

      if (!title || !options || options.length < 2) {
        return res.status(400).json({ error: 'Title and at least 2 options are required' })
      }

      const userRef = await sanityClient.fetch(
        `*[_type == "user" && email == $email][0]._id`,
        { email: session.user.email }
      )

      if (!userRef) {
        return res.status(404).json({ error: 'User not found' })
      }

      const poll = await sanityClient.create({
        _type: 'poll',
        title,
        description,
        options: options.map((opt) => ({
          _key: `option-${Date.now()}-${Math.random()}`,
          title: opt,
        })),
        board: { _type: 'reference', _ref: boardId },
        author: { _type: 'reference', _ref: userRef },
        status: 'active',
        startsAt: new Date().toISOString(),
        endsAt: endsAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      })

      return res.status(201).json({ poll })
    } catch (error) {
      console.error('Error creating poll:', error)
      return res.status(500).json({ error: 'Failed to create poll' })
    }
  }

  if (req.method === 'PATCH') {
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      const { pollId, optionKey } = req.body

      if (!pollId || !optionKey) {
        return res.status(400).json({ error: 'pollId and optionKey are required' })
      }

      const userRef = await sanityClient.fetch(
        `*[_type == "user" && email == $email][0]._id`,
        { email: session.user.email }
      )

      if (!userRef) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Check if user already voted
      const existingVote = await sanityClient.fetch(
        `*[_type == "pollVote" && poll._ref == $pollId && voter._ref == $userId][0]`,
        { pollId, userId: userRef }
      )

      if (existingVote) {
        return res.status(400).json({ error: 'You already voted on this poll' })
      }

      // Create vote
      const vote = await sanityClient.create({
        _type: 'pollVote',
        poll: { _type: 'reference', _ref: pollId },
        voter: { _type: 'reference', _ref: userRef },
        option: optionKey,
        createdAt: new Date().toISOString(),
      })

      return res.status(201).json({ vote })
    } catch (error) {
      console.error('Error voting on poll:', error)
      return res.status(500).json({ error: 'Failed to vote' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
