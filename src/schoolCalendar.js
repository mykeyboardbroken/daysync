// The school "day cycle": a 1..6 rotation that only advances on school days.
// Weekends and holidays are skipped entirely — they don't consume a cycle
// number, so the count picks up exactly where it left off when school resumes.
//
// Anchoring: Wed 1 Jul 2026 is Day 5, so Thu 2 Jul = Day 6, Fri 3 Jul = Day 1.
// Then the two following weeks are holidays, so the next school day
// (Mon 20 Jul 2026) is Day 2.
import { toKey, keyToDate, addDays } from './dateUtils'

export const CYCLE_LENGTH = 6

// The cycle days you can build a timetable for.
export const CYCLE_DAYS = [1, 2, 3, 4, 5, 6]

// Fixed daily period slots — same times every school day. The subject sitting
// in each slot is what rotates by cycle day. Times are 24h "HH:MM".
export const PERIODS = [
  // Tutor isn't a class — just come in and check email/notices. No subject, and
  // it's the same room every cycle day (shared), so editing it applies to all.
  { id: 'tutor', label: 'Tutor', start: '08:40', end: '08:55', noSubject: true, shared: true },
  { id: 'p1', label: '1st', start: '09:00', end: '10:00' },
  { id: 'p2', label: '2nd', start: '10:05', end: '11:05' },
  { id: 'p3a', label: '3A', start: '11:30', end: '12:10' },
  { id: 'p3b', label: '3B', start: '12:10', end: '12:50' },
  { id: 'p4', label: '4th', start: '12:55', end: '13:35' },
  { id: 'p5', label: '5th', start: '14:20', end: '15:20' },
]

// One known (school day -> cycle number) pin; everything else counts from here.
const ANCHOR = { key: '2026-07-01', day: 5 }

// ---------------------------------------------------------------------------
// SCHOOL YEARS
//
// TO ADD A YEAR: copy the 2026 block, change the dates, done. Nothing else needs
// touching.
//
// Why this is a list and not two constants: it used to be a single YEAR_START/
// YEAR_END pair, which meant that from 6 Dec 2026 onwards EVERY date fell outside
// the school year — so cycleDay() returned null forever, the timetable vanished,
// and the app quietly read "No school" for the rest of time. It wouldn't have
// crashed; it would just have become useless without telling anyone.
//
// Now: an unconfigured year degrades to "weekdays are school days" (so your
// timetable still works) and the app SAYS so, rather than silently dying. See
// `calendarNeedsUpdate()`.
// ---------------------------------------------------------------------------
const SCHOOL_YEARS = [
  {
    year: 2026,
    start: '2026-01-28',
    end: '2026-12-05',
    // Inclusive no-school date ranges — the term breaks.
    holidays: [
      { from: '2026-04-04', to: '2026-04-19', name: 'Term 1 holidays' },
      { from: '2026-07-04', to: '2026-07-19', name: 'Term 2 holidays' },
      { from: '2026-09-26', to: '2026-10-11', name: 'Term 3 holidays' },
    ],
  },
  // 2027: add it here as soon as the school publishes its term dates.
  // {
  //   year: 2027,
  //   start: '2027-01-27',
  //   end: '2027-12-04',
  //   holidays: [
  //     { from: '...', to: '...', name: 'Term 1 holidays' },
  //   ],
  // },
]

const yearFor = (key) => SCHOOL_YEARS.find((y) => key >= y.start && key <= y.end) || null

// The last year we actually have dates for.
const LAST_CONFIGURED_YEAR = Math.max(...SCHOOL_YEARS.map((y) => y.year))

// True once we're past every year we know about — i.e. the term dates need updating.
// The app surfaces this rather than pretending school has ended forever.
export function calendarNeedsUpdate(date = new Date()) {
  return date.getFullYear() > LAST_CONFIGURED_YEAR
}

export function nextCalendarYear() {
  return LAST_CONFIGURED_YEAR + 1
}

// NZ / Auckland public holidays for 2026 (observed dates included).
const PUBLIC_HOLIDAYS = {
  '2026-01-01': "New Year's Day",
  '2026-01-02': "Day after New Year's",
  '2026-01-26': 'Auckland Anniversary',
  '2026-02-06': 'Waitangi Day',
  '2026-04-03': 'Good Friday',
  '2026-04-06': 'Easter Monday',
  '2026-04-25': 'ANZAC Day',
  '2026-04-27': 'ANZAC Day (observed)',
  '2026-06-01': "King's Birthday",
  '2026-07-10': 'Matariki',
  '2026-10-26': 'Labour Day',
  '2026-12-25': 'Christmas Day',
  '2026-12-26': 'Boxing Day',
  '2026-12-28': 'Boxing Day (observed)',
}

// The name of the public holiday on `date`, or null.
export function publicHolidayOn(date) {
  return PUBLIC_HOLIDAYS[toKey(date)] || null
}

// If `date` falls in a school break, its name ("Term 2 holidays" / "Summer
// holidays"); otherwise null. Regular weekends are not counted as a break.
export function schoolBreakOn(date) {
  const key = toKey(date)
  const y = yearFor(key)
  if (y) {
    const h = y.holidays.find((x) => key >= x.from && key <= x.to)
    return h ? h.name : null
  }
  // Outside every configured year. If we're PAST the last one, the term dates simply
  // haven't been added yet — don't claim it's the summer holidays, because we have no
  // idea. If we're before/between known years, it genuinely is the summer break.
  if (calendarNeedsUpdate(date)) return null
  return 'Summer holidays'
}

// A school day is a weekday inside the school year and not inside a holiday.
export function isSchoolDay(date) {
  const dow = date.getDay()
  if (dow === 0 || dow === 6) return false // weekend
  const key = toKey(date)
  const y = yearFor(key)
  if (y) return !y.holidays.some((h) => key >= h.from && key <= h.to)
  // Past the last year we have dates for: fall back to "weekdays are school days" so
  // the timetable and packing list keep working. Better a timetable that shows on a
  // holiday (and says so) than an app that reads "No school" forever.
  return calendarNeedsUpdate(date)
}

// Whether a period's class is shared across every cycle day (e.g. Tutor room).
export function isSharedPeriod(periodId) {
  return !!PERIODS.find((p) => p.id === periodId)?.shared
}

// The next school day strictly after `date` (skips weekends/holidays).
export function nextSchoolDay(date) {
  let d = addDays(date, 1)
  for (let i = 0; i < 400 && !isSchoolDay(d); i++) d = addDays(d, 1)
  return d
}

// The cycle number (1..6) for a date, or null if it's not a school day.
// Counts school days from the anchor, skipping weekends/holidays.
export function cycleDay(date) {
  if (!isSchoolDay(date)) return null

  const anchor = keyToDate(ANCHOR.key)
  const target = toKey(date)
  if (target === ANCHOR.key) return ANCHOR.day

  const step = date.getTime() > anchor.getTime() ? 1 : -1
  let cur = anchor
  let count = 0
  // Walk one day at a time; a step lands +/-1 on the cycle only on school days.
  for (let i = 0; i < 4000 && toKey(cur) !== target; i++) {
    cur = addDays(cur, step)
    if (isSchoolDay(cur)) count += step
  }

  const mod = (((ANCHOR.day - 1 + count) % CYCLE_LENGTH) + CYCLE_LENGTH) % CYCLE_LENGTH
  return mod + 1
}
