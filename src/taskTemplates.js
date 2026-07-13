// The built-in default tasks. These are exactly the routines a new install is
// seeded with (see freshData() in useSchedule.js), and the picker in Today's edit
// mode offers them back — so its only job is "I deleted one, put it back".
//
// Keep this list and freshData() in step: every seeded task must have a template
// here, or it can't be restored once deleted.
//
// `days` [0..6] = every day.
const ALL = [0, 1, 2, 3, 4, 5, 6]

// Listed chronologically — morning, then afternoon, then night. The sort happens on
// export (bottom of the file), so a new template can be added anywhere below.
const BUCKET_ORDER = { morning: 0, afternoon: 1, night: 2, '': 3 }

const TEMPLATES = [
  // ---- Morning ----
  {
    title: 'Morning hygiene',
    description: '',
    steps: ['Wash your face', 'Brush your teeth', 'Sort your hair'],
    bucket: 'morning',
    category: 'health',
    days: ALL,
  },
  {
    title: 'Stretch / Move',
    description:
      'Five minutes of light movement or stretching to get the blood flowing and shake off morning stiffness.',
    steps: [],
    bucket: 'morning',
    category: 'health',
    days: ALL,
    pinFirst: true,
  },
  {
    title: 'Review daily plan',
    description:
      'A quick 60-second glance at your schedule so you know exactly what your targets are for the day.',
    steps: [],
    bucket: 'morning',
    category: 'lifestyle',
    days: ALL,
  },

  // ---- Afternoon ----
  {
    title: 'Hydration check',
    description: 'A reminder to drink water or refill your bottle to keep your energy from dipping.',
    steps: [],
    bucket: 'afternoon',
    category: 'health',
    days: ALL,
  },
  {
    title: 'Snack break',
    description: 'A proper pause to refuel — grab something to eat and take a breather.',
    steps: [],
    bucket: 'afternoon',
    category: 'health',
    days: ALL,
  },
  {
    title: 'Reading',
    description:
      'Time with a book — read as much or as little as you like; what matters is that you read.',
    steps: [],
    bucket: 'afternoon',
    category: 'lifestyle',
    days: ALL,
  },

  // ---- Night ----
  {
    title: 'Night hygiene',
    description: '',
    steps: ['Shower or wash your face', 'Brush your teeth', 'Moisturise'],
    bucket: 'night',
    category: 'health',
    days: ALL,
  },
  {
    title: 'Meditation',
    description: 'A few quiet minutes of focused breathing to settle your mind.',
    steps: [],
    bucket: 'night',
    category: 'health',
    days: ALL,
  },
  {
    title: 'Get ready for tomorrow',
    description: 'A quick evening routine so the morning runs smoothly.',
    steps: [
      "Check tomorrow's plans",
      "Lay out tomorrow's clothes",
      'Pack your bag',
      'Charge your devices',
      'Set your alarm',
    ],
    bucket: 'night',
    category: 'lifestyle',
    days: ALL,
    pinLast: true,
  },
]

// Sorted by time of day. Array.prototype.sort is stable, so templates sharing a
// bucket keep the order they're written in above.
export const TASK_TEMPLATES = [...TEMPLATES].sort(
  (a, b) => BUCKET_ORDER[a.bucket || ''] - BUCKET_ORDER[b.bucket || ''],
)
