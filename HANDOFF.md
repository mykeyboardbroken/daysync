# Schedule App — Handoff

A personal **school day planner** built with React + Vite. Three tabs: a day-focused
**Today** view (cycle-day timetable, coming up, reminders/notes, packing list, weather),
an **Assignments** checklist (assignments + tests), and a **Report** card (grades,
progress, co-curricular). All data is in the browser (localStorage) — **no backend**.

> **Design docs live in [`docs/`](docs/).** This handoff is the quick orientation.

---

## Run it

Prerequisites: **Node.js** (v24 LTS installed on this machine).

```powershell
cd C:\Users\Yeonw\schedule-app
npm install        # first time only
npm run dev        # dev server -> http://localhost:5173/
npm run build      # production build into dist/
```

> On this machine PowerShell may need the PATH refreshed before `node`/`npm` are found:
> `$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")`

---

## Architecture

**One source of truth:** [`src/useSchedule.js`](src/useSchedule.js) holds all state and
persists the whole object to `localStorage` under `schedule-app.data` on every change.
Add new persisted state *there*, never in components.

**Data shape:**

```js
{
  assignments: [{ id, title, subject, due, done }],          // due OPTIONAL "YYYY-MM-DDT23:59"
  events:      [{ id, title, date, subject, kind, testType, result, done }],
                 // kind: 'test' | 'date'; testType: 'assessment' | 'exam' (importance);
                 // result: grade code (see grades.js); date "YYYY-MM-DD"
  reminders:   [{ id, text, due, repeat, lastDone }],         // repeat: none|daily|weekdays|weekly
  notes:       [{ id, text }],
  bring:       [{ id, item, subject, days }],                 // days: weekday numbers it repeats on
  timetable:   { 1..6: { [periodId]: { subject, room, needs } } },  // keyed by CYCLE DAY
  reports:     [{ id, subject, teacher, email, absent, dispositions, termAverages, results }],
  extras:      { service: [...], activities: [...] },         // co-curricular (report page 5)
  reportSettings: { grades, progress, teacher, dispositions, extras }, // Report tab filters
}
```

**The 6-day cycle** (config in [`schoolCalendar.js`](src/schoolCalendar.js)): classes rotate
on a school "day cycle" (Day 1–6), not weekday.
- `ANCHOR` = `2026-07-01` = Day 5. `YEAR_START`/`YEAR_END` = 28 Jan → 5 Dec 2026.
- `HOLIDAYS` = term breaks (T1 Apr 4–19, T2 Jul 4–19, T3 Sep 26–Oct 11). Weekends + holidays
  never consume a cycle number.
- `PERIODS` = fixed slots `tutor, p1, p2, p3a, p3b, p4, p5`. `tutor` is `noSubject` + `shared`
  (same room every day — edits fan out).
- `cycleDay(date)` → 1..6 or `null`. **The timetable is keyed by cycle day 1–6.**

**Dates:** always local `"YYYY-MM-DD"` strings, never `toISOString`. Helpers in
[`dateUtils.js`](src/dateUtils.js) (pure, unit-testable).

**Styling:** plain CSS in [`App.css`](src/App.css); color variables in [`index.css`](src/index.css).
Dark, single-column, mobile-friendly.

---

## Tabs & features (all done)

### Today ([`TodayTab.jsx`](src/components/TodayTab.jsx))
- **Coming up** — one merged list: assignments due within 48h + **all** upcoming tests/dates
  (near and far), sorted by when. Tap a row to **edit** it; the checkbox marks done (which
  removes it). ("Important dates" was folded into here.)
- **Reminders** — check off to clear. **Recurring** reminders (`repeat` = daily / weekdays /
  weekly) reappear next period instead of deleting; one-offs delete. See [`reminders.js`](src/reminders.js).
- **Notes** — quick jots.
- **Pack for &lt;day&gt;** — packing list from each class's `needs` (books grouped, Device
  de-duped) + user "To bring" extras. To-bring items can **repeat on chosen weekdays**.
- **Timetable** — cycle-day period rows; tap a slot to edit. **📷 Upload** button imports a
  timetable **screenshot** (see below).
- **Weather** — forecast + what-to-wear. Prep block rolls to next school day after the 15:20 bell.

### Assignments ([`AssignmentsTab.jsx`](src/components/AssignmentsTab.jsx))
- Filter bar: **All · Assignments · Tests · Done**. (Grades moved to the Report tab;
  reminders/notes live only on Today.)
