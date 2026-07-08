import { toKey } from './dateUtils'
import { habitDueOn } from './habits'

// A "training" is any co-curricular task, or one whose title reads like a sports
// session — these are the ones bad weather actually matters for. (Health &
// Fitness is too broad — a "drink water" task isn't a training.)
const TRAIN_RE = /train|practice|prac\b|trial|\bgame\b|\bmatch\b|tournament|athletics|fitness|sport|\brun\b/i

// Rough hours each time-of-day bucket covers, to overlap against the rain window.
const BUCKET_HOURS = {
  morning: [6, 12],
  afternoon: [12, 18],
  night: [18, 22],
  '': [0, 24], // Anytime — any rain today counts
}
const BUCKET_WHEN = {
  today: { morning: 'this morning', afternoon: 'this afternoon', night: 'tonight', '': 'today' },
  tomorrow: {
    morning: 'tomorrow morning',
    afternoon: 'tomorrow afternoon',
    night: 'tomorrow night',
    '': 'tomorrow',
  },
}

function isTraining(t) {
  return t.category === 'cocurricular' || TRAIN_RE.test(t.title || '')
}

// Warn when a training on `targetDate` overlaps that day's likely-rain window.
// `tomorrow` picks the wording and whether undated to-dos count (they sit in
// today's plan, so they only count for today). Returns [{ title, when, label, peak }].
// Free — pure logic on data we already have.
export function trainingWarnings(schedule, weather, targetDate, tomorrow = false) {
  const win = weather?.rainWindow
  if (!win || win.start == null) return []
  const key = toKey(targetDate)
  const when = tomorrow ? BUCKET_WHEN.tomorrow : BUCKET_WHEN.today
  const out = []
  for (const t of schedule.tasks) {
    if (t.done || !isTraining(t)) continue
    // Happening on the target day?
    const on = t.repeat
      ? habitDueOn(t, targetDate)
      : t.due
        ? t.due.slice(0, 10) === key
        : !tomorrow // undated one-offs are "today" only
    if (!on) continue
    // Does its time of day overlap the rain window?
    const [bStart, bEnd] = BUCKET_HOURS[t.bucket] || BUCKET_HOURS['']
    if (bStart < win.end && win.start < bEnd) {
      out.push({ title: t.title, when: when[t.bucket] ?? when[''], label: win.label, peak: win.peak })
    }
  }
  return out
}
