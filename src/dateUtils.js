// Date helpers. Tasks are keyed by local date string "YYYY-MM-DD" to avoid
// the timezone drift you get from storing full ISO timestamps. The timetable
// is keyed by weekday (0 = Sunday) because school periods repeat weekly.

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// Local date -> "YYYY-MM-DD" (not UTC, unlike toISOString)
export function toKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// "YYYY-MM-DD" -> local Date
export function keyToDate(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function isToday(date) {
  return toKey(date) === toKey(new Date())
}

// The Monday that starts the week containing `date`. School weeks read
// Monday-first, so we anchor there.
export function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay() // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day // shift back to Monday
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// The 7 dates (Mon–Sun) of the week containing `date`.
export function weekDays(date) {
  const start = startOfWeek(date)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

// "14:30" -> "2:30 PM"
export function formatTime(time) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

// "Monday, July 1"
export function prettyDate(date) {
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`
}

// ---- Assignment due dates ----
// `due` is a local datetime string like "2026-07-03T23:59" (parsed as local).
const HOUR = 60 * 60 * 1000

// Urgent = not done and due within the next 48 hours (overdue counts too).
export function isUrgent(due, done) {
  if (done || !due) return false
  return new Date(due).getTime() <= Date.now() + 48 * HOUR
}

// "Thu, Jul 3" (date only — assignments are due by end of day)
export function formatDue(due) {
  if (!due) return 'No due date'
  const d = new Date(due)
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

// Day-granularity due phrasing for assignment cards: "Due today",
// "Due tomorrow", "In 3 days", "Overdue". `tone` drives the colour.
export function dueLabel(due) {
  if (!due) return { text: 'No date', tone: 'none' }
  const now = new Date()
  const d = new Date(due)
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startDue = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const days = Math.round((startDue - startToday) / 86400000)
  if (days < 0) return { text: 'Overdue', tone: 'overdue' }
  if (days === 0) return { text: 'Due today', tone: 'soon' }
  if (days === 1) return { text: 'Due tomorrow', tone: 'soon' }
  if (days < 7) return { text: `In ${days} days`, tone: 'later' }
  if (days < 14) return { text: 'In a week', tone: 'later' }
  return { text: `In ${Math.round(days / 7)} weeks`, tone: 'later' }
}

// A short countdown label, e.g. "in 5h", "in 30m", "in 2d", or "Overdue".
export function relativeDue(due) {
  if (!due) return { overdue: false, label: '' }
  const ms = new Date(due).getTime() - Date.now()
  if (ms < 0) return { overdue: true, label: 'Overdue' }
  const mins = Math.round(ms / 60000)
  if (mins < 60) return { overdue: false, label: `in ${mins}m` }
  const hours = Math.round(mins / 60)
  if (hours < 24) return { overdue: false, label: `in ${hours}h` }
  return { overdue: false, label: `in ${Math.round(hours / 24)}d` }
}
