import { useState, useEffect, useCallback, useRef } from 'react'
import { CYCLE_DAYS, isSharedPeriod } from './schoolCalendar'
import { toKey, keyToDate, addDays } from './dateUtils'
import { supabase, isCloudEnabled, DATA_TABLE } from './supabase'

// XP awarded for completing each kind of thing.
const XP = { task: 10, assignment: 15, event: 20, workout: 25 }

const STORAGE_KEY = 'schedule-app.data'

// Everything the app stores lives under one key so a single save keeps them
// in sync:
//   assignments: [{ id, title, subject, due, done }]   schoolwork with a deadline
//   timetable:   { [cycleDay 1-6]: { [periodId]: { subject, room, needs } } }
// The timetable is keyed by CYCLE DAY (not weekday) because classes rotate on
// the school's 6-day cycle. Period slots/times are fixed (see schoolCalendar).
function emptyData() {
  return {
    assignments: [],
    events: [],
    reminders: [],
    notes: [],
    bring: [],
    timetable: {},
    reports: [], // per-subject report cards imported from a PDF (see pdfImport.js)
    extras: { service: [], activities: [] }, // co-curricular: service & leadership + activities
    reportSettings: { grades: true, progress: true, teacher: true, dispositions: true, extras: true },
    // ---- Personal tasks (one-off to-dos and repeating routines are one type) ----
    // One-off:    { id, title, bucket, repeat: false, due, done }
    // Repeating:  { id, title, bucket, repeat: true, days, log }  (days: weekday nums, [] = daily)
    tasks: [],
    seededPackTask: false, // whether the default nightly "pack your bag" task was seeded once
    packLifestyle: false, // one-time move of the pack task into the Lifestyle category
    seededChores: false, // whether the extra default tasks (grooming, chores) were seeded once
    seededRoutinePlus: false, // stretch + hydration defaults seeded once
    seededJournalingFirst: false, // re-seed journaling as the first morning task
    seededReading: false, // reading default seeded once
    readingAfternoon: false, // one-time move of Reading back to the afternoon
    removedJournalingDefault: false, // one-time removal of the auto-seeded journaling default
    seededNightGrooming: false, // night grooming default seeded once
    seededCheckPlans: false, // "check tomorrow's plans" default seeded once (legacy)
    seededNightMerge: false, // folded check-plans + charge-devices into Get-ready once
    onboarded: false, // whether the first-open survey has been completed
    profile: {}, // answers from the onboarding survey, keyed by question id
    workoutLog: {}, // per-day done state for the generated workout ({ dateKey: true })
    workoutSeed: 0, // bumped to reshuffle today's generated workout
    xp: 0, // total XP earned by completing things
    loginStreak: 0, // consecutive days the app was opened
    lastActive: '', // dateKey of the last day the app was opened
    focusDistractions: [], // apps/sites the user commits to avoiding during focus
    focusMinutes: 0, // total minutes focused
    // Reminders: timed nudges that banner on Today. `repeat` = minutes between
    // fires (0 = once, min 30); `endDate` stops the repeat; `ackUntil` = dismissed-up-to.
    alerts: [],
    theme: 'custom', // appearance is now always a custom accent on a dark/bright base
    // Used when theme === 'custom': primary = the accent colour (the darker
    // hover/pressed shade is derived from it), base = 'dark' | 'bright' (which
    // background palette to sit it on).
    customColors: { primary: '#6366f1', base: 'dark' },
    settings: { showStreaks: false, weightUnit: 'kg' }, // general prefs
  }
}

// A brand-new install starts with a small, curated set of everyday routines so
// there's something to do from minute one. All are deletable like any task.
// Every `seeded*` flag is pre-set true so the one-time migration seeders below
// never pile extra copies on top of these.
function freshData() {
  const base = emptyData()
  const allWeek = [0, 1, 2, 3, 4, 5, 6]
  const task = (t) => ({
    id: makeId(),
    description: '',
    steps: [],
    repeat: true,
    days: allWeek,
    log: {},
    due: '',
    done: false,
    ...t,
  })
  base.tasks = [
    task({
      title: 'Journaling',
      description: 'A few lines to clear your head and set your intentions for the day.',
      steps: ['Write your thoughts', "Write today's to-do list", "Write what you're grateful for"],
      bucket: 'morning',
      category: 'lifestyle',
      order: -2,
    }),
    task({
      title: 'Stretch / Move',
      description:
        'Five minutes of light movement or stretching to get the blood flowing and shake off morning stiffness.',
      bucket: 'morning',
      category: 'health',
      order: -1,
    }),
    task({
      title: 'Hydration check',
      description: 'A reminder to drink water or refill your bottle to keep your energy from dipping.',
      bucket: 'morning',
      category: 'health',
    }),
    task({
      title: 'Reading',
      description:
        'Time with a book — read as much or as little as you like; what matters is that you read.',
      bucket: 'afternoon',
      category: 'lifestyle',
    }),
    task({
      title: 'Meditation',
      description: 'A few quiet minutes of focused breathing to settle your mind.',
      bucket: 'afternoon',
      category: 'health',
    }),
    task({
      title: 'Hydration',
      description: 'Drink some water or refill your bottle to keep your energy steady.',
      bucket: 'night',
      category: 'health',
    }),
    task({
      title: 'Get ready for tomorrow',
      description: 'A quick evening routine so the morning runs smoothly.',
      steps: [
        "Check tomorrow's plans",
        "Lay out tomorrow's clothes",
        'Pack your bag',
        'Charge your devices',
        'Set your alarm',
      ],
      bucket: 'night',
      category: 'lifestyle',
      pinLast: true,
    }),
  ]
  // Mark every one-time seeder as already done so migrations add nothing more.
  for (const k of Object.keys(base)) {
    if (k.startsWith('seeded') || k === 'packLifestyle' || k === 'readingAfternoon') base[k] = true
  }
  return base
}

