import { toKey, addDays } from './dateUtils'

// Weekday choices for a habit's schedule ([] = every day).
export const HABIT_WEEKDAYS = [
  { d: 1, label: 'Mon' },
  { d: 2, label: 'Tue' },
  { d: 3, label: 'Wed' },
  { d: 4, label: 'Thu' },
  { d: 5, label: 'Fri' },
  { d: 6, label: 'Sat' },
  { d: 0, label: 'Sun' },
]

// Is the habit scheduled for this date? Empty `days` = every day.
export function habitDueOn(habit, date) {
  if (!habit.days || habit.days.length === 0) return true
  return habit.days.includes(date.getDay())
}

export function habitDoneOn(habit, dateKey) {
  return !!(habit.log && habit.log[dateKey])
}

// A short human label for a habit's schedule.
export function habitScheduleLabel(habit) {
  if (!habit.days || habit.days.length === 0) return 'Every day'
  if (habit.days.length === 7) return 'Every day'
  const set = new Set(habit.days)
  const weekdays = [1, 2, 3, 4, 5]
  if (weekdays.every((d) => set.has(d)) && set.size === 5) return 'Weekdays'
  const names = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' }
  return [1, 2, 3, 4, 5, 6, 0].filter((d) => set.has(d)).map((d) => names[d]).join(' ')
}

// Current streak: consecutive scheduled days completed, counting back from today.
// If today is scheduled but not done yet, the streak isn't broken (it just doesn't
// count today) — you still have until end of day.
export function habitStreak(habit, today = new Date()) {
  let streak = 0
  let d = new Date(today)
  let firstDue = true
  for (let i = 0; i < 366; i++) {
    if (habitDueOn(habit, d)) {
      if (habitDoneOn(habit, toKey(d))) streak++
      else if (firstDue) {
        // today (or the most recent due day) isn't done yet — don't break
      } else break
      firstDue = false
    }
    d = addDays(d, -1)
  }
  return streak
}
