// Time-of-day greeting for the Today banner, plus a rotating cheer-up quote.

export function greetingFor(hour, name) {
  const who = name ? `, ${name}` : ''
  if (hour >= 5 && hour < 12) return `Good morning${who}`
  if (hour >= 12 && hour < 18) return `Good afternoon${who}`
  return `Good night${who}`
}

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
