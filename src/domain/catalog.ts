import type { EventType } from './contracts';

type Blueprint = {
  label: string;
  categories: readonly [string, number][];
  tasks: readonly [string, number, string][];
  vendors: readonly [string, string][];
  ideas: readonly [string, string, string][];
};

export const blueprints: Record<EventType, Blueprint> = {
  wedding: {
    label: 'a beautifully personal wedding',
    categories: [
      ['Venue & catering', 42],
      ['Décor & flowers', 16],
      ['Photography', 12],
      ['Attire & styling', 10],
      ['Entertainment', 8],
      ['Invitations & gifts', 5],
      ['Contingency', 7],
    ],
    tasks: [
      ['Shortlist venues and request written quotes', -90, 'Venue'],
      ['Build your guest list and dietary preferences', -75, 'Guests'],
      ['Book photographer and key vendors', -60, 'Vendors'],
      ['Choose your décor and celebration palette', -45, 'Design'],
      ['Send invitations and open RSVPs', -35, 'Guests'],
      ['Confirm menus, accessibility and seating', -14, 'Details'],
      ['Share the final run sheet with vendors', -7, 'Coordination'],
      ['Celebrate and enjoy every moment', 0, 'Event day'],
    ],
    vendors: [
      [
        'Venue',
        'Confirm capacity, accessible entry, timings and cancellation terms.',
      ],
      ['Catering', 'Request a tasting, dietary options and an itemized quote.'],
      [
        'Photography',
        'Review full galleries, deliverables and backup equipment.',
      ],
      [
        'Florals & décor',
        'Agree on a mood board, setup time and reusable options.',
      ],
      [
        'Entertainment',
        'Check sound limits, power supply and performance schedule.',
      ],
      [
        'Coordination',
        'Nominate an event-day contact and confirm the run sheet.',
      ],
    ],
    ideas: [
      [
        'A story worth celebrating',
        'Create a welcome table with handwritten notes and photographs that tell your story.',
        'Personal touch',
      ],
      [
        'A little green goes a long way',
        'Choose locally grown flowers, reusable décor and digital RSVPs for a lighter celebration.',
        'Thoughtful details',
      ],
      [
        'Together at the table',
        'Name tables after places that matter to you and add a conversation starter at each seat.',
        'Guest experience',
      ],
      [
        'Your own golden hour',
        'Leave a quiet twenty-minute pause for portraits and time together before the evening begins.',
        'Memorable moments',
      ],
    ],
  },
  birthday: {
    label: 'a joyful birthday celebration',
    categories: [
      ['Venue & food', 38],
      ['Décor & theme', 18],
      ['Entertainment', 15],
      ['Cake & desserts', 12],
      ['Gifts & favors', 7],
      ['Photography', 3],
      ['Contingency', 7],
    ],
    tasks: [
      ['Choose a theme and celebration style', -45, 'Design'],
      ['Confirm the venue and guest list', -35, 'Venue'],
      ['Book activities and entertainment', -28, 'Vendors'],
      ['Send invitations and collect RSVPs', -21, 'Guests'],
      ['Order the cake and dietary-friendly treats', -14, 'Food'],
      ['Prepare games, playlists and favors', -7, 'Details'],
      ['Confirm vendor arrival and setup', -2, 'Coordination'],
      ['Make a wish and celebrate', 0, 'Event day'],
    ],
    vendors: [
      ['Venue', 'Confirm capacity, setup access and weather backup.'],
      [
        'Food & drinks',
        'Check dietary requirements, portions and delivery time.',
      ],
      ['Cake', 'Agree on size, allergens, design and collection details.'],
      [
        'Entertainment',
        'Choose age-appropriate activities and agree on duration.',
      ],
      ['Décor', 'Check installation, collection and reusable materials.'],
    ],
    ideas: [
      [
        'A year in little moments',
        'Make a photo wall of favorite memories and invite guests to add their own messages.',
        'Personal touch',
      ],
      [
        'The birthday person’s favorites',
        'Build a small snack and music station around their favorite things.',
        'Personalized',
      ],
      [
        'A playful shared memory',
        'Host a short quiz about the guest of honor, with friendly team prizes.',
        'Guest experience',
      ],
      [
        'A wish for the year ahead',
        'Collect handwritten wishes in a keepsake jar to open on the next birthday.',
        'Keepsake',
      ],
    ],
  },
  community: {
    label: 'an inclusive community gathering',
    categories: [
      ['Venue & permits', 25],
      ['Food & refreshments', 25],
      ['Activities & equipment', 20],
      ['Outreach & signage', 10],
      ['Accessibility & safety', 13],
      ['Contingency', 7],
    ],
    tasks: [
      ['Define the purpose and recruit volunteers', -60, 'Team'],
      ['Secure venue, permits and safety requirements', -45, 'Venue'],
      ['Plan accessible activities and facilities', -35, 'Accessibility'],
      ['Open registration and community outreach', -28, 'Guests'],
      ['Confirm suppliers and volunteer roles', -14, 'Vendors'],
      ['Check emergency contacts and weather backup', -7, 'Safety'],
      ['Brief volunteers and test equipment', -1, 'Coordination'],
      ['Welcome the community and gather feedback', 0, 'Event day'],
    ],
    vendors: [
      [
        'Venue & permits',
        'Check public-space permissions, insurance requirements and accessible facilities.',
      ],
      [
        'Food & refreshments',
        'Confirm safe handling, dietary labels and drinking water.',
      ],
      ['Equipment', 'Check power, sound limits, installation and backups.'],
      [
        'Accessibility',
        'Confirm step-free routes, seating and communication support.',
      ],
      [
        'Safety & cleanup',
        'Coordinate first aid, waste sorting and an emergency contact.',
      ],
    ],
    ideas: [
      [
        'Everyone brings a little',
        'Invite optional skill-sharing or a community showcase so neighbors can contribute comfortably.',
        'Participation',
      ],
      [
        'A welcome for everyone',
        'Create clear signage, quiet seating and a friendly welcome desk with accessible information.',
        'Inclusion',
      ],
      [
        'Make something together',
        'Offer a collaborative mural or planting activity that remains useful after the event.',
        'Connection',
      ],
      [
        'Keep the good going',
        'Share a feedback board and invite volunteers to suggest the next community gathering.',
        'Community impact',
      ],
    ],
  },
};
