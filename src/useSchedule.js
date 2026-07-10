import { useState, useEffect, useCallback } from 'react'
import { CYCLE_DAYS, isSharedPeriod } from './schoolCalendar'
import { toKey } from './dateUtils'

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
    theme: 'custom', // appearance is now always a custom accent on a dark/bright base
    // Used when theme === 'custom': primary = the accent colour (the darker
    // hover/pressed shade is derived from it), base = 'dark' | 'bright' (which
    // background palette to sit it on).
    customColors: { primary: '#6366f1', base: 'dark' },
    settings: { showStreaks: false }, // general prefs (opt-in streaks etc.)
  }
}

// Take a parsed (possibly older / partial) data object and bring it up to the
// current shape — filling defaults and running every migration. Shared by
// load() (from localStorage) and importData() (from a backup file).
function normalize(parsed) {
  const base = emptyData()
  const data = { ...base, ...parsed }
  data.settings = { ...base.settings, ...(data.settings || {}) }
  data.customColors = { ...base.customColors, ...(data.customColors || {}) }
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
  const READY_STEPS = [
    "Lay out tomorrow's clothes",
    'Pack your bag',
    'Charge your devices',
    'Set your alarm',
    "Check tomorrow's plans",
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
        title: 'Morning grooming',
        description: '',
        steps: ['Gentle wash and moisturiser', 'Brush teeth', 'Hair check'],
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
  return data
}

// The timetable is the user's own input (saved here in localStorage) — the app
// ships with NO default timetable, so a fresh device starts empty and you fill
// it in via the "Class" add option.
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyData()
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

export function useSchedule() {
  const [data, setData] = useState(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  // ---- Assignments (schoolwork with a due date) ----
  const addAssignment = useCallback(({ title, subject, due }) => {
    setData((prev) => ({
      ...prev,
      assignments: [...prev.assignments, { id: makeId(), title, subject, due, done: false }],
    }))
  }, [])

  const toggleAssignment = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      assignments: prev.assignments.map((a) => (a.id === id ? { ...a, done: !a.done } : a)),
    }))
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
    setData((prev) => ({
      ...prev,
      events: prev.events.map((e) => (e.id === id ? { ...e, done: !e.done } : e)),
    }))
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
  const toggleTask = useCallback((id, dateKey) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== id) return t
        if (t.repeat) {
          const log = { ...t.log }
          if (log[dateKey]) delete log[dateKey]
          else log[dateKey] = true
          return { ...t, log }
        }
        return { ...t, done: !t.done }
      }),
    }))
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
    exportData,
    importData,
    addTask,
    toggleTask,
    updateTask,
    deleteTask,
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
