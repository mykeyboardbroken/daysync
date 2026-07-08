import { toKey } from './dateUtils'
import { habitDueOn } from './habits'

// A "training" is any physical / co-curricular task, or one whose title reads
// like a sports session — these are the ones bad weather actually matters for.
const TRAIN_RE = /train|practice|prac\b|trial|\bgame\b|\bmatch\b|tournament|athletics|fitness|sport|\brun\b/i

// Rough hours each time-of-day bucket covers, to overlap against the rain window.
const BUCKET_HOURS = {
  morning: [6, 12],
  afternoon: [12, 18],
  night: [18, 22],
  '': [0, 24], // Anytime — any rain today counts
}
const BUCKET_WHEN = {
  morning: 'this morning',
  afternoon: 'this afternoon',
  night: 'tonight',
  '': 'today',
}

function isTraining(t) {
  return t.category === 'physical' || t.category === 'cocurricular' || TRAIN_RE.test(t.title || '')
}

// Warn when a training happening TODAY overlaps today's likely-rain window.
// Returns [{ title, when, label, peak }]. Free — pure logic on data we already have.
export function trainingWarnings(schedule, todayWeather, now = new Date()) {
  const win = todayWeather?.rainWindow
  if (!win || win.start == null) return []
  const todayKey = toKey(now)
  const out = []
  for (const t of schedule.tasks) {
    if (t.done || !isTraining(t)) continue
    // Happening today?
    const today = t.repeat
      ? habitDueOn(t, now)
      : !t.due || t.due.slice(0, 10) === todayKey
    if (!today) continue
    // Does its time of day overlap the rain window?
    const [bStart, bEnd] = BUCKET_HOURS[t.bucket] || BUCKET_HOURS['']
    if (bStart < win.end && win.start < bEnd) {
      out.push({ title: t.title, when: BUCKET_WHEN[t.bucket] ?? 'today', label: win.label, peak: win.peak })
    }
  }
  return out
}
