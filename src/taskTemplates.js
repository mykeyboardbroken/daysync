// The built-in default tasks, offered as re-addable templates in the Today edit
// mode (so if you delete one you can drop it back in). `days` [0..6] = every day.
const ALL = [0, 1, 2, 3, 4, 5, 6]

// Templates are listed chronologically — morning, then afternoon, then night, with
// the time-agnostic ones last. The sort happens on export (see the bottom of the
// file) so you can add a template anywhere in the list below without worrying
// where it lands in the picker.
const BUCKET_ORDER = { morning: 0, afternoon: 1, night: 2, '': 3 }

const TEMPLATES = [
  {
    title: 'Stretch / Move',
    description:
      'Five minutes of light movement or stretching to get the blood flowing and shake off morning stiffness.',
    steps: [],
    bucket: 'morning',
    category: 'health',
    days: ALL,
    pinFirst: true,
    essential: true,
  },
  {
    title: 'Journaling',
    description: 'A few lines to clear your head and set your intentions for the day.',
    steps: ['Write your thoughts', "Write today's to-do list", "Write what you're grateful for"],
    bucket: 'morning',
    category: 'lifestyle',
    days: ALL,
    essential: true,
  },
  {
    title: 'Morning hygiene',
    description: '',
    steps: ['Wash your face', 'Brush your teeth', 'Sort your hair'],
    bucket: 'morning',
    category: 'health',
    days: ALL,
    essential: true,
  },
  {
    title: 'Sunlight exposure',
    description:
      'Spend 5 minutes looking outside or stepping into the sun to lock in your circadian rhythm.',
    steps: [],
    bucket: 'morning',
    category: 'health',
    days: ALL,
  },
  {
    title: 'Review daily plan',
    description:
      "A quick 60-second glance at your schedule so you know exactly what your targets are for the day.",
    steps: [],
    bucket: 'morning',
    category: 'lifestyle',
    days: ALL,
  },
  {
    title: 'Night hygiene',
    description: '',
    steps: ['Shower or wash your face', 'Brush your teeth', 'Moisturise'],
    bucket: 'night',
    category: 'health',
    days: ALL,
  },
  {
    title: 'Hydration check',
    description: 'A reminder to drink water or refill your bottle to keep your energy from dipping.',
    steps: [],
    bucket: 'afternoon',
    category: 'health',
    days: ALL,
    essential: true,
  },
  {
    title: 'Reading',
    description: 'Time with a book — read as much or as little as you like; what matters is that you read.',
    steps: [],
    bucket: 'afternoon',
    category: 'lifestyle',
    days: ALL,
    essential: true,
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
    title: 'Clean your room',
    description: '',
    steps: ['Tidy the floor', 'Clear the desk', 'Wipe down surfaces'],
    bucket: 'afternoon',
    category: 'lifestyle',
    days: [0], // Sunday
  },
  {
    title: 'Organise your wardrobe',
    description: '',
    steps: ['Sort your clothes', 'Fold the clean ones', 'Clear anything left out'],
    bucket: 'afternoon',
    category: 'lifestyle',
    days: [6], // Saturday
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
    essential: true,
  },
  {
    title: 'Screen off / wind down',
    description:
      'Disconnect from all digital devices 30 minutes before sleep to let your brain rest.',
    steps: [],
    bucket: 'night',
    category: 'health',
    days: ALL,
  },
  {
    title: 'Hydration',
    description: 'Drink some water or refill your bottle to keep your energy steady.',
    steps: [],
    bucket: 'night',
    category: 'health',
    days: ALL,
    essential: true,
  },
  {
    title: 'Meditation',
    description: 'A few quiet minutes of focused breathing to settle your mind.',
    steps: [],
    bucket: 'night',
    category: 'health',
    days: ALL,
    essential: true,
  },
]

// Sorted by time of day. Array.prototype.sort is stable, so templates sharing a
// bucket keep the order they're written in above.
export const TASK_TEMPLATES = [...TEMPLATES].sort(
  (a, b) => BUCKET_ORDER[a.bucket || ''] - BUCKET_ORDER[b.bucket || ''],
)