// Take a parsed (possibly older / partial) data object and bring it up to the
// current shape — filling defaults and running every migration. Shared by
// load() (from localStorage) and importData() (from a backup file).
function normalize(parsed) {
  const base = emptyData()
  const data = { ...base, ...parsed }
  data.settings = { ...base.settings, ...(data.settings || {}) }
  data.customColors = { ...base.customColors, ...(data.customColors || {}) }
  data.profile = { ...(data.profile || {}) }
  // Assignments gained a `kind` ('assignment' | 'homework') — default older ones.
  data.assignments = (data.assignments || []).map((a) => ({ kind: 'assignment', ...a }))
  // The old preset themes were dropped — fold any legacy one into the custom
  // accent/base so the user's look carries over.
  if (data.theme && data.theme !== 'custom') {
    const PRESET = {
      indigo: { primary: '#6366f1', base: 'dark' },
      emerald: { primary: '#10b981', base: 'dark' },
      teal: { primary: '#14b8a6', base: 'dark' },
      light: { primary: '#6366f1', base: 'bright' },
    }
    data.customColors = { ...data.customColors, ...(PRESET[data.theme] || PRESET.indigo) }
    data.theme = 'custom'
  }
  // Reminders were merged into notes — migrate any legacy ones (a note can now
  // carry an optional deadline). Recurrence is dropped.
  if (Array.isArray(data.reminders) && data.reminders.length) {
    data.notes = [
      ...data.notes,
      ...data.reminders.map((r) => ({ id: r.id, text: r.text, due: r.due || '' })),
    ]
    data.reminders = []
  }
  // Habits were merged into tasks — a habit is just a repeating task. Migrate
  // any legacy ones into the tasks list with `repeat: true`.
  if (Array.isArray(data.habits) && data.habits.length) {
    data.tasks = [
      ...data.tasks,
      ...data.habits.map((h) => ({
        id: h.id,
        title: h.title,
        bucket: h.bucket || '',
        repeat: true,
        days: h.days || [],
        log: h.log || {},
        due: '',
        done: false,
      })),
    ]
    data.habits = []
  }
  // Ensure every task has the unified shape (older one-off tasks lack repeat/days/log).
  data.tasks = data.tasks.map((t) => {
    const task = {
      repeat: false,
      days: [],
      log: {},
      due: '',
      bucket: '',
      category: 'other',
      description: '',
      steps: [],
      done: false,
      ...t,
    }
    // "Mental" was folded into "Health & Lifestyle"; then "Physical" + "Health"
    // merged into "Health & Fitness" (key stays `health`).
    if (task.category === 'mental' || task.category === 'physical') task.category = 'health'
    return task
  })
  // The default nightly "get ready" task: a general description plus steps.
  const READY_TITLE = 'Get ready for tomorrow'
  const READY_DESC = 'A quick evening routine so the morning runs smoothly.'
  // The whole night routine in one task — checking tomorrow's plans and charging
  // devices used to be separate defaults, which made the night a list of chores.
  const READY_STEPS = [
    "Check tomorrow's plans",
    "Lay out tomorrow's clothes",
    'Pack your bag',
    'Charge your devices',
    'Set your alarm',
  ]
  // What the steps were before those two were folded in.
  const PRE_MERGE_READY_STEPS = [
    "Lay out tomorrow's clothes",
    'Pack your bag',
    'Charge your devices',
    'Set your alarm',
  ]
  const OLD_READY_TITLES = ["Pack tomorrow's bag", 'Pack your bag']
  const OLD_READY_DESCS = new Set([
    "Sort your books, uniform and gear tonight so the morning's stress-free and nothing gets left behind.",
    "Pack everything you might need properly tonight, so you're set for whatever tomorrow brings.",
    "Get your things ready for tomorrow tonight, so your morning's calm — school day or not.",
    "Get your things ready tonight, so your morning's calm.",
    "Lay out tomorrow's clothes, pack your bag, charge your devices, set your alarm, and check what's on tomorrow.",
    "Clothes laid out, bag packed, devices charging, alarm set, and tomorrow's plans reviewed.",
  ])
  // Adopt older seeded copies into the current form (rename, Lifestyle, daily,
  // general description + steps). Skips a description you've edited yourself.
  data.tasks = data.tasks.map((t) => {
    const isOld = OLD_READY_TITLES.includes(t.title)
    if (!isOld && t.title !== READY_TITLE) return t
    const next = { ...t, title: READY_TITLE }
    delete next.schoolNight
    delete next.schoolAware
    if (OLD_READY_DESCS.has(t.description)) {
      next.description = READY_DESC
      if (!next.steps || next.steps.length === 0) next.steps = READY_STEPS
    }
    if (isOld) {
      next.category = 'lifestyle'
      next.days = []
    }
    return next
  })
  // Fold the standalone "Check tomorrow's plans" and "Charge all devices" defaults
  // back into Get-ready-for-tomorrow as steps, so the night is one routine instead
  // of three chores. Runs once (the flag), and only removes a copy that's still the
  // untouched default — anything you've reworded is yours and stays put.
  if (!data.seededNightMerge) {
    const FOLDED_IN = {
      "Check tomorrow's plans":
        "A quick look at what's on tomorrow so nothing catches you off guard.",
      'Charge all devices':
        'Plug in your laptop, phone, and headphones so they sit at 100% when you wake up.',
    }
    data.tasks = data.tasks.filter((t) => {
      const def = FOLDED_IN[t.title]
      if (def === undefined) return true
      const untouched = (!t.description || t.description === def) && !(t.steps?.length)
      return !untouched
    })
    // Bring an untouched Get-ready up to the merged step list.
    data.tasks = data.tasks.map((t) =>
      t.title === READY_TITLE &&
      JSON.stringify(t.steps) === JSON.stringify(PRE_MERGE_READY_STEPS)
        ? { ...t, steps: READY_STEPS }
        : t,
    )
    data.seededNightMerge = true
  }
  // Seed it once. Only added a single time — delete it and it stays gone.
  if (!data.seededPackTask) {
    data.tasks = [
      ...data.tasks,
      {
        id: makeId(),
        title: READY_TITLE,
        description: READY_DESC,
        steps: READY_STEPS,
        bucket: 'night',
        category: 'lifestyle',
        repeat: true,
        days: [],
        pinLast: true, // sits at the end of the night until reordered
        log: {},
        due: '',
        done: false,
      },
    ]
    data.seededPackTask = true
  }
  // Seed a few more helpful defaults once (deletable, like the rest).
  if (!data.seededChores) {
    data.tasks = [
      ...data.tasks,
      {
        id: makeId(),
        title: 'Morning hygiene',
        description: '',
        steps: ['Wash your face', 'Brush your teeth', 'Sort your hair'],
        bucket: 'morning',
        category: 'health',
        repeat: true,
        days: [], // every day
        log: {},
        due: '',
        done: false,
      },
      {
        id: makeId(),
        title: 'Clean your room',
        description: '',
        steps: ['Tidy the floor', 'Clear the desk', 'Wipe down surfaces'],
        bucket: 'afternoon',
        category: 'lifestyle',
        repeat: true,
        days: [0], // Sunday
        log: {},
        due: '',
        done: false,
      },
      {
        id: makeId(),
        title: 'Organise your wardrobe',
        description: '',
        steps: ['Sort your clothes', 'Fold the clean ones', 'Clear anything left out'],
        bucket: 'afternoon',
        category: 'lifestyle',
        repeat: true,
        days: [6], // Saturday
        log: {},
        due: '',
        done: false,
      },
    ]
    data.seededChores = true
  }
  // Move the chore defaults' prose descriptions into steps on existing copies,
  // without touching a description you've edited yourself.
  const CHORE_DEFAULTS = {
    'Morning grooming': {
      steps: ['Gentle wash and moisturiser', 'Brush teeth', 'Hair check'],
      old: new Set([
        'Gentle wash and moisturise, brush your teeth, and check your hair.',
        'A gentle wash and moisturiser, brushing teeth, and a quick hair check.',
      ]),
    },
    'Clean your room': {
      steps: ['Tidy the floor', 'Clear the desk', 'Wipe down surfaces'],
      old: new Set([
        'Give your room a proper tidy — floor, desk and surfaces.',
        'Tidying the floor, desk, and surfaces.',
      ]),
    },
    'Organise your wardrobe': {
      steps: ['Sort your clothes', 'Fold the clean ones', 'Clear anything left out'],
      old: new Set([
        'Sort your clothes, fold the clean ones and clear the pile on the chair.',
        'Sorting clothes, folding clean items, and clearing anything left out.',
      ]),
    },
  }
  data.tasks = data.tasks.map((t) => {
    const d = CHORE_DEFAULTS[t.title]
    if (!d || !d.old.has(t.description)) return t
    const next = { ...t, description: '' }
    if (!next.steps || next.steps.length === 0) next.steps = d.steps
    return next
  })
  // Reframe the old "grooming"/"skincare" defaults as plain hygiene routines, so the
  // wording reads the same to every student. Steps are only rewritten if they're
  // still the untouched defaults — anything you've edited yourself is left alone.
  const HYGIENE_RENAMES = {
    'Morning grooming': {
      title: 'Morning hygiene',
      oldSteps: ['Gentle wash and moisturiser', 'Brush teeth', 'Hair check'],
      steps: ['Wash your face', 'Brush your teeth', 'Sort your hair'],
    },
    'Night grooming': {
      title: 'Night hygiene',
      oldSteps: ['Wash your face', 'Brush your teeth', 'Moisturise / skincare'],
      steps: ['Shower or wash your face', 'Brush your teeth', 'Moisturise'],
    },
  }
  data.tasks = data.tasks.map((t) => {
    const r = HYGIENE_RENAMES[t.title]
    if (!r) return t
    const next = { ...t, title: r.title }
    if (JSON.stringify(t.steps) === JSON.stringify(r.oldSteps)) next.steps = r.steps
    return next
  })
  // We no longer ask for (or use) gender — drop any copy left in an older profile.
  if (data.profile && 'gender' in data.profile) {
    const { gender, ...rest } = data.profile
    data.profile = rest
  }
  // A morning stretch + an afternoon hydration nudge (deletable, seeded once).
  if (!data.seededRoutinePlus) {
    data.tasks = [
      ...data.tasks,
      {
        id: makeId(),
        title: 'Stretch / Move',
        description:
          'Five minutes of light movement or stretching to get the blood flowing and shake off morning stiffness.',
        steps: [],
        bucket: 'morning',
        category: 'health',
        repeat: true,
        days: [],
        order: -1, // near the top of the morning (just after journaling)
        log: {},
        due: '',
        done: false,
      },
      {
        id: makeId(),
        title: 'Hydration check',
        description: 'A reminder to drink water or refill your bottle to keep your energy from dipping.',
        steps: [],
        bucket: 'afternoon',
        category: 'health',
        repeat: true,
        days: [],
        log: {},
        due: '',
        done: false,
      },
    ]
    data.seededRoutinePlus = true
  }
  // A daily reading habit in the afternoon (deletable, seeded once).
  const READING_DESC = 'Time with a book — read as much or as little as you like; what matters is that you read.'
  if (!data.seededReading) {
    data.tasks = [
      ...data.tasks,
      {
        id: makeId(),
        title: 'Reading',
        description: READING_DESC,
        steps: [],
        bucket: 'afternoon',
        category: 'lifestyle',
        repeat: true,
        days: [], // every day (→ all week)
        log: {},
        due: '',
        done: false,
      },
    ]
    data.seededReading = true
  }
  // Refresh the reading default's wording (drop the fixed "twenty minutes").
  data.tasks = data.tasks.map((t) =>
    t.title === 'Reading' &&
    t.description === 'Twenty minutes with a book to unwind and pick up something new.'
      ? { ...t, description: READING_DESC }
      : t,
  )
  // Journaling is the first thing in the morning. Ensure it exists and sits first.
  if (!data.seededJournalingFirst) {
    if (data.tasks.some((t) => t.title === 'Journaling')) {
      data.tasks = data.tasks.map((t) => (t.title === 'Journaling' ? { ...t, order: -2 } : t))
    } else {
      data.tasks = [
        ...data.tasks,
        {
          id: makeId(),
          title: 'Journaling',
          description: 'A few lines to clear your head and set your intentions for the day.',
          steps: ['Write your thoughts', "Write today's to-do list", "Write what you're grateful for"],
          bucket: 'morning',
          category: 'lifestyle',
          repeat: true,
          days: [],
          order: -2, // first thing in the morning
          log: {},
          due: '',
          done: false,
        },
      ]
    }
    data.seededJournalingFirst = true
  }
  // A nightly grooming routine (deletable, seeded once).
  if (!data.seededNightGrooming) {
    data.tasks = [
      ...data.tasks,
      {
        id: makeId(),
        title: 'Night hygiene',
        description: '',
        steps: ['Shower or wash your face', 'Brush your teeth', 'Moisturise'],
        bucket: 'night',
        category: 'health',
        repeat: true,
        days: [],
        log: {},
        due: '',
        done: false,
      },
    ]
    data.seededNightGrooming = true
  }
  // ("Check tomorrow's plans" used to be seeded here as its own nightly task. It's
  // now a step inside Get-ready-for-tomorrow, so there's nothing to seed.)
  // New task model: blank weekdays = one-off. Give every-day repeats explicit
  // all-week days so an empty picker unambiguously means a one-off.
  data.tasks = data.tasks.map((t) =>
    t.repeat && (!t.days || t.days.length === 0) ? { ...t, days: [0, 1, 2, 3, 4, 5, 6] } : t,
  )
  // Stretch/Move sits near the top of the morning (just after journaling).
  data.tasks = data.tasks.map((t) =>
    t.title === 'Stretch / Move' && t.order === undefined ? { ...t, order: -1 } : t,
  )
  // Get ready for tomorrow sits at the end (until the user reorders it).
  data.tasks = data.tasks.map((t) =>
    t.title === 'Get ready for tomorrow' && t.pinLast === undefined && t.order === undefined
      ? { ...t, pinLast: true }
      : t,
  )
  // Reading lives in the afternoon — one-time move for any night copy from before.
  if (!data.readingAfternoon) {
    data.tasks = data.tasks.map((t) =>
      t.title === 'Reading' && t.bucket === 'night' ? { ...t, bucket: 'afternoon' } : t,
    )
    data.readingAfternoon = true
  }
  return data
}

