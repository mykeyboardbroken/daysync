// The built-in default tasks, offered as re-addable templates in the Today edit
// mode (so if you delete one you can drop it back in). `days` [0..6] = every day.
const ALL = [0, 1, 2, 3, 4, 5, 6]

export const TASK_TEMPLATES = [
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
    title: 'Journaling',
    description: 'A few lines to clear your head and set your intentions for the day.',
    steps: ['Write your thoughts', "Write today's to-do list", "Write what you're grateful for"],
    bucket: 'morning',
    category: 'lifestyle',
    days: ALL,
  },
  {
    title: 'Morning grooming',
    description: '',
    steps: ['Gentle wash and moisturiser', 'Brush teeth', 'Hair check'],
    bucket: 'morning',
    category: 'health',
    days: ALL,
  },
  {
    title: 'Night grooming',
    description: '',
    steps: ['Wash your face', 'Brush your teeth', 'Moisturise / skincare'],
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
  },
  {
    title: 'Reading',
    description: 'Time with a book — read as much or as little as you like; what matters is that you read.',
    steps: [],
    bucket: 'afternoon',
    category: 'lifestyle',
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
    steps: ["Lay out tomorrow's clothes", 'Pack your bag', 'Charge your devices', 'Set your alarm'],
    bucket: 'night',
    category: 'lifestyle',
    days: ALL,
    pinLast: true,
  },
  {
    title: "Check tomorrow's plans",
    description: "A quick look at what's on tomorrow so nothing catches you off guard.",
    steps: [],
    bucket: 'night',
    category: 'lifestyle',
    days: ALL,
  },
]
