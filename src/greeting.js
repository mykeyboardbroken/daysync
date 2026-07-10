// A single banner line for the Today tab: a time-of-day greeting during
// morning / afternoon / night, and a cheer-up quote in the in-between hours.

// Short, encouraging lines to lift the mood — one shown per day.
export const QUOTES = [
  'Small steps every day add up to big things.',
  'Progress, not perfection.',
  'You’ve got this — one thing at a time.',
  'Today is a fresh start.',
  'Be proud of how far you’ve come.',
  'Do something today your future self will thank you for.',
  'Every day is a chance to get a little better.',
  'You’re capable of more than you think.',
  'Make today count.',
  'Rest when you need to, then keep going.',
  'One good habit at a time.',
  'Your effort today shapes your tomorrow.',
  'Be kind to yourself — you’re doing your best.',
  'Focus on what you can do right now.',
  'A calm mind is a strong mind.',
  'Little by little, it all gets done.',
  'Believe in yourself and take the first step.',
  'Hard days build strong people.',
]

// Deterministic pick so the quote is stable through the day and changes daily.
export function quoteOfDay(date = new Date()) {
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000)
  return QUOTES[dayOfYear % QUOTES.length]
}

// The one-line banner: a greeting when there's something to say, otherwise a
// cheer-up quote for the in-between hours (evening).
export function bannerLine(date, name) {
  const hour = date.getHours()
  const who = name ? `, ${name}` : ''
  if (hour >= 5 && hour < 12) return `Good morning${who}`
  if (hour >= 12 && hour < 17) return `Good afternoon${who}`
  if (hour >= 21 || hour < 5) return `Good night${who}`
  return quoteOfDay(date) // evening in-between
}
