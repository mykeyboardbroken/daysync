import { toKey, keyToDate, startOfWeek } from './dateUtils'

// How often a reminder repeats. `none` = one-off (deleted when checked off);
// the rest reappear each period after you complete them.
export const REPEATS = [
  { key: 'none', label: 'Once' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekdays', label: 'Weekdays' },
  { key: 'weekly', label: 'Weekly' },
]

const LABELS = Object.fromEntries(REPEATS.map((r) => [r.key, r.label]))

export function repeatLabel(repeat) {
  return LABELS[repeat] || 'Once'
}

export function isRecurring(r) {
  return !!r.repeat && r.repeat !== 'none'
}

// Should this reminder show right now? One-offs always show (until deleted).
// A recurring reminder hides once completed for the current period and comes
// back the next: next day (daily/weekdays) or next week (weekly). Weekday
// reminders stay hidden on weekends.
export function reminderPending(r, now = new Date()) {
  if (!isRecurring(r)) return true
  if (r.repeat === 'weekdays') {
    const dow = now.getDay()
    if (dow === 0 || dow === 6) return false
  }
  if (!r.lastDone) return true
  if (r.repeat === 'weekly') return keyToDate(r.lastDone) < startOfWeek(now)
  return r.lastDone !== toKey(now) // daily + weekdays: done today → hidden
}
