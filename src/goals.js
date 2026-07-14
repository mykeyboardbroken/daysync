// Daily challenges, driven by the goals you pick.
//
// Deliberately NOT AI. The mapping from "I want more confidence" to "say hi to
// someone new today" is a finite, well-understood set — a language model would
// produce roughly this same list, but slower, at a cost, needing a server, breaking
// offline, and with no guarantee it doesn't hand a 13-year-old something stupid.
// Every suggestion below is one a human chose on purpose.
//
// Challenges are ordered EASY → HARD. You get the next one up each time you finish
// one, so the thing that felt big in week one is the warm-up by week four.

// The user's OWN goals, in their own words, over three horizons. A goal with no
// timeframe is a wish. Shared by the survey, the Today card and Settings so the three
// can't drift apart.
// The examples deliberately aren't all about grades. A goal can be about who you want
// to be, not just what you want to score — and the placeholder is the only hint most
// people will ever read, so it has to show that range.
export const HORIZONS = [
  { key: 'short', label: 'Short term', placeholder: 'e.g. talk to someone new this week' },
  { key: 'medium', label: 'Mid term', placeholder: 'e.g. be more confident speaking up' },
  { key: 'long', label: 'Long term', placeholder: 'e.g. stop caring what people think' },
]

export const GOALS = [
  {
    id: 'confidence',
    label: 'Confidence',
    icon: 'bolt',
    blurb: 'Small social risks that get less scary each time.',
    challenges: [
      'Make eye contact and say hi to someone you don’t usually talk to.',
      'Ask someone a question in class, even if you think you should already know.',
      'Give someone a genuine compliment — out loud, not a text.',
      'Sit somewhere new at lunch.',
      'Say your opinion in a group when you’d normally stay quiet.',
      'Ask a stranger something small — the time, directions, where something is.',
      'Start a conversation with someone you’ve never spoken to.',
      'Volunteer to go first at something today.',
      'Disagree with someone politely, out loud, instead of nodding along.',
      'Put your hand up to answer when you’re only 80% sure.',
    ],
  },
  {
    id: 'grades',
    label: 'Grades',
    icon: 'cap',
    blurb: 'Study habits that actually move a grade.',
    challenges: [
      'Re-read today’s class notes for 10 minutes tonight.',
      'Write down one thing from today you didn’t fully understand.',
      'Ask a teacher about that thing you didn’t understand.',
      'Do 20 minutes on the subject you’re avoiding.',
      'Teach one concept out loud to yourself, without notes.',
      'Test yourself on last week’s work instead of re-reading it.',
      'Start the assignment that isn’t due yet.',
      'Redo a question you got wrong, from scratch.',
      'Make a one-page summary of a whole topic.',
      'Sit a past paper under a timer.',
    ],
  },
  {
    id: 'social',
    label: 'Friendships',
    icon: 'heart',
    blurb: 'Being the person who reaches out first.',
    challenges: [
      'Message someone you haven’t spoken to in a while.',
      'Ask someone how they actually are — and wait for the real answer.',
      'Invite someone to do something this week.',
      'Thank someone properly for something they did.',
      'Introduce two friends who don’t know each other.',
      'Check in on someone who’s been quiet lately.',
      'Apologise for something you’ve been putting off.',
      'Include someone who’s on the edge of the group.',
    ],
  },
  {
    id: 'sleep',
    label: 'Sleep',
    icon: 'moon',
    blurb: 'The one habit that improves everything else.',
    challenges: [
      'Put your phone across the room before you get into bed.',
      'Go to bed 15 minutes earlier than last night.',
      'No screens for the last 30 minutes before sleep.',
      'Get up at the same time you did yesterday — no snooze.',
      'Get sunlight within 30 minutes of waking up.',
      'No caffeine after 2pm.',
      'Same bedtime tonight as last night.',
      'Wake up without an alarm going off twice.',
    ],
  },
  {
    id: 'discipline',
    label: 'Discipline',
    icon: 'flame',
    blurb: 'Doing the thing you said you’d do.',
    challenges: [
      'Do the thing you’ve been putting off — just the first 5 minutes.',
      'Make your bed before you leave the room.',
      'Finish one task completely before starting another.',
      'Do the hardest thing on your list first.',
      'Go a whole hour without checking your phone.',
      'Do what you planned last night, even though you don’t feel like it.',
      'No phone until you’ve finished your first task of the day.',
      'Finish something you started and abandoned.',
    ],
  },
  {
    id: 'creativity',
    label: 'Creativity',
    icon: 'star',
    blurb: 'Make something, however small.',
    challenges: [
      'Write down three ideas — any three, however bad.',
      'Spend 15 minutes making something with no plan.',
      'Learn one new thing about something you’re curious about.',
      'Finish something you made and never showed anyone.',
      'Show someone something you made.',
      'Try the thing you keep saying you’d be bad at.',
      'Copy something you admire, deliberately, to learn how it works.',
      'Make something and throw it away without judging it.',
    ],
  },
]

export const goalById = (id) => GOALS.find((g) => g.id === id) || null

function dayNumber(date) {
  return Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000)
}

// Today's challenge. Rotates through your chosen goals one day at a time — never more
// than one thing at once, because ten challenges a day is just a chore list — and
// climbs to the next-hardest challenge in a goal each time you complete one of its.
// Deterministic: the same all day, so it can't reshuffle under you mid-task.
export function todaysChallenge(goals = [], progress = {}, date = new Date()) {
  const picked = goals.map(goalById).filter(Boolean)
  if (!picked.length) return null

  const goal = picked[dayNumber(date) % picked.length]
  const done = progress[goal.id] || 0
  const challenge = goal.challenges[done % goal.challenges.length]

  return {
    goalId: goal.id,
    label: goal.label,
    icon: goal.icon,
    text: challenge,
    // 1-based position through this goal's ladder, for "3 of 10".
    step: (done % goal.challenges.length) + 1,
    total: goal.challenges.length,
  }
}