// The timetable is the user's own input (saved here in localStorage) — the app
// ships with NO default timetable, so a fresh device starts empty and you fill
// it in via the "Class" add option.
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return freshData() // brand-new install → curated starter routines
    return normalize(JSON.parse(raw))
  } catch {
    return emptyData()
  }
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

// A sensible default packing list for a subject:
//  - PE/Health and Tutor need nothing (no books, no device).
//  - Music (Strings etc.) needs a device for theory, but no books.
//  - Everything else needs its book + a device.
// Books group into one line in the packing summary; "Device" de-dupes to one.
function defaultNeeds(subject) {
  const s = (subject || '').trim()
  if (!s) return ''
  if (/physical|health|tutor|\bpe\b/i.test(s)) return ''
  if (/music|strings|band|orchestra|choir/i.test(s)) return 'Device'
  return `${s} Books, Device`
}

// `userId` (from useAuth) turns on cloud sync. Without it the store is local-only,
// exactly as before.
export function useSchedule(userId = null) {
  const [data, setData] = useState(load)

  // localStorage stays the offline cache / source of truth on-device, so the app
  // still works with no signal. The cloud is a mirror on top of it.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  // ---- Cloud sync ----
  // Latest data without making the pull effect depend on it (which would re-pull
  // on every keystroke).
  const dataRef = useRef(data)
  dataRef.current = data
  // Only start pushing once we've pulled, or the first save would overwrite the
  // account's real data with whatever was cached on this device.
  const [synced, setSynced] = useState(false)

  // Pull on sign-in: adopt the account's data, or seed the account from what's
  // already on this device (so signing up doesn't throw away an existing setup).
  useEffect(() => {
    if (!isCloudEnabled || !userId) return
    let alive = true
    setSynced(false)
    ;(async () => {
      const { data: row, error } = await supabase
        .from(DATA_TABLE)
        .select('data')
        .eq('user_id', userId)
        .maybeSingle()
      if (!alive) return
      if (error) return // offline or blocked — keep working from the local cache
      if (row?.data) setData(normalize(row.data))
      else await supabase.from(DATA_TABLE).upsert({ user_id: userId, data: dataRef.current })
      if (alive) setSynced(true)
    })()
    return () => {
      alive = false
    }
  }, [userId])

  // Push on change, debounced so a burst of edits is one write.
  useEffect(() => {
    if (!isCloudEnabled || !userId || !synced) return
    const t = setTimeout(() => {
      supabase
        .from(DATA_TABLE)
        .upsert({ user_id: userId, data, updated_at: new Date().toISOString() })
        .then(() => {}, () => {}) // offline writes fail silently; local cache still has it
    }, 800)
    return () => clearTimeout(t)
  }, [data, userId, synced])

  // Login streak: bump once per day. Same day = no change; yesterday = +1;
  // a gap resets to 1. Runs once on mount.
  useEffect(() => {
    setData((prev) => {
      const today = toKey(new Date())
      if (prev.lastActive === today) return prev
      const yesterday = toKey(addDays(keyToDate(today), -1))
      const streak = prev.lastActive === yesterday ? (prev.loginStreak || 0) + 1 : 1
      return { ...prev, lastActive: today, loginStreak: streak }
    })
  }, [])

  // ---- Assignments (schoolwork with a due date) ----
  const addAssignment = useCallback(({ title, subject, due, kind = 'assignment' }) => {
    setData((prev) => ({
      ...prev,
      assignments: [...prev.assignments, { id: makeId(), title, subject, due, kind, done: false }],
    }))
  }, [])

  const toggleAssignment = useCallback((id) => {
    setData((prev) => {
      let delta = 0
      const assignments = prev.assignments.map((a) => {
        if (a.id !== id) return a
        delta = a.done ? -XP.assignment : XP.assignment
        return { ...a, done: !a.done }
      })
      return { ...prev, assignments, xp: Math.max(0, (prev.xp || 0) + delta) }
    })
  }, [])

  const deleteAssignment = useCallback((id) => {
    setData((prev) => ({ ...prev, assignments: prev.assignments.filter((a) => a.id !== id) }))
  }, [])

  // Edit an existing assignment's fields (title / subject / due) in place.
  const updateAssignment = useCallback((id, fields) => {
    setData((prev) => ({
      ...prev,
      assignments: prev.assignments.map((a) => (a.id === id ? { ...a, ...fields } : a)),
    }))
  }, [])

  // ---- Dated events: tests (graded, with an importance level) or plain dates ----
  // `kind` is 'test' | 'date'; tests carry a `testType` ('assessment' | 'exam')
  // and an optional `subject` (used to group grades) + `result` (grade code).
  const addEvent = useCallback(({ title, date, subject = '', kind = 'date', testType = null }) => {
    setData((prev) => ({
      ...prev,
      events: [...prev.events, { id: makeId(), title, date, subject, kind, testType }],
    }))
  }, [])

  const deleteEvent = useCallback((id) => {
    setData((prev) => ({ ...prev, events: prev.events.filter((e) => e.id !== id) }))
  }, [])

  // Check a test/date off (or back on). Unlike delete, this keeps it around so
  // it moves into the "Done" section instead of vanishing.
  const toggleEvent = useCallback((id) => {
    setData((prev) => {
      let delta = 0
      const events = prev.events.map((e) => {
        if (e.id !== id) return e
        delta = e.done ? -XP.event : XP.event
        return { ...e, done: !e.done }
      })
      return { ...prev, events, xp: Math.max(0, (prev.xp || 0) + delta) }
    })
  }, [])

  // Edit an existing test/date's fields (title / date / subject / testType).
  const updateEvent = useCallback((id, fields) => {
    setData((prev) => ({
      ...prev,
      events: prev.events.map((e) => (e.id === id ? { ...e, ...fields } : e)),
    }))
  }, [])

  // Add a graded result straight to a subject (used by "+ Add result" on the
  // Report page). It's a done test with a grade, so it merges into that subject's
  // report card by name.
  const addResult = useCallback(({ subject, title, code }) => {
    setData((prev) => ({
      ...prev,
      events: [
        ...prev.events,
        {
          id: makeId(),
          title,
          subject,
          date: toKey(new Date()),
          kind: 'test',
          testType: 'assessment',
          result: code,
          done: true,
        },
      ],
    }))
  }, [])

  // Record (or clear, with null) a test's grade. Flows through setData so it
  // auto-saves like everything else.
  const setEventResult = useCallback((id, result) => {
    setData((prev) => ({
      ...prev,
      events: prev.events.map((e) => (e.id === id ? { ...e, result } : e)),
    }))
  }, [])

  // ---- Reminders (things to do, pinned to Today until checked off) ----
  // `due` is an optional "YYYY-MM-DDTHH:MM" deadline. `repeat` ('none' | 'daily'
  // | 'weekdays' | 'weekly') makes it recurring; `lastDone` tracks the last time
  // a recurring one was completed so it can reappear next period (see reminders.js).
  const addReminder = useCallback(({ text, due, repeat = 'none' }) => {
    setData((prev) => ({
      ...prev,
      reminders: [...prev.reminders, { id: makeId(), text, due, repeat }],
    }))
  }, [])

  // Check a reminder off: one-offs are removed; recurring ones are marked done
  // for the current period (they'll come back next time).
  const completeReminder = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      reminders: prev.reminders.flatMap((r) => {
        if (r.id !== id) return [r]
        if (!r.repeat || r.repeat === 'none') return []
        return [{ ...r, lastDone: toKey(new Date()) }]
      }),
    }))
  }, [])

  const deleteReminder = useCallback((id) => {
    setData((prev) => ({ ...prev, reminders: prev.reminders.filter((r) => r.id !== id) }))
  }, [])

  // ---- Notes (quick jots; optional deadline lets a note act as a reminder) ----
  const addNote = useCallback((text, due = '') => {
    setData((prev) => ({ ...prev, notes: [...prev.notes, { id: makeId(), text, due }] }))
  }, [])

  const deleteNote = useCallback((id) => {
    setData((prev) => ({ ...prev, notes: prev.notes.filter((n) => n.id !== id) }))
  }, [])

  // ---- Bring (extra everyday items folded into the packing list) ----
  // Comma-separated text becomes one item each; optional subject tags them all.
  // `days` is an optional list of weekday numbers (getDay()) the item repeats on;
  // empty means every day.
  const addBring = useCallback((text, subject = '', days = []) => {
    setData((prev) => {
      const items = text
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((item) => ({ id: makeId(), item, subject, days }))
      return { ...prev, bring: [...prev.bring, ...items] }
    })
  }, [])

  const deleteBring = useCallback((id) => {
    setData((prev) => ({ ...prev, bring: prev.bring.filter((b) => b.id !== id) }))
  }, [])

  // ---- Timetable (a class sits in a fixed period on a given cycle day) ----
  // Shared periods (e.g. Tutor) are the same room every day, so writes fan out
  // to all cycle days instead of just the one being edited.
  const saveClass = useCallback((cycleDay, periodId, cls) => {
    setData((prev) => {
      if (isSharedPeriod(periodId)) {
        const timetable = { ...prev.timetable }
        for (const d of CYCLE_DAYS) {
          timetable[d] = { ...(timetable[d] || {}), [periodId]: cls }
        }
        return { ...prev, timetable }
      }
      const day = prev.timetable[cycleDay] || {}
      return {
        ...prev,
        timetable: { ...prev.timetable, [cycleDay]: { ...day, [periodId]: cls } },
      }
    })
  }, [])

  const clearClass = useCallback((cycleDay, periodId) => {
    setData((prev) => {
      if (isSharedPeriod(periodId)) {
        const timetable = { ...prev.timetable }
        for (const d of CYCLE_DAYS) {
          const { [periodId]: _r, ...rest } = timetable[d] || {}
          timetable[d] = rest
        }
        return { ...prev, timetable }
      }
      const { [periodId]: _removed, ...rest } = prev.timetable[cycleDay] || {}
      return { ...prev, timetable: { ...prev.timetable, [cycleDay]: rest } }
    })
  }, [])

  // ---- Reports (per-subject report cards imported from a PDF) ----
  // Merge by subject: re-importing a subject replaces its card instead of
  // duplicating, so you can re-upload an updated report.
  const importReports = useCallback((incoming, extras) => {
    setData((prev) => {
      const reports = [...prev.reports]
      for (const r of incoming) {
        const key = r.subject.trim().toLowerCase()
        const at = reports.findIndex((x) => x.subject.trim().toLowerCase() === key)
        if (at >= 0) reports[at] = { ...r, id: reports[at].id }
        else reports.push({ id: makeId(), ...r })
      }
      // Replace co-curricular only when this import actually had that page.
      const next = { ...prev, reports }
      if (extras) next.extras = extras
      return next
    })
  }, [])

  const clearExtras = useCallback(() => {
    setData((prev) => ({ ...prev, extras: { service: [], activities: [] } }))
  }, [])

  // Add / remove a co-curricular entry by hand. `kind` is 'service' | 'activities'.
  const addExtra = useCallback((kind, text) => {
    const t = (text || '').trim()
    if (!t) return
    setData((prev) => ({
      ...prev,
      extras: { ...prev.extras, [kind]: [...prev.extras[kind], t] },
    }))
  }, [])

  const deleteExtra = useCallback((kind, index) => {
    setData((prev) => ({
      ...prev,
      extras: { ...prev.extras, [kind]: prev.extras[kind].filter((_, i) => i !== index) },
    }))
  }, [])

  const deleteReport = useCallback((id) => {
    setData((prev) => ({ ...prev, reports: prev.reports.filter((r) => r.id !== id) }))
  }, [])

  // Wipe every imported report (e.g. to re-upload a fresh one from scratch).
  const clearReports = useCallback(() => {
    setData((prev) => ({ ...prev, reports: [] }))
  }, [])

  // Toggle which sections show on report cards (grades / progress / teacher / dispositions).
  const setReportSetting = useCallback((key, value) => {
    setData((prev) => ({
      ...prev,
      reportSettings: { ...prev.reportSettings, [key]: value },
    }))
  }, [])

  // ---- Personal tasks (to-dos and repeating routines are one type) ----
  // A task is either one-off (uses `due` + `done`) or repeating (`repeat: true`,
  // with a weekday schedule `days` ([] = every day) and a per-day `log` for
  // streaks). Both carry an optional time-of-day `bucket`.
  const addTask = useCallback(
    ({
      title,
      description = '',
      steps = [],
      bucket = '',
      category = 'other',
      repeat = false,
      days = [],
      due = '',
    }) => {
      setData((prev) => ({
        ...prev,
        tasks: [
          ...prev.tasks,
          {
            id: makeId(),
            title,
            description,
            steps,
            bucket,
            category,
            repeat,
            days,
            log: {},
            due: repeat ? '' : due,
            done: false,
          },
        ],
      }))
    },
    [],
  )

  // Check a task off. One-offs flip `done`; repeating ones toggle `dateKey` in
  // their log (per-day completion, for streaks).
  // `part` is the day-section you were looking at when you ticked it ('morning' |
  // 'afternoon' | 'night'). It only matters for Anytime tasks, which float across
  // every tab until they're done and then settle onto the tab you did them on.
  // Stored in place of `true` in the log — every reader is a truthiness check, so
  // an old `true` keeps working.
  const toggleTask = useCallback((id, dateKey, part = '') => {
    setData((prev) => {
      let delta = 0
      const tasks = prev.tasks.map((t) => {
        if (t.id !== id) return t
        if (t.repeat) {
          const log = { ...t.log }
          if (log[dateKey]) {
            delete log[dateKey]
            delta = -XP.task
          } else {
            log[dateKey] = part || true
            delta = XP.task
          }
          return { ...t, log }
        }
        delta = t.done ? -XP.task : XP.task
        return { ...t, done: !t.done, doneIn: t.done ? '' : part }
      })
      return { ...prev, tasks, xp: Math.max(0, (prev.xp || 0) + delta) }
    })
  }, [])

  const updateTask = useCallback((id, fields) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...fields } : t)),
    }))
  }, [])

  const deleteTask = useCallback((id) => {
    setData((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }))
  }, [])

  // Add one of the built-in default tasks back from a template.
  const addTemplateTask = useCallback((tpl) => {
    setData((prev) => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        {
          id: makeId(),
          title: tpl.title,
          description: tpl.description || '',
          steps: tpl.steps || [],
          bucket: tpl.bucket || '',
          category: tpl.category || 'other',
          repeat: true,
          days: tpl.days || [0, 1, 2, 3, 4, 5, 6],
          pinFirst: !!tpl.pinFirst,
          pinLast: !!tpl.pinLast,
          log: {},
          due: '',
          done: false,
        },
      ],
    }))
  }, [])

  // ---- Theme (colour scheme) ----
  const setTheme = useCallback((theme) => {
    setData((prev) => ({ ...prev, theme }))
  }, [])

  const setCustomColor = useCallback((key, value) => {
    setData((prev) => ({ ...prev, customColors: { ...prev.customColors, [key]: value } }))
  }, [])

  // ---- General preferences (streaks toggle, etc.) ----
  const setSetting = useCallback((key, value) => {
    setData((prev) => ({ ...prev, settings: { ...prev.settings, [key]: value } }))
  }, [])

  // ---- Onboarding survey ----
  const finishSurvey = useCallback((answers) => {
    setData((prev) => ({ ...prev, profile: { ...prev.profile, ...answers }, onboarded: true }))
  }, [])

  const restartSurvey = useCallback(() => {
    setData((prev) => ({ ...prev, onboarded: false }))
  }, [])

  // Update a single profile field (edited from Settings → Profile).
  const setProfile = useCallback((key, value) => {
    setData((prev) => ({ ...prev, profile: { ...prev.profile, [key]: value } }))
  }, [])

  // Mark a sport aspect strong/weak (or null to clear) — tailors sport drills.
  const setSportSkill = useCallback((sport, aspect, level) => {
    setData((prev) => {
      const all = { ...(prev.profile.sportSkills || {}) }
      const forSport = { ...(all[sport] || {}) }
      if (level) forSport[aspect] = level
      else delete forSport[aspect]
      all[sport] = forSport
      return { ...prev, profile: { ...prev.profile, sportSkills: all } }
    })
  }, [])

  // ---- Generated workout ----
  const toggleWorkout = useCallback((dateKey) => {
    setData((prev) => {
      const log = { ...prev.workoutLog }
      let delta = 0
      if (log[dateKey]) {
        delete log[dateKey]
        delta = -XP.workout
      } else {
        log[dateKey] = true
        delta = XP.workout
      }
      return { ...prev, workoutLog: log, xp: Math.max(0, (prev.xp || 0) + delta) }
    })
  }, [])

  const reshuffleWorkout = useCallback(() => {
    setData((prev) => ({ ...prev, workoutSeed: (prev.workoutSeed || 0) + 1 }))
  }, [])

  // ---- Reminders ----
  const addAlert = useCallback(({ text, start, repeat = 0, endDate = '' }) => {
    setData((prev) => ({
      ...prev,
      alerts: [...prev.alerts, { id: makeId(), text, start, repeat, endDate, ackUntil: 0 }],
    }))
  }, [])

  const updateAlert = useCallback((id, fields) => {
    setData((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) => (a.id === id ? { ...a, ...fields } : a)),
    }))
  }, [])

  const deleteAlert = useCallback((id) => {
    setData((prev) => ({ ...prev, alerts: prev.alerts.filter((a) => a.id !== id) }))
  }, [])

  // Dismiss the current occurrence; a repeating reminder returns next interval.
  const dismissAlert = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) => (a.id === id ? { ...a, ackUntil: Date.now() } : a)),
    }))
  }, [])

  // ---- Focus timer ----
  const setFocusDistractions = useCallback((list) => {
    setData((prev) => ({ ...prev, focusDistractions: list }))
  }, [])

  // Finish a focus session: log the minutes and award XP (1 XP per minute).
  const completeFocusSession = useCallback((minutes) => {
    setData((prev) => ({
      ...prev,
      focusMinutes: (prev.focusMinutes || 0) + minutes,
      xp: (prev.xp || 0) + minutes,
    }))
  }, [])

  // ---- Backup: export everything as JSON / restore from a backup file ----
  const exportData = useCallback(() => JSON.stringify(data, null, 2), [data])

  const importData = useCallback((text) => {
    try {
      const parsed = JSON.parse(text)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false
      setData(normalize(parsed))
      return true
    } catch {
      return false
    }
  }, [])

  // Wipe everything and start over: clear storage, then hard-reload so the app
  // boots exactly like a first install (survey + the curated starter routines).
  // Reloading rather than just setState avoids any in-flight save writing the old
  // data straight back, and re-runs the first-open effects (login streak, etc.).
  const resetAll = useCallback(async () => {
    // Signed in? Drop the cloud row too, or the reload would just pull it all back.
    if (isCloudEnabled && userId) {
      try {
        await supabase.from(DATA_TABLE).delete().eq('user_id', userId)
      } catch {
        /* offline — the local wipe below still happens */
      }
    }
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore — reload still gives a clean slate */
    }
    window.location.reload()
  }, [userId])

  // Bulk-set the timetable from an imported screenshot. `grid` is
  // { [cycleDay]: { [periodId]: { subject, room } } }. `mode` 'merge' keeps the
  // current timetable and fills/overwrites from the grid; 'new' starts from a
  // blank timetable. Only cells with a subject or room are written; existing
  // `needs` on a slot is preserved, else a sensible default is filled in.
  const importTimetable = useCallback((grid, mode = 'merge') => {
    setData((prev) => {
      const timetable = mode === 'new' ? {} : { ...prev.timetable }
      for (const [day, periods] of Object.entries(grid)) {
        const dayTable = { ...(timetable[day] || {}) }
        for (const [periodId, cls] of Object.entries(periods)) {
          const subject = (cls.subject || '').trim()
          const room = (cls.room || '').trim()
          if (!subject && !room) continue
          const existing = dayTable[periodId]?.needs
          const needs = existing ? existing : defaultNeeds(subject)
          dayTable[periodId] = { subject, room, needs }
        }
        timetable[day] = dayTable
      }
      return { ...prev, timetable }
    })
  }, [])

  // Copy one cycle day's whole timetable onto another (e.g. "Day 3 is like Day 1").
  const copyDay = useCallback((fromCycle, toCycle) => {
    setData((prev) => {
      const source = prev.timetable[fromCycle] || {}
      const cloned = {}
      for (const [pid, cls] of Object.entries(source)) cloned[pid] = { ...cls }
      return { ...prev, timetable: { ...prev.timetable, [toCycle]: cloned } }
    })
  }, [])

  return {
    assignments: data.assignments,
    events: data.events,
    reminders: data.reminders,
    notes: data.notes,
    bring: data.bring,
    timetable: data.timetable,
    reports: data.reports,
    extras: data.extras,
    reportSettings: data.reportSettings,
    tasks: data.tasks,
    theme: data.theme,
    setTheme,
    customColors: data.customColors,
    setCustomColor,
    settings: data.settings,
    setSetting,
    onboarded: data.onboarded,
    profile: data.profile,
    finishSurvey,
    restartSurvey,
    setProfile,
    setSportSkill,
    workoutLog: data.workoutLog,
    workoutSeed: data.workoutSeed,
    toggleWorkout,
    reshuffleWorkout,
    xp: data.xp,
    loginStreak: data.loginStreak,
    focusDistractions: data.focusDistractions,
    focusMinutes: data.focusMinutes,
    setFocusDistractions,
    completeFocusSession,
    alerts: data.alerts,
    addAlert,
    updateAlert,
    deleteAlert,
    dismissAlert,
    exportData,
    importData,
    resetAll,
    addTask,
    toggleTask,
    updateTask,
    deleteTask,
    addTemplateTask,
    addAssignment,
    toggleAssignment,
    deleteAssignment,
    updateAssignment,
    addEvent,
    deleteEvent,
    toggleEvent,
    updateEvent,
    addResult,
    setEventResult,
    addReminder,
    completeReminder,
    deleteReminder,
    addNote,
    deleteNote,
    addBring,
    deleteBring,
    saveClass,
    clearClass,
    copyDay,
    importTimetable,
    importReports,
    deleteReport,
    clearReports,
    clearExtras,
    addExtra,
    deleteExtra,
    setReportSetting,
  }
}
