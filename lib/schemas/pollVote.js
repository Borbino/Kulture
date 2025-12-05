export default {
  name: 'pollVote',
  title: 'Poll Vote',
  type: 'document',
  fields: [
    {
      name: 'poll',
      title: 'Poll',
      type: 'reference',
      to: [{ type: 'poll' }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'voter',
      title: 'Voter',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'option',
      title: 'Selected Option',
      type: 'string',
      validation: (Rule) => Rule.required(),
      description: 'The option key that was selected',
    },
  ],
  preview: {
    select: {
      poll: 'poll.title',
      voter: 'voter.name',
      option: 'option',
    },
    prepare({ poll, voter, option }) {
      return {
        title: `${voter || 'Unknown'} voted ${option}`,
        subtitle: poll || 'Poll',
      }
    },
  },
}
