export default {
  name: 'event',
  title: 'Event',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Event Title',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      validation: (Rule) => Rule.required().max(1000),
    },
    {
      name: 'image',
      title: 'Event Image',
      type: 'url',
      description: 'Event banner or cover image URL',
    },
    {
      name: 'startDate',
      title: 'Start Date',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'endDate',
      title: 'End Date',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'Physical location or "Online"',
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Conference', value: 'conference' },
          { title: 'Concert', value: 'concert' },
          { title: 'Workshop', value: 'workshop' },
          { title: 'Meetup', value: 'meetup' },
          { title: 'Sports', value: 'sports' },
          { title: 'Other', value: 'other' },
        ],
      },
      initialValue: 'meetup',
    },
    {
      name: 'organizer',
      title: 'Organizer',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'attendees',
      title: 'Attendees',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'user' }] }],
      description: 'List of users who are attending',
    },
    {
      name: 'ticketPrice',
      title: 'Ticket Price',
      type: 'number',
      initialValue: 0,
      description: 'Price in USD (0 for free events)',
    },
    {
      name: 'ticketLimit',
      title: 'Ticket Limit',
      type: 'number',
      initialValue: 0,
      description: 'Maximum attendees (0 for unlimited)',
    },
    {
      name: 'attendeeCount',
      title: 'Attendee Count',
      type: 'number',
      initialValue: 0,
      readOnly: true,
    },
  ],
  preview: {
    select: {
      title: 'title',
      organizer: 'organizer.name',
      startDate: 'startDate',
      attendeeCount: 'attendeeCount',
      category: 'category',
    },
    prepare({ title, organizer, startDate, attendeeCount, category }) {
      return {
        title,
        subtitle: `${category} • ${attendeeCount || 0} attending • ${organizer || 'Unknown'}`,
        description: startDate ? new Date(startDate).toLocaleDateString() : 'No date',
      }
    },
  },
}
