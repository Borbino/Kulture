import { sanityClient } from '../../../lib/sanityClient'
import { getSession } from 'next-auth/react'

/**
 * Events API
 * - GET: Fetch events
 * - POST: Create new event
 * - PATCH: Join/Leave event
 */

export default async function handler(req, res) {
  const session = await getSession({ req })

  if (req.method === 'GET') {
    try {
      const { limit = 20, page = 1, category, startDate, endDate } = req.query

      let query = `*[_type == "event" && status == "active"`
      const params = {}

      if (category) {
        query += ` && category == $category`
        params.category = category
      }

      if (startDate) {
        query += ` && eventDate >= $startDate`
        params.startDate = startDate
      }

      if (endDate) {
        query += ` && eventDate <= $endDate`
        params.endDate = endDate
      }

      query += `] | order(eventDate asc)`

      const start = (parseInt(page) - 1) * parseInt(limit)
      query += ` [${start}...${start + parseInt(limit)}]`

      query += ` {
        _id,
        title,
        description,
        image,
        category,
        location,
        eventDate,
        eventEndDate,
        organizer->{name, image},
        "attendeeCount": count(attendees[]),
        "ticketsSold": count(tickets[status == "sold"]),
        ticketsAvailable,
        price,
        status,
        createdAt
      }`

      const events = await sanityClient.fetch(query, params)

      let countQuery = `count(*[_type == "event" && status == "active"`
      if (category) countQuery += ` && category == $category`
      countQuery += `])`

      const total = await sanityClient.fetch(countQuery, params)

      return res.status(200).json({
        events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      })
    } catch (error) {
      console.error('Error fetching events:', error)
      return res.status(500).json({ error: 'Failed to fetch events' })
    }
  }

  if (req.method === 'POST') {
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      const { title, description, image, category, location, eventDate, eventEndDate, ticketsAvailable, price } = req.body

      if (!title || !eventDate) {
        return res.status(400).json({ error: 'Title and event date are required' })
      }

      const organizerRef = await sanityClient.fetch(
        `*[_type == "user" && email == $email][0]._id`,
        { email: session.user.email }
      )

      if (!organizerRef) {
        return res.status(404).json({ error: 'User not found' })
      }

      const event = await sanityClient.create({
        _type: 'event',
        title,
        description,
        image,
        category,
        location,
        eventDate,
        eventEndDate,
        organizer: { _type: 'reference', _ref: organizerRef },
        attendees: [],
        tickets: [],
        ticketsAvailable: ticketsAvailable || 100,
        price: price || 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      })

      return res.status(201).json({ event })
    } catch (error) {
      console.error('Error creating event:', error)
      return res.status(500).json({ error: 'Failed to create event' })
    }
  }

  if (req.method === 'PATCH') {
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      const { eventId, action } = req.body

      const userRef = await sanityClient.fetch(
        `*[_type == "user" && email == $email][0]._id`,
        { email: session.user.email }
      )

      if (!userRef) {
        return res.status(404).json({ error: 'User not found' })
      }

      if (action === 'joinEvent') {
        const event = await sanityClient
          .patch(eventId)
          .append('attendees', [{ _type: 'reference', _ref: userRef }])
          .commit()

        return res.status(200).json({ event })
      } else if (action === 'leaveEvent') {
        const event = await sanityClient
          .patch(eventId)
          .unset([`attendees[_ref == "${userRef}"]`])
          .commit()

        return res.status(200).json({ event })
      }
    } catch (error) {
      console.error('Error updating event:', error)
      return res.status(500).json({ error: 'Failed to update event' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