- Tap a card/row to **edit**; checkbox = done → moves to the **Done** filter (not deleted).
- Tests carry an **importance** badge (Assessment / Exam) and can be graded (grade chip).
- All deletes are **two-tap confirm** ([`ConfirmDelete.jsx`](src/components/ConfirmDelete.jsx)).
- Check-off plays a slide/fade animation ([`useExitAnimation.js`](src/useExitAnimation.js)).

### Report ([`ReportTab.jsx`](src/components/ReportTab.jsx))
- **Grades system** = the school's junior scale N0–E8 ([`grades.js`](src/grades.js)): each code
  is a letter+number (0–8 value) so grades average numerically but show as codes.
- **Per-subject cards**: average grade, **term-average progress** (labelled Term 1/2/… +
  Overall; last value is Overall), teacher & email, learning dispositions (latest term).
- Grades come from **imported report results + hand-added results** (merged by subject).
- **Co-curricular** card: **Service & Leadership** + **Activities** (report page 5).
- **Filters** ("Show:" toggles) always visible. An **Edit** button reveals all
  add/delete/Clear-all controls (clean read-only otherwise).

---

## The two importers (both browser-only, lazy-loaded)

**PDF report import** ([`pdfImport.js`](src/pdfImport.js), [`PdfImportModal.jsx`](src/components/PdfImportModal.jsx)):
uses `pdfjs-dist` to read the report PDF's text on-device. Parses each subject page
(position-aware, handles the two-column results table), plus the co-curricular page.
Editable review before save. `importReports(reports, extras)` **merges by subject**; extras
**replace** if that page was present.

**Timetable screenshot OCR** ([`timetableOcr.js`](src/timetableOcr.js), [`TimetableImportModal.jsx`](src/components/TimetableImportModal.jsx)):
uses `tesseract.js`. Preprocesses (upscale + grayscale + threshold) to beat coloured cell
backgrounds. Reconstructs the grid by x/y position. Handles **both** timetable formats:
- old (6 rows = Day 1–6), and
- new (Mon–Fri weekly) — reads each row's **date** (a 2nd grayscale OCR pass for the light
  date text) and converts via `cycleDay()` to the right Day 1–6 slot.

One weekly screenshot covers 5 of 6 cycle days, so the modal takes **two screenshots** (two
weeks) and merges. Save offers **Merge** vs **Replace**. `importTimetable(grid, mode)` also
auto-fills sensible `needs` (Subject Books + Device; PE/Tutor none; Music = Device only).

> Tuned against the user's real Rangitoto report/timetable. If the school changes formats,
> the parsers may need re-tuning — validate with Node scripts + `sharp`/`tesseract.js`
> (both are devDependencies) on a saved sample image.

---

## Files added this session

`grades.js`, `eventMeta.js`, `reminders.js`, `useExitAnimation.js`, `pdfImport.js`,
`timetableOcr.js`, and components `GradeModal`, `TestModal`, `ConfirmDelete`, `ReportTab`,
`ResultModal`, `PdfImportModal`, `TimetableImportModal`. (`GradesSummary.jsx` is now unused —
safe to delete.) Deps added: `pdfjs-dist`, `tesseract.js`; dev-only `sharp`, `playwright-core`.

---

## Next steps (priority order)

1. **Deploy + PWA** — *still the #1 thing.* It only runs on `localhost`, so it isn't usable
   on the phone at school. Deploy `dist/` (Vercel/Netlify) + manifest/service worker for
   install + offline. Nothing else matters as much: it's built but not *usable* yet.
2. **Export / import `.json`** — all data is in one browser's localStorage with no backup;
   clearing site data wipes everything. Low effort, high safety.
3. **Notifications** ("due tomorrow") — depends on PWA groundwork.
4. `git init` (no repo yet); weather location hard-coded to Auckland in `useWeather.js`.

---

## Gotchas

- `useSchedule` is the only place that touches `localStorage`.
- Timetable is keyed by **cycle day (1–6)**, not weekday; `periodId`s must stay stable.
- Re-importing a report **overwrites the co-curricular list** if the new PDF has that page
  (hand-added service/activities would be replaced). Merge-by-subject preserves everything else.
- The OCR importers are the most **fragile** part — tuned to specific Rangitoto formats. The
  library assets (`tesseract.js` lang data ~10 MB, `pdf.js` worker) download on first use, so
  the importers need internet the first time.
- `cycleDay()` accuracy depends on `ANCHOR` + `HOLIDAYS` + `YEAR_START/END` in `schoolCalendar.js`.
