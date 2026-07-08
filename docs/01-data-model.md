# Data model

Everything persists to `localStorage` under one key: **`schedule-app.data`**.
The single owner is [`src/useSchedule.js`](../src/useSchedule.js) — add new persisted
state **there**, never in a component.

## Shape

```js
{
  // Schoolwork with a deadline.
  assignments: [
    { id, title, subject, due, done }   // due = "YYYY-MM-DDTHH:MM" local string
  ],

  events:    [ { id, title, date } ],   // tests / important dates ("YYYY-MM-DD", no time)
  reminders: [ { id, text } ],          // things to do, pinned to Today until checked off
  notes:     [ { id, text } ],          // quick jots, removed when deleted

  // Timetable, keyed by CYCLE DAY (1..6). Each day maps period id -> the class
  // in that slot. Period ids/times are fixed config (see schoolCalendar.js).
  timetable: {
    1..6: { [periodId]: { subject, room, needs } }   // periodId: 'tutor','p1','p2','p3a','p3b','p4','p5'
  }
}
```

> The app is school-only: just assignments and the timetable. The timetable
> rotates by the 6-day **cycle day**, not by weekday — so "Day 5" always shows
> the same classes, whatever weekday it falls on. (An earlier before/after-school
> daily-tasks feature was removed; old saved `recurring` / `recurDone` keys, and
> the previous weekday-keyed timetable, are ignored by the current model.)

## Rules & gotchas

- **Dates are local `"YYYY-MM-DD"` keys** — never `toISOString()`/UTC (avoids timezone
  drift). All conversions live in [`src/dateUtils.js`](../src/dateUtils.js).
- **The week starts Monday** in the UI (`startOfWeek` in `dateUtils`).
- **`timetable` keys are weekday numbers** but JSON serializes them as strings;
  lookups use `timetable[date.getDay()]` and rely on JS key coercion.
- **`phase` defaults to `'before'`** — older recurring items saved without a phase
  read as before-school.
- **Migrations:** `load()` shallow-merges saved data over `emptyData()`, so adding a
  new top-level key is safe. Changing an *existing* item's shape needs a real migration
  (or accept that old items lack the field and default it at read time, like `phase`).

## Not persisted: the school-day cycle

The 6-day cycle tracker and the period slots aren't stored data — they're
**computed config** in [`src/schoolCalendar.js`](../src/schoolCalendar.js):
- the cycle **anchor** (`2026-07-01` = Day 5) and length (6),
- a `HOLIDAYS` list of no-school date ranges (weekends/holidays never consume a
  cycle number), and
- the fixed `PERIODS` (Tutor, 1st, 2nd, 3A, 3B, 4th, 5th with their times).

To change term breaks, re-anchor the cycle, or edit period times, edit that file —
no data migration needed. (Renaming/removing a `periodId` would orphan any class
saved under it, so keep ids stable.)

## If you want to change this

Tell me the new field and I'll update the store, the read sites, and this doc together.
Note whether old saved data needs migrating or can just default.
